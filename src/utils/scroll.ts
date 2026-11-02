function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export interface PageScrollState {
  progress: number
  isVisible: boolean
}

export function getPageScrollState(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): PageScrollState {
  const safeViewportHeight = Math.max(0, viewportHeight)
  const maxScroll = Math.max(0, scrollHeight - safeViewportHeight)
  const boundedScroll = Math.min(Math.max(0, scrollY), maxScroll)

  return {
    progress: maxScroll > 0 ? boundedScroll / maxScroll : 0,
    isVisible: maxScroll > 0 && boundedScroll >= safeViewportHeight,
  }
}

export function getPinnedScrollProgress(sectionTop: number, scrollSpan: number): number {
  if (!Number.isFinite(scrollSpan) || scrollSpan <= 0) return 0
  return clampUnit(-sectionTop / scrollSpan)
}

export function getPinnedPageOffset(
  sectionDocumentTop: number,
  scrollSpan: number,
  scrollLeft: number,
  maxScrollLeft: number,
): number {
  if (!Number.isFinite(sectionDocumentTop)) return 0
  if (!Number.isFinite(scrollSpan) || scrollSpan <= 0) return sectionDocumentTop
  if (!Number.isFinite(maxScrollLeft) || maxScrollLeft <= 0) return sectionDocumentTop

  const progress = clampUnit(scrollLeft / maxScrollLeft)
  return sectionDocumentTop + progress * scrollSpan
}
