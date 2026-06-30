/**
 * Layer 3 — Component Tokens
 * Maps semantic tokens into reusable component visual language.
 * PM primitives consume these mappings — pages never import this layer directly.
 */

import { pmMotion } from '@/tokens/layers/motion'
import { pmRadius } from '@/tokens/layers/radius'
import { pmElevation } from '@/tokens/layers/elevation'
import { pmLayoutRhythm } from '@/tokens/layers/layout'
import { pmTypography } from '@/tokens/layers/typography'
import { pmIconSize } from '@/tokens/layers/icon'

/** Component token mappings — semantic → primitive defaults. */
export const pmComponentTokens = {
  button: {
    radius: pmRadius.lg,
    motion: pmMotion.fast,
    focus: pmLayoutRhythm.focusRing,
  },
  card: {
    radius: pmRadius.xl,
    padding: pmLayoutRhythm.cardPadding,
    elevation: pmElevation.card,
    border: 'border-border/60',
  },
  badge: {
    typography: pmTypography.badge,
    radius: pmRadius.md,
  },
  input: {
    radius: pmRadius.md,
    border: 'border-input',
    focus: pmLayoutRhythm.focusRing,
  },
  table: {
    density: pmLayoutRhythm.tableDense,
    border: 'border-border',
  },
  dialog: {
    elevation: pmElevation.modal,
    radius: pmRadius.lg,
  },
  navigation: {
    itemMotion: pmMotion.fast,
    badgeTypography: pmTypography.badge,
  },
  tooltip: {
    elevation: pmElevation.floating,
    typography: pmTypography.caption,
  },
  inspector: {
    gap: pmLayoutRhythm.sectionGap,
    typographyLabel: pmTypography.label,
    typographyValue: pmTypography.bodySm,
  },
  timeline: {
    gap: pmLayoutRhythm.sectionGap,
    iconSize: pmIconSize.status,
  },
  wizard: {
    gap: pmLayoutRhythm.formGap,
    stepTypography: pmTypography.label,
  },
} as const

export type PmComponentToken = keyof typeof pmComponentTokens

/** Match-type badge styles — domain display mapping via semantic status backgrounds. */
export const pmMatchTypeStyles: Record<string, string> = {
  one_way: 'bg-info/10 text-info',
  two_way: 'bg-primary/10 text-primary',
  consortium: 'bg-warning/10 text-warning',
  circular: 'bg-success/10 text-success',
}

export function resolveMatchTypeStyle(matchType: string): string {
  const key = matchType.toLowerCase()
  return pmMatchTypeStyles[key] ?? 'bg-neutral/10 text-neutral'
}

export function formatMatchTypeLabel(matchType: string): string {
  return matchType.replace(/_/g, ' ')
}
