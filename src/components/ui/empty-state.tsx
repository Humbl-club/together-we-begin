import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className={cn('glass-card border-0', className)}>
      <CardContent className={cn(
        'text-center',
        isCompact ? 'py-8' : 'py-12'
      )}>
        <div className={cn(
          'mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center',
          isCompact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          <Icon className={cn(
            'text-primary/70',
            isCompact ? 'w-6 h-6' : 'w-8 h-8'
          )} />
        </div>
        
        <h3 className={cn(
          'font-semibold gradient-text mb-2',
          isCompact ? 'text-lg' : 'text-xl'
        )}>
          {title}
        </h3>
        
        <p className={cn(
          'text-muted-foreground mb-6 max-w-md mx-auto',
          isCompact ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            size={isCompact ? 'sm' : 'default'}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};