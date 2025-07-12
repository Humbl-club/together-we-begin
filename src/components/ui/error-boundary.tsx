import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container max-w-2xl mx-auto p-4">
          <Card className="glass-card">
            <CardContent className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="text-muted-foreground">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm font-medium">Error details</summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="bg-gradient-primary"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}