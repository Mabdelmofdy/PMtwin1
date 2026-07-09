import {
  getComplianceMetadata,
  getDynamicFields,
  getEducationalContent,
  getLifecycleMetadata,
  getRiskProfile,
} from '@pm-twin/collaboration-models'
import type { ReasonCode } from '../reason-codes/index.ts'
import { KNOWLEDGE_REASON_CODES } from '../reason-codes/knowledge.ts'
import {
  isComplianceReasonCode,
  isLifecycleReasonCode,
  isReadinessFieldReasonCode,
  isRiskReasonCode,
  reasonCodeToFieldId,
} from './knowledge-reason-map.ts'
import type {
  KnowledgeAnswer,
  KnowledgeBridge,
  KnowledgeBridgeRequest,
} from './knowledge-bridge.ts'

function resolveSubModelKey(request: KnowledgeBridgeRequest): string | undefined {
  const key = request.context?.subModelKey
  return typeof key === 'string' && key.length > 0 ? key : undefined
}

function makeAnswer(
  title: string,
  body: string,
  reasonCode: ReasonCode,
  href?: string,
): KnowledgeAnswer {
  return { title, body, href, reasonCode }
}

function resolveFieldGuidance(
  subModelKey: string,
  reasonCode: ReasonCode,
): KnowledgeAnswer | null {
  const fieldId = reasonCodeToFieldId(reasonCode)
  if (!fieldId) return null

  const fields = getDynamicFields(subModelKey)
  const field = fields?.find((entry) => entry.id === fieldId)
  if (!field) return null

  const body = [field.description, field.helpText].filter(Boolean).join(' — ')
  if (!body) return null

  return makeAnswer(
    field.label,
    body,
    KNOWLEDGE_REASON_CODES.FIELD_GUIDANCE,
    `#field-${fieldId}`,
  )
}

function createKnowledgeBridgeImpl(): KnowledgeBridge {
  return {
    resolveKnowledgeAnswer(request: KnowledgeBridgeRequest): KnowledgeAnswer | null {
      const subModelKey = resolveSubModelKey(request)
      const { reasonCode } = request

      if (subModelKey && isReadinessFieldReasonCode(reasonCode)) {
        const fieldGuidance = resolveFieldGuidance(subModelKey, reasonCode)
        if (fieldGuidance) return fieldGuidance
      }

      if (subModelKey && isComplianceReasonCode(reasonCode)) {
        const hints = this.resolveComplianceHints(request)
        return hints[0] ?? null
      }

      if (subModelKey && isRiskReasonCode(reasonCode)) {
        const hints = this.resolveRiskHints(request)
        return hints[0] ?? null
      }

      if (subModelKey && isLifecycleReasonCode(reasonCode)) {
        const hints = this.resolveLifecycleHints(request)
        return hints[0] ?? null
      }

      return this.resolveEducationalContent(request)
    },

    resolveEducationalContent(request: KnowledgeBridgeRequest): KnowledgeAnswer | null {
      const subModelKey = resolveSubModelKey(request)
      if (!subModelKey) return null

      const education = getEducationalContent(subModelKey)
      if (!education) return null

      return makeAnswer(
        'What is this collaboration model?',
        [education.whatIsIt, education.whyUseIt].filter(Boolean).join(' '),
        KNOWLEDGE_REASON_CODES.EDUCATIONAL_HINT,
      )
    },

    resolveComplianceHints(request: KnowledgeBridgeRequest): readonly KnowledgeAnswer[] {
      const subModelKey = resolveSubModelKey(request)
      if (!subModelKey) return []

      const compliance = getComplianceMetadata(subModelKey)
      if (!compliance) return []

      const hints: KnowledgeAnswer[] = []

      if (compliance.requiresLegalReview) {
        hints.push(
          makeAnswer(
            'Legal review required',
            'This collaboration model may require legal review before contracting.',
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
          ),
        )
      }

      if (compliance.requiresFinancialReview) {
        hints.push(
          makeAnswer(
            'Financial review required',
            'Financial controls or treasury review may be required for this model.',
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
          ),
        )
      }

      if (compliance.requiresKyc) {
        hints.push(
          makeAnswer(
            'KYC required',
            'Know-your-customer checks are expected for counterparties in this model.',
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
          ),
        )
      }

      if (compliance.requiresBoardApproval) {
        hints.push(
          makeAnswer(
            'Board approval required',
            'Board or executive approval may be required before execution.',
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
          ),
        )
      }

      if (hints.length === 0) {
        hints.push(
          makeAnswer(
            'Standard compliance',
            'No elevated legal, financial, KYC, or board gates are defined for this model.',
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
          ),
        )
      }

      return hints
    },

    resolveRiskHints(request: KnowledgeBridgeRequest): readonly KnowledgeAnswer[] {
      const subModelKey = resolveSubModelKey(request)
      if (!subModelKey) return []

      const riskProfile = getRiskProfile(subModelKey)
      if (!riskProfile) return []

      const hints: KnowledgeAnswer[] = [
        makeAnswer(
          `Default risk: ${riskProfile.defaultRiskLevel}`,
          riskProfile.riskFactors.join('; ') || 'No specific risk factors catalogued.',
          KNOWLEDGE_REASON_CODES.RISK_HINT,
        ),
      ]

      for (const mitigation of riskProfile.mitigationHints) {
        hints.push(
          makeAnswer(
            'Mitigation',
            mitigation,
            KNOWLEDGE_REASON_CODES.RISK_HINT,
          ),
        )
      }

      const education = getEducationalContent(subModelKey)
      for (const risk of education?.risks ?? []) {
        hints.push(
          makeAnswer(
            'Typical risk',
            risk,
            KNOWLEDGE_REASON_CODES.RISK_HINT,
          ),
        )
      }

      return hints
    },

    resolveLifecycleHints(request: KnowledgeBridgeRequest): readonly KnowledgeAnswer[] {
      const subModelKey = resolveSubModelKey(request)
      if (!subModelKey) return []

      const lifecycle = getLifecycleMetadata(subModelKey)
      if (!lifecycle) return []

      const hints: KnowledgeAnswer[] = [
        makeAnswer(
          'Typical lifecycle',
          lifecycle.typicalStages.join(' → '),
          KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT,
        ),
      ]

      if (lifecycle.recommendedNextStage) {
        hints.push(
          makeAnswer(
            'Recommended next stage',
            lifecycle.recommendedNextStage,
            KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT,
          ),
        )
      }

      if (lifecycle.terminalStages.length > 0) {
        hints.push(
          makeAnswer(
            'Terminal stages',
            lifecycle.terminalStages.join(', '),
            KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT,
          ),
        )
      }

      return hints
    },
  }
}

export function createKnowledgeBridge(): KnowledgeBridge {
  return createKnowledgeBridgeImpl()
}
