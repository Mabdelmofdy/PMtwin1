/**
 * Layer 9 — Icon Tokens
 * Size and spacing conventions for lucide icons across PM-Twin.
 */

export const pmIconSize = {
  /** Inline with caption text */
  compact: 'size-3.5',
  /** Default UI icon */
  default: 'size-4',
  /** Button-adjacent / nav */
  medium: 'size-5',
  /** Section headers, empty states */
  large: 'size-6',
  /** Dashboard / marketing emphasis */
  xl: 'size-8',
  /** Navigation sidebar items */
  navigation: 'size-4',
  /** Status indicators in timelines and badges */
  status: 'size-3.5',
  /** Interactive controls (icon buttons) */
  interactive: 'size-4',
} as const

export const pmIconSpacing = {
  /** Gap between icon and label in buttons */
  buttonGap: 'gap-2',
  /** Gap in nav items */
  navGap: 'gap-2',
  /** Gap in list rows */
  listGap: 'gap-3',
} as const

export type PmIconSize = keyof typeof pmIconSize
