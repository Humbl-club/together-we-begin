import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface IOSScrollViewProps {
  children: React.ReactNode;
  className?: string;
  onPullToRefresh?: () => Promise<void>;
  pullToRefreshThreshold?: number;
  showScrollIndicator?: boolean;
}

export const IOSScrollView: React.FC<IOSScrollViewProps> = ({
  children,
  className,
  onPullToRefresh,
  pullToRefreshThreshold = 60,
  showScrollIndicator = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullDistance = useRef(0);
  const isRefreshing = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !onPullToRefresh) return;

    let isTouch = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isTouch = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouch || element.scrollTop > 0 || isRefreshing.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (deltaY > 0) {
        pullDistance.current = Math.min(deltaY * 0.5, pullToRefreshThreshold * 1.5);
        element.style.transform = `translateY(${pullDistance.current}px)`;
        
        // Add visual feedback
        if (pullDistance.current > pullToRefreshThreshold) {
          element.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isTouch) return;
      isTouch = false;

      if (pullDistance.current > pullToRefreshThreshold && !isRefreshing.current) {
        isRefreshing.current = true;
        element.style.transform = `translateY(${pullToRefreshThreshold}px)`;
        
        try {
          await onPullToRefresh();
        } finally {
          element.style.transform = 'translateY(0)';
          element.style.backgroundColor = '';
          pullDistance.current = 0;
          isRefreshing.current = false;
        }
      } else {
        element.style.transform = 'translateY(0)';
        element.style.backgroundColor = '';
        pullDistance.current = 0;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPullToRefresh, pullToRefreshThreshold]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'ios-scroll transition-transform duration-300 ease-out',
        'overflow-auto overscroll-behavior-y-contain',
        !showScrollIndicator && 'scrollbar-hide',
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}
    >
      {children}
    </div>
  );
};

interface IOSPageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'slide-left' | 'slide-right' | 'fade' | 'slide-up';
  duration?: number;
}

export const IOSPageTransition: React.FC<IOSPageTransitionProps> = ({
  children,
  isVisible,
  direction = 'slide-right',
  duration = 300
}) => {
  const getTransitionClasses = () => {
    const base = `transition-all duration-${duration} ease-out`;
    
    if (!isVisible) {
      switch (direction) {
        case 'slide-left':
          return `${base} transform -translate-x-full opacity-0`;
        case 'slide-right':
          return `${base} transform translate-x-full opacity-0`;
        case 'slide-up':
          return `${base} transform translate-y-full opacity-0`;
        case 'fade':
          return `${base} opacity-0`;
        default:
          return `${base} transform translate-x-full opacity-0`;
      }
    }
    
    return `${base} transform translate-x-0 translate-y-0 opacity-100`;
  };

  return (
    <div className={getTransitionClasses()}>
      {children}
    </div>
  );
};

interface IOSStatusBarProps {
  style?: 'light' | 'dark';
  backgroundColor?: string;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({ 
  style = 'dark',
  backgroundColor = 'transparent'
}) => {
  useEffect(() => {
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', backgroundColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = backgroundColor;
      document.head.appendChild(meta);
    }

    // Set status bar style for iOS
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', style === 'light' ? 'black-translucent' : 'default');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = style === 'light' ? 'black-translucent' : 'default';
      document.head.appendChild(meta);
    }
  }, [style, backgroundColor]);

  return null;
};

interface IOSKeyboardAvoidingViewProps {
  children: React.ReactNode;
  className?: string;
}

export const IOSKeyboardAvoidingView: React.FC<IOSKeyboardAvoidingViewProps> = ({
  children,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardHeight = windowHeight - viewportHeight;

      if (keyboardHeight > 0) {
        containerRef.current.style.paddingBottom = `${keyboardHeight}px`;
      } else {
        containerRef.current.style.paddingBottom = '0';
      }
    };

    // Listen for viewport changes (keyboard events)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('transition-all duration-300 ease-out', className)}
    >
      {children}
    </div>
  );
};