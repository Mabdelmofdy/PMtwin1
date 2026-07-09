import type { ExplanationBundle } from '../types/bundle.ts'
import type { AgentExplainabilityContext } from './agent-context.ts'
import {
  deserializeExplanationBundle,
  fromAIExplanationPayload,
  toAIExplanationPayload,
  type AIExplanationPayload,
} from './serialization.ts'
import type { KnowledgeExtension } from '../services/enrichment.ts'
import {
  normalizeExplainabilityLocale,
  type ExplainabilityLocale,
} from '../services/locale.ts'

export type AIExplanationGateway = {
  readonly exportPayload: (bundle: ExplanationBundle) => AIExplanationPayload
  readonly importPayload: (payload: AIExplanationPayload) => ExplanationBundle
  readonly exportBatch: (bundles: readonly ExplanationBundle[]) => string
  readonly buildAgentContext: (options: {
    readonly bundles: readonly ExplanationBundle[]
    readonly subModelKey?: string
    readonly locale?: ExplainabilityLocale | string
    readonly includeKnowledge?: boolean
  }) => AgentExplainabilityContext
}

function resolveKnowledgeFromBundles(
  bundles: readonly ExplanationBundle[],
  includeKnowledge: boolean,
): KnowledgeExtension | undefined {
  if (!includeKnowledge) return undefined

  for (const bundle of bundles) {
    const knowledge = bundle.metadata.extensions?.knowledge
    if (knowledge && typeof knowledge === 'object') {
      return knowledge as KnowledgeExtension
    }
  }

  return undefined
}

export function createAIExplanationGateway(): AIExplanationGateway {
  return {
    exportPayload(bundle: ExplanationBundle): AIExplanationPayload {
      return toAIExplanationPayload(bundle)
    },

    importPayload(payload: AIExplanationPayload): ExplanationBundle {
      return fromAIExplanationPayload(payload)
    },

    exportBatch(bundles: readonly ExplanationBundle[]): string {
      const payloads = bundles.map((bundle) => toAIExplanationPayload(bundle))
      return JSON.stringify(payloads)
    },

    buildAgentContext(options): AgentExplainabilityContext {
      const locale = normalizeExplainabilityLocale(options.locale)
      const includeKnowledge = options.includeKnowledge ?? true

      return {
        generatedAt: new Date().toISOString(),
        locale,
        subModelKey: options.subModelKey,
        includeKnowledge,
        bundles: options.bundles,
        summaries: options.bundles.map((bundle) => ({
          engine: bundle.engine,
          entityId: bundle.entityId,
          score: bundle.score,
          health: bundle.health,
          summary: bundle.summary,
        })),
        knowledge: resolveKnowledgeFromBundles(options.bundles, includeKnowledge),
      }
    },
  }
}

export function importPayloadFromJson(json: string): ExplanationBundle {
  const parsed: unknown = JSON.parse(json)

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'version' in parsed &&
    'bundle' in parsed
  ) {
    return fromAIExplanationPayload(parsed as AIExplanationPayload)
  }

  return deserializeExplanationBundle(json)
}

export function serializeAgentContext(context: AgentExplainabilityContext): string {
  return JSON.stringify(context)
}
