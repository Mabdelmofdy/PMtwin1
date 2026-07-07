import type { Command } from '../types.ts'

/**
 * Generic decision-routing command. aggregateId is the governed entity id.
 * This is intentionally domain-agnostic and configuration-driven.
 */
export interface RouteDecisionCommand extends Command {
  readonly commandType: 'RouteDecision'
  readonly matrixId: string
  readonly entityType: string
}

/** Commercial agreement specific alias used by workflow orchestrator actions. */
export interface RouteContractDecisionCommand extends Command {
  readonly commandType: 'RouteContractDecision'
  readonly commercialAgreementId: string
}

export interface RecordDecisionApprovalCommand extends Command {
  readonly commandType: 'RecordDecisionApproval'
  readonly decisionId: string
  readonly actorId: string
  readonly approve: boolean
  readonly comment?: string
}

export interface DelegateDecisionApprovalCommand extends Command {
  readonly commandType: 'DelegateDecisionApproval'
  readonly decisionId: string
  readonly fromApproverId: string
  readonly toApproverId: string
}

export interface EscalateDecisionCommand extends Command {
  readonly commandType: 'EscalateDecision'
  readonly decisionId: string
  readonly reason?: string
}
