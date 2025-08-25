import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centerContent?: boolean;
  safeArea?: boolean;
}

export const MobileContainer = memo(({ 
  children, 
  className,
  padding = 'md',
  maxWidth = 'lg',
  centerContent = false,
  safeArea = true
}: MobileContainerProps) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();

  // Mobile-first padding system - consistent across all devices
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const safeAreaStyles = safeArea ? {
    paddingTop: `max(1rem, ${safeAreaInsets.top}px)`,
    paddingBottom: `max(1rem, ${safeAreaInsets.bottom}px)`,
    paddingLeft: `max(1rem, ${safeAreaInsets.left}px)`,
    paddingRight: `max(1rem, ${safeAreaInsets.right}px)`
  } : {};

  return (
    <div 
      className={cn(
        'w-full mx-auto',
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        centerContent && 'flex flex-col items-center justify-center',
        isMobile && 'mobile-container',
        className
      )}
      style={safeAreaStyles}
    >
      <div className={cn(
        'w-full',
        // Ensure text doesn't overflow
        'break-words overflow-wrap-anywhere',
        // Mobile-first text and spacing - consistent across all devices
        'text-responsive space-y-4'
      )}>
        {children}
      </div>
    </div>
  );
});

export const MobileSection = memo(({ 
  children, 
  className,
  title,
  description 
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) => {
  return (
    <section className={cn(
      // Mobile-first design - consistent across all devices
      'glass-card rounded-2xl p-4 mb-4',
      className
    )}>
      {(title || description) && (
        <div className="mb-3">
          {title && (
            <h2 className="font-semibold text-foreground text-lg">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
});

MobileContainer.displayName = 'MobileContainer';
MobileSection.displayName = 'MobileSection';