import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmSplitLayout } from '@/components/layout/pm-split-layout'
import { PmFormField } from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import {
  AttachmentsUploadControl,
  type AttachmentFileMeta,
} from '@/components/shared/attachments-upload-control.tsx'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

export type MessagesViewProps = {
  activeThreadId?: string
}

/** Messages master-detail layout — mock threads preserved from legacy page. */
export function MessagesView({ activeThreadId }: MessagesViewProps) {
  const activeThread = MOCK_MESSAGE_THREADS.find((t) => t.id === activeThreadId)
  const [draftAttachments, setDraftAttachments] = useState<readonly AttachmentFileMeta[]>([])

  return (
    <PmSplitLayout
      listClassName={activeThreadId ? 'max-lg:hidden' : undefined}
      detailClassName={!activeThreadId ? 'max-lg:hidden' : undefined}
      listLabel="Conversations"
      detailLabel="Message thread"
      list={
        <PmContentCard title="Conversations" className="h-full">
          <div className="divide-y divide-border/60">
            {MOCK_MESSAGE_THREADS.map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                aria-current={activeThreadId === thread.id ? 'page' : undefined}
                className={cn(
                  'flex items-start justify-between gap-2 px-2 py-3 transition-colors hover:bg-surface-muted/50',
                  activeThreadId === thread.id && 'bg-surface-muted/60',
                )}
              >
                <div className="min-w-0">
                  <p className={cn(pmTypography.bodySm, 'font-medium')}>{thread.name}</p>
                  <p className={cn('truncate', pmTypography.caption, 'text-muted-foreground')}>{thread.preview}</p>
                </div>
                {thread.unread > 0 ? (
                  <PmBadge tone="primary" size="sm">
                    {thread.unread}
                  </PmBadge>
                ) : null}
              </Link>
            ))}
          </div>
        </PmContentCard>
      }
      detail={
        <PmContentCard
          title={activeThread?.name ?? 'Conversation'}
          description={activeThread ? 'Direct message thread' : undefined}
          className="flex h-full min-h-[20rem] flex-col"
        >
          {activeThread ? (
            <>
              <Link
                to="/messages"
                className={cn(
                  'mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden',
                )}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
                Back to inbox
              </Link>
              <div className="flex-1 space-y-3 overflow-y-auto py-2">
                <PmEmptyState
                  title="Messaging preview"
                  description="Sample thread selected. Live message history will appear here once inbox is connected to your workspace."
                  size="compact"
                />
              </div>
              <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={cn('flex items-center gap-2', pmTypography.caption, 'text-muted-foreground')}>
                    <Paperclip className="size-3.5" aria-hidden />
                    Attachments
                    {draftAttachments.length > 0
                      ? ` (${draftAttachments.map((file) => file.fileName).join(', ')})`
                      : ''}
                  </div>
                  <AttachmentsUploadControl
                    label="Upload"
                    aria-label="Upload message attachments"
                    onFilesSelected={(files) => {
                      setDraftAttachments((current) => {
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
                      toast.success(
                        files.length === 1 ? 'Attachment added' : 'Attachments added',
                      )
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <PmFormField id="message-compose" label="Message" className="min-w-0 flex-1">
                    <Input id="message-compose" placeholder="Write a message…" />
                  </PmFormField>
                  <PmButton className="w-full sm:w-auto sm:self-end">Send</PmButton>
                </div>
              </div>
            </>
          ) : (
            <PmEmptyState
              title="Select a conversation"
              description="Messaging is in preview — choose a sample thread to see how conversations will appear once connected."
              size="compact"
            />
          )}
        </PmContentCard>
      }
    />
  )
}
