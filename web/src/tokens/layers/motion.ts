/**
 * Layer 8 — Motion Tokens (DDS-005)
 * Duration, delay, distance, easing, interaction presets, reduced-motion policy.
 * CSS source: web/src/index.css --motion-*
 */

export const pmMotionVars = {
  fast: '--motion-fast',
  base: '--motion-base',
  slow: '--motion-slow',
  easeOut: '--motion-ease-out',
  easeSpring: '--motion-ease-spring',
  easeInOut: '--motion-ease-in-out',
  delayShort: '--motion-delay-short',
  delayBase: '--motion-delay-base',
  delayStagger: '--motion-delay-stagger',
  distanceSm: '--motion-distance-sm',
  distanceMd: '--motion-distance-md',
  distanceLg: '--motion-distance-lg',
} as const

/** Base motion utility class names (duration + easing). */
export const pmMotion = {
  fast: 'pm-motion-fast',
  base: 'pm-motion-base',
  slow: 'pm-motion-slow',
  spring: 'pm-motion-spring',
} as const

/** Documented durations — mirror CSS values for JS / framer-motion consumers. */
export const pmMotionDuration = {
  fast: 120,
  base: 180,
  slow: 240,
  hover: 120,
  transition: 180,
} as const

export const pmMotionDelay = {
  short: 40,
  base: 80,
  stagger: 60,
} as const

export const pmMotionDistance = {
  sm: 4,
  md: 8,
  lg: 16,
} as const

export const pmMotionEasing = {
  out: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  spring: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Framer Motion tuple for page / hero transitions */
  outTuple: [0.25, 0.1, 0.25, 1] as const,
} as const

/** Hover, press, and focus interaction presets. */
export const pmInteraction = {
  hover: 'pm-interactive-hover',
  press: 'pm-interactive-press',
  focus: 'pm-focus-ring',
  card: 'pm-interactive-card',
  tableRow: 'pm-table-row-hover',
  navItem: 'pm-nav-item',
  toolbarAction: 'pm-toolbar-action',
} as const

/** Enter / reveal animations for pages, heroes, empty states. */
export const pmEnter = {
  fade: 'pm-enter-fade',
  reveal: 'pm-enter-reveal',
  hero: 'pm-enter-hero',
  empty: 'pm-enter-empty',
  stagger: 'pm-enter-stagger',
} as const

/** Loading and skeleton motion. */
export const pmLoading = {
  skeleton: 'pm-skeleton',
  pulse: 'pm-loading-pulse',
  inline: 'pm-loading-inline',
  section: 'pm-loading-section',
} as const

/** Pipeline kanban drag / drop feedback. */
export const pmPipeline = {
  drag: 'pm-pipeline-drag',
  dropZone: 'pm-pipeline-drop',
  dropActive: 'pm-pipeline-drop-active',
} as const

/** Modal, drawer, and overlay transitions. */
export const pmOverlay = {
  modal: 'pm-overlay-modal',
  modalContent: 'pm-overlay-modal-content',
  drawer: 'pm-overlay-drawer',
  drawerContent: 'pm-overlay-drawer-content',
} as const

/** Toast enter / exit (Sonner). */
export const pmToast = {
  root: 'pm-toast-root',
  enter: 'pm-toast-enter',
  exit: 'pm-toast-exit',
} as const

/** Reduced motion: index.css @media (prefers-reduced-motion: reduce) collapses transitions globally. */
export const pmReducedMotionPolicy = 'global-collapse' as const

export type PmMotionSpeed = keyof typeof pmMotion
