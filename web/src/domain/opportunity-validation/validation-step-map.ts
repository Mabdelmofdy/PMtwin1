import type { ValidationIssue } from '@pm-twin/validation'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { FIELD_TO_WIZARD_STEP } from '@/components/opportunity/wizard/wizard-steps.ts'

/** Map validation field paths / groups to wizard step IDs. */
const GROUP_TO_STEP: Readonly<Record<string, WizardStepId>> = {
  field: 'basic',
  dates: 'timeline',
  budget: 'commercial',
  commercial: 'commercial',
  skills: 'attributes',
  workPackages: 'attributes',
  capacity: 'attributes',
  documents: 'basic',
  location: 'timeline',
  duplicates: 'basic',
  needOffer: 'type',
  exchange: 'collaboration',
  publish: 'review',
}

const PATH_PREFIX_TO_STEP: ReadonlyArray<readonly [string, WizardStepId]> = [
  ['title', 'basic'],
  ['description', 'basic'],
  ['structuredSkills', 'attributes'],
  ['workPackages', 'attributes'],
  ['capacity', 'attributes'],
  ['budget', 'commercial'],
  ['exchangeData', 'commercial'],
  ['startDate', 'timeline'],
  ['endDate', 'timeline'],
  ['deliveryDeadline', 'timeline'],
  ['duration', 'timeline'],
  ['location', 'timeline'],
  ['country', 'timeline'],
  ['city', 'timeline'],
  ['workMode', 'timeline'],
  ['mainCollaborationModel', 'collaboration'],
  ['subModelType', 'collaboration'],
  ['exchangeMode', 'collaboration'],
  ['intent', 'type'],
]

/**
 * Resolve wizard step for a validation issue (human UX navigation).
 * Never exposes VAL_* codes.
 */
export function resolveStepForValidationIssue(
  issue: ValidationIssue,
): WizardStepId {
  if (issue.group && GROUP_TO_STEP[issue.group]) {
    return GROUP_TO_STEP[issue.group]!
  }
  for (const path of issue.fieldPaths) {
    const readinessKey = path.split('.')[0] ?? path
    const fromFieldMap = FIELD_TO_WIZARD_STEP[readinessKey]
    if (fromFieldMap) return fromFieldMap
    for (const [prefix, step] of PATH_PREFIX_TO_STEP) {
      if (path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`)) {
        return step
      }
    }
  }
  return 'review'
}

export function humanValidationMessages(
  issues: readonly ValidationIssue[],
): readonly string[] {
  return issues
    .map((i) => i.message)
    .filter((m) => typeof m === 'string' && !m.includes('VAL_'))
}
