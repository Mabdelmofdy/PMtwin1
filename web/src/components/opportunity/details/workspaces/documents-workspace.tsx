import { useState } from 'react'
import { toast } from 'sonner'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import type { OpportunityDetailsDocumentItem } from '@/lib/opportunity-details'
import {
  AttachmentsUploadControl,
  type AttachmentFileMeta,
} from '@/components/shared/attachments-upload-control.tsx'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function DocumentsWorkspace() {
  const { model } = useOpportunityDetailsContext()
  const [sessionAttachments, setSessionAttachments] = useState<readonly AttachmentFileMeta[]>([])

  if (model.workspaceVisibility.documents === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Restricted documents"
        description="Documents are available to authorized viewers only."
      />
    )
  }

  function handleUpload(files: readonly AttachmentFileMeta[]): void {
    setSessionAttachments((current) => {
      const seen = new Set(current.map((item) => item.fileName.toLowerCase()))
      const merged = [...current]
      for (const file of files) {
        const key = file.fileName.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(file)
      }
      return merged
    })
    toast.success(files.length === 1 ? 'Attachment uploaded' : 'Attachments uploaded')
  }

  const byCategory = new Map<string, OpportunityDetailsDocumentItem[]>()
  for (const doc of model.documents) {
    const list = byCategory.get(doc.category) ?? []
    list.push(doc)
    byCategory.set(doc.category, list)
  }

  const existingFileNames = [
    ...model.documents.map((doc) => doc.name),
    ...sessionAttachments.map((item) => item.fileName),
  ]

  const uploadControl = (
    <AttachmentsUploadControl
      label="Upload"
      aria-label="Upload opportunity attachments"
      existingFileNames={existingFileNames}
      onFilesSelected={handleUpload}
    />
  )

  const hasStoredDocs = model.documents.length > 0
  const hasSessionDocs = sessionAttachments.length > 0

  if (!hasStoredDocs && !hasSessionDocs) {
    return (
      <div className="space-y-6" role="tabpanel" aria-label="Documents">
        <OpportunitySection title="Attachments">
          <OpportunityEmptyState
            title="No documents"
            description="No attachments or document requirements are recorded for this opportunity."
            action={uploadControl}
          />
        </OpportunitySection>
      </div>
    )
  }

  const categories = [...byCategory.entries()]
  if (!byCategory.has('Attachments')) {
    categories.push(['Attachments', []])
  }

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Documents">
      {categories.map(([category, docs]) => {
        const isAttachments = category === 'Attachments'
        const attachmentItems = isAttachments ? sessionAttachments : []
        const isEmpty = docs.length === 0 && attachmentItems.length === 0

        return (
          <OpportunitySection key={category} title={category}>
            {isAttachments ? (
              <div className="mb-3 flex justify-end">{uploadControl}</div>
            ) : null}
            {isEmpty ? (
              <OpportunityEmptyState
                title={`No ${category.toLowerCase()} yet`}
                description="Upload files to attach document references to this opportunity."
              />
            ) : (
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
                {attachmentItems.map((attachment) => (
                  <li
                    key={`session-${attachment.fileName}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
                  >
                    <div>
                      <p className={cn(pmTypography.label)}>{attachment.fileName}</p>
                      <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                        Session upload
                      </p>
                    </div>
                    <PmBadge tone="muted">local</PmBadge>
                  </li>
                ))}
              </ul>
            )}
          </OpportunitySection>
        )
      })}
    </div>
  )
}
