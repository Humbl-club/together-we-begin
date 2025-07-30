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

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8'
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
        // Mobile-specific adjustments
        isMobile && cn(
          'text-responsive',
          'space-y-4', // Better mobile spacing
        )
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
  const { isMobile } = useMobileFirst();

  return (
    <section className={cn(
      'glass-card rounded-xl',
      isMobile ? 'p-4 mb-4' : 'p-6 mb-6',
      className
    )}>
      {(title || description) && (
        <div className={cn('mb-4', isMobile && 'mb-3')}>
          {title && (
            <h2 className={cn(
              'font-semibold text-foreground',
              isMobile ? 'text-lg' : 'text-xl'
            )}>
              {title}
            </h2>
          )}
          {description && (
            <p className={cn(
              'text-muted-foreground mt-1',
              isMobile ? 'text-sm' : 'text-base'
            )}>
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