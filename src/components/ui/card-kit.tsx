import React from 'react';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { Card as BaseCard, CardContent as BaseCardContent, CardHeader as BaseCardHeader, CardTitle as BaseCardTitle, CardDescription as BaseCardDescription, CardFooter as BaseCardFooter } from '@/components/ui/card';
import { MobileNativeCard, MobileNativeCardContent, MobileNativeCardHeader, MobileNativeCardTitle } from '@/components/ui/mobile-native-card';

// Unified Card Kit - chooses native card on mobile for tactile feel, base card on desktop

export const CardKit: React.FC<React.ComponentProps<typeof BaseCard> & {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ className, children, variant = 'default', interactive = false, padding = 'md', ...props }) => {
  const { isMobile } = useMobileFirst();

  if (isMobile) {
    return (
      <MobileNativeCard className={className} variant={variant} interactive={interactive} padding={padding} {...(props as any)}>
        {children}
      </MobileNativeCard>
    );
  }

  // Map variants to desktop classNames
  const variantCls =
    variant === 'elevated' ? 'shadow-lg border' :
    variant === 'outlined' ? 'border-2' :
    variant === 'glass' ? 'glass-card' : 'card-secondary';

  return (
    <BaseCard className={cn(variantCls, 'motion-safe:animate-fade-in', className)} {...props}>
      {children}
    </BaseCard>
  );
};

export const CardKitHeader: React.FC<React.ComponentProps<typeof BaseCardHeader>> = ({ className, children, ...props }) => {
  const { isMobile } = useMobileFirst();
  if (isMobile) return <MobileNativeCardHeader className={className} {...(props as any)}>{children}</MobileNativeCardHeader>;
  return <BaseCardHeader className={className} {...props}>{children}</BaseCardHeader>;
};

export const CardKitContent: React.FC<React.ComponentProps<typeof BaseCardContent>> = ({ className, children, ...props }) => {
  const { isMobile } = useMobileFirst();
  if (isMobile) return <MobileNativeCardContent className={className} {...(props as any)}>{children}</MobileNativeCardContent>;
  return <BaseCardContent className={className} {...props}>{children}</BaseCardContent>;
};

export const CardKitTitle: React.FC<React.ComponentProps<typeof BaseCardTitle>> = ({ className, children, ...props }) => {
  const { isMobile } = useMobileFirst();
  if (isMobile) return <MobileNativeCardTitle className={cn('text-lg', className)} {...(props as any)}>{children}</MobileNativeCardTitle>;
  return <BaseCardTitle className={className} {...props}>{children}</BaseCardTitle>;
};

export const CardKitFooter: React.FC<React.ComponentProps<typeof BaseCardFooter>> = ({ className, children, ...props }) => {
  return <BaseCardFooter className={className} {...props}>{children}</BaseCardFooter>;
};

export const CardKitDescription = BaseCardDescription;
