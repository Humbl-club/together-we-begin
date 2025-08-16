import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MobileEnhancedSkeletonProps extends React.ComponentProps<typeof Skeleton> {
  variant?: 'mobile-card' | 'mobile-feed' | 'mobile-stats' | 'mobile-header' | 'mobile-list';
}

export const MobileEnhancedSkeleton = memo(({ variant = 'mobile-card', className, ...props }: MobileEnhancedSkeletonProps) => {
  if (variant === 'mobile-feed') {
    return <MobileFeedSkeleton />;
  }
  
  if (variant === 'mobile-header') {
    return <MobileHeaderSkeleton />;
  }
  
  if (variant === 'mobile-stats') {
    return <MobileStatsSkeleton />;
  }
  
  if (variant === 'mobile-list') {
    return <MobileListSkeleton />;
  }
  
  return <Skeleton className={className} {...props} />;
});

export const MobileHeaderSkeleton = memo(() => (
  <div className="animate-pulse px-4 py-2">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 bg-muted" />
        <Skeleton className="h-4 w-24 bg-muted/60" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
      </div>
    </div>
  </div>
));

export const MobileStatsSkeleton = memo(() => (
  <div className="grid grid-cols-2 gap-3 px-4">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-24 bg-muted rounded-2xl" />
    ))}
  </div>
));

export const MobileFeedSkeleton = memo(() => (
  <div className="space-y-4 px-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <Skeleton className="h-48 w-full bg-muted rounded-2xl mb-3" />
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-full bg-muted" />
          <Skeleton className="h-4 w-24 bg-muted" />
        </div>
        <Skeleton className="h-4 w-full bg-muted mb-2" />
        <Skeleton className="h-4 w-3/4 bg-muted" />
      </div>
    ))}
  </div>
));

export const MobileListSkeleton = memo(() => (
  <div className="space-y-3 px-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex items-center gap-3 p-3">
        <Skeleton className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-muted" />
          <Skeleton className="h-3 w-24 bg-muted/60" />
        </div>
        <Skeleton className="h-8 w-16 bg-muted rounded-full" />
      </div>
    ))}
  </div>
));

MobileEnhancedSkeleton.displayName = 'MobileEnhancedSkeleton';