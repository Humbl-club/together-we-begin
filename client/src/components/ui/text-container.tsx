import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';

interface TextContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'body' | 'caption' | 'heading' | 'subheading';
  truncate?: boolean | number; // true for single line, number for multiple lines
  responsive?: boolean;
}

export const TextContainer = memo(({ 
  children, 
  className,
  variant = 'body',
  truncate = false,
  responsive = true
}: TextContainerProps) => {
  const { isMobile } = useAdvancedMobileOptimization();

  const variantClasses = {
    body: cn(
      'text-base leading-relaxed',
      responsive && isMobile && 'text-sm leading-normal'
    ),
    caption: cn(
      'text-sm text-muted-foreground',
      responsive && isMobile && 'text-xs'
    ),
    heading: cn(
      'text-xl font-semibold',
      responsive && isMobile && 'text-lg'
    ),
    subheading: cn(
      'text-lg font-medium',
      responsive && isMobile && 'text-base'
    )
  };

  const truncateClasses = (() => {
    if (truncate === true) {
      return 'truncate';
    }
    if (typeof truncate === 'number' && truncate > 1) {
      return cn(
        'overflow-hidden',
        `line-clamp-${truncate}`
      );
    }
    return '';
  })();

  return (
    <div className={cn(
      // Base text handling
      'break-words overflow-wrap-anywhere hyphens-auto',
      
      // Variant styling
      variantClasses[variant],
      
      // Truncation
      truncateClasses,
      
      // Mobile optimizations
      isMobile && cn(
        'leading-normal', // Better line height for mobile
        'max-w-full', // Ensure container doesn't overflow
      ),
      
      className
    )}>
      {children}
    </div>
  );
});

// Specific text components for common use cases
export const ResponsiveHeading = memo(({ 
  level = 1, 
  children, 
  className 
}: { 
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}) => {
  const { isMobile } = useAdvancedMobileOptimization();
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const sizeClasses = {
    1: cn('text-3xl font-bold', isMobile && 'text-2xl'),
    2: cn('text-2xl font-semibold', isMobile && 'text-xl'),
    3: cn('text-xl font-semibold', isMobile && 'text-lg'),
    4: cn('text-lg font-medium', isMobile && 'text-base'),
    5: cn('text-base font-medium', isMobile && 'text-sm'),
    6: cn('text-sm font-medium', isMobile && 'text-xs')
  };

  return (
    <Tag className={cn(
      'break-words leading-tight',
      sizeClasses[level],
      className
    )}>
      {children}
    </Tag>
  );
});

export const ResponsiveText = memo(({ 
  children, 
  className,
  size = 'base'
}: { 
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}) => {
  const { isMobile } = useAdvancedMobileOptimization();
  
  const sizeClasses = {
    xs: cn('text-xs', isMobile && 'text-xs'),
    sm: cn('text-sm', isMobile && 'text-xs'),
    base: cn('text-base', isMobile && 'text-sm'),
    lg: cn('text-lg', isMobile && 'text-base'),
    xl: cn('text-xl', isMobile && 'text-lg')
  };

  return (
    <p className={cn(
      'break-words leading-relaxed',
      sizeClasses[size],
      className
    )}>
      {children}
    </p>
  );
});

TextContainer.displayName = 'TextContainer';
ResponsiveHeading.displayName = 'ResponsiveHeading';
ResponsiveText.displayName = 'ResponsiveText';