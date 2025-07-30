import { useMemo } from 'react';
import { useMobileFirst } from './useMobileFirst';

/**
 * Centralized mobile optimization hook that consolidates all mobile-specific logic
 * This replaces the scattered useViewport and useAdvancedMobileOptimization usage
 */
export const useMobileOptimization = () => {
  const mobileState = useMobileFirst();

  const optimizations = useMemo(() => {
    const { isMobile, isTablet, touchSupported, orientation, safeAreaInsets } = mobileState;

    return {
      // Device detection
      isMobile,
      isTablet,
      isDesktop: mobileState.isDesktop,
      touchSupported,
      orientation,
      safeAreaInsets,

      // Layout optimizations
      gridCols: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
      spacing: isMobile ? 'gap-3' : 'gap-4',
      padding: isMobile ? 'p-3' : 'p-4',
      margin: isMobile ? 'm-2' : 'm-4',
      fontSize: {
        title: isMobile ? 'text-xl' : 'text-2xl',
        heading: isMobile ? 'text-lg' : 'text-xl',
        body: isMobile ? 'text-sm' : 'text-base',
        caption: isMobile ? 'text-xs' : 'text-sm'
      },

      // Interaction optimizations
      buttonSize: isMobile ? 'default' : 'default',
      iconSize: isMobile ? 'w-5 h-5' : 'w-6 h-6',
      touchTarget: isMobile ? 'min-h-[44px] min-w-[44px]' : '',
      
      // Performance optimizations
      animationReduceMotion: 'motion-reduce:animate-none',
      lazyLoadThreshold: isMobile ? '0px' : '100px',

      // Container queries
      containerClass: isMobile ? 'mobile-container' : isTablet ? 'tablet-container' : 'desktop-container',
      
      // Safe area handling
      safeAreaClass: isMobile ? 'safe-area-mobile' : '',
      
      // Navigation optimizations
      navLayout: isMobile ? 'bottom' : 'sidebar',
      navItemSize: isMobile ? 'compact' : 'full',

      // Modal/Dialog optimizations
      modalSize: isMobile ? 'full' : 'default',
      sheetSide: isMobile ? 'bottom' : 'right',

      // Form optimizations
      inputSize: isMobile ? 'lg' : 'default',
      formLayout: isMobile ? 'stacked' : 'grid'
    };
  }, [mobileState]);

  return optimizations;
};