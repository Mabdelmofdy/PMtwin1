import type { NormalizedPost } from './opportunity.ts'

export interface SemanticProfile {
  readonly structured: NormalizedPost
  readonly categoryTags: readonly string[]
  readonly expandedSkillsOrCategories: readonly string[]
}
