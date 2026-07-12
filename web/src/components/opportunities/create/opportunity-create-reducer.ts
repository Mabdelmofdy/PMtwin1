import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  syncDraftExchangeFromCommercialStructure,
} from '@/components/opportunity/wizard/draft-model.ts'
import {
  normalizeWizardStepId,
  type WizardStepId,
} from '@/components/opportunity/wizard/wizard-steps.ts'

export type OpportunityCreateState = {
  draft: OpportunityDraft
  activeStepId: WizardStepId
  readinessDrawerOpen: boolean
  highlightFieldId?: string
}

export type OpportunityCreateAction =
  | { type: 'SET_DRAFT'; draft: OpportunityDraft }
  | { type: 'PATCH_DRAFT'; patch: Partial<OpportunityDraft> }
  | { type: 'SET_STEP'; stepId: string }
  | { type: 'OPEN_READINESS' }
  | { type: 'CLOSE_READINESS' }
  | { type: 'SET_HIGHLIGHT'; fieldId?: string }

export function opportunityCreateReducer(
  state: OpportunityCreateState,
  action: OpportunityCreateAction,
): OpportunityCreateState {
  switch (action.type) {
    case 'SET_DRAFT':
      return { ...state, draft: action.draft }
    case 'PATCH_DRAFT': {
      let next: OpportunityDraft = { ...state.draft, ...action.patch }
      if (action.patch.commercialStructure) {
        next = syncDraftExchangeFromCommercialStructure(next)
      }
      return { ...state, draft: next }
    }
    case 'SET_STEP':
      return { ...state, activeStepId: normalizeWizardStepId(action.stepId) }
    case 'OPEN_READINESS':
      return { ...state, readinessDrawerOpen: true }
    case 'CLOSE_READINESS':
      return { ...state, readinessDrawerOpen: false }
    case 'SET_HIGHLIGHT':
      return { ...state, highlightFieldId: action.fieldId }
    default:
      return state
  }
}
