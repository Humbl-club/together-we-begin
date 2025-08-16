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

      // Enhanced Layout optimizations with tablet-specific scaling
      gridCols: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-3 xl:grid-cols-4',
      spacing: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6',
      padding: isMobile ? 'p-3' : isTablet ? 'p-5' : 'p-6',
      margin: isMobile ? 'm-2' : isTablet ? 'm-3' : 'm-4',
      
      // Refined Typography with tablet-specific scaling
      fontSize: {
        title: isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl',
        heading: isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl',
        body: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg',
        caption: isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'
      },

      // Enhanced Interaction optimizations
      buttonSize: isMobile ? 'default' : isTablet ? 'default' : 'lg',
      iconSize: isMobile ? 'w-5 h-5' : isTablet ? 'w-6 h-6' : 'w-7 h-7',
      touchTarget: isMobile ? 'min-h-[44px] min-w-[44px]' : isTablet ? 'min-h-[48px] min-w-[48px]' : '',
      
      // Performance optimizations
      animationReduceMotion: 'motion-reduce:animate-none',
      lazyLoadThreshold: isMobile ? '0px' : isTablet ? '50px' : '100px',

      // Enhanced Container queries
      containerClass: isMobile ? 'mobile-container' : isTablet ? 'tablet-container' : 'desktop-container',
      
      // Safe area handling
      safeAreaClass: isMobile ? 'safe-area-mobile' : isTablet ? 'safe-area-tablet' : '',
      
      // Enhanced Navigation optimizations
      navLayout: isMobile ? 'bottom' : isTablet ? 'sidebar-compact' : 'sidebar-full',
      navItemSize: isMobile ? 'compact' : isTablet ? 'medium' : 'full',
      sidebarWidth: isMobile ? '0' : isTablet ? 'w-20' : 'w-24',

      // Modal/Dialog optimizations
      modalSize: isMobile ? 'full' : isTablet ? 'lg' : 'xl',
      sheetSide: isMobile ? 'bottom' : isTablet ? 'right' : 'right',

      // Enhanced Form optimizations
      inputSize: isMobile ? 'lg' : isTablet ? 'default' : 'default',
      formLayout: isMobile ? 'stacked' : isTablet ? 'grid' : 'grid',
      
      // Tablet-specific enhancements
      cardSpacing: isMobile ? 'space-y-3' : isTablet ? 'space-y-4' : 'space-y-6',
      sectionSpacing: isMobile ? 'space-y-4' : isTablet ? 'space-y-6' : 'space-y-8',
      contentMaxWidth: isMobile ? 'max-w-none' : isTablet ? 'max-w-4xl' : 'max-w-7xl',
      
      // Tablet grid systems
      statsGrid: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4',
      cardGrid: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
      
      // Tablet-specific UI scaling
      borderRadius: isMobile ? 'rounded-lg' : isTablet ? 'rounded-xl' : 'rounded-2xl',
      shadowLevel: isMobile ? 'shadow-md' : isTablet ? 'shadow-lg' : 'shadow-xl'
    };
  }, [mobileState]);

  return optimizations;
};