import type { CategoryExpansionMap } from '../types/canonical.ts'

export function normalizeCategory(
  category: string | null | undefined,
  categoryExpansion: CategoryExpansionMap = {},
): string {
  if (!category || typeof category !== 'string') return ''
  const trimmed = category.trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  const expanded = categoryExpansion[key]
  if (Array.isArray(expanded) && expanded.length > 0) return expanded[0]
  if (typeof expanded === 'string') return expanded
  return trimmed
}
