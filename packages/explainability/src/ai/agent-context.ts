import type { ExplanationBundle } from '../types/bundle.ts'
import type { KnowledgeExtension } from '../services/enrichment.ts'
import type { ExplainabilityLocale } from '../services/locale.ts'

export type AgentExplainabilityContext = {
  readonly generatedAt: string
  readonly locale: ExplainabilityLocale
  readonly subModelKey?: string
  readonly includeKnowledge: boolean
  readonly bundles: readonly ExplanationBundle[]
  readonly summaries: readonly {
    readonly engine: string
    readonly entityId: string
    readonly score: number
    readonly health: string
    readonly summary: string
  }[]
  readonly knowledge?: KnowledgeExtension
}
