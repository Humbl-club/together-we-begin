import { useEffect, useRef, useState } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isActive: boolean;
}

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
}

export const useGestures = (handlers: GestureHandlers) => {
  const ref = useRef<HTMLElement>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isActive: false
  });

  const longPressTimer = useRef<NodeJS.Timeout>();
  const tapStartTime = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let touchStartTime = 0;
    let touches: TouchList | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartTime = Date.now();
      tapStartTime.current = touchStartTime;
      touches = e.touches;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setSwipeState({
          startX: touch.clientX,
          startY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY,
          deltaX: 0,
          deltaY: 0,
          isActive: true
        });

        // Long press detection
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, 500);
      } else if (e.touches.length === 2) {
        handlers.onPinchStart?.();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && swipeState.isActive) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - swipeState.startX;
        const deltaY = touch.clientY - swipeState.startY;

        setSwipeState(prev => ({
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY,
          deltaX,
          deltaY
        }));

        // Clear long press timer if moving
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      if (e.changedTouches.length === 1 && swipeState.isActive) {
        const { deltaX, deltaY } = swipeState;
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;
        const swipeTime = Date.now() - touchStartTime;

        if (swipeTime < maxSwipeTime) {
          if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
              handlers.onSwipeRight?.();
            } else {
              handlers.onSwipeLeft?.();
            }
          } else if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY > 0) {
              handlers.onSwipeDown?.();
            } else {
              handlers.onSwipeUp?.();
            }
          } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            // Tap detection
            const tapTime = Date.now() - tapStartTime.current;
            if (tapTime < 200) {
              handlers.onTap?.();
            }
          }
        }

        setSwipeState(prev => ({ ...prev, isActive: false }));
      } else if (touches && touches.length === 2) {
        handlers.onPinchEnd?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handlers, swipeState.isActive, swipeState.startX, swipeState.startY]);

  return { ref, swipeState };
};