import type { ReasonCode } from '../reason-codes/index.ts'

export type KnowledgeBridgeRequest = {
  readonly reasonCode: ReasonCode
  readonly entityId?: string
  readonly locale?: string
  readonly context?: Readonly<Record<string, unknown>>
}

export type KnowledgeAnswer = {
  readonly title: string
  readonly body: string
  readonly href?: string
  readonly reasonCode: ReasonCode
}

export interface KnowledgeBridge {
  resolveKnowledgeAnswer(
    request: KnowledgeBridgeRequest,
  ): KnowledgeAnswer | null

  resolveEducationalContent(
    request: KnowledgeBridgeRequest,
  ): KnowledgeAnswer | null

  resolveComplianceHints(
    request: KnowledgeBridgeRequest,
  ): readonly KnowledgeAnswer[]

  resolveRiskHints(
    request: KnowledgeBridgeRequest,
  ): readonly KnowledgeAnswer[]

  resolveLifecycleHints(
    request: KnowledgeBridgeRequest,
  ): readonly KnowledgeAnswer[]
}
