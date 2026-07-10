import { PmFormSection } from '@/components/forms/pm-form-index'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { StructuredSkill } from '@/domain/opportunity-creation'
import { skillNames } from '@/domain/opportunity-creation'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'

/**
 * Advisory Matching Insight — presentation only.
 * Uses taxonomy + readiness signals. Does not call or change the matching engine.
 */
export function MatchingInsightPanel({
  intent,
  skills,
  location,
  exchangeMode,
  topology,
  relationshipLabel = 'Company → Company',
  collaborationLabel,
  readinessScore,
  missingRequired,
  onFixFactor,
}: {
  intent: 'need' | 'offer' | ''
  skills: StructuredSkill[]
  location: string
  exchangeMode: string
  topology?: string
  relationshipLabel?: string
  collaborationLabel?: string
  readinessScore: number
  missingRequired: readonly string[]
  onFixFactor?: (stepId: WizardStepId) => void
}) {
  const names = skillNames(skills)
  const quality =
    readinessScore >= 80 ? 'High' : readinessScore >= 50 ? 'Medium' : 'Developing'
  const confidence =
    readinessScore >= 80 ? 'High' : readinessScore >= 50 ? 'Medium' : 'Low'

  const estimatedPartners = Math.max(
    5,
    Math.round(readinessScore * 1.1) + names.length * 3 + (location ? 8 : 0),
  )

  const topFactors: string[] = []
  if (location) topFactors.push('Location')
  if (names.length > 0) topFactors.push('Skills')
  if (exchangeMode) topFactors.push('Exchange')
  if (topology) topFactors.push('Match type')
  if (topFactors.length === 0) topFactors.push('Complete more fields for stronger factors')

  const missingFactors =
    missingRequired.length > 0
      ? missingRequired.slice(0, 5)
      : names.length === 0
        ? ['Skills not yet specified']
        : !location
          ? ['Location not yet specified']
          : []

  return (
    <PmFormSection
      title="Matching preview"
      description="Advisory estimates only — does not run or change the matching engine. Shows who you are likely to attract after publish."
    >
      <div className="space-y-3 text-sm" data-testid="matching-insight-panel">
        <div className="flex flex-wrap gap-2">
          <PmBadge tone="info" size="sm">
            Estimated quality: {quality}
          </PmBadge>
          <PmBadge tone="muted" size="sm">
            Confidence: {confidence}
          </PmBadge>
          <PmBadge tone="muted" size="sm">
            Compatible partners ≈ {estimatedPartners}
          </PmBadge>
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Expected match type</dt>
            <dd className="font-medium">
              {topology
                ? formatFrameworkMatchTypeLabel(topology)
                : 'Derived after model selection'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expected relationship</dt>
            <dd className="font-medium">{relationshipLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expected collaboration</dt>
            <dd className="font-medium">
              {collaborationLabel || (intent === 'need' ? 'Need seeking Offer' : intent === 'offer' ? 'Offer seeking Need' : '—')}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Exchange mode</dt>
            <dd className="font-medium">
              {exchangeMode
                ? formatCollaborationExchangeMode(exchangeMode)
                : '—'}
            </dd>
          </div>
        </dl>

        <div>
          <p className={cn(pmTypography.label)}>Top matching factors</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {topFactors.map((factor) => (
              <PmBadge key={factor} tone="muted" size="sm">
                {factor}
              </PmBadge>
            ))}
          </ul>
        </div>

        {missingFactors.length > 0 ? (
          <div>
            <p className={cn(pmTypography.label)}>Why match quality may be limited</p>
            <ul className="mt-1 list-disc ps-5 text-muted-foreground">
              {missingFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
            {onFixFactor ? (
              <PmButton
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() =>
                  onFixFactor(names.length === 0 ? 'attributes' : 'timeline')
                }
              >
                Fix matching inputs →
              </PmButton>
            ) : null}
          </div>
        ) : (
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
            Draft looks discoverable — save, then publish from the detail page when ready.
          </p>
        )}
      </div>
    </PmFormSection>
  )
}
