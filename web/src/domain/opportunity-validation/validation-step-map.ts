import type { ValidationIssue } from '@pm-twin/validation'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import {
  FIELD_TO_WIZARD_STEP,
  normalizeWizardStepId,
} from '@/components/opportunity/wizard/wizard-steps.ts'

/** Map validation field paths / groups to wizard step IDs (Creation 3.0). */
const GROUP_TO_STEP: Readonly<Record<string, WizardStepId>> = {
  field: 'opportunity',
  dates: 'scope_work',
  budget: 'commercial',
  commercial: 'commercial',
  skills: 'scope_work',
  workPackages: 'scope_work',
  capacity: 'scope_work',
  documents: 'scope_work',
  location: 'opportunity',
  duplicates: 'opportunity',
  needOffer: 'opportunity',
  exchange: 'commercial',
  publish: 'review',
}

const PATH_PREFIX_TO_STEP: ReadonlyArray<readonly [string, WizardStepId]> = [
  ['title', 'opportunity'],
  ['description', 'opportunity'],
  ['structuredSkills', 'scope_work'],
  ['workPackages', 'scope_work'],
  ['capacity', 'scope_work'],
  ['budget', 'commercial'],
  ['exchangeData', 'commercial'],
  ['commercialStructure', 'commercial'],
  ['startDate', 'opportunity'],
  ['endDate', 'opportunity'],
  ['deliveryDeadline', 'opportunity'],
  ['tenderDeadline', 'opportunity'],
  ['availabilityEndDate', 'opportunity'],
  ['duration', 'scope_work'],
  ['location', 'opportunity'],
  ['country', 'opportunity'],
  ['city', 'opportunity'],
  ['workMode', 'scope_work'],
  ['mainCollaborationModel', 'collaboration'],
  ['subModelType', 'collaboration'],
  ['exchangeMode', 'commercial'],
  ['intent', 'opportunity'],
]

/**
 * Resolve wizard step for a validation issue (human UX navigation).
 * Never exposes VAL_* codes.
 */
export function resolveStepForValidationIssue(
  issue: ValidationIssue,
): WizardStepId {
  const paths = [
    ...(issue.fieldPaths ?? []),
    String(
      (issue as { path?: string; field?: string }).path
        ?? (issue as { field?: string }).field
        ?? '',
    ),
  ].filter(Boolean)

  for (const path of paths) {
    for (const [prefix, step] of PATH_PREFIX_TO_STEP) {
      if (
        path === prefix ||
        path.startsWith(`${prefix}.`) ||
        path.startsWith(`${prefix}[`)
      ) {
        return step
      }
    }
    if (FIELD_TO_WIZARD_STEP[path]) return FIELD_TO_WIZARD_STEP[path]!
  }

  const group = (issue as { group?: string }).group
  if (group && GROUP_TO_STEP[group]) return GROUP_TO_STEP[group]!

  return normalizeWizardStepId('review')
}
