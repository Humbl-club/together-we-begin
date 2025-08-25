import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'avatar' | 'text';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className, 
  variant = 'default' 
}) => {
  const baseClasses = "skeleton-mobile";
  
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-32 w-full",
    avatar: "h-12 w-12 rounded-full",
    text: "h-3 w-3/4",
  };

  return (
    <div 
      className={cn(
        baseClasses, 
        variantClasses[variant], 
        className
      )} 
    />
  );
};

export const PageLoading: React.FC<{ title?: string }> = ({ 
  title = "Loading..." 
}) => (
  <div className="space-mobile p-mobile">
    <div className="card-primary p-mobile space-mobile">
      <LoadingSkeleton variant="text" className="w-1/3" />
      <LoadingSkeleton variant="text" className="w-1/2" />
    </div>
    
    <div className="responsive-grid lg:grid-cols-3">
      <div className="lg:col-span-2 space-mobile">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
      <div className="space-mobile">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    </div>
  </div>
);