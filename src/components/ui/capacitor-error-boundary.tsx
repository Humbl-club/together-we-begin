import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface CapacitorErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const CapacitorErrorFallback: React.FC<CapacitorErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Log error to Capacitor debug
  React.useEffect(() => {
    window.capacitorDebug?.log(`React Error: ${error.message}`, 'error');
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full text-center p-8">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-destructive" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        
        <p className="text-muted-foreground mb-6 text-sm">
          The app encountered an unexpected error. This might be due to a connection issue or a temporary problem.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full btn-responsive bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full btn-responsive bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Go to Home
          </button>
          
          <button
            onClick={handleReload}
            className="w-full btn-responsive bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Reload App
          </button>
        </div>
        
        <details className="mt-6 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs bg-muted p-3 rounded text-muted-foreground overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
};

interface CapacitorErrorBoundaryProps {
  children: React.ReactNode;
}

export const CapacitorErrorBoundary: React.FC<CapacitorErrorBoundaryProps> = ({ 
  children 
}) => {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    console.error('Capacitor Error Boundary caught an error:', error, errorInfo);
    window.capacitorDebug?.log(
      `Error Boundary: ${error.message} - Component: ${errorInfo.componentStack.split('\n')[1]?.trim()}`, 
      'error'
    );
  };

  return (
    <ErrorBoundary
      FallbackComponent={CapacitorErrorFallback}
      onError={handleError}
      onReset={() => {
        window.capacitorDebug?.log('Error boundary reset', 'info');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};