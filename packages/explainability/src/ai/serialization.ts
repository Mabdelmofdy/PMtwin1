import type { ExplanationBundle } from '../types/bundle.ts'
import { isExplanationBundle } from '../validation/bundle-shape.ts'

export const AI_EXPLANATION_PAYLOAD_VERSION = '1.0.0' as const

export type AIExplanationPayload = {
  readonly version: typeof AI_EXPLANATION_PAYLOAD_VERSION
  readonly bundle: ExplanationBundle
  readonly serializedAt: string
}

export function serializeExplanationBundle(bundle: ExplanationBundle): string {
  return JSON.stringify(bundle)
}

export function deserializeExplanationBundle(json: string): ExplanationBundle {
  const parsed: unknown = JSON.parse(json)

  if (!isExplanationBundle(parsed)) {
    throw new Error('Invalid ExplanationBundle payload')
  }

  return parsed
}

export function toAIExplanationPayload(
  bundle: ExplanationBundle,
  serializedAt: string = new Date().toISOString(),
): AIExplanationPayload {
  return {
    version: AI_EXPLANATION_PAYLOAD_VERSION,
    bundle,
    serializedAt,
  }
}

export function fromAIExplanationPayload(
  payload: AIExplanationPayload,
): ExplanationBundle {
  if (payload.version !== AI_EXPLANATION_PAYLOAD_VERSION) {
    throw new Error(
      `Unsupported AI explanation payload version: ${payload.version}`,
    )
  }

  if (!isExplanationBundle(payload.bundle)) {
    throw new Error('Invalid ExplanationBundle in AIExplanationPayload')
  }

  return payload.bundle
}

export function serializeAIExplanationPayload(
  payload: AIExplanationPayload,
): string {
  return JSON.stringify(payload)
}

export function deserializeAIExplanationPayload(
  json: string,
): AIExplanationPayload {
  const parsed: unknown = JSON.parse(json)

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('bundle' in parsed) ||
    !('serializedAt' in parsed)
  ) {
    throw new Error('Invalid AIExplanationPayload shape')
  }

  const candidate = parsed as AIExplanationPayload

  if (!isExplanationBundle(candidate.bundle)) {
    throw new Error('Invalid ExplanationBundle in AIExplanationPayload')
  }

  return candidate
}
