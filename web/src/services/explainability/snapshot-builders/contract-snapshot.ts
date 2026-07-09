import type {
  ContractExplainabilitySnapshot,
  ContractStatus,
} from '@pm-twin/explainability'
import type { ContractDetailReadModel } from '@/lib/contract-detail-read-model.ts'

const CONTRACT_STATUSES = new Set<ContractStatus>([
  'draft',
  'pending_signature',
  'active',
  'completed',
  'terminated',
])

function normalizeContractStatus(status: string): ContractStatus {
  const key = status.trim().toLowerCase()
  return CONTRACT_STATUSES.has(key as ContractStatus)
    ? (key as ContractStatus)
    : 'draft'
}

export type ContractSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

export function buildContractExplainabilitySnapshot(
  model: ContractDetailReadModel,
  options?: ContractSnapshotOptions,
): ContractExplainabilitySnapshot {
  const signedCount = model.parties.filter(
    (party) => party.signatureState === 'signed',
  ).length

  return {
    entityId: model.contractId,
    status: normalizeContractStatus(model.canonicalStatus),
    parties: model.parties.map((party) => ({
      userId: party.userId,
      role: party.role,
      signedAt: party.signedAt,
    })),
    partiesSigned: signedCount,
    totalParties: model.parties.length,
    canSign: model.canSign,
    canComplete: model.canComplete,
    canTerminate: model.canTerminate,
    milestones: model.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      dueDate: milestone.dueDate,
      status: milestone.status,
    })),
    createdAt: model.contract.createdAt,
    evaluatedAt: options?.evaluatedAt ?? model.contract.updatedAt ?? model.contract.createdAt,
    locale: options?.locale ?? 'en-SA',
  }
}
