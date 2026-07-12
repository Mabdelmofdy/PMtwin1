import { createContext, useContext, type ReactNode } from 'react'
import type { OpportunityDetailsReadModel } from '@/lib/opportunity-details'
import type { WorkspaceId } from '@/lib/opportunity-details'
import type { OpportunityDetailsActionHandlers } from './header/opportunity-executive-header.tsx'

export type OpportunityDetailsContextValue = {
  readonly model: OpportunityDetailsReadModel
  readonly workspace: WorkspaceId
  readonly setWorkspace: (id: WorkspaceId) => void
  readonly handlers: OpportunityDetailsActionHandlers
  readonly highlightRelatedMatches: boolean
}

const OpportunityDetailsContext = createContext<OpportunityDetailsContextValue | null>(null)

export function OpportunityDetailsProvider({
  value,
  children,
}: {
  readonly value: OpportunityDetailsContextValue
  readonly children: ReactNode
}) {
  return (
    <OpportunityDetailsContext.Provider value={value}>
      {children}
    </OpportunityDetailsContext.Provider>
  )
}

export function useOpportunityDetailsContext(): OpportunityDetailsContextValue {
  const ctx = useContext(OpportunityDetailsContext)
  if (!ctx) {
    throw new Error('useOpportunityDetailsContext must be used within OpportunityDetailsProvider')
  }
  return ctx
}
