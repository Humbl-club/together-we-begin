import React, { memo, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { MobileLoading } from './mobile-loading';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh = memo(({ 
  children, 
  onRefresh, 
  threshold = 80,
  className,
  disabled = false 
}: PullToRefreshProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const isAtTop = useRef<boolean>(true);

  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      isAtTop.current = containerRef.current.scrollTop <= 0;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || disabled || isRefreshing) return;
    
    checkScrollPosition();
    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
    }
  }, [isMobile, disabled, isRefreshing, checkScrollPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || disabled || isRefreshing || !isAtTop.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(distance);
      setIsPulling(distance > threshold);
    }
  }, [isMobile, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile || disabled || isRefreshing) return;
    
    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isMobile, disabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh]);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showIndicator = isPulling || isRefreshing || pullDistance > 0;

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={checkScrollPosition}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div 
          className={cn(
            'absolute top-0 left-0 right-0 z-50',
            'flex items-center justify-center',
            'transition-all duration-200 ease-out',
            'bg-gradient-to-b from-background/80 to-transparent',
            'backdrop-blur-sm'
          )}
          style={{
            height: Math.max(pullDistance, isRefreshing ? 60 : 0),
            transform: `translateY(-${Math.max(0, 60 - pullDistance)}px)`
          }}
        >
          {isRefreshing ? (
            <MobileLoading 
              variant="ios" 
              size="sm" 
              className="py-4"
            />
          ) : (
            <div className="flex flex-col items-center py-4">
              <div 
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all duration-200',
                  pullProgress >= 1 
                    ? 'border-primary bg-primary/10 rotate-180' 
                    : 'border-muted border-t-primary'
                )}
                style={{
                  transform: `rotate(${pullProgress * 180}deg) scale(${0.8 + pullProgress * 0.4})`
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div 
        style={{
          transform: isRefreshing ? 'translateY(60px)' : `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
});

PullToRefresh.displayName = 'PullToRefresh';