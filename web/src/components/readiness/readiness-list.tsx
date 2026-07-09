import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { READINESS_READY_MESSAGE } from '@/components/readiness/readiness-display.ts'

export function ReadinessList({
  missingRequired,
  missingRecommended,
  showReadyMessage,
  className,
}: {
  missingRequired: readonly string[]
  missingRecommended: readonly string[]
  showReadyMessage: boolean
  className?: string
}) {
  if (showReadyMessage) {
    return (
      <p className={cn(pmTypography.bodySm, 'font-medium text-success', className)}>
        {READINESS_READY_MESSAGE}
      </p>
    )
  }

  return (
    <div className={cn('space-y-4', pmTypography.bodySm, className)}>
      {missingRequired.length > 0 ? (
        <div>
          <p className="font-medium text-foreground">Missing Required:</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground" aria-label="Missing required fields">
            {missingRequired.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {missingRecommended.length > 0 ? (
        <div>
          <p className="font-medium text-foreground">Missing Recommended:</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground" aria-label="Missing recommended fields">
            {missingRecommended.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {missingRequired.length === 0 && missingRecommended.length === 0 ? (
        <p className="text-muted-foreground">No missing fields detected.</p>
      ) : null}
    </div>
  )
}
