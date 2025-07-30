import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedLoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'ios';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showText?: boolean;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  className,
  text = 'Loading...',
  showText = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (variant === 'ios') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className={cn(
          'animate-spin rounded-full border-2 border-primary/20 border-t-primary',
          sizeClasses[size]
        )} />
        {showText && (
          <p className="text-sm text-muted-foreground mt-2">{text}</p>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded-lg animate-pulse w-4/6" />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className={cn(
          'bg-primary/20 rounded-full animate-pulse',
          sizeClasses[size]
        )} />
        {showText && (
          <p className="text-sm text-muted-foreground mt-2">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {showText && (
        <p className="text-sm text-muted-foreground mt-2">{text}</p>
      )}
    </div>
  );
};

// Skeleton components for different layouts
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('glass-card p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded animate-pulse" />
      <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
      <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/20">
        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('grid grid-cols-2 gap-4', className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card p-4 space-y-2">
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    ))}
  </div>
);