import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileNativeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  haptic?: boolean;
}

export const MobileNativeButton = forwardRef<HTMLButtonElement, MobileNativeButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, loading, haptic = true, children, onClick, ...props }, ref) => {
    const { isMobile, touchSupported } = useMobileFirst();
    const feedback = useHapticFeedback();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic && isMobile && touchSupported) {
        feedback.tap();
      }
      onClick?.(event);
    };

    const baseStyles = cn(
      // Base styles - mobile-first
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
      
      // Mobile-first touch targets
      isMobile ? "min-h-[44px] text-base" : "min-h-[40px] text-sm",
      
      // Mobile-specific improvements
      isMobile && cn(
        "active:scale-95 active:brightness-90",
        "transform-gpu will-change-transform", // Hardware acceleration
        "select-none touch-manipulation", // Optimized touch
      ),
      
      // Size variants
      {
        'px-3 py-2 text-sm min-h-[36px]': size === 'sm' && !isMobile,
        'px-3 py-2.5 text-sm min-h-[40px]': size === 'sm' && isMobile,
        'px-4 py-2.5 text-base min-h-[40px]': size === 'md' && !isMobile,
        'px-4 py-3 text-base min-h-[44px]': size === 'md' && isMobile,
        'px-6 py-3 text-lg min-h-[44px]': size === 'lg' && !isMobile,
        'px-6 py-4 text-lg min-h-[48px]': size === 'lg' && isMobile,
      },
      
      // Variant styles
      {
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm': variant === 'primary',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border': variant === 'secondary',
        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm': variant === 'destructive',
      },
      
      // Full width
      fullWidth && "w-full",
      
      // Rounded corners - mobile-first
      isMobile ? "rounded-xl" : "rounded-lg",
      
      className
    );

    return (
      <button
        className={baseStyles}
        ref={ref}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

MobileNativeButton.displayName = 'MobileNativeButton';