import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import { PUBLISH_READINESS_BLOCKED_MESSAGE } from '@/domain/publish-readiness/index.ts'

export function PublishReadinessAlert({
  message = PUBLISH_READINESS_BLOCKED_MESSAGE,
  details,
  className,
}: {
  message?: string
  details?: readonly string[]
  className?: string
}) {
  const profileLines = extractSection(details, 'Profile missing:')
  const opportunityLines = extractSection(details, 'Opportunity missing:')

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
      {profileLines.length > 0 ? (
        <div className="mt-3">
          <p className={cn(pmTypography.caption, 'font-medium')}>Profile missing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {profileLines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {opportunityLines.length > 0 ? (
        <div className="mt-3">
          <p className={cn(pmTypography.caption, 'font-medium')}>Opportunity missing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {opportunityLines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </PmSurface>
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
