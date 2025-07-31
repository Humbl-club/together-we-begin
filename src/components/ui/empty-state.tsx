import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {/* Icon with gradient background */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl" />
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 text-muted-foreground">
          <div className="w-10 h-10">
            {icon}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'secondary'}
          className="min-w-[140px]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};