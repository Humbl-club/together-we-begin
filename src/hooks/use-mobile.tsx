import * as React from "react"

/**
 * Modern viewport hook using ResizeObserver for performance
 * Provides essential responsive information without over-engineering
 */
export function useViewport() {
  const [dimensions, setDimensions] = React.useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 }
    }
    return { width: window.innerWidth, height: window.innerHeight }
  })

  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    // Use ResizeObserver for better performance
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(document.documentElement)
      return () => resizeObserver.disconnect()
    }

    // Fallback to resize event
    const handleResize = () => updateDimensions()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  }
}

// Simple hook for backward compatibility
export function useIsMobile(): boolean {
  const { isMobile } = useViewport()
  return isMobile
}

/**
 * Modern responsive value hook - cleaner API
 * Returns values based on current viewport
 */
export function useResponsiveValue<T>(mobile: T, desktop: T, tablet?: T): T {
  const { isMobile, isTablet } = useViewport()
  
  if (isMobile) return mobile
  if (isTablet && tablet) return tablet
  return desktop
}
