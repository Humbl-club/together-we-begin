import * as React from "react"

// Enhanced breakpoint system
const BREAKPOINTS = {
  mobile: 639,     // 0-639px
  tablet: 1023,    // 640-1023px  
  desktop: 1024,   // 1024px+
  xs: 475,         // Extra small mobile
  sm: 640,         // Small devices
  md: 768,         // Medium devices
  lg: 1024,        // Large devices
  xl: 1280,        // Extra large
  '2xl': 1400      // 2X Large
} as const

type BreakpointKey = keyof typeof BREAKPOINTS
type ViewportSize = {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2xl: boolean
  orientation: 'portrait' | 'landscape'
}

export function useViewport(): ViewportSize {
  const [viewport, setViewport] = React.useState<ViewportSize>(() => {
    // Safe initial state for SSR
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isXs: false,
        isSm: false,
        isMd: false,
        isLg: true,
        isXl: false,
        is2xl: false,
        orientation: 'landscape'
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    
    return {
      width,
      height,
      isMobile: width <= BREAKPOINTS.mobile,
      isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
      isDesktop: width > BREAKPOINTS.tablet,
      isXs: width <= BREAKPOINTS.xs,
      isSm: width > BREAKPOINTS.xs && width <= BREAKPOINTS.sm,
      isMd: width > BREAKPOINTS.sm && width <= BREAKPOINTS.md,
      isLg: width > BREAKPOINTS.md && width <= BREAKPOINTS.lg,
      isXl: width > BREAKPOINTS.lg && width <= BREAKPOINTS.xl,
      is2xl: width > BREAKPOINTS.xl,
      orientation: width > height ? 'landscape' : 'portrait'
    }
  })

  React.useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setViewport({
        width,
        height,
        isMobile: width <= BREAKPOINTS.mobile,
        isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
        isDesktop: width > BREAKPOINTS.tablet,
        isXs: width <= BREAKPOINTS.xs,
        isSm: width > BREAKPOINTS.xs && width <= BREAKPOINTS.sm,
        isMd: width > BREAKPOINTS.sm && width <= BREAKPOINTS.md,
        isLg: width > BREAKPOINTS.md && width <= BREAKPOINTS.lg,
        isXl: width > BREAKPOINTS.lg && width <= BREAKPOINTS.xl,
        is2xl: width > BREAKPOINTS.xl,
        orientation: width > height ? 'landscape' : 'portrait'
      })
    }

    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateViewport)
      resizeObserver.observe(document.documentElement)
      return () => resizeObserver.disconnect()
    } else {
      // Fallback to window resize listener
      window.addEventListener('resize', updateViewport)
      return () => window.removeEventListener('resize', updateViewport)
    }
  }, [])

  return viewport
}

// Legacy hook for backward compatibility
export function useIsMobile(): boolean {
  const { isMobile } = useViewport()
  return isMobile
}

// Utility hook for specific breakpoint checking
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const { width } = useViewport()
  return width <= BREAKPOINTS[breakpoint]
}

// Responsive value hook - returns different values based on breakpoint
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  default: T
}): T {
  const { isMobile, isTablet, isDesktop } = useViewport()
  
  if (isMobile && values.mobile !== undefined) return values.mobile
  if (isTablet && values.tablet !== undefined) return values.tablet
  if (isDesktop && values.desktop !== undefined) return values.desktop
  
  return values.default
}
