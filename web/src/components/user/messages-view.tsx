import { Link } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmSplitLayout } from '@/components/layout/pm-split-layout'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type MessagesViewProps = {
  activeThreadId?: string
}

/** Messages master-detail layout — mock threads preserved from legacy page. */
export function MessagesView({ activeThreadId }: MessagesViewProps) {
  const activeThread = MOCK_MESSAGE_THREADS.find((t) => t.id === activeThreadId)

  return (
    <PmSplitLayout
      listLabel="Conversations"
      detailLabel="Message thread"
      list={
        <PmContentCard title="Conversations" className="h-full border-0 shadow-none">
          <div className="divide-y divide-border/60">
            {MOCK_MESSAGE_THREADS.map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className={cn(
                  'flex items-start justify-between gap-2 px-2 py-3 transition-colors hover:bg-surface-muted/50',
                  activeThreadId === thread.id && 'bg-surface-muted/60',
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium">{thread.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{thread.preview}</p>
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
              <div className="flex-1 space-y-3 overflow-y-auto py-2">
                <div className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
                  Thread {activeThread.id} — message history placeholder
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Typing indicator placeholder…
                </p>
              </div>
              <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Paperclip className="size-3.5" aria-hidden />
                  Attachments placeholder
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Write a message…" className="flex-1" />
                  <PmButton>Send</PmButton>
                </div>
              </div>
            </>
          ) : (
            <PmEmptyState
              title="Select a conversation"
              description="Choose a thread from the list to view messages."
              size="compact"
            />
          )}
        </PmContentCard>
      }
    />
  )
}
