import type {
  Application,
  Contract,
  Deal,
  Negotiation,
} from '@/types/domain.ts'
import {
  commercialTermsFromApplicationValue,
  commercialTermsFromLegacyTerms,
  commercialTermsFromValueTerms,
} from '@/types/commercial-terms.ts'
import { normalizeParticipants } from '@/types/participant.ts'

export function normalizeApplication(raw: Application): Application {
  return {
    ...raw,
    commercialTerms:
      raw.commercialTerms ??
      commercialTermsFromApplicationValue(raw.application_value),
  }
}

export function normalizeNegotiation(raw: Negotiation): Negotiation {
  const participants = normalizeParticipants(raw.participants, raw.parties)
  const commercialTerms =
    raw.commercialTerms ??
    commercialTermsFromLegacyTerms(raw.agreedTerms ?? raw.initialTerms)
  return {
    ...raw,
    participants,
    parties: participants,
    commercialTerms,
  }
}

export function normalizeDeal(raw: Deal): Deal {
  const participants = normalizeParticipants(raw.participants, raw.parties)
  const commercialTerms =
    raw.commercialTerms ??
    commercialTermsFromValueTerms(raw.valueTerms) ??
    commercialTermsFromLegacyTerms(raw.terms)
  return {
    ...raw,
    participants,
    parties: participants,
    commercialTerms,
  }
}

export function normalizeContract(raw: Contract): Contract {
  const participants = normalizeParticipants(raw.participants, raw.parties)
  const commercialTerms =
    raw.commercialTerms ??
    (raw.agreedValue != null || raw.paymentSchedule || raw.duration
      ? {
          amount: raw.agreedValue ?? undefined,
          currency: 'SAR',
          duration: raw.duration,
          paymentSchedule: raw.paymentSchedule ?? undefined,
          profitSplit: raw.profitShare ?? undefined,
        }
      : commercialTermsFromLegacyTerms(raw.terms as never))
  return {
    ...raw,
    participants,
    parties: participants,
    commercialTerms,
  }
}

export function normalizeApplications(items: Application[]): Application[] {
  return items.map(normalizeApplication)
}

export function normalizeNegotiations(items: Negotiation[]): Negotiation[] {
  return items.map(normalizeNegotiation)
}

export function normalizeDeals(items: Deal[]): Deal[] {
  return items.map(normalizeDeal)
}

export function normalizeContracts(items: Contract[]): Contract[] {
  return items.map(normalizeContract)
}
