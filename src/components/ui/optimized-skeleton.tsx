import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const OptimizedSkeleton = memo(({ className, ...props }: React.ComponentProps<typeof Skeleton>) => (
  <Skeleton className={className} {...props} />
));

export const DashboardSkeleton = memo(() => (
  <div className="flow-content">
    <div className="animate-pulse">
      <OptimizedSkeleton className="h-16 md:h-24 bg-muted rounded-xl" />
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <OptimizedSkeleton key={i} className="h-16 md:h-20 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="responsive-grid">
        <OptimizedSkeleton className="h-64 bg-muted rounded-xl" />
        <OptimizedSkeleton className="h-96 bg-muted rounded-xl lg:col-span-2" />
      </div>
    </div>
  </div>
));

export const FeedSkeleton = memo(() => (
  <div className="flow-content">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse p-6 border rounded-xl">
        <div className="flex items-center space-x-3 mb-4">
          <OptimizedSkeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <OptimizedSkeleton className="h-4 w-24" />
            <OptimizedSkeleton className="h-3 w-16" />
          </div>
        </div>
        <OptimizedSkeleton className="h-4 w-full mb-2" />
        <OptimizedSkeleton className="h-4 w-3/4 mb-4" />
        <OptimizedSkeleton className="h-32 w-full rounded-lg" />
      </div>
    ))}
  </div>
));