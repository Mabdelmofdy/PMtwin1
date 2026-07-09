import {
  createAIExplanationGateway,
  serializeAIExplanationPayload,
  toAIExplanationPayload,
  type AgentExplainabilityContext,
  type AIExplanationGateway,
  type AIExplanationPayload,
  type ExplanationBundle,
} from '@pm-twin/explainability'

const gateway: AIExplanationGateway = createAIExplanationGateway()

export function exportExplanationPayload(
  bundle: ExplanationBundle,
): AIExplanationPayload {
  return gateway.exportPayload(bundle)
}

export function importExplanationPayload(
  payload: AIExplanationPayload,
): ExplanationBundle {
  return gateway.importPayload(payload)
}

export function exportExplanationBatch(
  bundles: readonly ExplanationBundle[],
): string {
  return gateway.exportBatch(bundles)
}

export function buildAgentExplainabilityContext(options: {
  readonly bundles: readonly ExplanationBundle[]
  readonly subModelKey?: string
  readonly locale?: string
  readonly includeKnowledge?: boolean
}): AgentExplainabilityContext {
  return gateway.buildAgentContext(options)
}

export function serializeBundleForAi(bundle: ExplanationBundle): string {
  return serializeAIExplanationPayload(toAIExplanationPayload(bundle))
}

export { gateway as aiExplanationGateway }
