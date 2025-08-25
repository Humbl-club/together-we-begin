import React from 'react';
import { cn } from '@/lib/utils';

interface MobileTypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'tiny';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  responsive?: boolean;
}

export const MobileTypography: React.FC<MobileTypographyProps> = ({ 
  variant = 'body', 
  weight = 'normal',
  responsive = true,
  className,
  children,
  ...props 
}) => {
  const getVariantClasses = () => {
    const baseClasses = {
      h1: responsive 
        ? 'text-2xl sm:text-3xl md:text-4xl leading-tight' 
        : 'text-2xl leading-tight',
      h2: responsive 
        ? 'text-xl sm:text-2xl md:text-3xl leading-tight' 
        : 'text-xl leading-tight',
      h3: responsive 
        ? 'text-lg sm:text-xl md:text-2xl leading-snug' 
        : 'text-lg leading-snug',
      h4: responsive 
        ? 'text-base sm:text-lg md:text-xl leading-snug' 
        : 'text-base leading-snug',
      body: responsive 
        ? 'text-sm sm:text-base leading-relaxed' 
        : 'text-sm leading-relaxed',
      caption: responsive 
        ? 'text-xs sm:text-sm leading-normal' 
        : 'text-xs leading-normal',
      tiny: 'text-xs leading-normal'
    };
    return baseClasses[variant];
  };

  const getWeightClasses = () => {
    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };
    return weightClasses[weight];
  };

  const Element = (() => {
    switch (variant) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      case 'caption':
      case 'tiny': return 'span';
      default: return 'p';
    }
  })();

  return React.createElement(
    Element,
    {
      className: cn(
        getVariantClasses(),
        getWeightClasses(),
        'text-foreground',
        className
      ),
      ...props
    },
    children
  );
};

// Convenience components for common usage
export const MobileHeading = (props: Omit<MobileTypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 }) => (
  <MobileTypography variant={`h${props.level}` as any} weight="semibold" {...props} />
);

export const MobileText = (props: Omit<MobileTypographyProps, 'variant'>) => (
  <MobileTypography variant="body" {...props} />
);

export const MobileCaption = (props: Omit<MobileTypographyProps, 'variant'>) => (
  <MobileTypography variant="caption" className="text-muted-foreground" {...props} />
);