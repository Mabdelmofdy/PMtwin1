import type { ReadinessActionTarget } from './readiness-presentation-types.ts'
import type { ReadinessUserMessage } from './readiness-presentation-types.ts'
import { wizardStepHref } from '@/components/opportunity/wizard/wizard-steps.ts'

export function readinessIssueToActionTarget(
  issue: ReadinessUserMessage,
): ReadinessActionTarget {
  return {
    stepId: issue.stepId,
    sectionId: issue.sectionId,
    fieldId: issue.fieldId,
    hash: issue.sectionId ? `section-${issue.sectionId}` : undefined,
  }
}

export function readinessIssueHref(
  issue: ReadinessUserMessage,
  opportunityId?: string,
): string {
  const target = readinessIssueToActionTarget(issue)
  return wizardStepHref(opportunityId, target.stepId, target.hash)
}

/** Focus and briefly highlight a field after navigation. */
export function focusReadinessTarget(target: ReadinessActionTarget): void {
  if (typeof document === 'undefined') return
  const candidates = [
    target.fieldId ? `[data-field-id="${target.fieldId}"]` : null,
    target.fieldId ? `#${target.fieldId}` : null,
    target.sectionId ? `#section-${target.sectionId}` : null,
    target.hash ? `#${target.hash.replace(/^#/, '')}` : null,
  ].filter(Boolean) as string[]

  for (const selector of candidates) {
    const el = document.querySelector(selector)
    if (!(el instanceof HTMLElement)) continue
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
    const focusable =
      el.matches('input, textarea, select, button, [tabindex]')
        ? el
        : el.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')
    focusable?.focus()
    window.setTimeout(() => {
      el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
    }, 2400)
    return
  }
}
