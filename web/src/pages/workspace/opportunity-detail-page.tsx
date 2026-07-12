import { useParams } from 'react-router-dom'
import { OpportunityDetailsShell } from '@/components/opportunity/details/opportunity-details-shell.tsx'
import { PmEmptyState, PmButton, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { Link } from 'react-router-dom'

/**
 * Opportunity Details Experience 4.0 — thin route entry.
 * Presentation lives in components/opportunity/details/*; data via opportunity-details read model.
 */
export function OpportunityDetailPage() {
  const { id } = useParams()

  if (!id) {
    return (
      <PmPage
        header={<PmPageHeader title="Opportunity not found" description="Missing opportunity id." />}
      >
        <PmEmptyState
          title="Opportunity not found"
          description="This link is missing an opportunity id."
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/opportunities">Back to opportunities</Link>
            </PmButton>
          }
        />
      </PmPage>
    )
  }

  return <OpportunityDetailsShell opportunityId={id} />
}
