import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MessageErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function MessageErrorFallback({ error, resetErrorBoundary }: MessageErrorFallbackProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Message System Error</CardTitle>
        <CardDescription>
          Something went wrong with the messaging system. This could be due to encryption issues or network problems.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">Error Details:</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        
        <div className="space-y-2">
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // Clear local storage and retry
              localStorage.removeItem('encryption_keys_');
              resetErrorBoundary();
            }}
          >
            Reset Encryption & Retry
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If this error persists, please refresh the page or contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export const MessageErrorBoundary: React.FC<MessageErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={MessageErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Message system error:', error, errorInfo);
        
        // Log error for monitoring
        if (onError) {
          onError(error, errorInfo);
        }
        
        // Optional: Send to error tracking service
        // errorTrackingService.captureException(error, { extra: errorInfo });
      }}
      onReset={() => {
        // Clear any error state when resetting
        console.log('Resetting message error boundary');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};