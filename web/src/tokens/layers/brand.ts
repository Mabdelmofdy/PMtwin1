/**
 * Layer 1 — Brand Tokens
 * Identity constants only. Never reference components.
 * CSS source: web/src/index.css (:root / .dark --primary, --success, etc.)
 */

/** CSS custom property names for brand palette (theme-scoped values in index.css). */
export const pmBrandVars = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  primaryMuted: '--primary-muted',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  danger: '--danger',
  dangerForeground: '--danger-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
  neutral: '--neutral',
  neutralForeground: '--neutral-foreground',
  destructive: '--destructive',
} as const

/** Tailwind color utilities mapped to brand tokens (for documentation and lint rules). */
export const pmBrandColor = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
  destructive: 'destructive',
} as const

export type PmBrandColor = keyof typeof pmBrandColor
