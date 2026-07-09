import {
  AGREEMENT_REASON_CODES,
  type AgreementReasonCode,
} from './agreement.ts'
import {
  ANALYTICS_REASON_CODES,
  type AnalyticsReasonCode,
} from './analytics.ts'
import {
  COMMERCIAL_REASON_CODES,
  type CommercialReasonCode,
} from './commercial.ts'
import {
  CONTRACT_REASON_CODES,
  type ContractReasonCode,
} from './contract.ts'
import {
  DASHBOARD_REASON_CODES,
  type DashboardReasonCode,
} from './dashboard.ts'
import {
  DOCUMENT_REASON_CODES,
  type DocumentReasonCode,
} from './document.ts'
import {
  MATCH_REASON_CODES,
  type MatchReasonCode,
} from './match.ts'
import {
  NEGOTIATION_REASON_CODES,
  type NegotiationReasonCode,
} from './negotiation.ts'
import {
  PROFILE_REASON_CODES,
  type ProfileReasonCode,
} from './profile.ts'
import {
  READINESS_REASON_CODES,
  type ReadinessReasonCode,
} from './readiness.ts'
import {
  KNOWLEDGE_REASON_CODES,
  type KnowledgeReasonCode,
} from './knowledge.ts'
import {
  VETTING_REASON_CODES,
  type VettingReasonCode,
} from './vetting.ts'

export {
  AGREEMENT_REASON_CODES,
  ANALYTICS_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_REASON_CODES,
  DASHBOARD_REASON_CODES,
  DOCUMENT_REASON_CODES,
  KNOWLEDGE_REASON_CODES,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
  PROFILE_REASON_CODES,
  READINESS_REASON_CODES,
  VETTING_REASON_CODES,
}

export type {
  AgreementReasonCode,
  AnalyticsReasonCode,
  CommercialReasonCode,
  ContractReasonCode,
  DashboardReasonCode,
  DocumentReasonCode,
  KnowledgeReasonCode,
  MatchReasonCode,
  NegotiationReasonCode,
  ProfileReasonCode,
  ReadinessReasonCode,
  VettingReasonCode,
}

export const REASON_CODE_PREFIX = {
  PROFILE: 'PROFILE_',
  DOCUMENT: 'DOCUMENT_',
  READINESS: 'READINESS_',
  MATCH: 'MATCH_',
  NEGOTIATION: 'NEGOTIATION_',
  COMMERCIAL: 'COMMERCIAL_',
  CONTRACT: 'CONTRACT_',
  VETTING: 'VETTING_',
  DASHBOARD: 'DASHBOARD_',
  ANALYTICS: 'ANALYTICS_',
  AGREEMENT: 'AGREEMENT_',
  KNOWLEDGE: 'KNOWLEDGE_',
} as const

export type ReasonCodePrefix =
  (typeof REASON_CODE_PREFIX)[keyof typeof REASON_CODE_PREFIX]

export type ReasonCode =
  | ProfileReasonCode
  | DocumentReasonCode
  | ReadinessReasonCode
  | MatchReasonCode
  | NegotiationReasonCode
  | CommercialReasonCode
  | ContractReasonCode
  | VettingReasonCode
  | DashboardReasonCode
  | AnalyticsReasonCode
  | AgreementReasonCode
  | KnowledgeReasonCode

const STATIC_REASON_CODES: readonly ReasonCode[] = [
  ...Object.values(PROFILE_REASON_CODES),
  ...Object.values(DOCUMENT_REASON_CODES),
  ...Object.values(READINESS_REASON_CODES),
  ...Object.values(MATCH_REASON_CODES),
  ...Object.values(NEGOTIATION_REASON_CODES),
  ...Object.values(COMMERCIAL_REASON_CODES),
  ...Object.values(CONTRACT_REASON_CODES),
  ...Object.values(VETTING_REASON_CODES),
  ...Object.values(DASHBOARD_REASON_CODES),
  ...Object.values(ANALYTICS_REASON_CODES),
  ...Object.values(AGREEMENT_REASON_CODES),
  ...Object.values(KNOWLEDGE_REASON_CODES),
] as const

export const ALL_REASON_CODES: readonly ReasonCode[] = STATIC_REASON_CODES

const PREFIXES: readonly ReasonCodePrefix[] = Object.values(REASON_CODE_PREFIX)

export function isReasonCode(value: unknown): value is ReasonCode {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }

  if (STATIC_REASON_CODES.includes(value as ReasonCode)) {
    return true
  }

  return PREFIXES.some((prefix) => value.startsWith(prefix))
}

export function assertReasonCode(value: unknown): ReasonCode {
  if (!isReasonCode(value)) {
    throw new Error(`Invalid reason code: ${String(value)}`)
  }

  return value
}
