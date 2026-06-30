/**
 * PM Form system — barrel export.
 * Phase 5B: infrastructure only; no page migrations.
 */

// Core form
export {
  PmForm,
  PmFormBody,
  PmFormHeader,
  type PmFormProps,
} from '@/components/forms/pm-form'
export {
  PmFormSection,
  PmFormSectionBody,
  type PmFormSectionProps,
} from '@/components/forms/pm-form-section'
export { PmFormField, type PmFormFieldProps } from '@/components/forms/pm-form-field'
export {
  PmFormGrid,
  PmFormGridItem,
  type PmFormGridProps,
  type PmFormGridItemProps,
} from '@/components/forms/pm-form-grid'
export {
  PmFormActions,
  PmFormActionsSlot,
  type PmFormActionsProps,
} from '@/components/forms/pm-form-actions'
export { PmFormHelp, type PmFormHelpProps } from '@/components/forms/pm-form-help'
export { PmFormError, type PmFormErrorProps } from '@/components/forms/pm-form-error'
export { PmFormSummary, type PmFormSummaryProps } from '@/components/forms/pm-form-summary'

// Wizard
export {
  PmFormWizard,
  PmFormWizardStep,
  PmFormWizardFooter,
  type PmFormWizardProps,
} from '@/components/forms/pm-form-wizard'
export {
  PmFormStepper,
  PmFormStepperSlot,
  type PmFormStepperProps,
  type PmFormStepperStep,
} from '@/components/forms/pm-form-stepper'

// Read-only
export {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormReadonlyCopySlot,
  type PmFormReadonlyFieldProps,
  type PmFormReadonlySectionProps,
} from '@/components/forms/pm-form-readonly'

// Helpers
export {
  type PmFormGridColumns,
  pmFormGridOptions,
  resolveFormGridClasses,
  resolveFormFieldSpan,
  resolveFormStackClasses,
  resolveFormWizardLayoutClasses,
} from '@/components/forms/pm-form-layout'
export {
  type PmFieldValidationState,
  resolveFieldValidationState,
  shouldShowFieldError,
  shouldShowFieldSuccess,
  resolveFieldDescribedByIds,
  resolveFieldInputStateClasses,
  collectFormErrors,
  shouldShowFormSummary,
} from '@/components/forms/pm-form-validation'
export {
  type PmFormMode,
  type PmFormStateFlags,
  type PmWizardStepStatus,
  type PmWizardStepMeta,
  resolveFormMode,
  isFormInteractive,
  isFormSubmitting,
  resolveWizardStepStatus,
  resolveWizardProgress,
  resolveActiveStepIndex,
  isWizardStepNavigable,
} from '@/components/forms/pm-form-state'
export {
  resolveReadonlyValue,
  isReadonlyValueEmpty,
  groupReadonlyFields,
} from '@/components/forms/pm-form-readonly-helpers'
