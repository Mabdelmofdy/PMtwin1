import { getSubModel } from '../registry/index.ts'
import type {
  AiMetadata,
  AnalyticsMetadata,
  CapabilityDependencies,
  CommercialMetadata,
  ComplianceMetadata,
  ConfidentialityMetadata,
  DocumentsMetadata,
  DynamicFieldDefinition,
  EducationalContent,
  LifecycleMetadata,
  MatchingMetricDefinition,
  ReadinessDefinition,
  RiskProfile,
  SubModelKnowledgeMetadata,
  WorkflowMetadata,
} from './types.ts'

export function getDynamicFields(subModelKey: string): readonly DynamicFieldDefinition[] | undefined {
  const sub = getSubModel(subModelKey)
  if (!sub) return undefined
  return [...sub.knowledge.dynamicForm.fields].sort((a, b) => a.displayOrder - b.displayOrder)
}

export function getReadinessDefinition(subModelKey: string): ReadinessDefinition | undefined {
  return getSubModel(subModelKey)?.knowledge.readiness
}

export function getMatchingMetrics(subModelKey: string): readonly MatchingMetricDefinition[] | undefined {
  return getSubModel(subModelKey)?.knowledge.matching.metrics
}

export function getEducationalContent(subModelKey: string): EducationalContent | undefined {
  return getSubModel(subModelKey)?.knowledge.education
}

export function getWorkflowMetadata(subModelKey: string): WorkflowMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.workflow
}

export function getAnalyticsMetadata(subModelKey: string): AnalyticsMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.analytics
}

export function getAiMetadata(subModelKey: string): AiMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.ai
}

export function getCapabilityDependencies(subModelKey: string): CapabilityDependencies | undefined {
  return getSubModel(subModelKey)?.knowledge.dependencies
}

export function getLifecycleMetadata(subModelKey: string): LifecycleMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.lifecycle
}

export function getDocumentsMetadata(subModelKey: string): DocumentsMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.documents
}

export function getConfidentialityMetadata(subModelKey: string): ConfidentialityMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.confidentiality
}

export function getRiskProfile(subModelKey: string): RiskProfile | undefined {
  return getSubModel(subModelKey)?.knowledge.riskProfile
}

export function getComplianceMetadata(subModelKey: string): ComplianceMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.compliance
}

export function getCommercialMetadata(subModelKey: string): CommercialMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.commercial
}

export function getKnowledgeMetadata(subModelKey: string): SubModelKnowledgeMetadata | undefined {
  return getSubModel(subModelKey)?.knowledge.metadata
}
