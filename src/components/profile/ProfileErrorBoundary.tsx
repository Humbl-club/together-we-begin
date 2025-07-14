import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="glass-card p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
    <p className="text-muted-foreground mb-4">
      {error.message || 'Failed to load profile content'}
    </p>
    <button 
      onClick={retry}
      className="btn-responsive bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Try Again
    </button>
  </div>
);

export const ProfileErrorBoundary: React.FC<ProfileErrorBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const handleRetry = () => {
    window.location.reload();
  };

  const errorFallback = fallback ? 
    React.createElement(fallback, { error: new Error(), retry: handleRetry }) : 
    <DefaultErrorFallback error={new Error()} retry={handleRetry} />;

  return (
    <ErrorBoundary fallback={errorFallback}>
      {children}
    </ErrorBoundary>
  );
};