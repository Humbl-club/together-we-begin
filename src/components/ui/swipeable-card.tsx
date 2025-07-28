import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGestures } from '@/hooks/useGestures';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  background: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children?: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  onTap,
  swipeThreshold = 80,
  disabled = false,
  className
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isActionVisible, setIsActionVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  
  const feedback = useHapticFeedback();

  const { ref, swipeState } = useGestures({
    onSwipeLeft: () => {
      if (disabled) return;
      feedback.tap();
      onSwipeLeft?.();
      if (rightActions.length > 0) {
        setIsActionVisible(true);
        setSwipeOffset(-swipeThreshold);
      }
    },
    onSwipeRight: () => {
      if (disabled) return;
      feedback.tap();
      onSwipeRight?.();
      if (leftActions.length > 0) {
        setIsActionVisible(true);
        setSwipeOffset(swipeThreshold);
      }
    },
    onTap: () => {
      if (disabled) return;
      if (isActionVisible) {
        resetCard();
      } else {
        feedback.tap();
        onTap?.();
      }
    }
  });

  const resetCard = () => {
    setSwipeOffset(0);
    setIsActionVisible(false);
    setActiveAction(null);
  };

  const executeAction = (action: SwipeAction) => {
    feedback.impact('medium');
    action.onAction();
    resetCard();
  };

  const getVisibleActions = () => {
    if (swipeOffset > 0) return leftActions;
    if (swipeOffset < 0) return rightActions;
    return [];
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Actions */}
      {isActionVisible && (
        <div className="absolute inset-0 flex items-center z-0">
          {swipeOffset > 0 && leftActions.length > 0 && (
            <div className="flex h-full">
              {leftActions.map((action, index) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-full rounded-none px-4 min-w-[80px]",
                    action.background,
                    action.color
                  )}
                  onClick={() => executeAction(action)}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              ))}
            </div>
          )}
          
          {swipeOffset < 0 && rightActions.length > 0 && (
            <div className="flex h-full ml-auto">
              {rightActions.map((action, index) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-full rounded-none px-4 min-w-[80px]",
                    action.background,
                    action.color
                  )}
                  onClick={() => executeAction(action)}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          "relative z-10 transition-transform duration-200 ease-out",
          "touch-manipulation select-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`
        }}
      >
        <Card className={className}>
          {children}
        </Card>
      </div>
    </div>
  );
};