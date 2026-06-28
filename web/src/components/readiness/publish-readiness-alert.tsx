import { cn } from '@/lib/utils'
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
    <div
      className={cn(
        'rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100',
        className,
      )}
      role="alert"
    >
      <p className="font-medium">{message}</p>
      {profileLines.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium">Profile missing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {profileLines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {opportunityLines.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium">Opportunity missing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {opportunityLines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
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
