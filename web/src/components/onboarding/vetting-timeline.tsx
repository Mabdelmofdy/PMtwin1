type VettingTimelineProps = {
  readonly status: string
}

const STEPS = [
  { id: 'registered', label: 'Registered' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'clarification_requested', label: 'Changes Requested' },
  { id: 'resubmitted', label: 'Resubmitted' },
  { id: 'active', label: 'Approved' },
] as const

function resolveStepIndex(status: string): number {
  if (status === 'clarification_requested') return 2
  if (status === 'active') return 4
  if (status === 'rejected') return 2
  return 1
}

export function VettingTimeline({ status }: VettingTimelineProps) {
  const activeIndex = resolveStepIndex(status)

  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label="Vetting timeline">
      {STEPS.map((step, index) => (
        <li
          key={step.id}
          className={`rounded border px-3 py-2 text-xs ${
            index <= activeIndex ? 'border-primary bg-primary/5 text-foreground' : 'border-muted text-muted-foreground'
          }`}
        >
          {step.label}
        </li>
      ))}
    </ol>
  )
}
