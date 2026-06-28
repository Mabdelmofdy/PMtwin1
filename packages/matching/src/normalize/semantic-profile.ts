import type { CanonicalData } from '../types/canonical.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'
import type { SemanticProfile } from '../types/semantic-profile.ts'

function resolveExpansion(canonical: CanonicalData): CanonicalData['categoryExpansion'] {
  return canonical.semanticTerms ?? canonical.categoryExpansion ?? {}
}

export function expandTerm(
  term: string | null | undefined,
  categoryExpansion: CanonicalData['categoryExpansion'] = {},
): string[] {
  if (!term || typeof term !== 'string') return []
  const key = term.toLowerCase().trim()
  const expanded = categoryExpansion?.[key]
  if (Array.isArray(expanded)) return [...expanded]
  if (typeof expanded === 'string') return [expanded]
  return [term]
}

export function buildSemanticProfile(
  normalizedPost: NormalizedPost,
  opportunity: OpportunityPost | null = null,
  canonical: CanonicalData = {},
): SemanticProfile {
  const expansion = resolveExpansion(canonical) ?? {}
  const categoryTags = [
    ...(normalizedPost.categories ?? []),
    ...(normalizedPost.modelType ? [normalizedPost.modelType] : []),
    ...(normalizedPost.subModelType ? [normalizedPost.subModelType] : []),
  ].filter(Boolean)
  const uniqueTags = [...new Set(categoryTags)]

  const expandedSet = new Set(normalizedPost.skills ?? [])
  ;(normalizedPost.skills ?? []).forEach((skill) => {
    expandTerm(skill, expansion).forEach((term) => expandedSet.add(term))
  })

  if (opportunity && (opportunity.title || opportunity.description)) {
    const text = [opportunity.title, opportunity.description].filter(Boolean).join(' ').toLowerCase()
    Object.keys(expansion).forEach((key) => {
      if (!text.includes(key)) return
      const value = expansion[key]
      const terms = Array.isArray(value) ? value : (value ? [value] : [])
      terms.forEach((term) => expandedSet.add(term))
    })
  }

  return {
    structured: normalizedPost,
    categoryTags: uniqueTags,
    expandedSkillsOrCategories: [...expandedSet],
  }
}
