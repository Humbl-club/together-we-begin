import { useEffect, useRef, useState } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: PullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const scrollTop = useRef<number>(0);
  
  const feedback = useHapticFeedback();

  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    let touchId: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      scrollTop.current = container.scrollTop;
      if (scrollTop.current > 0) return;

      touchId = e.touches[0].identifier;
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId === null) return;
      
      const touch = Array.from(e.touches).find(t => t.identifier === touchId);
      if (!touch) return;

      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0 && scrollTop.current <= 0) {
        e.preventDefault();
        
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
        
        if (!isPulling && distance > 10) {
          setIsPulling(true);
          feedback.selection();
        }
        
        if (distance >= threshold && !isRefreshing) {
          feedback.impact('medium');
        }
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (touchId === null) return;
      
      const wasReleased = !Array.from(e.touches).some(t => t.identifier === touchId);
      if (!wasReleased) return;

      touchId = null;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        feedback.success();
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull to refresh error:', error);
          feedback.error();
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, onRefresh, pullDistance, isPulling, isRefreshing, feedback]);

  const refreshIndicatorStyle = {
    transform: `translateY(${pullDistance}px)`,
    opacity: Math.min(pullDistance / threshold, 1)
  };

  return {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    refreshIndicatorStyle,
    shouldTrigger: pullDistance >= threshold
  };
};