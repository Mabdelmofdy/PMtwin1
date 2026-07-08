import type { PmWorkflowJourneyStep } from '@/components/ui/pm-workflow-journey'
import type { StatusEntity } from '@/lib/status-display'

export type CollaborationActiveStep =
  | 'Opportunity'
  | 'PostMatch'
  | 'Negotiation'
  | 'Commercial Agreement'
  | 'Contract'

export type OpportunityWorkflowContext = {
  id: string
  status: string
}

export type OpportunityMatchWorkflowContext = {
  match: { status: string }
  detailPath?: string
  actions: {
    negotiation?: { status?: string } | null
    negotiationId?: string | null
    dealId?: string | null
  }
}

export function resolveCollaborationActiveStepFromMatches(
  matches: ReadonlyArray<{ actions: { showViewDeal?: boolean; showViewNegotiation?: boolean; showCreateDeal?: boolean } }>,
): CollaborationActiveStep {
  if (matches.some((card) => card.actions.showViewDeal)) return 'Commercial Agreement'
  if (matches.some((card) => card.actions.showViewNegotiation || card.actions.showCreateDeal)) {
    return 'Negotiation'
  }
  if (matches.length > 0) return 'PostMatch'
  return 'Opportunity'
}

function resolveJourneyActiveIndex(
  collaborationStep: CollaborationActiveStep,
  oppStatus: string,
): number {
  if (['completed', 'closed'].includes(oppStatus)) return 5
  if (['in_execution', 'executing'].includes(oppStatus)) return 5
  if (oppStatus === 'contracted') return 4
  const stepIndex: Record<CollaborationActiveStep, number> = {
    Opportunity: 0,
    PostMatch: 1,
    Negotiation: 2,
    'Commercial Agreement': 3,
    Contract: 4,
  }
  return stepIndex[collaborationStep] ?? 0
}

function mapStepDefsToJourney(
  stepDefs: ReadonlyArray<{
    id: string
    label: string
    status?: string
    statusEntity?: StatusEntity
    href?: string
  }>,
  activeIndex: number,
): readonly PmWorkflowJourneyStep[] {
  return stepDefs.map((step, index) => ({
    id: step.id,
    label: step.label,
    status: step.status,
    statusEntity: step.statusEntity,
    href: step.href,
    state:
      index < activeIndex
        ? ('complete' as const)
        : index === activeIndex
          ? ('current' as const)
          : ('upcoming' as const),
  }))
}

/** Six-step journey for opportunity detail (Opportunity → Complete). */
export function buildOpportunityWorkflowSteps(
  opp: OpportunityWorkflowContext,
  collaborationStep: CollaborationActiveStep,
  topCard?: OpportunityMatchWorkflowContext,
  dealStatus?: string,
  contractStatus?: string,
): readonly PmWorkflowJourneyStep[] {
  const activeIndex = resolveJourneyActiveIndex(collaborationStep, opp.status)
  const stepDefs = [
    {
      id: 'opportunity',
      label: 'Opportunity',
      status: opp.status,
      statusEntity: 'opportunity' as const,
      href: `/opportunities/${opp.id}`,
    },
    {
      id: 'match',
      label: 'Match',
      status: topCard?.match.status,
      statusEntity: 'match' as const,
      href: topCard?.detailPath,
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: topCard?.actions.negotiation?.status,
      statusEntity: 'negotiation' as const,
      href: topCard?.actions.negotiationId
        ? `/negotiations/${topCard.actions.negotiationId}`
        : undefined,
    },
    {
      id: 'deal',
      label: 'Commercial Agreement',
      status: dealStatus,
      statusEntity: 'deal' as const,
      href: topCard?.actions.dealId ? `/commercial-agreements/${topCard.actions.dealId}` : undefined,
    },
    {
      id: 'contract',
      label: 'Contract',
      status: contractStatus,
      statusEntity: 'contract' as const,
    },
    {
      id: 'execution',
      label: 'Complete',
      status: ['completed', 'closed'].includes(opp.status) ? opp.status : undefined,
      statusEntity: 'opportunity' as const,
    },
  ]
  return mapStepDefsToJourney(stepDefs, activeIndex)
}

export type MatchWorkflowContext = {
  id: string
  status: string
  negotiation?: { id: string; status: string }
  deal?: { id: string; status: string }
}

