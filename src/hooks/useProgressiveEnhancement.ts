import { useEffect, useCallback, useState, useRef } from 'react';
import { useViewport } from '@/hooks/use-mobile';

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// Progressive enhancement with adaptive loading and native behaviors
export const useProgressiveEnhancement = () => {
  const { isMobile } = useViewport();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLowBattery, setIsLowBattery] = useState(false);
  const [supportsServiceWorker, setSupportsServiceWorker] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Network-aware loading
  const getLoadingStrategy = useCallback(() => {
    if (!networkInfo) return 'normal';
    
    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      return 'minimal';
    }
    
    if (networkInfo.effectiveType === '3g') {
      return 'reduced';
    }
    
    return 'full';
  }, [networkInfo]);

  // Battery-aware optimizations
  const getBatteryOptimizations = useCallback(() => {
    if (isLowBattery) {
      return {
        reduceAnimations: true,
        limitBackgroundTasks: true,
        reducePolling: true
      };
    }
    
    return {
      reduceAnimations: false,
      limitBackgroundTasks: false,
      reducePolling: false
    };
  }, [isLowBattery]);

  // Pull-to-refresh gesture
  const usePullToRefresh = useCallback((onRefresh: () => Promise<void>) => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || window.scrollY > 0) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);

      // Vertical swipe down from top
      if (deltaY > 100 && deltaX < 50) {
        e.preventDefault();
        // Add visual feedback here
        document.body.style.setProperty('--pull-distance', `${Math.min(deltaY, 150)}px`);
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartRef.current) return;

      const element = document.querySelector('[data-pull-refresh]');
      if (element) {
        const distance = parseInt(getComputedStyle(document.body).getPropertyValue('--pull-distance') || '0');
        
        if (distance > 100) {
          await onRefresh();
        }
      }

      document.body.style.removeProperty('--pull-distance');
      touchStartRef.current = null;
    };

    useEffect(() => {
      if (!isMobile) return;

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [isMobile, onRefresh]);
  }, [isMobile]);

  // Swipe gestures
  const useSwipeGestures = useCallback((callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  }) => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      // Minimum swipe distance and maximum time
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;
      
      if (deltaTime > maxSwipeTime) return;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight();
          } else if (deltaX < 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown();
          } else if (deltaY < 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
    };

    useEffect(() => {
      if (!isMobile) return;

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [isMobile, callbacks]);
  }, [isMobile]);

  // Initialize progressive enhancements
  useEffect(() => {
    // Network information
    const connection = (navigator as any).connection;
    if (connection) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  // Battery information
  useEffect(() => {
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateBatteryInfo = () => {
            setIsLowBattery(battery.level < 0.2 && !battery.charging);
          };

          updateBatteryInfo();
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        } catch (error) {
          console.warn('Battery API not available:', error);
        }
      }
    };

    checkBattery();
  }, []);

  // Service Worker support
  useEffect(() => {
    setSupportsServiceWorker('serviceWorker' in navigator);
  }, []);

  return {
    networkInfo,
    isLowBattery,
    supportsServiceWorker,
    getLoadingStrategy,
    getBatteryOptimizations,
    usePullToRefresh,
    useSwipeGestures
  };
};