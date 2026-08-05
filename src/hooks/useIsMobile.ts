/**
 * Hook to detect mobile devices and screen sizes
 * Provides reactive breakpoint detection for responsive layouts
 */
import { useState, useEffect, useCallback } from 'react'

interface MobileState {
  isMobile: boolean // Screen width < 768px
  isTablet: boolean // Screen width >= 768px && < 1024px
  isDesktop: boolean // Screen width >= 1024px
  isTouchDevice: boolean // Device supports touch
  screenWidth: number
  screenHeight: number
  isPortrait: boolean
  isLandscape: boolean
}

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile(): MobileState {
  const [state, setState] = useState<MobileState>(() => {
    // SSR-safe initial state
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1024,
        screenHeight: 768,
        isPortrait: false,
        isLandscape: true,
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight

    return {
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenWidth: width,
      screenHeight: height,
      isPortrait: height > width,
      isLandscape: width >= height,
    }
  })

  const updateState = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight

    setState({
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenWidth: width,
      screenHeight: height,
      isPortrait: height > width,
      isLandscape: width >= height,
    })
  }, [])

  useEffect(() => {
    // Initial update
    updateState()

    // Listen for resize events
    window.addEventListener('resize', updateState)
    window.addEventListener('orientationchange', updateState)

    return () => {
      window.removeEventListener('resize', updateState)
      window.removeEventListener('orientationchange', updateState)
    }
  }, [updateState])

  return state
}