/** Five-step journey from match detail onward. */
export function buildMatchWorkflowSteps(match: MatchWorkflowContext): readonly PmWorkflowJourneyStep[] {
  const { negotiation, deal } = match
  return [
    {
      id: 'match',
      label: 'Match',
      status: match.status,
      statusEntity: 'match',
      href: `/matches/${match.id}`,
      state: negotiation || deal ? 'complete' : 'current',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: negotiation?.status,
      statusEntity: 'negotiation',
      href: negotiation ? `/negotiations/${negotiation.id}` : undefined,
      state: negotiation ? (deal ? 'complete' : 'current') : 'upcoming',
    },
    {
      id: 'deal',
      label: 'Commercial Agreement',
      status: deal?.status,
      statusEntity: 'deal',
      href: deal ? `/commercial-agreements/${deal.id}` : undefined,
      state: deal ? 'current' : 'upcoming',
    },
    {
      id: 'contract',
      label: 'Contract',
      state: 'upcoming',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]
}

export type NegotiationWorkflowContext = {
  id: string
  status: string
  postMatchId?: string
  linkedMatch?: { status: string }
  linkedDeal?: { id: string; status: string }
}

/** Five-step journey from negotiation detail onward. */
export function buildNegotiationWorkflowSteps(
  neg: NegotiationWorkflowContext,
): readonly PmWorkflowJourneyStep[] {
  const { linkedMatch, linkedDeal } = neg
  return [
    {
      id: 'match',
      label: 'Match',
      status: linkedMatch?.status,
      statusEntity: 'match',
      href: neg.postMatchId ? `/matches/${neg.postMatchId}` : undefined,
      state: 'complete',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: neg.status,
      statusEntity: 'negotiation',
      href: `/negotiations/${neg.id}`,
      state: linkedDeal ? 'complete' : 'current',
    },
    {
      id: 'deal',
      label: 'Commercial Agreement',
      status: linkedDeal?.status,
      statusEntity: 'deal',
      href: linkedDeal ? `/commercial-agreements/${linkedDeal.id}` : undefined,
      state: linkedDeal ? 'current' : 'upcoming',
    },
    {
      id: 'contract',
      label: 'Contract',
      state: 'upcoming',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]
}

export type DealWorkflowContext = {
  id: string
  status: string
  postMatchId?: string | null
  negotiationId?: string | null
  negotiationStatus?: string | null
  existingContract?: { status: string } | null
  contractLink?: { path: string } | null
}

/** Five-step journey from deal detail onward. */
export function buildDealWorkflowSteps(model: DealWorkflowContext): readonly PmWorkflowJourneyStep[] {
  return [
    {
      id: 'match',
      label: 'Match',
      href: model.postMatchId ? `/matches/${model.postMatchId}` : undefined,
      state: 'complete',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: model.negotiationStatus ?? undefined,
      statusEntity: 'negotiation',
      href: model.negotiationId ? `/negotiations/${model.negotiationId}` : undefined,
      state: 'complete',
    },
    {
      id: 'deal',
      label: 'Commercial Agreement',
      status: model.status,
      statusEntity: 'deal',
      href: `/commercial-agreements/${model.id}`,
      state: model.existingContract ? 'complete' : 'current',
    },
    {
      id: 'contract',
      label: 'Contract',
      status: model.existingContract?.status,
      statusEntity: 'contract',
      href: model.contractLink?.path,
      state: model.existingContract ? 'current' : 'upcoming',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]
}

export type ContractWorkflowContext = {
  contractId: string
  status: string
  postMatchId?: string | null
  negotiationId?: string | null
  dealId?: string | null
}

/** Five-step journey from contract detail onward. */
export function buildContractWorkflowSteps(
  model: ContractWorkflowContext,
): readonly PmWorkflowJourneyStep[] {
  return [
    {
      id: 'match',
      label: 'Match',
      href: model.postMatchId ? `/matches/${model.postMatchId}` : undefined,
      state: 'complete',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      href: model.negotiationId ? `/negotiations/${model.negotiationId}` : undefined,
      state: 'complete',
    },
    {
      id: 'deal',
      label: 'Commercial Agreement',
      href: model.dealId ? `/commercial-agreements/${model.dealId}` : undefined,
      state: 'complete',
    },
    {
      id: 'contract',
      label: 'Contract',
      status: model.status,
      statusEntity: 'contract',
      href: `/contracts/${model.contractId}`,
      state: 'current',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]
}
