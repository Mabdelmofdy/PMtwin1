import type { Application, ApplicationValue, PostMatch } from '@/types/domain.ts'
import {
  postMatchRepository,
  applicationRepository,
} from '@/repositories/index.ts'

function normalizeApplicationValue(rawValue?: ApplicationValue | null) {
  const av = rawValue || {}
  const requestedValue =
    av.requestedValue ?? av.requested_value ?? av.amount ?? null
  const currency = av.currency || 'SAR'
  const valueScore = av.value_score ?? null
  return {
    requestedValue,
    currency,
    valueScore: valueScore != null ? Number(valueScore) : null,
    valueScorePct:
      valueScore != null ? Math.round(Number(valueScore) * 100) : null,
  }
}

function formatApplicationValueAmount(
  rawValue?: ApplicationValue | null,
): string | null {
  const n = normalizeApplicationValue(rawValue)
  if (n.requestedValue != null && String(n.requestedValue).trim() !== '') {
    const display =
      typeof n.requestedValue === 'number'
        ? n.requestedValue.toLocaleString()
        : String(n.requestedValue)
    return `${display} ${n.currency}`
  }
  return null
}

function sortApplicationsByValueScore(
  applications: Application[],
): Application[] {
  const score = (a: Application) => {
    const v = normalizeApplicationValue(a.application_value).valueScore
    return v != null ? v : -1
  }
  return [...applications].sort((a, b) => score(b) - score(a))
}

export const matchingService = {
  normalizeApplicationValue,
  formatApplicationValueAmount,
  sortApplicationsByValueScore,

  getHighMatches(threshold = 0.9): PostMatch[] {
    return postMatchRepository
      .getAll()
      .filter((m) => m.matchScore >= threshold)
  },

  getMatchesForUser(userId: string): PostMatch[] {
    return postMatchRepository.getByUser(userId)
  },

  getMatchBreakdown(
    matchId: string,
  ): Record<string, number> | undefined {
    const match = postMatchRepository.getById(matchId)
    return match?.payload?.breakdown
  },

  getFilteredApplications(opportunityId: string): Application[] {
    return applicationRepository.getByOpportunity(opportunityId)
  },
}
