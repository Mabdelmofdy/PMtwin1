/**
 * PM-Twin token ownership registry — machine-readable governance (DDS-002).
 * CSS values: web/src/index.css | TS helpers: web/src/tokens/
 */

import type { PmTokenLayer } from '@/tokens/pm-token-layers'

export type PmTokenOwnership = {
  readonly layer: PmTokenLayer
  readonly owner: string
  readonly consumers: readonly string[]
  readonly allowedDependencies: readonly PmTokenLayer[]
  readonly forbiddenDependencies: readonly PmTokenLayer[]
}

export const pmTokenOwnership: Record<PmTokenLayer, PmTokenOwnership> = {
  brand: {
    layer: 'brand',
    owner: 'index.css (:root / .dark)',
    consumers: ['semantic', 'theme engine'],
    allowedDependencies: [],
    forbiddenDependencies: ['component', 'layout', 'chart'],
  },
  semantic: {
    layer: 'semantic',
    owner: 'index.css + tokens/layers/semantic.ts',
    consumers: ['component', 'PM primitives', 'shadcn theme mapping'],
    allowedDependencies: ['brand'],
    forbiddenDependencies: ['layout', 'chart'],
  },
  component: {
    layer: 'component',
    owner: 'tokens/layers/component.ts + pm-* primitives',
    consumers: ['PM primitives', 'domain sections'],
    allowedDependencies: ['semantic', 'typography', 'radius', 'elevation', 'motion', 'icon', 'layout'],
    forbiddenDependencies: ['brand', 'chart'],
  },
  layout: {
    layer: 'layout',
    owner: 'index.css (--pm-space-*) + tokens/layers/layout.ts',
    consumers: ['PmPageLayout', 'PmDetailLayout', 'PmDashboardLayout', 'pages via layout index'],
    allowedDependencies: ['semantic'],
    forbiddenDependencies: ['brand', 'component', 'chart'],
  },
  typography: {
    layer: 'typography',
    owner: 'index.css (.pm-text-*) + tokens/layers/typography.ts',
    consumers: ['component', 'PM primitives', 'domain sections'],
    allowedDependencies: ['semantic', 'brand'],
    forbiddenDependencies: ['component', 'layout', 'chart'],
  },
  radius: {
    layer: 'radius',
    owner: 'index.css (@theme --radius-*) + tokens/layers/radius.ts',
    consumers: ['component', 'PM primitives'],
    allowedDependencies: ['brand'],
    forbiddenDependencies: ['component', 'layout', 'chart'],
  },
  elevation: {
    layer: 'elevation',
    owner: 'index.css (--shadow-*) + tokens/layers/elevation.ts',
    consumers: ['component', 'PM primitives'],
    allowedDependencies: ['semantic', 'brand'],
    forbiddenDependencies: ['component', 'layout', 'chart'],
  },
  motion: {
    layer: 'motion',
    owner: 'index.css (--motion-*) + tokens/layers/motion.ts',
    consumers: ['component', 'PM primitives'],
    allowedDependencies: ['brand'],
    forbiddenDependencies: ['component', 'layout', 'chart'],
  },
  icon: {
    layer: 'icon',
    owner: 'tokens/layers/icon.ts',
    consumers: ['component', 'shell chrome', 'domain sections'],
    allowedDependencies: ['layout'],
    forbiddenDependencies: ['brand', 'chart'],
  },
  chart: {
    layer: 'chart',
    owner: 'tokens/layers/chart.ts (reserved)',
    consumers: ['future analytics components'],
    allowedDependencies: ['semantic', 'brand'],
    forbiddenDependencies: ['component', 'layout'],
  },
}

/** Pages may only consume layout grid helpers and PM primitives — never brand or raw semantic CSS vars. */
export const pmPageTokenPolicy = {
  allowedImports: ['@/components/layout/pm-layout-index', '@/components/ui/pm-index', '@/tokens/layers/layout'],
  forbiddenImports: ['@/tokens/layers/brand', '@/tokens/layers/chart'],
} as const

/** Validation rules for token compliance (DDS-002 §9). */
export const pmTokenValidationRules = {
  forbidden: [
    'hardcoded hex/rgb/oklch in components',
    'hardcoded box-shadow values in components',
    'hardcoded spacing (px/rem) in PM primitives',
    'hardcoded border-radius in PM primitives',
    'hardcoded font-size/weight in PM primitives',
    'hardcoded animation duration in PM primitives',
    'pages importing brand tokens directly',
  ],
  allowed: [
    'token utility class names from @/tokens',
    'semantic Tailwind utilities (bg-surface, text-muted-foreground)',
    'layout grid classes from pmLayoutGrid',
    'component token mappings from pmComponentTokens',
  ],
} as const
