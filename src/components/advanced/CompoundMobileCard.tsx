import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';

interface CompoundMobileCardProps {
  children: React.ReactNode;
  className?: string;
  enableSwipeActions?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableLongPress?: boolean;
  onLongPress?: () => void;
  variant?: string; // For compatibility
}

interface CompoundMobileCardComponent extends React.FC<CompoundMobileCardProps> {
  Header: React.FC<{ children: React.ReactNode }>;
  Content: React.FC<{ children: React.ReactNode }>;
}

const CompoundMobileCardBase: React.FC<CompoundMobileCardProps> = ({
  children,
  className = '',
  enableSwipeActions = false,
  onSwipeLeft,
  onSwipeRight,
  enableLongPress = false,
  onLongPress,
  variant, // Accept but ignore for compatibility
}) => {
  const { isMobile, isTouch, prefersReducedMotion } = useAdvancedMobileOptimization();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTouch) return;
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });

    if (enableLongPress && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !enableSwipeActions) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // Cancel long press if user moves too much
    if (longPressTimer.current && (Math.abs(deltaX) > 10 || deltaY > 10)) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only handle horizontal swipes
    if (deltaY < 50) {
      setSwipeOffset(deltaX * 0.3); // Damped movement
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart || !enableSwipeActions) {
      setTouchStart(null);
      setSwipeOffset(0);
      setIsLongPressing(false);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaTime = Date.now() - touchStart.time;

    // Swipe detection
    if (Math.abs(deltaX) > 100 && deltaTime < 300) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setTouchStart(null);
    setSwipeOffset(0);
    setIsLongPressing(false);
  };

  const cardStyle = {
    transform: !prefersReducedMotion && swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
    transition: swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    willChange: swipeOffset !== 0 ? 'transform' : undefined,
  };

  const enhancedClassName = `
    ${className}
    ${isMobile ? 'mobile-optimized' : ''}
    ${isTouch ? 'touch-optimized' : ''}
    ${isLongPressing ? 'long-pressing' : ''}
    ${enableSwipeActions ? 'swipe-enabled' : ''}
  `.trim();

  return (
    <Card
      ref={cardRef}
      className={enhancedClassName}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent className="relative">
        {children}
        {enableSwipeActions && swipeOffset !== 0 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <div className={`text-sm font-medium transition-opacity duration-200 ${
              swipeOffset < -50 ? 'opacity-100 text-destructive' : 'opacity-50 text-muted-foreground'
            }`}>
              {swipeOffset < -50 ? '← Delete' : 'Swipe left'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Create compound component with proper typing
export const CompoundMobileCard = CompoundMobileCardBase as CompoundMobileCardComponent;

// Add compound component pattern for compatibility
CompoundMobileCard.Header = ({ children }: { children: React.ReactNode }) => <>{children}</>;
CompoundMobileCard.Content = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Legacy export for backward compatibility
export const MobileCard = CompoundMobileCard;