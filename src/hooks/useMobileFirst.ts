import { useState, useEffect } from 'react';

interface MobileFirstState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  touchSupported: boolean;
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  visualViewport: {
    width: number;
    height: number;
  };
}

/**
 * Mobile-first hook that provides comprehensive device information
 * This is the single source of truth for all mobile optimizations
 */
export const useMobileFirst = (): MobileFirstState => {
  const [state, setState] = useState<MobileFirstState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        touchSupported: false,
        orientation: 'landscape',
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
        visualViewport: { width: 1024, height: 768 }
      };
    }

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    return {
      isMobile,
      isTablet,
      isDesktop,
      touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      safeAreaInsets: {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-top') || '0'),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-bottom') || '0'),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-left') || '0'),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-right') || '0')
      },
      visualViewport: {
        width: window.visualViewport?.width || window.innerWidth,
        height: window.visualViewport?.height || window.innerHeight
      }
    };
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        safeAreaInsets: {
          top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-top') || '0'),
          bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-bottom') || '0'),
          left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-left') || '0'),
          right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-safe-area-right') || '0')
        },
        visualViewport: {
          width: window.visualViewport?.width || window.innerWidth,
          height: window.visualViewport?.height || window.innerHeight
        }
      });
    };

    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);
    
    // Listen for visual viewport changes (mobile keyboard, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateState);
      window.visualViewport.addEventListener('scroll', updateState);
    }

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateState);
        window.visualViewport.removeEventListener('scroll', updateState);
      }
    };
  }, []);

  return state;
};

// Convenience hooks for specific use cases
export const useIsMobile = () => useMobileFirst().isMobile;
export const useIsTablet = () => useMobileFirst().isTablet;
export const useIsDesktop = () => useMobileFirst().isDesktop;
export const useTouchSupported = () => useMobileFirst().touchSupported;
export const useSafeAreaInsets = () => useMobileFirst().safeAreaInsets;