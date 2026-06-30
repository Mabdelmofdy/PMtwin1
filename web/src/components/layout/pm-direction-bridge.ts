/**
 * Document direction bridge (DDS-005 / Phase 9.5D).
 * Pure helpers — no React, no business logic.
 */

export type DocumentDirection = 'ltr' | 'rtl'

export const PM_DIRECTION_STORAGE_KEY = 'pm-twin-direction'

export function normalizeDocumentDirection(
  value: string | null | undefined,
): DocumentDirection {
  return value === 'rtl' ? 'rtl' : 'ltr'
}

export function resolveDocumentLanguage(direction: DocumentDirection): string {
  return direction === 'rtl' ? 'ar' : 'en'
}

/** Attributes to apply on document.documentElement. */
export function resolveDocumentDirectionAttributes(direction: DocumentDirection) {
  return {
    dir: direction,
    lang: resolveDocumentLanguage(direction),
  } as const
}

/** Sonner toast anchor — inline-end in LTR is right; in RTL prefer inline-start (physical left). */
export function resolveToastPosition(
  direction: DocumentDirection,
): 'bottom-right' | 'bottom-left' {
  return direction === 'rtl' ? 'bottom-left' : 'bottom-right'
}

/** Hero metric slide-in offset — from inline-start. */
export function resolveInlineStartRevealOffset(
  direction: DocumentDirection,
  distance: number,
): number {
  return direction === 'rtl' ? distance : -distance
}
