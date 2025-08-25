import React from 'react';
import { cn } from '@/lib/utils';

interface InstantLoadingProps {
  message?: string;
  className?: string;
}

export const InstantLoading: React.FC<InstantLoadingProps> = ({ 
  message = "Loading...",
  className 
}) => {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-[200px]",
      className
    )}>
      <div className="text-center space-y-3">
        <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export const QuickSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    "animate-pulse bg-muted/50 rounded-lg",
    className
  )} />
);