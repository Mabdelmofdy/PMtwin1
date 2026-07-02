import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  APPLICATION_STATUS_LABELS,
  type Application,
} from '@/lib/applications'
import type { Opportunity } from '@/types/domain.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { applicationRepository } from '@/repositories/index.ts'
import { pipelineApplicationDrop } from '@/lib/pipeline-application-drop.ts'
import { pipelineOpportunityDrop } from '@/lib/pipeline-opportunity-drop.ts'
import { dealService } from '@/services/deal-service.ts'
import { negotiationService } from '@/services/negotiation-service.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import { PmEmptyState, PmSurface } from '@/components/ui/pm-index'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { PmReadinessScoreBadge } from '@/components/ui/pm-readiness-score-badge'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import { pmPipeline, pmTypography, pmResponsive } from '@/tokens'
import type { StatusEntity } from '@/lib/status-display.ts'
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
  ownerLabel,
  status,
  statusEntity,
  href,
  dragType,
  disabled,
  headerBadge,
  editHref,
}: {
  id: string
  title: string
  subtitle?: string
  ownerLabel?: string
  status?: string
  statusEntity?: StatusEntity
  href: string
  dragType: 'opportunity' | 'application'
  disabled?: boolean
  headerBadge?: ReactNode
  editHref?: string
}) {
  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive={!disabled}
      draggable={!disabled}
      role="group"
      aria-label={`${title}${subtitle ? `, ${subtitle}` : ''}. Open record or drag to another stage.`}
      onDragStart={(e) => {
        if (disabled) return
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ id, type: dragType }),
        )
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'flex flex-col p-3',
        pmPipeline.drag,
        disabled ? 'opacity-60' : 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="block min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(pmTypography.bodySm, 'line-clamp-2 min-w-0 flex-1 font-medium')}>
            <Link to={href} className="hover:text-primary" draggable={false}>
              {title}
            </Link>
          </p>
          {headerBadge ? <div className="shrink-0">{headerBadge}</div> : null}
        </div>
        {ownerLabel ? (
          <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>{ownerLabel}</p>
        ) : null}
        {subtitle ? (
          <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>{subtitle}</p>
        ) : null}
        {status ? (
          <PmWorkflowBadge
            status={status}
            entity={statusEntity}
            className="mt-2"
            size="sm"
          />
        ) : null}
      </div>
      <PmCardActions
        className="mt-3 border-t border-border/40 pt-2"
        primary={{ label: 'Open', href, size: 'sm' }}
        more={
          editHref
            ? [{ id: 'edit', label: 'Edit', href: editHref, icon: Pencil }]
            : undefined
        }
      />
    </PmSurface>
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
      <p className={cn(pmTypography.overline, 'mb-2 text-muted-foreground')}>
        Status
      </p>
      <nav className={cn('flex flex-row gap-2 lg:flex-col lg:overflow-visible', pmResponsive.scrollX)}>
        {stages.map((stage) => (
          <button
            key={stage.key}
            type="button"
            data-stage={stage.key}
            title={stage.hint}
            aria-label={`${stage.label} stage, ${counts[stage.key] ?? 0} items`}
            aria-current={selected === stage.key ? 'step' : undefined}
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
              pmTypography.bodySm,
              pmPipeline.dropZone,
              'flex min-w-[9rem] cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-start',
              selected === stage.key
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border/60 hover:bg-muted/50',
              dragOver === stage.key && pmPipeline.dropActive,
            )}
          >
            <span>{stage.label}</span>
            <span className={cn(pmTypography.caption, 'rounded-full bg-muted px-2 py-0.5 tabular-nums')}>
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
    () => opportunitiesApi.list(),
    [version],
  )
  const applications = useMemo(() => {
    return applicationRepository.getAll().map((app) => ({
      ...app,
      opportunity: opportunitiesApi.get(app.opportunityId),
    }))
  }, [version])

  const userId = user?.id ?? ''

  const oppBuckets = useMemo(
    () =>
      dealService.bucketOpportunitiesForPipeline(
        opportunities,
        userId,
        intentFilter,
      ),
    [opportunities, userId, intentFilter],
  )

  const userApps = useMemo(
    () => applications.filter((a) => a.applicantId === userId),
    [applications, userId],
  )

  const appBuckets = useMemo(
    () => negotiationService.bucketApplicationsForPipeline(userApps, intentFilter),
    [userApps, intentFilter],
  )

  const handleOppDrop = (stageKey: string, payload: { id: string; type: string }) => {
    if (payload.type !== 'opportunity') return
    const result = pipelineOpportunityDrop(payload.id, stageKey)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    toast.success('Opportunity moved')
  }

  const handleAppDrop = (stageKey: string, payload: { id: string; type: string }) => {
    if (payload.type !== 'application') return
    const result = pipelineApplicationDrop(payload.id, stageKey)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    toast.success('Application moved')
  }

  if (mode === 'opportunities') {
    const items = (oppBuckets[oppStage as keyof typeof oppBuckets] ?? []) as Opportunity[]
    const counts = Object.fromEntries(
      OPP_STAGES.map((s) => [s.key, oppBuckets[s.key as keyof typeof oppBuckets]?.length ?? 0]),
    )

    return (
      <div className="space-y-4">
        <Tabs
          value={intentFilter || 'all'}
          onValueChange={(value) =>
            setIntentFilter(value === 'all' ? '' : (value as 'request' | 'offer'))
          }
        >
          <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
            <TabsTrigger value="all" className="cursor-pointer">
              All
            </TabsTrigger>
            <TabsTrigger value="request" className="cursor-pointer">
              Need
            </TabsTrigger>
            <TabsTrigger value="offer" className="cursor-pointer">
              Offer
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
              <h3 className={pmTypography.h3}>
                {OPP_STAGES.find((s) => s.key === oppStage)?.label}
              </h3>
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                Drag cards onto a stage in the sidebar to update status.
              </p>
            </div>
            {items.length === 0 ? (
              <PmEmptyState
                title="No opportunities in this stage"
                description="Drag cards onto a stage in the sidebar to update status."
                size="compact"
              />
            ) : (
              items.map((item) => {
                const itemReadiness = resolveOpportunityReadiness(item)
                const owner = item.creatorId ? peopleApi.get(item.creatorId) : undefined
                const isOwner = userId && item.creatorId === userId
                return (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={item.location}
                    ownerLabel={owner?.profile?.name ? `Owner: ${owner.profile.name}` : undefined}
                    status={item.status}
                    statusEntity="opportunity"
                    href={`/opportunities/${item.id}`}
                    dragType="opportunity"
                    disabled={isPendingApproval}
                    editHref={isOwner ? `/opportunities/${item.id}/edit` : undefined}
                    headerBadge={
                      <PmReadinessScoreBadge
                        score={itemReadiness.score}
                        variant="compact"
                        showLabel={false}
                        explanation={{
                          missingRequired: itemReadiness.missingRequired,
                          missingRecommended: itemReadiness.missingRecommended,
                        }}
                      />
                    }
                  />
                )
              })
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
      <Tabs
        value={intentFilter || 'all'}
        onValueChange={(value) =>
          setIntentFilter(value === 'all' ? '' : (value as 'request' | 'offer'))
        }
      >
        <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
          <TabsTrigger value="all" className="cursor-pointer">
            All
          </TabsTrigger>
          <TabsTrigger value="request" className="cursor-pointer">
            Need
          </TabsTrigger>
          <TabsTrigger value="offer" className="cursor-pointer">
            Offer
          </TabsTrigger>
        </TabsList>
      </Tabs>
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
            <h3 className={pmTypography.h3}>
              {APP_STAGES.find((s) => s.key === appStage)?.label}
            </h3>
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              {APPLICATION_STATUS_LABELS[appStage] ?? appStage} legacy applications
            </p>
          </div>
          {items.length === 0 ? (
            <PmEmptyState
              title="No legacy applications in this stage"
              description={APPLICATION_STATUS_LABELS[appStage] ?? appStage}
              size="compact"
            />
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
