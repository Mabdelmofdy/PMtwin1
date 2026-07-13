import seedUsers from '@seed-data/seed-controlled-users.json'
import demoEmployees from '@seed-data/demo-employees.json'
import demoCompanies from '@seed-data/demo-companies.json'
import demoPendingUsers from '@seed-data/demo-pending-users.json'
import usersBase from '@seed-data/users.json'
import castCoverageOpportunities from '@seed-data/demo-cast-coverage-opportunities.json'
import castCoverageMatches from '@seed-data/demo-cast-coverage-matches.json'
import opportunitiesBase from '@seed-data/opportunities.json'
import postMatchesBase from '@seed-data/demo-post-matches.json'
import demoDeals from '@seed-data/demo-deals.json'
import demoContracts from '@seed-data/demo-contracts.json'
import demoNegotiations from '@seed-data/demo-negotiations.json'
import demoNotifications from '@seed-data/demo-notifications.json'
import demoAudit from '@seed-data/demo-audit.json'
import type { MatchingModelKey } from '@/config/need-offer-framework.ts'
import { getDemoScenarioRegistry } from '@/infrastructure/environment/demo-scenario-registry.ts'

type Envelope<T> = { data?: T[] }

function rows<T>(envelope: Envelope<T>): T[] {
  return envelope.data ?? []
}

export type DemoTopologyChainStatus = {
  readonly matchType: MatchingModelKey
  readonly complete: boolean
  readonly matchId?: string
  readonly dealId?: string
  readonly contractId?: string
  readonly negotiationId?: string
}

export type DemoCastCoverageSnapshot = {
  readonly totalAccounts: number
  readonly castAccounts: number
  readonly missingAccountIds: readonly string[]
  readonly topologyChains: readonly DemoTopologyChainStatus[]
  readonly registryCoversAllTopologies: boolean
}

const SHOWCASE_MATCH_IDS: Record<MatchingModelKey, string> = {
  one_way: 'seed-pm-demo-oneway-cash',
  two_way: 'seed-pm-demo-twoway-barter',
  consortium: 'seed-pm-demo-consortium-jv',
  circular: 'seed-pm-demo-circular-resource',
}

const DEMO_TOPOLOGIES: readonly MatchingModelKey[] = [
  'one_way',
  'two_way',
  'consortium',
  'circular',
]

function collectDemoAccountIds(): string[] {
  const ids = new Set<string>()
  for (const user of rows<{ id: string }>(seedUsers as Envelope<{ id: string }>)) ids.add(user.id)
  for (const user of rows<{ id: string }>(demoEmployees as Envelope<{ id: string }>)) ids.add(user.id)
  for (const company of rows<{ id: string }>(demoCompanies as Envelope<{ id: string }>)) {
    ids.add(company.id)
  }
  for (const user of rows<{ id: string }>(demoPendingUsers as Envelope<{ id: string }>)) {
    ids.add(user.id)
  }
  for (const user of rows<{ id: string; role?: string; email?: string }>(
    usersBase as Envelope<{ id: string; role?: string; email?: string }>,
  )) {
    if (user.role === 'admin' || user.email === 'admin@pmtwin.com') ids.add(user.id)
  }
  return [...ids]
}

function collectCastAccountIds(): Set<string> {
  const cast = new Set<string>()

  const opportunities = [
    ...rows<{
      id: string
      creatorId?: string
      createdByUserId?: string
      ownerPartyId?: string
      status?: string
    }>(opportunitiesBase as Envelope<{ id: string; creatorId?: string; createdByUserId?: string }>),
    ...rows<{ id: string; creatorId?: string; createdByUserId?: string }>(
      castCoverageOpportunities as Envelope<{ id: string; creatorId?: string; createdByUserId?: string }>,
    ),
  ]
  for (const opp of opportunities) {
    if (opp.creatorId) cast.add(opp.creatorId)
    if (opp.createdByUserId && opp.createdByUserId !== 'system-migration-actor') {
      cast.add(opp.createdByUserId)
    }
  }

  const matches = [
    ...rows<{ participants?: Array<{ userId?: string }> }>(
      postMatchesBase as Envelope<{ participants?: Array<{ userId?: string }> }>,
    ),
    ...rows<{ participants?: Array<{ userId?: string }> }>(
      castCoverageMatches as Envelope<{ participants?: Array<{ userId?: string }> }>,
    ),
  ]
  for (const match of matches) {
    for (const participant of match.participants ?? []) {
      if (participant.userId) cast.add(participant.userId)
    }
  }

  for (const notif of rows<{ userId?: string; entityId?: string }>(
    demoNotifications as Envelope<{ userId?: string; entityId?: string }>,
  )) {
    if (notif.entityId === 'demo-walkthrough' && notif.userId) cast.add(notif.userId)
  }
  for (const entry of rows<{ userId?: string; entityId?: string }>(
    demoAudit as Envelope<{ userId?: string; entityId?: string }>,
  )) {
    if (entry.entityId === 'demo-walkthrough' && entry.userId) cast.add(entry.userId)
  }

  return cast
}

