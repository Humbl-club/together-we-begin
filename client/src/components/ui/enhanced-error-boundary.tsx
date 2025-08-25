import React, { Component, ReactNode } from 'react';
import { MobileFirstCard } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  allowRetry?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: number;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 Application Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      // Too many retries, redirect home
      window.location.href = '/';
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));

    // Clear retry timeout if it exists
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, retryCount } = this.state;
      const isNetworkError = error?.message?.includes('fetch') || 
                           error?.message?.includes('network') ||
                           error?.message?.includes('timeout');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <MobileFirstCard className="w-full max-w-md text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {isNetworkError ? 'Connection Problem' : 'Something Went Wrong'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isNetworkError 
                    ? 'Please check your internet connection and try again.'
                    : 'The app encountered an unexpected error.'
                  }
                </p>
              </div>

              {this.props.showDetails && error && (
                <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground mb-2">
                    Technical Details
                  </summary>
                  <pre className="whitespace-pre-wrap break-words text-destructive">
                    {error.message}
                    {errorInfo?.componentStack?.substring(0, 500)}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {this.props.allowRetry && retryCount < 3 && (
                <MobileNativeButton
                  onClick={this.handleRetry}
                  variant="primary"
                  fullWidth
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${retryCount}/3)`}
                </MobileNativeButton>
              )}
              
              <MobileNativeButton
                onClick={this.handleGoHome}
                variant="secondary"
                fullWidth
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </MobileNativeButton>
              
              <MobileNativeButton
                onClick={this.handleReload}
                variant="ghost"
                fullWidth
                size="sm"
              >
                Reload App
              </MobileNativeButton>
            </div>
          </MobileFirstCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;