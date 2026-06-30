/**
 * PM-Twin design governance rule definitions (DDS-003).
 * Shared by validate-design-governance.mjs and unit tests.
 */

/** @typedef {{ type: string; message: string; suggestion: string }} ViolationMeta */

/** @type {Record<string, ViolationMeta>} */
export const VIOLATION_TYPES = {
  HEX_COLOR: {
    type: 'HEX_COLOR',
    message: 'Hardcoded hex color',
    suggestion: 'Use semantic token utilities (bg-surface, text-foreground) or @/tokens helpers',
  },
  RGB_COLOR: {
    type: 'RGB_COLOR',
    message: 'Hardcoded rgb/rgba/hsl color function',
    suggestion: 'Use CSS variables via semantic Tailwind tokens',
  },
  SHADOW_ARBITRARY: {
    type: 'SHADOW_ARBITRARY',
    message: 'Arbitrary shadow-[...] value',
    suggestion: 'Use pmElevation.* (pm-shadow-card, pm-shadow-panel) or var(--shadow-*) inside token layer only',
  },
  ROUNDED_ARBITRARY: {
    type: 'ROUNDED_ARBITRARY',
    message: 'Arbitrary rounded-[...] value',
    suggestion: 'Use pmRadius.* (rounded-lg, rounded-xl) from @/tokens',
  },
  PAGE_SHADCN_BUTTON: {
    type: 'PAGE_SHADCN_BUTTON',
    message: 'Page imports shadcn Button directly',
    suggestion: 'Use PmButton from @/components/ui/pm-index',
  },
  PAGE_SHADCN_CARD: {
    type: 'PAGE_SHADCN_CARD',
    message: 'Page imports shadcn Card directly',
    suggestion: 'Use PmCard / PmContentCard from @/components/ui/pm-index or layout index',
  },
  PAGE_SHADCN_BADGE: {
    type: 'PAGE_SHADCN_BADGE',
    message: 'Page imports shadcn Badge directly',
    suggestion: 'Use PmBadge or PmWorkflowBadge from @/components/ui/pm-index',
  },
  PAGE_BRAND_TOKENS: {
    type: 'PAGE_BRAND_TOKENS',
    message: 'Page imports brand token layer',
    suggestion: 'Pages must not import @/tokens/layers/brand — use PM primitives',
  },
  DEPRECATED_PAGE_PRIMITIVES: {
    type: 'DEPRECATED_PAGE_PRIMITIVES',
    message: 'Import from deprecated page-primitives.tsx',
    suggestion: 'Use PmPageHeader, PmEmptyState, PmWorkflowBadge from @/components/ui/pm-index',
  },
  TAILWIND_PALETTE: {
    type: 'TAILWIND_PALETTE',
    message: 'Hardcoded Tailwind palette color (e.g. bg-emerald-500)',
    suggestion: 'Use semantic tokens (bg-success/10, text-warning) via @/tokens',
  },
  DUPLICATED_STYLE_MAP: {
    type: 'DUPLICATED_STYLE_MAP',
    message: 'Inline status/style map with hardcoded palette classes',
    suggestion: 'Delegate to PmWorkflowBadge or pmStatusBackground in @/tokens',
  },
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/
const RGB_RE = /(?:rgb|rgba|hsl|hsla)\s*\(/
const SHADOW_ARBITRARY_RE = /shadow-\[/
const ROUNDED_ARBITRARY_RE = /rounded-\[/
const TAILWIND_PALETTE_RE =
  /(?:^|[\s"'`])(?:bg|text|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\d{2,3}(?:\/\d+)?)/

const PAGE_SHADCN_IMPORT_RE =
  /from\s+['"]@\/components\/ui\/(button|card|badge)['"]/
const PAGE_BRAND_IMPORT_RE = /from\s+['"]@\/tokens\/layers\/brand['"]/
const DEPRECATED_PRIMITIVES_RE = /from\s+['"]@\/components\/shared\/page-primitives['"]/
const STYLE_MAP_RE = /(?:const|let)\s+\w*(?:Styles|styles|StyleMap)\s*:\s*Record</

/**
 * Paths (relative to web/src) fully excluded from style violation scans.
 * @param {string} relPath
 */
export function isFullyExcluded(relPath) {
  return relPath.endsWith('.test.ts')
}

/**
 * Paths allowed for low-level styling (shadcn wrappers, token defs, deprecated baseline).
 * @param {string} relPath
 */
export function isStyleAllowlisted(relPath) {
  if (isFullyExcluded(relPath)) return true
  if (relPath === 'components/shared/page-primitives.tsx') return true
  if (relPath.startsWith('tokens/')) return true
  if (relPath.startsWith('components/ui/')) return true
  return false
}

/** @param {string} relPath */
export function isPageFile(relPath) {
  return relPath.startsWith('pages/')
}

/**
 * Baseline exceptions accepted at Phase 3 — do not fail CI until cleaned up.
 * Keys: `${relPath}:${line}:${type}` or `${relPath}::${type}` for import lines
 * @type {Set<string>}
 */
export const BASELINE_EXCEPTION_KEYS = new Set([
  // Public routes — out of UI freeze (DDS-001, PM-TWIN-UI-FREEZE)
  'pages/public/auth-pages.tsx::PAGE_SHADCN_BUTTON',
  'pages/public/auth-pages.tsx::PAGE_SHADCN_CARD',
  'pages/public/marketing-pages.tsx::PAGE_SHADCN_BUTTON',
  'pages/public/marketing-pages.tsx:72:TAILWIND_PALETTE',
  // Deprecated file — zero imports; scheduled removal
  'components/shared/page-primitives.tsx::DUPLICATED_STYLE_MAP',
  'components/shared/page-primitives.tsx:15:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:16:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:17:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:18:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:19:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:20:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:21:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:22:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:23:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:24:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:25:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:26:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:27:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:28:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:29:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:30:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:31:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:32:TAILWIND_PALETTE',
  'components/shared/page-primitives.tsx:33:TAILWIND_PALETTE',
  // Readiness visuals — migrate to semantic tokens in future UI phase
  'components/readiness/readiness-list.tsx:17:TAILWIND_PALETTE',
  'components/readiness/readiness-score-ring.tsx:6:TAILWIND_PALETTE',
  'components/readiness/readiness-score-ring.tsx:7:TAILWIND_PALETTE',
  'components/readiness/readiness-score-ring.tsx:8:TAILWIND_PALETTE',
  // Token-var shadows outside ui/ — acceptable until component token pass
  'components/data/pm-data-table.tsx:285:SHADOW_ARBITRARY',
  'components/layout/app-sidebar.tsx:30:SHADOW_ARBITRARY',
])

/**
 * @param {string} relPath
 * @param {number} lineNumber
 * @param {string} line
 * @returns {Array<{ type: string; message: string; suggestion: string; line: number; excerpt: string }>}
 */
export function checkLine(relPath, lineNumber, line) {
  /** @type {Array<{ type: string; message: string; suggestion: string; line: number; excerpt: string }>} */
  const violations = []
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
    return violations
  }

  const excerpt = trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed

  if (isPageFile(relPath)) {
    if (PAGE_SHADCN_IMPORT_RE.test(line)) {
      const match = line.match(/ui\/(button|card|badge)/)
      const kind = match?.[1]
      const typeKey =
        kind === 'button'
          ? 'PAGE_SHADCN_BUTTON'
          : kind === 'card'
            ? 'PAGE_SHADCN_CARD'
            : 'PAGE_SHADCN_BADGE'
      violations.push({ ...VIOLATION_TYPES[typeKey], line: lineNumber, excerpt })
    }
    if (PAGE_BRAND_IMPORT_RE.test(line)) {
      violations.push({ ...VIOLATION_TYPES.PAGE_BRAND_TOKENS, line: lineNumber, excerpt })
    }
  }

  if (DEPRECATED_PRIMITIVES_RE.test(line) && !isFullyExcluded(relPath)) {
    violations.push({ ...VIOLATION_TYPES.DEPRECATED_PAGE_PRIMITIVES, line: lineNumber, excerpt })
  }

  if (isStyleAllowlisted(relPath)) {
    return violations
  }

  if (HEX_RE.test(line)) {
    violations.push({ ...VIOLATION_TYPES.HEX_COLOR, line: lineNumber, excerpt })
  }
  if (RGB_RE.test(line)) {
    violations.push({ ...VIOLATION_TYPES.RGB_COLOR, line: lineNumber, excerpt })
  }
  if (SHADOW_ARBITRARY_RE.test(line) && !/var\s*\(--/.test(line)) {
    violations.push({ ...VIOLATION_TYPES.SHADOW_ARBITRARY, line: lineNumber, excerpt })
  }
  if (ROUNDED_ARBITRARY_RE.test(line)) {
    violations.push({ ...VIOLATION_TYPES.ROUNDED_ARBITRARY, line: lineNumber, excerpt })
  }
  if (TAILWIND_PALETTE_RE.test(line)) {
    violations.push({ ...VIOLATION_TYPES.TAILWIND_PALETTE, line: lineNumber, excerpt })
  }
  if (STYLE_MAP_RE.test(line) && relPath.includes('page-primitives')) {
    violations.push({ ...VIOLATION_TYPES.DUPLICATED_STYLE_MAP, line: lineNumber, excerpt })
  }

  return violations
}

/**
 * @param {string} relPath
 * @param {number} line
 * @param {string} type
 */
export function isBaselineException(relPath, line, type) {
  const lineKey = `${relPath}:${line}:${type}`
  const fileKey = `${relPath}::${type}`
  return BASELINE_EXCEPTION_KEYS.has(lineKey) || BASELINE_EXCEPTION_KEYS.has(fileKey)
}

/**
 * @param {string} relPath
 * @param {{ type: string; line: number }} violation
 */
export function violationKey(relPath, violation) {
  return `${relPath}:${violation.line}:${violation.type}`
}
