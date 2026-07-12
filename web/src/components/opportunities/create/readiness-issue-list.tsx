import type { ReadinessUserMessage } from '@/presentation/readiness'
import { sanitizeReadinessDisplayText } from '@/presentation/readiness'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type ReadinessIssueListProps = {
  required: readonly ReadinessUserMessage[]
  recommended: readonly ReadinessUserMessage[]
  completed: readonly ReadinessUserMessage[]
  onIssueClick: (issue: ReadinessUserMessage) => void
}

function IssueGroup({
  title,
  items,
  onIssueClick,
  tone,
}: {
  title: string
  items: readonly ReadinessUserMessage[]
  onIssueClick: (issue: ReadinessUserMessage) => void
  tone: 'required' | 'recommended' | 'completed'
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className={cn(pmTypography.label)}>{title}</h3>
      <ul className="space-y-1.5">
        {items.map((issue, index) => (
          <li key={`${issue.title}-${index}`}>
            <button
              type="button"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-start transition-colors',
                'hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tone === 'required' && 'border-danger/30',
                tone === 'recommended' && 'border-warning/30',
                tone === 'completed' && 'border-success/30 opacity-80',
              )}
              onClick={() => onIssueClick(issue)}
              disabled={tone === 'completed'}
            >
              <span className={cn(pmTypography.bodySm, 'font-medium')}>
                {sanitizeReadinessDisplayText(issue.title)}
              </span>
              {issue.description ? (
                <span
                  className={cn(
                    pmTypography.caption,
                    'mt-0.5 block text-muted-foreground',
                  )}
                >
                  {sanitizeReadinessDisplayText(issue.description)}
                  {issue.impactPercent
                    ? ` · May improve readiness by up to ${issue.impactPercent}%`
                    : ''}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReadinessIssueList({
  required,
  recommended,
  completed,
  onIssueClick,
}: ReadinessIssueListProps) {
  return (
    <div data-slot="readiness-issue-list" className="space-y-5">
      <IssueGroup
        title="Required Before Publishing"
        items={required}
        onIssueClick={onIssueClick}
        tone="required"
      />
      <IssueGroup
        title="Recommended Improvements"
        items={recommended}
        onIssueClick={onIssueClick}
        tone="recommended"
      />
      <IssueGroup
        title="Completed"
        items={completed}
        onIssueClick={onIssueClick}
        tone="completed"
      />
    </div>
  )
}
