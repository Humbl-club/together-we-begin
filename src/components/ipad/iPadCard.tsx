import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface iPadCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'minimal' | 'bordered';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onClick?: () => void;
  fullHeight?: boolean;
}

export const iPadCard: React.FC<iPadCardProps> = memo(({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className,
  variant = 'elevated',
  size = 'md',
  interactive = false,
  onClick,
  fullHeight = false
}) => {
  const { isTablet, isDesktop } = useMobileOptimization();

  // Use regular card for mobile
  if (!isTablet && !isDesktop) {
    return (
      <Card className={cn("glass-card", className)} onClick={onClick}>
        {(title || subtitle) && (
          <CardHeader>
            {title && (
              <CardTitle className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5" />}
                {title}
              </CardTitle>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  const variants = {
    default: 'bg-card border border-border',
    elevated: 'ipad-card-elevated',
    glass: 'ipad-card-glass',
    minimal: 'bg-card/50 border-0',
    bordered: 'bg-card border-2 border-border/20'
  };

  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const cardClasses = cn(
    'ipad-card-base',
    variants[variant],
    sizes[size],
    interactive && 'ipad-card-interactive',
    fullHeight && 'h-full',
    className
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <CardHeader className="pb-4">
          {title && (
            <CardTitle className="text-xl flex items-center gap-3">
              {Icon && <Icon className="w-6 h-6 text-primary" />}
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-base leading-relaxed">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
});

iPadCard.displayName = 'iPadCard';