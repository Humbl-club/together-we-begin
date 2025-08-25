import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const AdminErrorFallback: React.FC<AdminErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Card className="glass-card border-destructive">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Component Error</h2>
        <p className="text-muted-foreground mb-4">
          Something went wrong loading this admin section.
        </p>
        <details className="text-left mb-4 p-3 bg-muted rounded-lg">
          <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
          <pre className="text-xs mt-2 overflow-auto">{error.message}</pre>
        </details>
        <Button onClick={resetErrorBoundary} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<AdminErrorFallbackProps>;
}

export const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ 
  children, 
  fallback = AdminErrorFallback 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        console.error('Admin Error Boundary caught an error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AdminErrorBoundary;