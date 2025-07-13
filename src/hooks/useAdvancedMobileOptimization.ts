import { useEffect, useCallback, useMemo } from 'react';
import { useViewport } from './use-mobile';

// Advanced mobile optimization hook with performance monitoring
export const useAdvancedMobileOptimization = () => {
  const { isMobile } = useViewport();

  // Performance monitoring for mobile
  const performanceMetrics = useMemo(() => ({
    measureInteraction: (name: string) => {
      if ('performance' in window && 'measure' in performance) {
        performance.mark(`${name}-start`);
        return () => {
          performance.mark(`${name}-end`);
          performance.measure(name, `${name}-start`, `${name}-end`);
        };
      }
      return () => {};
    },
    reportWebVitals: (metric: any) => {
      // In production, send to analytics
      console.log('Web Vital:', metric);
    }
  }), []);

  // Advanced touch optimization
  const touchOptimization = useCallback(() => {
    if (!isMobile) return;

    // Optimize scrolling performance
    const optimizeScrolling = () => {
      document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
      document.body.style.setProperty('scroll-behavior', 'smooth');
    };

    // Optimize touch targets
    const optimizeTouchTargets = () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          button, [role="button"], input, select, textarea {
            min-height: 44px !important;
            min-width: 44px !important;
          }
          
          .touch-optimized {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
          }
          
          .haptic-feedback {
            transition: transform 0.1s ease-out;
          }
          
          .haptic-feedback:active {
            transform: scale(0.97);
          }
        }
      `;
      document.head.appendChild(style);
    };

    // Reduce paint/layout thrashing
    const optimizeAnimations = () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          * {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          
          .gpu-accelerated {
            transform: translateZ(0);
            will-change: transform;
          }
          
          .smooth-animation {
            transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        }
      `;
      document.head.appendChild(style);
    };

    optimizeScrolling();
    optimizeTouchTargets();
    optimizeAnimations();
  }, [isMobile]);

  // Memory optimization for mobile
  const memoryOptimization = useCallback(() => {
    if (!isMobile) return;

    // Cleanup unused images
    const cleanupImages = () => {
      const images = document.querySelectorAll('img[data-cleanup="true"]');
      images.forEach(img => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              // Cleanup images that are far from viewport
              const distance = Math.abs(entry.boundingClientRect.top);
              if (distance > window.innerHeight * 3) {
                (img as HTMLImageElement).src = '';
              }
            }
          });
        });
        observer.observe(img);
      });
    };

    cleanupImages();
  }, [isMobile]);

  useEffect(() => {
    touchOptimization();
    memoryOptimization();
  }, [touchOptimization, memoryOptimization]);

  return {
    performanceMetrics,
    isMobileOptimized: isMobile,
    applyTouchOptimization: touchOptimization
  };
};