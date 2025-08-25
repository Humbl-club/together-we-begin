import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export const useMessagePerformance = () => {
  const performanceRef = useRef<Map<string, number>>(new Map());

  // Start timing an operation
  const startTiming = useCallback((operationId: string) => {
    performanceRef.current.set(operationId, performance.now());
  }, []);

  // End timing and optionally log to database
  const endTiming = useCallback(async (
    operationId: string, 
    operation: string, 
    success: boolean = true, 
    error?: string,
    metadata?: Record<string, any>
  ) => {
    const startTime = performanceRef.current.get(operationId);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    performanceRef.current.delete(operationId);

    const metric: PerformanceMetric = {
      operation,
      duration,
      success,
      error,
      metadata
    };

    // Log to console for development
    if (!success || duration > 1000) { // Log slow operations or errors
      console.warn(`Message Performance - ${operation}:`, metric);
    }

    // Store critical metrics in database for monitoring
    if (!success || duration > 2000) { // Store errors or very slow operations
      try {
        await supabase
          .from('performance_metrics')
          .insert({
            page_url: `/messages/${operation}`,
            load_time_ms: Math.round(duration),
            user_agent: navigator.userAgent
          });
      } catch (dbError) {
        console.warn('Failed to store performance metric:', dbError);
      }
    }

    return metric;
  }, []);

  // Monitor message operations
  const measureOperation = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`;
    startTiming(operationId);

    try {
      const result = await fn();
      await endTiming(operationId, operation, true, undefined, metadata);
      return result;
    } catch (error) {
      await endTiming(
        operationId, 
        operation, 
        false, 
        error instanceof Error ? error.message : 'Unknown error',
        metadata
      );
      throw error;
    }
  }, [startTiming, endTiming]);

  // Monitor encryption/decryption operations
  const measureEncryption = useCallback(async <T>(
    operation: 'encrypt' | 'decrypt' | 'key_generation',
    fn: () => Promise<T>,
    messageCount?: number
  ): Promise<T> => {
    return measureOperation(
      `encryption_${operation}`,
      fn,
      { messageCount }
    );
  }, [measureOperation]);

  // Monitor database operations
  const measureDatabase = useCallback(async <T>(
    operation: 'load_threads' | 'load_messages' | 'send_message' | 'mark_read',
    fn: () => Promise<T>,
    recordCount?: number
  ): Promise<T> => {
    return measureOperation(
      `database_${operation}`,
      fn,
      { recordCount }
    );
  }, [measureOperation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      performanceRef.current.clear();
    };
  }, []);

  return {
    measureOperation,
    measureEncryption,
    measureDatabase,
    startTiming,
    endTiming
  };
};