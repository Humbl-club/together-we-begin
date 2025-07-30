import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';

interface MobileNativeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const MobileNativeCard = forwardRef<HTMLDivElement, MobileNativeCardProps>(
  ({ className, variant = 'default', padding = 'md', interactive = false, children, ...props }, ref) => {
    const { isMobile } = useMobileFirst();

    const baseStyles = cn(
      // Base styles
      "rounded-xl bg-card text-card-foreground transition-all duration-200",
      
      // Mobile-first responsive design
      isMobile ? "rounded-2xl" : "rounded-xl",
      
      // Padding variants - mobile-first
      padding === 'none' && 'p-0',
      padding === 'sm' && (isMobile ? 'p-3' : 'p-2'),
      padding === 'md' && (isMobile ? 'p-4' : 'p-3'),
      padding === 'lg' && (isMobile ? 'p-6' : 'p-4'),
      
      // Variant styles
      {
        'shadow-sm border border-border': variant === 'default',
        'shadow-lg border border-border': variant === 'elevated',
        'shadow-none border-2 border-border': variant === 'outlined',
        'glass-card': variant === 'glass',
      },
      
      // Interactive states
      interactive && cn(
        "cursor-pointer hover:shadow-md",
        isMobile && "active:scale-[0.98] active:brightness-95 transform-gpu"
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

export const MobileNativeCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5",
          isMobile ? "p-4 pb-0" : "p-3 pb-0",
          className
        )}
        {...props}
      />
    );
  }
);

export const MobileNativeCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <div
        ref={ref}
        className={cn(
          isMobile ? "p-4 pt-0" : "p-3 pt-0",
          className
        )}
        {...props}
      />
    );
  }
);

export const MobileNativeCardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { isMobile } = useMobileFirst();
    
    return (
      <h3
        ref={ref}
        className={cn(
          "font-semibold leading-none tracking-tight",
          isMobile ? "text-lg" : "text-base",
          className
        )}
        {...props}
      />
    );
  }
);

MobileNativeCard.displayName = 'MobileNativeCard';
MobileNativeCardHeader.displayName = 'MobileNativeCardHeader';
MobileNativeCardContent.displayName = 'MobileNativeCardContent';
MobileNativeCardTitle.displayName = 'MobileNativeCardTitle';