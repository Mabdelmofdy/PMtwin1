import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import { CommercialComponentsBuilder } from '../commercial/commercial-components-builder.tsx'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type CommercialStructureStepProps = {
  draft: OpportunityDraft
  onChange: (patch: Partial<OpportunityDraft>) => void
}

export function CommercialStructureStep({
  draft,
  onChange,
}: CommercialStructureStepProps) {
  return (
    <div data-slot="commercial-structure-step" className="space-y-6">
      <div>
        <h2 className={cn(pmTypography.h2)}>Commercial Structure</h2>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Configure one or more value exchange components. Hybrid is derived automatically.
        </p>
      </div>
      <div id="section-exchange-components">
        <CommercialComponentsBuilder
          draft={draft}
          structure={draft.commercialStructure}
          onChange={(commercialStructure) => onChange({ commercialStructure })}
        />
      </div>
    </div>
  )
}
