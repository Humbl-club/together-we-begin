import { useState, useEffect, useCallback } from 'react';

interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  networkConnection: 'slow' | 'fast' | 'unknown';
  prefersReducedMotion: boolean;
  // Legacy properties for backward compatibility
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
  };
  isMobileOptimized: boolean;
}

export const useAdvancedMobileOptimization = (): MobileOptimizationState => {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    orientation: 'portrait',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    networkConnection: 'unknown',
    prefersReducedMotion: false,
    performanceMetrics: { loadTime: 0, renderTime: 0 },
    isMobileOptimized: false,
  });

  const updateState = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Get safe area insets for mobile devices
    const safeAreaInsets = {
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0', 10),
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0', 10),
      right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0', 10),
    };

    // Detect network connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    let networkConnection: 'slow' | 'fast' | 'unknown' = 'unknown';
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      networkConnection = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setState({
      isMobile,
      isTablet,
      isTouch,
      orientation,
      safeAreaInsets,
      networkConnection,
      prefersReducedMotion,
      performanceMetrics: { loadTime: performance.now(), renderTime: 0 },
      isMobileOptimized: isMobile && isTouch,
    });
  }, []);

  useEffect(() => {
    updateState();
    
    const handleResize = () => updateState();
    const handleOrientationChange = () => setTimeout(updateState, 100);
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Update CSS custom properties for safe areas
    const updateSafeAreas = () => {
      const root = document.documentElement;
      root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
    };
    
    updateSafeAreas();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateState]);

  return state;
};