/**
 * Resolve enterprise presentation labels for admin UI subjects.
 * Presentation only — repository IDs remain for routing/commands.
 */

import {
  commercialAgreementRepository,
  contractRepository,
  negotiationRepository,
  opportunityRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import {
  formatCommercialAgreementPresentation,
  formatContractPresentation,
  formatEnterpriseReference,
  formatNegotiationPresentation,
  formatOpportunityPresentation,
  formatPartyCompanyCode,
  formatPartyPresentation,
  formatPostMatchPresentation,
  formatUserEmployeeNumber,
  formatUserPresentation,
  looksLikeInternalId,
} from '@/lib/enterprise-display.ts'

export type EnterpriseSubjectView = {
  readonly title: string
  readonly reference: string
}

function normalizeType(entityType?: string | null): string {
  return (entityType ?? '').toLowerCase().replace(/-/g, '_')
}

export function resolveEnterpriseSubject(
  entityType?: string | null,
  entityId?: string | null,
): EnterpriseSubjectView | null {
  if (!entityId?.trim()) return null
  const id = entityId.trim()
  const type = normalizeType(entityType)

  switch (type) {
    case 'user':
    case 'vetting': {
      const user = userRepository.getById(id)
      if (user) {
        const view = formatUserPresentation(user)
        return { title: view.fullName, reference: view.employeeNumber }
      }
      return { title: 'User', reference: formatUserEmployeeNumber(id) }
    }
    case 'party': {
      const party = partyRepository.getById(id)
      if (party) {
        const view = formatPartyPresentation(party)
        return { title: view.companyName, reference: view.companyCode }
      }
      return { title: 'Party', reference: formatPartyCompanyCode(id) }
    }
    case 'opportunity': {
      const opp = opportunityRepository.getById(id)
      if (opp) {
        const view = formatOpportunityPresentation(opp)
        return { title: view.name, reference: view.reference }
      }
      return {
        title: 'Opportunity',
        reference: formatEnterpriseReference('opportunity', id),
      }
    }
    case 'post_match':
    case 'match': {
      const match = postMatchRepository.getById(id)
      if (match) {
        const view = formatPostMatchPresentation(match, (oid) =>
          opportunityRepository.getById(oid),
        )
        return { title: view.title, reference: view.reference }
      }
      return {
        title: 'Post Match',
        reference: formatEnterpriseReference('post_match', id),
      }
    }
    case 'negotiation': {
      const negotiation = negotiationRepository.getById(id)
      if (negotiation) {
        const view = formatNegotiationPresentation(negotiation, (oid) =>
          opportunityRepository.getById(oid),
        )
        return { title: view.title, reference: view.reference }
      }
      return {
        title: 'Negotiation',
        reference: formatEnterpriseReference('negotiation', id),
      }
    }
    case 'commercial_agreement':
    case 'deal': {
      const ca = commercialAgreementRepository.getById(id)
      if (ca) {
        const view = formatCommercialAgreementPresentation(ca, (opportunityId) =>
          opportunityRepository.getById(opportunityId),
        )
        return { title: view.name, reference: view.reference }
      }
      return {
        title: 'Commercial Agreement',
        reference: formatEnterpriseReference('commercial_agreement', id),
      }
    }
    case 'contract': {
      const contract = contractRepository.getById(id)
      if (contract) {
        const view = formatContractPresentation(contract)
        return { title: view.name, reference: view.reference }
      }
      return {
        title: 'Contract',
        reference: formatEnterpriseReference('contract', id),
      }
    }
    default: {
      if (looksLikeInternalId(id)) {
        return {
          title: type ? type.replace(/_/g, ' ') : 'Record',
          reference: formatEnterpriseReference('opportunity', id).replace(/^OPP/, 'REC'),
        }
      }
      return { title: id, reference: '' }
    }
  }
}

/** Single-line label for lists/inbox/audit: "Name · REF-…" */
export function formatEnterpriseSubjectLine(
  entityType?: string | null,
  entityId?: string | null,
): string | undefined {
  const view = resolveEnterpriseSubject(entityType, entityId)
  if (!view) return undefined
  return view.reference ? `${view.title} · ${view.reference}` : view.title
}

/**
 * Best-effort resolve when entity type is unknown (e.g. failed-command aggregate).
 * Only returns a label when a live repository record exists — never invents a demo id string.
 */
export function resolveEnterpriseSubjectById(
  entityId?: string | null,
): EnterpriseSubjectView | null {
  if (!entityId?.trim()) return null
  const id = entityId.trim()

  const user = userRepository.getById(id)
  if (user) {
    const view = formatUserPresentation(user)
    return { title: view.fullName, reference: view.employeeNumber }
  }
  const party = partyRepository.getById(id)
  if (party) {
    const view = formatPartyPresentation(party)
    return { title: view.companyName, reference: view.companyCode }
  }
  const opp = opportunityRepository.getById(id)
  if (opp) {
    const view = formatOpportunityPresentation(opp)
    return { title: view.name, reference: view.reference }
  }
  const match = postMatchRepository.getById(id)
  if (match) {
    const view = formatPostMatchPresentation(match, (oid) =>
      opportunityRepository.getById(oid),
    )
    return { title: view.title, reference: view.reference }
  }
  const negotiation = negotiationRepository.getById(id)
  if (negotiation) {
    const view = formatNegotiationPresentation(negotiation, (oid) =>
      opportunityRepository.getById(oid),
    )
    return { title: view.title, reference: view.reference }
  }
  const ca = commercialAgreementRepository.getById(id)
  if (ca) {
    const view = formatCommercialAgreementPresentation(ca, (opportunityId) =>
      opportunityRepository.getById(opportunityId),
    )
    return { title: view.name, reference: view.reference }
  }
  const contract = contractRepository.getById(id)
  if (contract) {
    const view = formatContractPresentation(contract)
    return { title: view.name, reference: view.reference }
  }
  return null
}

export function formatEnterpriseSubjectLineById(
  entityId?: string | null,
): string | undefined {
  const view = resolveEnterpriseSubjectById(entityId)
  if (!view) return undefined
  return view.reference ? `${view.title} · ${view.reference}` : view.title
}
