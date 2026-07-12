import { useSearchParams } from 'react-router-dom'
import {
  WORKSPACE_IDS,
  parseWorkspaceId,
  workspaceStorageKey,
  type WorkspaceId,
} from '@/lib/opportunity-details'
import { cn } from '@/lib/utils'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'

const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
  overview: 'Overview',
  scope: 'Scope & Work',
  commercial: 'Commercial',
  marketplace: 'Marketplace',
  matching: 'Matching',
  documents: 'Documents',
  related: 'Related',
  history: 'History',
}

export function useOpportunityWorkspace(
  opportunityId: string,
  userId?: string,
): {
  readonly workspace: WorkspaceId
  readonly setWorkspace: (id: WorkspaceId) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const fromUrl = parseWorkspaceId(searchParams.get('workspace'))

  let workspace = fromUrl
  if (!searchParams.get('workspace') && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(workspaceStorageKey(userId, opportunityId))
      if (stored) workspace = parseWorkspaceId(stored)
    } catch {
      // ignore
    }
  }

  const setWorkspace = (id: WorkspaceId) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'overview') next.delete('workspace')
    else next.set('workspace', id)
    setSearchParams(next, { replace: true })
    try {
      localStorage.setItem(workspaceStorageKey(userId, opportunityId), id)
    } catch {
      // ignore
    }
    trackOcxEvent('opportunity_workspace_viewed', { workspace: id, opportunityId })
  }

  return { workspace, setWorkspace }
}

export function OpportunityDetailsNavigation({
  workspace,
  onWorkspaceChange,
  restricted,
}: {
  readonly workspace: WorkspaceId
  readonly onWorkspaceChange: (id: WorkspaceId) => void
  readonly restricted?: ReadonlySet<WorkspaceId>
}) {
  return (
    <div
      role="tablist"
      aria-label="Opportunity workspaces"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {WORKSPACE_IDS.map((id) => {
        const isActive = workspace === id
        const isRestricted = restricted?.has(id)
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={isRestricted}
            onClick={() => onWorkspaceChange(id)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              isRestricted && 'cursor-not-allowed opacity-50',
            )}
          >
            {WORKSPACE_LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}
