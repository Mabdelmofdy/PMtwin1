import { Link } from 'react-router-dom'
import type { PartyDocument } from '@/types/party-document.ts'
import { resolveDocumentsProgress } from '@/components/vetting/vetting-documents-provider.ts'
import { PmButton } from '@/components/ui/pm-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

export function VettingDocumentsProgressCard({
  documents,
  className,
}: {
  readonly documents: readonly PartyDocument[]
  readonly className?: string
}) {
  const progress = resolveDocumentsProgress(documents)

  return (
    <PmContentCard title="Documents" className={className}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={pmTypography.bodySm}>
            <span className="text-muted-foreground">Required documents</span>
          </p>
          <p className={cn(pmTypography.stat, 'text-lg')}>
            {progress.required.completed} / {progress.required.total}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={pmTypography.bodySm}>
            <span className="text-muted-foreground">Optional documents</span>
          </p>
          <p className={cn(pmTypography.stat, 'text-lg')}>
            {progress.optional.completed} / {progress.optional.total}
          </p>
        </div>
        <PmButton asChild size="sm" variant="outline" className="w-fit">
          <Link to="/party-documents">Manage documents</Link>
        </PmButton>
      </div>
    </PmContentCard>
  )
}
