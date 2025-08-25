import React, { memo, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
  threshold?: number;
  longPressDelay?: number;
}

export const SwipeableCard = memo(({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onLongPress,
  className,
  disabled = false,
  threshold = 100,
  longPressDelay = 500
}: SwipeableCardProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const haptic = useHapticFeedback();
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const dragStart = useRef<number>(0);

  const startLongPress = useCallback(() => {
    if (!onLongPress || disabled) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      haptic.impact('medium');
      onLongPress();
    }, longPressDelay);
  }, [onLongPress, disabled, longPressDelay, haptic]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !isMobile) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    dragStart.current = touch.clientX;
    setIsDragging(true);
    
    startLongPress();
  }, [disabled, isMobile, startLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled || !isMobile) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - dragStart.current);
    
    // Cancel long press if user moves finger
    if (deltaX > 10) {
      cancelLongPress();
    }
    
    setCurrentX(touch.clientX);
    
    if (cardRef.current) {
      const offset = touch.clientX - startX;
      cardRef.current.style.transform = `translateX(${offset}px)`;
      cardRef.current.style.opacity = `${1 - Math.abs(offset) / (threshold * 2)}`;
    }
  }, [isDragging, disabled, isMobile, startX, threshold, cancelLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    
    cancelLongPress();
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const shouldTrigger = Math.abs(deltaX) > threshold;
    
    if (cardRef.current) {
      if (shouldTrigger) {
        // Animate out before triggering callback
        cardRef.current.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'})`;
        cardRef.current.style.opacity = '0';
        
        setTimeout(() => {
          if (deltaX > 0 && onSwipeRight) {
            haptic.impact('light');
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            haptic.impact('light');
            onSwipeLeft();
          }
          
          // Reset position
          if (cardRef.current) {
            cardRef.current.style.transform = '';
            cardRef.current.style.opacity = '';
          }
        }, 200);
      } else {
        // Snap back
        cardRef.current.style.transform = '';
        cardRef.current.style.opacity = '';
      }
    }
    
    setCurrentX(0);
    setStartX(0);
  }, [isDragging, disabled, currentX, startX, threshold, onSwipeLeft, onSwipeRight, haptic, cancelLongPress]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
    startLongPress();
  }, [isMobile, startLongPress]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    
    const deltaX = Math.abs(e.clientX - startX);
    if (deltaX > 10) {
      cancelLongPress();
    }
    
    setCurrentX(e.clientX);
    
    if (cardRef.current) {
      const offset = e.clientX - startX;
      cardRef.current.style.transform = `translateX(${offset}px)`;
      cardRef.current.style.opacity = `${1 - Math.abs(offset) / (threshold * 2)}`;
    }
  }, [isDragging, isMobile, startX, threshold, cancelLongPress]);

  const handleMouseUp = useCallback(() => {
    if (isMobile) return;
    handleTouchEnd();
  }, [isMobile, handleTouchEnd]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'touch-manipulation select-none transition-all duration-200',
        isDragging && 'cursor-grabbing',
        isLongPressing && 'scale-95',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
    </div>
  );
});

interface GestureZoneProps {
  children: React.ReactNode;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
}

export const GestureZone = memo(({ 
  children, 
  onTap, 
  onDoubleTap, 
  onLongPress,
  className,
  disabled = false
}: GestureZoneProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const haptic = useHapticFeedback();
  
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout>();
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        haptic.impact('medium');
        onLongPress();
      }, 500);
    }
  }, [disabled, onLongPress, haptic]);

  const handleRelease = useCallback(() => {
    if (disabled) return;
    
    // Clear long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Handle tap counting
    setTapCount(prev => prev + 1);
    
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }
    
    tapTimer.current = setTimeout(() => {
      if (tapCount === 0) { // First tap
        if (onTap) {
          haptic.tap();
          onTap();
        }
      } else if (tapCount === 1) { // Double tap
        if (onDoubleTap) {
          haptic.impact('light');
          onDoubleTap();
        }
      }
      setTapCount(0);
    }, 300);
  }, [disabled, tapCount, onTap, onDoubleTap, haptic]);

  return (
    <div
      className={cn('touch-manipulation', className)}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseDown={!isMobile ? handlePress : undefined}
      onMouseUp={!isMobile ? handleRelease : undefined}
    >
      {children}
    </div>
  );
});

SwipeableCard.displayName = 'SwipeableCard';
GestureZone.displayName = 'GestureZone';