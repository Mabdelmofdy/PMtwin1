import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  APP_STAGE_TO_STATUS,
  APPLICATION_STATUS_LABELS,
  OPP_STAGE_TO_STATUS,
  bucketApplicationsForPipeline,
  bucketOpportunitiesForPipeline,
  type Application,
} from '@/lib/applications'
import { dataStore, type Opportunity } from '@/lib/data-store'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { StatusBadge } from '@/components/shared/page-primitives'
import { cn } from '@/lib/utils'

const OPP_STAGES = [
  { key: 'draft', label: 'Draft', hint: 'Not visible until published.' },
  { key: 'published', label: 'Published', hint: 'Visible to the network.' },
  { key: 'in_progress', label: 'In progress', hint: 'Negotiation, contract, or execution.' },
  { key: 'closed', label: 'Closed', hint: 'Completed or cancelled.' },
] as const

const APP_STAGES = [
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'in_negotiation', label: 'In negotiation' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected / withdrawn' },
] as const

type BoardMode = 'opportunities' | 'applications'

function KanbanCard({
  id,
  title,
  subtitle,
  status,
  href,
  dragType,
  disabled,
}: {
  id: string
  title: string
  subtitle?: string
  status?: string
  href: string
  dragType: 'opportunity' | 'application'
  disabled?: boolean
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ id, type: dragType }),
        )
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        disabled ? 'opacity-60' : 'cursor-grab active:cursor-grabbing',
      )}
    >
      <Link to={href} className="block cursor-pointer" draggable={false}>
        <p className="line-clamp-2 text-sm font-medium">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {status ? <StatusBadge status={status} className="mt-2" /> : null}
      </Link>
    </div>
  )
}

function StageSidebar({
  stages,
  selected,
  counts,
  onSelect,
  onDrop,
  dropPrefix: _dropPrefix,
  disabled,
}: {
  stages: ReadonlyArray<{ key: string; label: string; hint?: string }>
  selected: string
  counts: Record<string, number>
  onSelect: (key: string) => void
  onDrop: (stageKey: string, payload: { id: string; type: string }) => void
  dropPrefix: 'opp' | 'app'
  disabled?: boolean
}) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Status
      </p>
      <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {stages.map((stage) => (
          <button
            key={stage.key}
            type="button"
            data-stage={stage.key}
            title={stage.hint}
            disabled={disabled}
            onClick={() => onSelect(stage.key)}
            onDragOver={(e) => {
              if (disabled) return
              e.preventDefault()
              setDragOver(stage.key)
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(null)
              if (disabled) return
              try {
                const raw =
                  e.dataTransfer.getData('application/json') ||
                  e.dataTransfer.getData('text/plain')
                const payload = JSON.parse(raw) as { id: string; type: string }
                onDrop(stage.key, payload)
              } catch {
                toast.error('Could not move card')
              }
            }}
            className={cn(
              'flex min-w-[9rem] cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              selected === stage.key
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border/60 hover:bg-muted/50',
              dragOver === stage.key && 'border-primary bg-primary/5',
            )}
          >
            <span>{stage.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
              {counts[stage.key] ?? 0}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export function PipelineBoard({ mode }: { mode: BoardMode }) {
  const version = useDataStoreVersion()
  const { user, isPendingApproval } = useAuth()
  const [oppStage, setOppStage] = useState('draft')
  const [appStage, setAppStage] = useState('pending')
  const [intentFilter, setIntentFilter] = useState<'' | 'request' | 'offer'>('')

  const opportunities = useMemo(
    () => dataStore.getOpportunities(),
    [version],
  )
  const applications = useMemo(() => {
    return dataStore.getApplications().map((app) => ({
      ...app,
      opportunity: dataStore.getOpportunityById(app.opportunityId),
    }))
  }, [version])

  const userId = user?.id ?? ''

  const oppBuckets = useMemo(
    () =>
      bucketOpportunitiesForPipeline(opportunities, userId, intentFilter),
    [opportunities, userId, intentFilter],
  )

  const userApps = useMemo(
    () => applications.filter((a) => a.applicantId === userId),
    [applications, userId],
  )

  const appBuckets = useMemo(
    () => bucketApplicationsForPipeline(userApps, intentFilter),
    [userApps, intentFilter],
  )

  const handleOppDrop = (stageKey: string, payload: { id: string; type: string }) => {
    if (payload.type !== 'opportunity') return
    const status = OPP_STAGE_TO_STATUS[stageKey]
    if (!status) return
    dataStore.updateOpportunity(payload.id, { status })
    toast.success('Opportunity moved')
  }

  const handleAppDrop = (stageKey: string, payload: { id: string; type: string }) => {
    if (payload.type !== 'application') return
    const status = APP_STAGE_TO_STATUS[stageKey]
    if (!status) return
    dataStore.updateApplication(payload.id, { status })
    toast.success('Application moved')
  }

  if (mode === 'opportunities') {
    const items = (oppBuckets[oppStage as keyof typeof oppBuckets] ?? []) as Opportunity[]
    const counts = Object.fromEntries(
      OPP_STAGES.map((s) => [s.key, oppBuckets[s.key as keyof typeof oppBuckets]?.length ?? 0]),
    )

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['', 'request', 'offer'] as const).map((intent) => (
            <button
              key={intent || 'all'}
              type="button"
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
                intentFilter === intent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setIntentFilter(intent)}
            >
              {intent === '' ? 'All' : intent === 'request' ? 'Need' : 'Offer'}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <StageSidebar
            stages={OPP_STAGES}
            selected={oppStage}
            counts={counts}
            onSelect={setOppStage}
            onDrop={handleOppDrop}
            dropPrefix="opp"
            disabled={isPendingApproval}
          />
          <div className="min-h-[12rem] flex-1 space-y-3">
            <div>
              <h3 className="font-semibold">
                {OPP_STAGES.find((s) => s.key === oppStage)?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag cards onto a stage in the sidebar to update status.
              </p>
            </div>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                No opportunities in this stage.
              </p>
            ) : (
              items.map((item) => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  subtitle={item.location}
                  status={item.status}
                  href={`/opportunities/${item.id}`}
                  dragType="opportunity"
                  disabled={isPendingApproval}
                />
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const items = (appBuckets[appStage as keyof typeof appBuckets] ?? []) as Array<
    Application & { opportunity?: Opportunity | null }
  >
  const counts = Object.fromEntries(
    APP_STAGES.map((s) => [s.key, appBuckets[s.key as keyof typeof appBuckets]?.length ?? 0]),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['', 'request', 'offer'] as const).map((intent) => (
          <button
            key={intent || 'all'}
            type="button"
            className={cn(
              'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
              intentFilter === intent
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setIntentFilter(intent)}
          >
            {intent === '' ? 'All' : intent === 'request' ? 'Need' : 'Offer'}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <StageSidebar
          stages={APP_STAGES}
          selected={appStage}
          counts={counts}
          onSelect={setAppStage}
          onDrop={handleAppDrop}
          dropPrefix="app"
          disabled={isPendingApproval}
        />
        <div className="min-h-[12rem] flex-1 space-y-3">
          <div>
            <h3 className="font-semibold">
              {APP_STAGES.find((s) => s.key === appStage)?.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {APPLICATION_STATUS_LABELS[appStage] ?? appStage} applications
            </p>
          </div>
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
              No applications in this stage.
            </p>
          ) : (
            items.map((item) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                title={item.opportunity?.title ?? item.opportunityId}
                subtitle={item.proposal?.slice(0, 80)}
                status={item.status}
                href={`/opportunities/${item.opportunityId}`}
                dragType="application"
                disabled={isPendingApproval}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
