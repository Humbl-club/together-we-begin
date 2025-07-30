import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';

interface MobileFirstCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const MobileFirstCard = forwardRef<HTMLDivElement, MobileFirstCardProps>(
  ({ className, variant = 'default', size = 'md', interactive = false, padding = 'md', children, ...props }, ref) => {
    const { isMobile } = useMobileFirst();

    const baseStyles = cn(
      // Base styles
      "relative overflow-hidden transition-all duration-200",
      
      // Mobile-first border radius
      isMobile ? "rounded-2xl" : "rounded-xl",
      
      // Size variants
      {
        'min-h-[120px]': size === 'sm',
        'min-h-[160px]': size === 'md', 
        'min-h-[200px]': size === 'lg',
      },
      
      // Padding variants - mobile-first
      padding === 'none' && 'p-0',
      padding === 'sm' && (isMobile ? 'p-3' : 'p-2'),
      padding === 'md' && (isMobile ? 'p-4' : 'p-3'),
      padding === 'lg' && (isMobile ? 'p-6' : 'p-4'),
      
      // Variant styles
      {
        'card-secondary': variant === 'default',
        'card-primary shadow-lg': variant === 'elevated',
        'card-glass backdrop-blur-xl': variant === 'glass',
        'card-accent shadow-xl': variant === 'premium',
      },
      
      // Interactive states
      interactive && cn(
        "cursor-pointer hover:shadow-md",
        isMobile && "active:scale-[0.98] transform-gpu touch-manipulation"
      ),
      
      className
    );

    return (
      <div className={baseStyles} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

export const MobileFirstCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-2",
          isMobile ? "pb-3" : "pb-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const MobileFirstCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const MobileFirstCardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <h3
        ref={ref}
        className={cn(
          "font-semibold leading-tight tracking-tight text-foreground",
          isMobile ? "text-lg" : "text-base",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

export const MobileFirstCardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <p
        ref={ref}
        className={cn(
          "text-muted-foreground leading-relaxed",
          isMobile ? "text-sm" : "text-xs",
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

MobileFirstCard.displayName = 'MobileFirstCard';
MobileFirstCardHeader.displayName = 'MobileFirstCardHeader';
MobileFirstCardContent.displayName = 'MobileFirstCardContent';
MobileFirstCardTitle.displayName = 'MobileFirstCardTitle';
MobileFirstCardDescription.displayName = 'MobileFirstCardDescription';