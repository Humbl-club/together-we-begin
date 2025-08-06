// Enhanced error boundary hook with comprehensive error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  allowRetry?: boolean;
  isolateErrors?: boolean;
}

/**
 * Enhanced Error Boundary with better error reporting and recovery
 */
export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Store error info
    this.setState({ errorInfo });
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
    
    // Report to error tracking service (implement your error reporting here)
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implement error reporting to your service here
    // Example: Sentry, LogRocket, Bugsnag, etc.
    try {
      // Mock error reporting
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };
      
      // In production, send to your error reporting service
      console.log('Error Report:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    // Clear error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined, 
      errorId: undefined 
    });
  };

  private handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  private handleReload = () => {
    // Reload the current page
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showErrorDetails = false, allowRetry = true } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                We're sorry, but something unexpected happened. This error has been reported 
                and we're working to fix it.
              </p>

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Error ID: <code className="font-mono text-xs">{this.state.errorId}</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please provide this ID if you contact support
                  </p>
                </div>
              )}

              {/* Error details for development */}
              {showErrorDetails && process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical Details
                  </summary>
                  <div className="bg-muted/50 rounded-lg p-3 text-left overflow-auto">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">Error Message:</h4>
                        <pre className="text-xs text-destructive mt-1">{error.message}</pre>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <h4 className="font-medium text-sm">Stack Trace:</h4>
                          <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="font-medium text-sm">Component Stack:</h4>
                          <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {allowRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for using error boundary with toast notifications
 */
export const useErrorBoundary = () => {
  const { toast } = useToast();

  const showErrorToast = (error: Error) => {
    toast({
      title: "Something went wrong",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  };

  const captureError = (error: Error) => {
    // Report error without crashing the component
    console.error('Captured error:', error);
    showErrorToast(error);
  };

  return { captureError, showErrorToast };
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<EnhancedErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Context provider for error boundary features
 */
export const ErrorBoundaryProvider: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, onError }) => {
  return (
    <EnhancedErrorBoundary
      onError={onError}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      allowRetry={true}
      isolateErrors={true}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};