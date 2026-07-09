import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { PmFormSection } from '@/components/forms/pm-form-index'
import type { Opportunity } from '@/types/domain.ts'

/**
 * Marketplace Preview MUST reuse the existing Marketplace Card component tree.
 * No duplicate card implementation.
 */
export function MarketplacePreviewPanel({
  opportunity,
}: {
  opportunity: Opportunity | Record<string, unknown>
}) {
  const cardOpportunity = {
    id: String((opportunity as Opportunity).id ?? 'preview-draft'),
    title: String((opportunity as Opportunity).title || 'Untitled draft'),
    status: (opportunity as Opportunity).status ?? 'draft',
    ...opportunity,
  } as Opportunity

  return (
    <PmFormSection
      title="Marketplace preview"
      description="Rendered with the same Marketplace Card used in browse."
    >
      <div data-testid="marketplace-preview-panel" className="max-w-md">
        <OpportunityCard
          opportunity={cardOpportunity}
          showActions={false}
          showOwnerInsights
        />
      </div>
    </PmFormSection>
  )
}
