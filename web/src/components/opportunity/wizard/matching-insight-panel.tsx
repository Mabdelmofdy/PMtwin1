import { PmFormSection } from '@/components/forms/pm-form-index'
import { PmBadge } from '@/components/ui/pm-badge'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { StructuredSkill } from '@/domain/opportunity-creation'
import { skillNames } from '@/domain/opportunity-creation'

/**
 * Advisory Matching Insight — presentation only.
 * Uses taxonomy + readiness signals. Does not call or change the matching engine.
 */
export function MatchingInsightPanel({
  intent,
  skills,
  location,
  exchangeMode,
  readinessScore,
  missingRequired,
}: {
  intent: 'need' | 'offer' | ''
  skills: StructuredSkill[]
  location: string
  exchangeMode: string
  readinessScore: number
  missingRequired: readonly string[]
}) {
  const names = skillNames(skills)
  const quality =
    readinessScore >= 80 ? 'High' : readinessScore >= 50 ? 'Medium' : 'Developing'

  const companyHint =
    intent === 'need'
      ? 'Companies offering matching capacity and delivery models'
      : 'Companies seeking the services you provide'
  const professionalHint =
    intent === 'offer'
      ? 'Professionals and consultants who may engage your offer'
      : 'Professionals with the required skills'
  const consortiumHint =
    exchangeMode === 'equity' || exchangeMode === 'profit_sharing'
      ? 'Consortium / JV partners for shared-value models'
      : 'Optional consortium partners for multi-party delivery'

  const missingFactors =
    missingRequired.length > 0
      ? missingRequired.slice(0, 5)
      : names.length === 0
        ? ['Skills not yet specified']
        : !location
          ? ['Location not yet specified']
          : []

  const recommendations: string[] = []
  if (names.length === 0) {
    recommendations.push('Add structured skills to improve discoverability.')
  }
  if (!location) {
    recommendations.push('Add a location or service area.')
  }
  if (readinessScore < 80) {
    recommendations.push('Raise readiness to 80%+ before publishing.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Draft looks discoverable — review commercial terms and publish when ready.')
  }

  return (
    <PmFormSection
      title="Matching insight"
      description="Advisory estimates only — does not run or change the matching engine."
    >
      <div className="space-y-3 text-sm" data-testid="matching-insight-panel">
        <div className="flex flex-wrap gap-2">
          <PmBadge tone="info" size="sm">
            Expected quality: {quality}
          </PmBadge>
          <PmBadge tone="muted" size="sm">
            Skills: {names.length || 'none'}
          </PmBadge>
        </div>
        <dl className="grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Potential companies</dt>
            <dd className="font-medium">{companyHint}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Potential professionals</dt>
            <dd className="font-medium">{professionalHint}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Potential consortiums</dt>
            <dd className="font-medium">{consortiumHint}</dd>
          </div>
        </dl>
        {missingFactors.length > 0 ? (
          <div>
            <p className={cn(pmTypography.label)}>Top missing match factors</p>
            <ul className="mt-1 list-disc ps-5 text-muted-foreground">
              {missingFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <p className={cn(pmTypography.label)}>Recommendations to improve discoverability</p>
          <ul className="mt-1 list-disc ps-5 text-muted-foreground">
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </PmFormSection>
  )
}
