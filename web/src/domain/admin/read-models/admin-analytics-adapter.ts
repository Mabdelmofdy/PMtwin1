/**
 * Admin analytics aggregations from live repositories only.
 * Never invents series points.
 */

import {
  contractRepository,
  negotiationRepository,
  opportunityRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import { buildPipelineSummary } from './command-center-adapter.ts'

export type AdminDistributionBucket = {
  readonly id: string
  readonly label: string
  readonly count: number
  readonly href: string
}

export type AdminTrendPoint = {
  readonly id: string
  readonly label: string
  readonly value: number
}

export type AdminAnalyticsBundle = {
  readonly conversion: readonly AdminDistributionBucket[]
  readonly topRegions: readonly AdminDistributionBucket[]
  readonly topCollaborationModels: readonly AdminDistributionBucket[]
  readonly topExchangeModes: readonly AdminDistributionBucket[]
  readonly topCompanies: readonly AdminDistributionBucket[]
  readonly statusDistribution: readonly AdminDistributionBucket[]
  readonly velocityDays: {
    readonly avgNegotiationAgeDays: number | null
    readonly avgContractAgeDays: number | null
    readonly avgOpportunityAgeDays: number | null
  }
  readonly completionRate: number | null
  readonly matchingTrend: readonly AdminTrendPoint[]
}

function statusLower(value?: string): string {
  return (value ?? '').toLowerCase()
}

function ageDays(iso?: string): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return Math.max(0, (Date.now() - t) / (24 * 60 * 60 * 1000))
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function topCounts(
  entries: readonly { readonly key: string; readonly href: string }[],
  limit = 5,
): AdminDistributionBucket[] {
  const map = new Map<string, { count: number; href: string }>()
  for (const entry of entries) {
    const key = entry.key.trim() || 'Unknown'
    const prev = map.get(key)
    if (prev) prev.count += 1
    else map.set(key, { count: 1, href: entry.href })
  }
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([label, v]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      count: v.count,
      href: v.href,
    }))
}

export function buildAdminAnalyticsBundle(): AdminAnalyticsBundle {
  const opportunities = opportunityRepository.getAll()
  const matches = postMatchRepository.getAll()
  const negotiations = negotiationRepository.getAll()
  const contracts = contractRepository.getAll()
  const parties = partyRepository.getAll()
  const pipeline = buildPipelineSummary()

  const conversion = pipeline.stages.map((stage) => ({
    id: stage.id,
    label: stage.label,
    count: stage.count,
    href: stage.href,
  }))

  const topRegions = topCounts(
    opportunities.map((o) => ({
      key: String(o.location ?? o.city ?? o.country ?? 'Unspecified'),
      href: '/admin/opportunities',
    })),
  )

  const topCollaborationModels = topCounts(
    opportunities.map((o) => ({
      key: String(o.mainCollaborationModel ?? o.modelType ?? 'Unspecified'),
      href: '/admin/taxonomy',
    })),
  )

  const topExchangeModes = topCounts(
    opportunities.map((o) => ({
      key: String(o.exchangeMode ?? o.value_exchange?.mode ?? 'Unspecified'),
      href: '/admin/opportunities',
    })),
  )

  const companyParties = parties.filter((p) => statusLower(p.partyType) === 'company')
  const topCompanies = topCounts(
    companyParties.map((p) => ({
      key: String(p.displayName ?? p.id),
      href: `/admin/parties/${p.id}`,
    })),
  )

  const statusDistribution = topCounts(
    opportunities.map((o) => ({
      key: String(o.status ?? 'unknown'),
      href: `/admin/opportunities?status=${encodeURIComponent(String(o.status ?? ''))}`,
    })),
    8,
  )

  const negotiationAges = negotiations
    .map((n) => ageDays(n.updatedAt ?? n.createdAt))
    .filter((v): v is number => v != null)
  const contractAges = contracts
    .map((c) => ageDays(c.updatedAt ?? c.createdAt))
    .filter((v): v is number => v != null)
  const opportunityAges = opportunities
    .map((o) => ageDays(o.updatedAt ?? o.createdAt))
    .filter((v): v is number => v != null)

  const completedContracts = contracts.filter((c) => {
    const s = statusLower(c.status)
    return s === 'completed' || s === 'closed'
  }).length
  const completionRate =
    contracts.length > 0 ? (completedContracts / contracts.length) * 100 : null

  const matchingTrend: AdminTrendPoint[] = [
    { id: 'discovered', label: 'Discovered', value: matches.filter((m) => ['discovered', 'pending'].includes(statusLower(m.status))).length },
    { id: 'accepted', label: 'Accepted', value: matches.filter((m) => statusLower(m.status) === 'accepted').length },
    { id: 'confirmed', label: 'Confirmed', value: matches.filter((m) => statusLower(m.status) === 'confirmed').length },
    { id: 'declined', label: 'Declined', value: matches.filter((m) => statusLower(m.status) === 'declined').length },
  ].filter((p) => p.value > 0)

  void userRepository.getAll().length

  return {
    conversion,
    topRegions,
    topCollaborationModels,
    topExchangeModes,
    topCompanies,
    statusDistribution,
    velocityDays: {
      avgNegotiationAgeDays: average(negotiationAges),
      avgContractAgeDays: average(contractAges),
      avgOpportunityAgeDays: average(opportunityAges),
    },
    completionRate,
    matchingTrend,
  }
}
