import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Wifi } from 'lucide-react';
import { MobileNativeButton } from './mobile-native-button';
import { MobileFirstCard, MobileFirstCardContent } from './mobile-first-card';

interface MobileErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface MobileErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class MobileErrorBoundary extends Component<MobileErrorBoundaryProps, MobileErrorBoundaryState> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MobileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to console for debugging
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultMobileErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultMobileErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network') || !navigator.onLine;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <MobileFirstCard className="w-full max-w-sm">
        <MobileFirstCardContent className="text-center space-y-4 p-6">
          <div className="flex justify-center">
            {isNetworkError ? (
              <Wifi className="h-12 w-12 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-destructive" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isNetworkError ? 'Connection Issue' : 'Something went wrong'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isNetworkError 
                ? 'Check your internet connection and try again.'
                : 'An unexpected error occurred. We\'re working to fix it.'
              }
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-left bg-muted p-2 rounded">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2 w-full">
            <MobileNativeButton 
              onClick={retry}
              variant="primary"
              size="lg"
              fullWidth
              className="touch-target"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </MobileNativeButton>
            
            <MobileNativeButton
              onClick={() => window.location.href = '/dashboard'}
              variant="secondary"
              size="lg"
              fullWidth
              className="touch-target"
            >
              Go to Dashboard
            </MobileNativeButton>
          </div>
        </MobileFirstCardContent>
      </MobileFirstCard>
    </div>
  );
};