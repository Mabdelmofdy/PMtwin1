import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import type { OpportunityDetailsDocumentItem } from '@/lib/opportunity-details'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function DocumentsWorkspace() {
  const { model } = useOpportunityDetailsContext()

  if (model.workspaceVisibility.documents === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Restricted documents"
        description="Documents are available to authorized viewers only."
      />
    )
  }

  if (model.documents.length === 0) {
    return (
      <OpportunityEmptyState
        title="No documents"
        description="No attachments or document requirements are recorded for this opportunity."
      />
    )
  }

  const byCategory = new Map<string, OpportunityDetailsDocumentItem[]>()
  for (const doc of model.documents) {
    const list = byCategory.get(doc.category) ?? []
    list.push(doc)
    byCategory.set(doc.category, list)
  }

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Documents">
      {[...byCategory.entries()].map(([category, docs]) => (
        <OpportunitySection key={category} title={category}>
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <div>
                  <p className={cn(pmTypography.label)}>{doc.name}</p>
                  {doc.relatedWorkPackageTitle ? (
                    <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                      Related: {doc.relatedWorkPackageTitle}
                    </p>
                  ) : null}
                </div>
                <PmBadge tone="muted">{doc.visibility}</PmBadge>
              </li>
            ))}
          </ul>
        </OpportunitySection>
      ))}
    </div>
  )
}
