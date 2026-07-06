import { getSubModel } from '../registry/index.ts'
import type { MatchTopology } from '../types.ts'

/** Values that must never appear in subModelType — they are matching topology. */
/** Matching topology values — never valid subModelType (consortium is a valid sub-model key). */
export const MATCH_TOPOLOGY_SUBMODEL_ALIASES = new Set<string>([
  'one_way',
  'two_way',
  'circular',
  'oneway',
  'twoway',
  'two-way',
  'one-way',
])

/** Legacy seed / POC aliases → canonical subModelType. */
export const LEGACY_SUB_MODEL_ALIASES: Readonly<Record<string, string>> = {
  project: 'task_based',
  shared_resources: 'resource_sharing',
  resource_pooling: 'resource_sharing',
  hiring_resource: 'professional_hiring',
  retainer: 'task_based',
}

export function isMatchTopologyValue(value: string | undefined): value is MatchTopology {
  if (!value) return false
  const normalized = value.toLowerCase().replace(/-/g, '_')
  return MATCH_TOPOLOGY_SUBMODEL_ALIASES.has(normalized)
}

export function normalizeSubModelType(
  raw: string | undefined,
  hints?: { readonly modelType?: string; readonly mainCollaborationModel?: string },
): string | undefined {
  if (!raw) return undefined
  const normalized = raw.toLowerCase().replace(/-/g, '_').trim()
  if (isMatchTopologyValue(normalized)) {
    return undefined
  }
  if (LEGACY_SUB_MODEL_ALIASES[normalized]) {
    return LEGACY_SUB_MODEL_ALIASES[normalized]
  }
  if (normalized === 'joint_venture') {
    if (hints?.modelType === 'strategic_partnership') return 'strategic_jv'
    return 'project_jv'
  }
  return normalized
}

export function inferMainCollaborationModel(input: {
  readonly mainCollaborationModel?: string
  readonly modelType?: string
  readonly subModelType?: string
}): string | undefined {
  if (input.mainCollaborationModel) {
    return input.mainCollaborationModel
  }
  const sub = input.subModelType
    ? normalizeSubModelType(input.subModelType, input)
    : undefined
  if (sub) {
    return getSubModel(sub)?.mainCollaborationModel
  }
  const modelType = input.modelType
  if (modelType === 'hiring') return 'hiring'
  if (modelType === 'resource_pooling') return 'resource_sharing'
  if (modelType === 'competition') return 'cash_subcontracting'
  if (modelType === 'strategic_partnership') return 'service_exchange'
  if (modelType === 'project_based') return 'cash_subcontracting'
  return undefined
}
