/**
 * Layer 4 — Layout Tokens
 * Page structure, spacing rhythm, breakpoints, and grid patterns.
 * CSS source: web/src/index.css (--pm-space-*) + layout grid classes.
 */

/** CSS custom property names for spatial rhythm. */
export const pmLayoutVars = {
  pageX: '--pm-space-page-x',
  pageY: '--pm-space-page-y',
  section: '--pm-space-section',
  card: '--pm-space-card',
  form: '--pm-space-form',
  tableY: '--pm-space-table-y',
  tableX: '--pm-space-table-x',
} as const

/** Layout rhythm utility class names (pair with CSS variables in index.css). */
export const pmLayoutRhythm = {
  pagePadding: 'pm-page-padding',
  sectionGap: 'pm-section-gap',
  cardPadding: 'pm-card-padding',
  formGap: 'pm-form-gap',
  tableDense: 'pm-table-dense',
  focusRing: 'pm-focus-ring',
} as const

export const pmBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type PmBreakpoint = keyof typeof pmBreakpoints

export const pmBreakpointMedia = {
  sm: `(min-width: ${pmBreakpoints.sm}px)`,
  md: `(min-width: ${pmBreakpoints.md}px)`,
  lg: `(min-width: ${pmBreakpoints.lg}px)`,
  xl: `(min-width: ${pmBreakpoints.xl}px)`,
  '2xl': `(min-width: ${pmBreakpoints['2xl']}px)`,
} as const

/** Shell dimension tokens (implementation in shadcn sidebar — documented for governance). */
export const pmShellDimensions = {
  headerHeight: '3.5rem',
  sidebarWidth: '16rem',
  sidebarWidthCollapsed: '3rem',
  inspectorMinWidth: '16rem',
  inspectorMaxWidth: '22rem',
} as const

export const pmLayoutGrid = {
  pageStack: 'flex flex-col pm-section-gap',
  detail: 'grid gap-6 lg:grid-cols-3',
  detailMain: 'space-y-4 lg:col-span-2',
  detailInspector: 'space-y-4 lg:col-span-1',
  metrics: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
  metricsThree: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  dashboardBody: 'grid gap-6 xl:grid-cols-3',
  dashboardMain: 'space-y-6 xl:col-span-2',
  dashboardAside: 'space-y-6 xl:col-span-1',
  split: 'grid min-h-0 gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr] lg:gap-6',
  splitList: 'min-h-0 lg:max-h-[calc(100svh-12rem)]',
  splitDetail: 'min-h-0',
  wizard: 'grid gap-6 lg:grid-cols-[1fr_minmax(16rem,20rem)]',
  wizardMain: 'min-w-0 space-y-6',
  wizardAside: 'min-w-0 space-y-4',
} as const

export const pmSticky = {
  toolbar:
    'sticky top-14 z-10 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:px-8',
  filters: 'sticky top-[calc(3.5rem+3.25rem)] z-[9] bg-background/95 py-2',
  inspectorHeader:
    'sticky top-14 z-[8] -mx-4 border-b border-border/40 bg-surface/95 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none',
  actionFooter:
    'sticky bottom-0 z-10 -mx-4 mt-auto border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 md:-mx-8 md:px-8',
} as const

export const pmContentWidth = {
  default: 'mx-auto w-full max-w-7xl',
  narrow: 'mx-auto w-full max-w-3xl',
  wide: 'mx-auto w-full max-w-[90rem]',
  full: 'w-full',
} as const

export function resolveMetricColumns(count: number): keyof typeof pmLayoutGrid {
  if (count <= 3) return 'metricsThree'
  return 'metrics'
}
