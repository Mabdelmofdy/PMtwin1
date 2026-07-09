import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmSurface } from '@/components/ui/pm-surface'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

const STEPS = [
  'Admin will review your account.',
  'If changes are required, you will receive a notification.',
  'Once approved, you can create and publish opportunities.',
] as const

export function PendingVettingWhatHappensNext({ className }: { readonly className?: string }) {
  return (
    <PmContentCard title="What happens next?" className={className}>
      <ul className="space-y-2" role="list">
        {STEPS.map((step) => (
          <li key={step}>
            <PmSurface variant="muted" className="p-3.5">
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>{step}</p>
            </PmSurface>
          </li>
        ))}
      </ul>
    </PmContentCard>
  )
}
