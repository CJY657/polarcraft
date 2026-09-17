// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from './useIsMobile'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setViewport(width: number, height: number) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal('innerHeight', height)
}

describe('useIsMobile', () => {
  it.each([
    [767, true, false, false],
    [768, false, true, false],
    [1023, false, true, false],
    [1024, false, false, true],
  ])('classifies width %i on first render and resize', (width, isMobile, isTablet, isDesktop) => {
    const expected = { screenWidth: width, isMobile, isTablet, isDesktop }
    setViewport(width, 800)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toMatchObject(expected)

    setViewport(500, 800)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current.screenWidth).toBe(500)

    setViewport(width, 800)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current).toMatchObject(expected)
  })

  it('updates dimensions and orientation, treating a square as landscape', () => {
    setViewport(600, 900)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toMatchObject({ isPortrait: true, isLandscape: false })

    setViewport(900, 600)
    act(() => window.dispatchEvent(new Event('orientationchange')))
    expect(result.current).toMatchObject({
      screenWidth: 900, screenHeight: 600, isPortrait: false, isLandscape: true,
    })

    setViewport(600, 600)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current).toMatchObject({
      screenWidth: 600, screenHeight: 600, isPortrait: false, isLandscape: true,
    })
  })

  it.each([0, 2])('detects touch support with %i touch points', (maxTouchPoints) => {
    vi.stubGlobal('navigator', { maxTouchPoints })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current.isTouchDevice).toBe('ontouchstart' in window || maxTouchPoints > 0)
  })

  it('retains stable listeners across rerenders and removes them on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { rerender, unmount } = renderHook(() => useIsMobile())
    const resizeCalls = add.mock.calls.filter(([event]) => event === 'resize')
    const orientationCalls = add.mock.calls.filter(([event]) => event === 'orientationchange')
    expect(resizeCalls).toHaveLength(1)
    expect(orientationCalls).toHaveLength(1)
    expect(resizeCalls[0][1]).toBe(orientationCalls[0][1])

    rerender()
    expect(add.mock.calls.filter(([event]) => event === 'resize')).toHaveLength(1)
    expect(add.mock.calls.filter(([event]) => event === 'orientationchange')).toHaveLength(1)
    unmount()
    expect(remove).toHaveBeenCalledWith('resize', resizeCalls[0][1])
    expect(remove).toHaveBeenCalledWith('orientationchange', orientationCalls[0][1])
  })

  it('keeps the server-rendered desktop fallback without reading browser dimensions', () => {
    vi.stubGlobal('window', undefined)
    let state: ReturnType<typeof useIsMobile> | undefined
    function Probe() {
      state = useIsMobile()
      return null
    }

    renderToString(<Probe />)
    expect(state).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenWidth: 1024,
      screenHeight: 768,
      isPortrait: false,
      isLandscape: true,
    })
  })
})
