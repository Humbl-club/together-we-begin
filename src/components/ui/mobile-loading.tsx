import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { cn } from '@/lib/utils';

interface MobileLoadingProps {
  variant?: 'pulse' | 'skeleton' | 'ios' | 'dots' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const MobileLoading = memo(({ 
  variant = 'pulse', 
  size = 'md', 
  className,
  text 
}: MobileLoadingProps) => {
  const { isMobile } = useMobileFirst();
  
  // Use simpler animations for mobile to save battery
  const shouldUseReducedAnimation = isMobile;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'ios') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
        <div className={cn(
          'rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size],
          shouldUseReducedAnimation ? 'animate-pulse' : 'animate-spin'
        )} />
        {text && (
          <p className={cn(
            'text-muted-foreground font-light tracking-wide',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-primary/60',
              size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3',
              shouldUseReducedAnimation ? 'animate-pulse' : 'animate-bounce'
            )}
            style={{
              animationDelay: shouldUseReducedAnimation ? '0ms' : `${i * 150}ms`,
              animationDuration: shouldUseReducedAnimation ? '1s' : '0.6s'
            }}
          />
        ))}
        {text && (
          <p className={cn(
            'ml-3 text-muted-foreground font-light',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div className={cn('flex flex-col space-y-3', className)}>
        <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
          <div 
            className={cn(
              'h-full bg-primary rounded-full',
              shouldUseReducedAnimation ? 'animate-pulse' : 'animate-[progress_2s_ease-in-out_infinite]'
            )}
            style={{
              width: '30%',
              animation: shouldUseReducedAnimation ? undefined : 'progress 2s ease-in-out infinite'
            }}
          />
        </div>
        {text && (
          <p className={cn(
            'text-center text-muted-foreground font-light',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className={cn(
          'bg-muted rounded animate-pulse',
          size === 'sm' ? 'h-12' : size === 'md' ? 'h-16' : 'h-20'
        )} />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
        </div>
        {text && (
          <p className={cn(
            'text-muted-foreground font-light text-center',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default pulse variant
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className={cn(
        'rounded-full bg-primary/20',
        sizeClasses[size],
        shouldUseReducedAnimation ? 'animate-pulse' : 'animate-[pulse_1.5s_ease-in-out_infinite]'
      )} />
      {text && (
        <p className={cn(
          'text-muted-foreground font-light tracking-wide',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
});

// Skeleton components for specific layouts
export const FeedLoadingSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="glass-card p-4 space-y-3 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="space-y-1 flex-1">
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="h-2 bg-muted rounded w-1/6" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    ))}
  </div>
));

export const DashboardLoadingSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="h-16 bg-muted rounded-xl animate-pulse" />
    
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
      ))}
    </div>
    
    {/* Content skeleton */}
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
));

export const EventsLoadingSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="glass-card p-4 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
));