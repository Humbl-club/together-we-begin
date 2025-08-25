import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    toast({
      title: "Something went wrong",
      description: error?.message || "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  const handleNetworkError = useCallback((error: any) => {
    if (!navigator.onLine) {
      toast({
        title: "Connection Lost",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } else {
      handleError(error, "Network");
    }
  }, [toast, handleError]);

  return {
    handleError,
    handleNetworkError
  };
};