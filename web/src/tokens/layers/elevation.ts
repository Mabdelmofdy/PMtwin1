/**
 * Layer 7 — Elevation Tokens
 * Shadow levels express surface priority — not decorative depth.
 * CSS source: web/src/index.css --shadow-*
 */

export const pmElevationVars = {
  card: '--shadow-card',
  panel: '--shadow-panel',
  floating: '--shadow-floating',
  modal: '--shadow-modal',
} as const

/** Elevation utility class names. */
export const pmElevation = {
  flat: '',
  card: 'pm-shadow-card',
  raised: 'pm-shadow-panel',
  floating: 'pm-shadow-floating',
  modal: 'pm-shadow-modal',
} as const

/**
 * Shadow philosophy (DDS-001):
 * - Low-opacity oklch shadows — no blur-heavy glass
 * - flat → card → raised → floating → modal (increasing prominence)
 * - Overlay scrims use separate semantic tokens when implemented
 */
export const pmElevationLevels = ['flat', 'card', 'raised', 'floating', 'modal'] as const

export type PmElevationLevel = (typeof pmElevationLevels)[number]
