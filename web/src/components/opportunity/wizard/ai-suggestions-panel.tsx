/**
 * Deterministic AI Suggestions — Explainability + Knowledge Registry only.
 * Never calls external AI / LLM / runtime prompts.
 */
import { PmFormSection } from '@/components/forms/pm-form-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { getReadinessReasonCopy } from '@/lib/readiness-reason-copy.ts'
import type { ExplanationBundle } from '@pm-twin/explainability'

export function AiSuggestionsPanel({
  bundle,
  subModelType,
  registryHints,
}: {
  bundle?: ExplanationBundle | null
  subModelType?: string
  /** Optional Knowledge Registry field labels still missing. */
  registryHints?: readonly string[]
}) {
  const suggestions: { title: string; detail: string }[] = []

  for (const blocker of bundle?.blockers ?? []) {
    const copy = getReadinessReasonCopy(blocker.reasonCode)
    suggestions.push({
      title: copy.label,
      detail: blocker.resolutionHint || copy.why,
    })
  }

  for (const rec of (bundle?.recommendations ?? []).slice(0, 4)) {
    const label = 'label' in rec ? String(rec.label) : 'Improve readiness'
    const detail =
      'reasonCode' in rec
        ? getReadinessReasonCopy(String(rec.reasonCode)).why
        : 'Complete recommended fields from explainability.'
    if (!suggestions.some((s) => s.title === label)) {
      suggestions.push({ title: label, detail })
    }
  }

  if (subModelType) {
    suggestions.push({
      title: 'Sub-model attributes',
      detail: `Complete Knowledge Registry fields for ${subModelType.replace(/_/g, ' ')}.`,
    })
  }

  for (const hint of registryHints ?? []) {
    suggestions.push({
      title: hint,
      detail: 'Required or recommended by the Knowledge Registry dynamic form.',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Looking good',
      detail: 'No deterministic gaps from explainability or registry metadata.',
    })
  }

  return (
    <PmFormSection
      title="AI suggestions"
      description="Deterministic guidance from Explainability and Knowledge Registry only — no external AI."
    >
      <ul className="space-y-2 text-sm" data-testid="ai-suggestions-panel">
        {suggestions.slice(0, 6).map((item) => (
          <li
            key={`${item.title}-${item.detail}`}
            className="rounded-md border border-border/50 bg-surface-muted/30 px-3 py-2"
          >
            <p className="font-medium">{item.title}</p>
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              {item.detail}
            </p>
          </li>
        ))}
      </ul>
    </PmFormSection>
  )
}
