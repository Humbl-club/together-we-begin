import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useViewport } from '@/hooks/use-mobile';

interface OptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const OptimizedLayout: React.FC<OptimizedLayoutProps> = memo(({ 
  children, 
  className = "min-h-screen bg-gradient-to-br from-background via-background to-muted/20" 
}) => {
  const { isMobile } = useViewport();
  
  return (
    <ErrorBoundary>
      <div className={className}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-8'} flow-content`}>
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default OptimizedLayout;