function resolveTopologyChain(matchType: MatchingModelKey): DemoTopologyChainStatus {
  const matchId = SHOWCASE_MATCH_IDS[matchType]
  const match = rows<{ id: string; negotiationId?: string; dealId?: string }>(
    postMatchesBase as Envelope<{ id: string; negotiationId?: string; dealId?: string }>,
  ).find((row) => row.id === matchId)

  const deal = rows<{ id: string; postMatchId?: string; matchId?: string; negotiationId?: string }>(
    demoDeals as Envelope<{
      id: string
      postMatchId?: string
      matchId?: string
      negotiationId?: string
    }>,
  ).find((row) => row.postMatchId === matchId || row.matchId === matchId)

  const contract = rows<{ id: string; matchId?: string; dealId?: string; negotiationId?: string }>(
    demoContracts as Envelope<{
      id: string
      matchId?: string
      dealId?: string
      negotiationId?: string
    }>,
  ).find(
    (row) =>
      row.matchId === matchId ||
      (deal != null && (row.dealId === deal.id || row.matchId === matchId)),
  )

  const negotiationId =
    match?.negotiationId ??
    deal?.negotiationId ??
    contract?.negotiationId ??
    rows<{ id: string; postMatchId?: string; matchId?: string }>(
      demoNegotiations as Envelope<{ id: string; postMatchId?: string; matchId?: string }>,
    ).find((row) => row.postMatchId === matchId || row.matchId === matchId)?.id

  const complete = Boolean(match && deal && contract && negotiationId)
  return {
    matchType,
    complete,
    matchId,
    dealId: deal?.id,
    contractId: contract?.id,
    negotiationId,
  }
}

export function buildDemoCastCoverageSnapshot(): DemoCastCoverageSnapshot {
  const allIds = collectDemoAccountIds()
  const cast = collectCastAccountIds()
  const missingAccountIds = allIds.filter((id) => !cast.has(id)).sort()
  const topologyChains = DEMO_TOPOLOGIES.map(resolveTopologyChain)
  const registryTypes = new Set(
    getDemoScenarioRegistry().flatMap((scenario) => [...scenario.matchTypes]),
  )
  const registryCoversAllTopologies = DEMO_TOPOLOGIES.every((type) => registryTypes.has(type))

  return {
    totalAccounts: allIds.length,
    castAccounts: allIds.length - missingAccountIds.length,
    missingAccountIds,
    topologyChains,
    registryCoversAllTopologies,
  }
}

export function isDemoOpportunityMatchingReady(opp: {
  id?: string
  attributes?: { targetRole?: string; coreSkills?: string[] }
  scope?: { targetRole?: string; coreSkills?: string[]; requiredSkills?: string[] }
  normalized?: { role?: string; coreSkills?: string[] }
  preferredMatchingTopology?: string
  skills?: string[]
}): boolean {
  if (opp.id === 'seed-opp-009') return false
  const role =
    opp.attributes?.targetRole ||
    opp.scope?.targetRole ||
    opp.normalized?.role ||
    ''
  const skills =
    opp.normalized?.coreSkills ||
    opp.attributes?.coreSkills ||
    opp.scope?.coreSkills ||
    opp.scope?.requiredSkills ||
    opp.skills ||
    []
  return Boolean(role && skills.length > 0 && opp.preferredMatchingTopology && opp.normalized)
}

export function listShowcaseDemoOpportunityIds(): readonly string[] {
  return [
    'seed-opp-demo-task-need',
    'seed-opp-demo-task-offer',
    'seed-opp-demo-alliance-a',
    'seed-opp-demo-alliance-b',
    'seed-opp-demo-consortium-lead',
    'seed-opp-demo-project-jv',
    'seed-opp-demo-spv',
    'seed-opp-demo-bulk',
    'seed-opp-demo-equip',
    'seed-opp-demo-resource',
    'seed-opp-demo-prof-hiring',
    'seed-opp-demo-consultant',
  ]
}
