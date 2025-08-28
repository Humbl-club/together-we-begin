import { useCallback, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { rateLimitService } from '@/services/RateLimitService';

interface RateLimitOptions {
  configKey: string;
  customKey?: string;
  onRateLimited?: () => void;
  showToast?: boolean;
}

/**
 * Hook for rate-limited operations
 * Automatically handles rate limiting for API calls
 */
export const useRateLimited = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRateLimited, setIsRateLimited] = useState(false);

  /**
   * Execute a rate-limited operation
   */
  const executeWithRateLimit = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: RateLimitOptions
  ): Promise<T> => {
    const key = options.customKey || user?.id || 'anonymous';
    
    try {
      setIsRateLimited(false);
      
      const result = await rateLimitService.withRateLimit(
        key,
        options.configKey,
        operation,
        () => {
          setIsRateLimited(true);
          
          if (options.onRateLimited) {
            options.onRateLimited();
          }
          
          if (options.showToast !== false) {
            const resetTime = rateLimitService.getResetTime(key, options.configKey);
            const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
            
            toast({
              title: "Slow Down",
              description: `Too many requests. Please wait ${waitTime} seconds.`,
              variant: "destructive"
            });
          }
        }
      );
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limited')) {
        setIsRateLimited(true);
        
        if (options.showToast !== false) {
          const match = error.message.match(/(\d+) seconds/);
          const seconds = match ? match[1] : '60';
          
          toast({
            title: "Rate Limited",
            description: `Please wait ${seconds} seconds before trying again.`,
            variant: "destructive"
          });
        }
      }
      throw error;
    }
  }, [user?.id, toast]);

  /**
   * Check if an operation would be rate limited
   */
  const checkRateLimit = useCallback((configKey: string, customKey?: string): boolean => {
    const key = customKey || user?.id || 'anonymous';
    return rateLimitService.getRemainingRequests(key, configKey) > 0;
  }, [user?.id]);

  /**
   * Get remaining requests for a config
   */
  const getRemainingRequests = useCallback((configKey: string, customKey?: string): number => {
    const key = customKey || user?.id || 'anonymous';
    return rateLimitService.getRemainingRequests(key, configKey);
  }, [user?.id]);

  /**
   * Get reset time for rate limit
   */
  const getResetTime = useCallback((configKey: string, customKey?: string): Date | null => {
    const key = customKey || user?.id || 'anonymous';
    const resetTime = rateLimitService.getResetTime(key, configKey);
    return resetTime ? new Date(resetTime) : null;
  }, [user?.id]);

  /**
   * Reset rate limits for current user
   */
  const resetLimits = useCallback((configKey?: string) => {
    const key = user?.id || 'anonymous';
    rateLimitService.resetLimit(key, configKey);
    setIsRateLimited(false);
  }, [user?.id]);

  return {
    executeWithRateLimit,
    checkRateLimit,
    getRemainingRequests,
    getResetTime,
    resetLimits,
    isRateLimited
  };
};

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export const withRateLimit = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  configKey: string
) => {
  return async (...args: T): Promise<R> => {
    // Get user ID from context or use anonymous
    const userId = 'anonymous'; // In real usage, get from auth context
    
    return rateLimitService.withRateLimit(
      userId,
      configKey,
      () => fn(...args)
    );
  };
};