// Enhanced useEffect hook with automatic cleanup for common patterns
import { useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced useEffect that automatically handles cleanup for timers
 */
export const useTimerEffect = (
  callback: () => void,
  interval: number,
  deps: React.DependencyList = []
) => {
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (interval > 0) {
      timerRef.current = setInterval(callback, interval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [callback, interval, ...deps]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  return { clearTimer };
};

/**
 * Enhanced useEffect that automatically handles cleanup for timeouts
 */
export const useTimeoutEffect = (
  callback: () => void,
  delay: number,
  deps: React.DependencyList = []
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (delay > 0) {
      timeoutRef.current = setTimeout(callback, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [callback, delay, ...deps]);

  const clearTimeoutFunc = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  return { clearTimeout: clearTimeoutFunc };
};

/**
 * Enhanced useEffect that automatically handles cleanup for event listeners
 */
export const useEventListenerEffect = (
  target: EventTarget | null | (() => EventTarget | null),
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const element = typeof target === 'function' ? target() : target;
    
    if (!element) return;

    element.addEventListener(event, handler, options);

    return () => {
      element.removeEventListener(event, handler, options);
    };
  }, [target, event, handler, options, ...deps]);
};

/**
 * Enhanced useEffect for window event listeners
 */
export const useWindowEventEffect = (
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
  deps: React.DependencyList = []
) => {
  useEventListenerEffect(
    () => window,
    event,
    handler,
    options,
    deps
  );
};

/**
 * Enhanced useEffect for document event listeners
 */
export const useDocumentEventEffect = (
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
  deps: React.DependencyList = []
) => {
  useEventListenerEffect(
    () => document,
    event,
    handler,
    options,
    deps
  );
};

/**
 * Enhanced useEffect that handles AbortController cleanup
 */
export const useAbortEffect = (
  callback: (signal: AbortSignal) => void | Promise<void>,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const execute = async () => {
      try {
        await callback(signal);
      } catch (error) {
        if (!signal.aborted) {
          console.error('Effect error:', error);
        }
      }
    };

    execute();

    return () => {
      controller.abort();
    };
  }, deps);
};

/**
 * Enhanced useEffect for WebSocket connections
 */
export const useWebSocketEffect = (
  url: string | null,
  onMessage?: (event: MessageEvent) => void,
  onOpen?: (event: Event) => void,
  onClose?: (event: CloseEvent) => void,
  onError?: (event: Event) => void,
  deps: React.DependencyList = []
) => {
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    if (onOpen) ws.addEventListener('open', onOpen);
    if (onMessage) ws.addEventListener('message', onMessage);
    if (onClose) ws.addEventListener('close', onClose);
    if (onError) ws.addEventListener('error', onError);

    return () => {
      ws.close();
      wsRef.current = undefined;
    };
  }, [url, onMessage, onOpen, onClose, onError, ...deps]);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  return { sendMessage };
};

/**
 * Enhanced useEffect for ResizeObserver
 */
export const useResizeObserverEffect = (
  target: Element | null | (() => Element | null),
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const element = typeof target === 'function' ? target() : target;
    
    if (!element) return;

    const observer = new ResizeObserver(callback);
    observer.observe(element, options);

    return () => {
      observer.disconnect();
    };
  }, [target, callback, options, ...deps]);
};

/**
 * Enhanced useEffect for IntersectionObserver
 */
export const useIntersectionObserverEffect = (
  target: Element | null | (() => Element | null),
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const element = typeof target === 'function' ? target() : target;
    
    if (!element) return;

    const observer = new IntersectionObserver(callback, options);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [target, callback, options, ...deps]);
};

/**
 * Enhanced useEffect for MutationObserver
 */
export const useMutationObserverEffect = (
  target: Node | null | (() => Node | null),
  callback: MutationCallback,
  options?: MutationObserverInit,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const node = typeof target === 'function' ? target() : target;
    
    if (!node) return;

    const observer = new MutationObserver(callback);
    observer.observe(node, options);

    return () => {
      observer.disconnect();
    };
  }, [target, callback, options, ...deps]);
};

/**
 * Utility hook for managing multiple cleanup functions
 */
export const useCleanupManager = () => {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
};