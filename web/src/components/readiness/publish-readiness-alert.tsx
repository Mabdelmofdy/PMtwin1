import type { ExplanationBundle } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import { ExplanationBlockers } from '@/components/explainability/explanation-blockers.tsx'
import { PUBLISH_READINESS_BLOCKED_MESSAGE } from '@/domain/publish-readiness/index.ts'

export function PublishReadinessAlert({
  message = PUBLISH_READINESS_BLOCKED_MESSAGE,
  details,
  bundles,
  className,
}: {
  message?: string
  details?: readonly string[]
  bundles?: readonly ExplanationBundle[]
  className?: string
}) {
  const profileRequired = extractSection(details, 'Profile required:')
  const profileRecommended = extractSection(details, 'Profile recommended:')
  const opportunityRequired = extractSection(details, 'Opportunity required:')
  const opportunityRecommended = extractSection(details, 'Opportunity recommended:')

  const profileMissing =
    profileRequired.length === 0 && profileRecommended.length === 0
      ? extractSection(details, 'Profile missing:')
      : []
  const opportunityMissing =
    opportunityRequired.length === 0 && opportunityRecommended.length === 0
      ? extractSection(details, 'Opportunity missing:')
      : []

  const hasBundleBlockers = (bundles?.length ?? 0) > 0

  return (
    <PmSurface
      variant="muted"
      role="alert"
      className={cn(
        'border border-warning/30 bg-warning/10 px-4 py-3 text-warning',
        className,
      )}
    >
      <p className={cn(pmTypography.label, 'text-warning')}>{message}</p>

      {hasBundleBlockers
        ? bundles?.map((bundle) => (
            <ExplanationBlockers
              key={`${bundle.engine}-${bundle.entityId}`}
              bundle={bundle}
              className="mt-3 text-foreground"
              heading={`${bundle.engine} blockers`}
            />
          ))
        : null}

      <MissingList heading="Profile required:" items={profileRequired} />
      <MissingList heading="Profile recommended:" items={profileRecommended} />
      <MissingList heading="Opportunity required:" items={opportunityRequired} />
      <MissingList heading="Opportunity recommended:" items={opportunityRecommended} />
      <MissingList heading="Profile missing:" items={profileMissing} />
      <MissingList heading="Opportunity missing:" items={opportunityMissing} />
    </PmSurface>
  )
}

function MissingList({
  heading,
  items,
}: {
  heading: string
  items: readonly string[]
}) {
  if (items.length === 0) return null
  return (
    <div className="mt-3">
      <p className={cn(pmTypography.caption, 'font-medium')}>{heading}</p>
      <ul className={cn('mt-1 list-disc space-y-1 ps-5', pmTypography.bodySm)}>
        {items.map((item) => (
          <li key={`${heading}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function extractSection(
  details: readonly string[] | undefined,
  heading: string,
): string[] {
  if (!details?.length) return []
  const start = details.indexOf(heading)
  if (start === -1) return []

  const items: string[] = []
  for (let index = start + 1; index < details.length; index += 1) {
    const line = details[index]
    if (!line?.startsWith('- ')) break
    if (line.endsWith(':')) break
    items.push(line.slice(2))
  }
  return items
}
