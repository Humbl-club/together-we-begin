import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface TabletCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'enhanced' | 'glass' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

export const TabletCard: React.FC<TabletCardProps> = memo(({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className,
  variant = 'enhanced',
  size = 'md',
  interactive = false,
  onClick
}) => {
  const { isTablet, fontSize, spacing, padding } = useMobileOptimization();

  if (!isTablet) {
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
    default: 'bg-background border border-border',
    enhanced: 'tablet-card-enhanced',
    glass: 'glass-card',
    accent: 'bg-primary/5 border border-primary/20'
  };

  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const cardClasses = cn(
    variants[variant],
    sizes[size],
    interactive && 'cursor-pointer hover:scale-[1.02] transition-all duration-200',
    className
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className={cn(fontSize.heading, "flex items-center gap-2")}>
              {Icon && <Icon className="w-6 h-6 text-primary" />}
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className={cn("text-muted-foreground", fontSize.body)}>{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={spacing}>
        {children}
      </CardContent>
    </Card>
  );
});

TabletCard.displayName = 'TabletCard';