import React, { memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const MobileOptimizedButton = memo(forwardRef<HTMLButtonElement, MobileOptimizedButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, onClick, ...props }, ref) => {
    const { isMobile, prefersReducedMotion } = useAdvancedMobileOptimization();
    const haptic = useHapticFeedback();

    const variants = {
      primary: cn(
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
        "active:bg-primary/80"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground",
        "hover:bg-secondary/80",
        "active:bg-secondary/60"
      ),
      ghost: cn(
        "bg-transparent text-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "active:bg-accent/50"
      ),
      destructive: cn(
        "bg-destructive text-destructive-foreground",
        "hover:bg-destructive/90",
        "active:bg-destructive/80"
      )
    };

    const sizes = {
      sm: cn(
        "h-9 px-3 text-xs",
        isMobile && "h-11 px-4 text-sm" // Larger on mobile
      ),
      md: cn(
        "h-10 px-4 py-2",
        isMobile && "h-12 px-6 py-3" // Larger on mobile
      ),
      lg: cn(
        "h-11 px-8",
        isMobile && "h-14 px-10" // Larger on mobile
      )
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isMobile) {
        haptic.tap();
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-all duration-200 ease-out",
          "touch-manipulation focus-ring",
          "relative overflow-hidden",
          
          // Mobile optimizations
          isMobile && cn(
            "min-h-[44px] min-w-[44px]", // iOS minimum touch target
            "active:scale-[0.97]",
            !prefersReducedMotion && "active:animate-ios-bounce"
          ),
          
          // Desktop optimizations
          !isMobile && cn(
            "hover:scale-[1.02]",
            "hover:shadow-lg"
          ),
          
          // Variants and sizes
          variants[variant],
          sizes[size],
          
          // Loading state
          loading && "opacity-70 cursor-not-allowed",
          
          // Disabled state
          props.disabled && "opacity-50 cursor-not-allowed",
          
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect overlay */}
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 active:opacity-100" />
        </span>
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {children}
        </span>
      </button>
    );
  }
));

MobileOptimizedButton.displayName = 'MobileOptimizedButton';