import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EnhancedLoadingProps {
  variant?: 'card' | 'list' | 'table' | 'form';
  count?: number;
  className?: string;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  variant = 'card',
  count = 3,
  className
}) => {
  const renderCardSkeleton = () => (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-2">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

interface LoadingWrapperProps {
  loading: boolean;
  variant?: 'card' | 'list' | 'table' | 'form';
  count?: number;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  variant,
  count,
  children
}) => {
  if (loading) {
    return <EnhancedLoading variant={variant} count={count} />;
  }
  
  return <>{children}</>;
};