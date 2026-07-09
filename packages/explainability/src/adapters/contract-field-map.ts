import {
  CONTRACT_REASON_CODES,
  type ContractReasonCode,
} from '../reason-codes/contract.ts'
import type { ContractStatus } from './contract-types.ts'

export const CONTRACT_ADAPTER_SCORE_WEIGHTS = {
  signatures: 35,
  activation: 25,
  execution: 25,
  milestones: 15,
} as const

export const CONTRACT_BREAKDOWN_LABELS = {
  signatures: 'Party signatures',
  activation: 'Activation readiness',
  execution: 'Execution progress',
  milestones: 'Milestone delivery',
} as const

export type ContractBreakdownDimension =
  keyof typeof CONTRACT_ADAPTER_SCORE_WEIGHTS

export const CONTRACT_STATUS_TO_REASON_CODE: Readonly<
  Record<ContractStatus, ContractReasonCode>
> = {
  draft: CONTRACT_REASON_CODES.STATUS_DRAFT,
  pending_signature: CONTRACT_REASON_CODES.STATUS_PENDING_SIGNATURE,
  active: CONTRACT_REASON_CODES.STATUS_ACTIVE,
  completed: CONTRACT_REASON_CODES.STATUS_COMPLETED,
  terminated: CONTRACT_REASON_CODES.STATUS_TERMINATED,
}

export function contractStatusToReasonCode(
  status: ContractStatus,
): ContractReasonCode {
  return CONTRACT_STATUS_TO_REASON_CODE[status]
}

export function contractStatusToHref(
  entityId: string,
  section?: 'sign' | 'milestones' | 'complete' | 'terminate',
): string {
  const base = `/contracts/${entityId}`
  if (section) return `${base}/${section}`
  return base
}

export function resolvePartiesSigned(
  partiesSigned: number | undefined,
  parties: readonly { signedAt?: string | null }[] | undefined,
): number {
  if (partiesSigned != null) return partiesSigned
  if (!parties) return 0
  return parties.filter((party) => Boolean(party.signedAt)).length
}

export function resolveTotalParties(
  totalParties: number | undefined,
  parties: readonly unknown[] | undefined,
): number {
  if (totalParties != null) return totalParties
  return parties?.length ?? 0
}

export function hasUnsignedParties(
  partiesSigned: number,
  totalParties: number,
): boolean {
  return totalParties > 0 && partiesSigned < totalParties
}

export function hasBlockedMilestones(
  milestones: readonly { status?: string }[] | undefined,
): boolean {
  if (!milestones?.length) return false
  return milestones.some(
    (milestone) =>
      milestone.status === 'blocked'
      || milestone.status === 'overdue'
      || milestone.status === 'failed',
  )
}
