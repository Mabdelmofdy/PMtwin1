import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import { MarketplacePreviewPanel } from '@/components/opportunity/wizard/marketplace-preview-panel.tsx'
import { OpportunitySection } from '../shared/opportunity-section.tsx'
import { PmButton } from '@/components/ui/pm-index'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { toast } from 'sonner'

export function MarketplaceWorkspace() {
  const { model } = useOpportunityDetailsContext()

  useEffect(() => {
    trackOcxEvent('opportunity_marketplace_preview_viewed', {
      opportunityId: model.opportunity.id,
    })
  }, [model.opportunity.id])

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Marketplace Preview">
      <OpportunitySection
        title="Marketplace Preview"
        description="How this opportunity appears using the public marketplace representation."
      >
        <div className="mx-auto max-w-md">
          <MarketplacePreviewPanel opportunity={model.opportunity} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/opportunities">Open Marketplace View</Link>
          </PmButton>
          <PmButton
            size="sm"
            variant="outline"
            onClick={async () => {
              const url = `${window.location.origin}/opportunities/${model.opportunity.id}`
              try {
                await navigator.clipboard.writeText(url)
                toast.success('Public link copied')
              } catch {
                toast.message(url)
              }
            }}
          >
            Copy Public Link
          </PmButton>
        </div>
      </OpportunitySection>
    </div>
  )
}
