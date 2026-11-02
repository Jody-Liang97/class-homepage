import { describe, expect, it } from 'vitest'
import { getPageScrollState, getPinnedPageOffset, getPinnedScrollProgress } from './scroll'

describe('getPageScrollState', () => {
  it('keeps the control hidden on a page that cannot scroll', () => {
    expect(getPageScrollState(0, 700, 800)).toEqual({
      progress: 0,
      isVisible: false,
    })
  })

  it('shows the control after one viewport and reports progress', () => {
    expect(getPageScrollState(800, 2400, 800)).toEqual({
      progress: 0.5,
      isVisible: true,
    })
  })

  it('clamps overscroll values to the valid range', () => {
    expect(getPageScrollState(3000, 2000, 800)).toEqual({
      progress: 1,
      isVisible: true,
    })
  })
})

describe('pinned horizontal story helpers', () => {
  it('clamps vertical progress before, during, and after the sticky stage', () => {
    expect(getPinnedScrollProgress(120, 1000)).toBe(0)
    expect(getPinnedScrollProgress(-420, 1000)).toBeCloseTo(0.42)
    expect(getPinnedScrollProgress(-1400, 1000)).toBe(1)
    expect(getPinnedScrollProgress(-100, 0)).toBe(0)
  })

  it('maps a horizontal target back to the matching page position', () => {
    expect(getPinnedPageOffset(2400, 1100, 0, 1000)).toBe(2400)
    expect(getPinnedPageOffset(2400, 1100, 500, 1000)).toBe(2950)
    expect(getPinnedPageOffset(2400, 1100, 1400, 1000)).toBe(3500)
    expect(getPinnedPageOffset(2400, 1100, 500, 0)).toBe(2400)
  })
})
