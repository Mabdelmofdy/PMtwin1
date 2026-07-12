import {
  Archive,
  Copy,
  FileJson,
  Link2,
  MoreHorizontal,
  Pencil,
  Printer,
  Share2,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OpportunityDetailsReadModel } from '@/lib/opportunity-details'
import { buildExecutiveHeaderViewModel } from '@/lib/opportunity-details'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'

export type OpportunityDetailsActionHandlers = {
  readonly onPublish?: () => void
  readonly onDeleteDraft?: () => void
  readonly onArchive?: () => void
  readonly onClose?: () => void
  readonly onDuplicate?: (asTemplate: boolean) => void
  readonly onExportJson?: () => void
  readonly onExportPdf?: () => void
  readonly onPrint?: () => void
  readonly onShare?: () => void
  readonly onCopyLink?: () => void
}

function trackAction(actionId: string, opportunityId: string) {
  trackOcxEvent('opportunity_action_clicked', { actionId, opportunityId })
}

export function OpportunityExecutiveHeader({
  model,
  handlers,
}: {
  readonly model: OpportunityDetailsReadModel
  readonly handlers: OpportunityDetailsActionHandlers
}) {
  const header = buildExecutiveHeaderViewModel(model)
  const { capabilities, opportunity } = model
  const chips = [
    header.postIntent,
    header.mainModel,
    header.subModel,
    header.commercialLabel,
    header.matchingTopology,
    header.location,
    header.readinessLabel,
    header.workPackageCount != null && header.workPackageCount > 0
      ? `${header.workPackageCount} Work Packages`
      : null,
    header.matchCountLabel,
    header.updatedLabel,
  ].filter(Boolean) as string[]

  return (
    <div data-slot="opportunity-executive-header" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {header.postIntent ? (
              <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {header.postIntent}
              </span>
            ) : null}
            {header.status ? <OpportunityStatusBadge status={header.status} /> : null}
            {header.visibilityStatus ? (
              <PmBadge tone="muted">{header.visibilityStatus}</PmBadge>
            ) : null}
          </div>
          <h1 className={cn(pmTypography.h1, 'text-balance text-foreground')}>
            {header.title}
          </h1>
          {header.ownerLabel ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              Owned by · {header.ownerLabel}
              {header.createdByLabel && header.createdByLabel !== header.ownerLabel
                ? ` · Created by · ${header.createdByLabel}`
                : null}
            </p>
          ) : header.createdByLabel ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              Created by · {header.createdByLabel}
            </p>
          ) : null}
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Opportunity summary">
              {chips.map((chip) => (
                <PmBadge key={chip} tone="muted">
                  {chip}
                </PmBadge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {capabilities.canPublish ? (
            <PmButton
              size="sm"
              onClick={() => {
                trackAction('publish', opportunity.id)
                handlers.onPublish?.()
              }}
            >
              Publish
            </PmButton>
          ) : null}
          {capabilities.canEdit ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link
                to={`/opportunities/${opportunity.id}/edit`}
                onClick={() => trackAction('edit', opportunity.id)}
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Link>
            </PmButton>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PmButton size="sm" variant="outline" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </PmButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {capabilities.canDuplicateDraft ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('duplicate_draft', opportunity.id)
                    handlers.onDuplicate?.(false)
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate as Draft
                </DropdownMenuItem>
              ) : null}
              {capabilities.canDuplicateTemplate ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('duplicate_template', opportunity.id)
                    handlers.onDuplicate?.(true)
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate as Template
                </DropdownMenuItem>
              ) : null}
              {capabilities.canCopyLink ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('copy_link', opportunity.id)
                    handlers.onCopyLink?.()
                  }}
                >
                  <Link2 className="size-3.5" />
                  Copy Link
                </DropdownMenuItem>
              ) : null}
              {capabilities.canShare ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('share', opportunity.id)
                    handlers.onShare?.()
                  }}
                >
                  <Share2 className="size-3.5" />
                  Share
                </DropdownMenuItem>
              ) : null}
              {capabilities.canPrint ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('print', opportunity.id)
                    handlers.onPrint?.()
                  }}
                >
                  <Printer className="size-3.5" />
                  Print
                </DropdownMenuItem>
              ) : null}
              {capabilities.canExportPdf ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('export_pdf', opportunity.id)
                    handlers.onExportPdf?.()
                  }}
                >
                  <Printer className="size-3.5" />
                  Export PDF
                </DropdownMenuItem>
              ) : null}
              {capabilities.canExportJson ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('export_json', opportunity.id)
                    handlers.onExportJson?.()
                  }}
                >
                  <FileJson className="size-3.5" />
                  Export JSON
                </DropdownMenuItem>
              ) : null}
              {(capabilities.canArchive || capabilities.canDeleteDraft || capabilities.canClose) && (
                <DropdownMenuSeparator />
              )}
              {capabilities.canDeleteDraft ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    trackAction('delete_draft', opportunity.id)
                    handlers.onDeleteDraft?.()
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete Draft
                </DropdownMenuItem>
              ) : null}
              {capabilities.canClose ? (
                <DropdownMenuItem
                  onSelect={() => {
                    trackAction('close', opportunity.id)
                    handlers.onClose?.()
                  }}
                >
                  <Archive className="size-3.5" />
                  Close Opportunity
                </DropdownMenuItem>
              ) : null}
              {capabilities.canArchive ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    trackAction('archive', opportunity.id)
                    handlers.onArchive?.()
                  }}
                >
                  <Archive className="size-3.5" />
                  Archive
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
