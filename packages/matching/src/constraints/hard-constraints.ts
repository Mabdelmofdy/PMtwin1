import type { MatchingConfig } from '../types/matching-config.ts'
import type { HardConstraintContext, HardConstraintResult } from '../types/match-result.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'
import { ROLE_ALIASES, ROLE_COMPATIBILITY } from './role-matrix.ts'

export function normalizeRoleLabel(role: string | null | undefined): string {
  if (!role) return ''
  const trimmed = String(role).trim()
  const alias = ROLE_ALIASES[trimmed.toLowerCase()]
  return alias ?? trimmed
}

export function getNeedRole(needPost: OpportunityPost, needNorm: NormalizedPost): string {
  const fromNorm = needNorm.role
  if (fromNorm) return normalizeRoleLabel(fromNorm)
  const att = needPost.attributes ?? {}
  const explicit = att.targetRole ?? att.professionalRole
  if (explicit) {
    const label = typeof explicit === 'string'
      ? explicit
      : String((explicit as { label?: string; role?: string }).label
        ?? (explicit as { label?: string; role?: string }).role
        ?? '')
    return normalizeRoleLabel(label)
  }
  return ''
}

export function getOfferRole(offerPost: OpportunityPost, offerNorm: NormalizedPost): string {
  const fromNorm = offerNorm.role
  if (fromNorm) return normalizeRoleLabel(fromNorm)
  const att = offerPost.attributes ?? {}
  const explicit = att.targetRole ?? att.professionalRole
  if (explicit) {
    const label = typeof explicit === 'string'
      ? explicit
      : String((explicit as { label?: string; role?: string }).label
        ?? (explicit as { label?: string; role?: string }).role
        ?? '')
    return normalizeRoleLabel(label)
  }
  return ''
}

export function rolesCompatible(
  needRole: string,
  offerRole: string,
  config: MatchingConfig,
): boolean {
  const need = normalizeRoleLabel(needRole)
  const offer = normalizeRoleLabel(offerRole)
  if (!need || !offer) return false
  if (need.toLowerCase() === offer.toLowerCase()) return true

  if (config.STRICT_ROLE_EXACT_MATCH !== false) {
    return false
  }

  const allowed = ROLE_COMPATIBILITY[need]
    ?? ROLE_COMPATIBILITY[needRole]
    ?? ROLE_COMPATIBILITY[normalizeRoleLabel(needRole)]

  if (!allowed) {
    return need.toLowerCase() === offer.toLowerCase()
  }

  return allowed.some((candidate) => candidate.toLowerCase() === offer.toLowerCase())
}

export function serviceOverlapScore(
  needServices: readonly string[] | undefined,
  offerServices: readonly string[] | undefined,
): number {
  const needList = (needServices ?? []).filter(Boolean)
  if (!needList.length) return 1

  const offerSet = new Set((offerServices ?? []).map((service) => String(service).toLowerCase()))
  let matched = 0
  needList.forEach((service) => {
    if (offerSet.has(String(service).toLowerCase())) matched++
  })
  return matched / needList.length
}

export function passesCoreSkills(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
): HardConstraintResult {
  const needCore = needNorm.coreSkills ?? []
  if (!needCore.length) return { ok: true }

  const offerPool = [
    ...(offerNorm.coreSkills ?? []),
    ...(offerNorm.offeredServices ?? []),
    ...(offerNorm.skills ?? []),
  ]
  const offerSet = new Set(offerPool.map((skill) => String(skill).toLowerCase()))

  const missing = needCore.filter((skill) => !offerSet.has(String(skill).toLowerCase()))
  if (missing.length) {
    return { ok: false, reason: 'core_skill_missing', missing }
  }
  return { ok: true }
}

export function passesServiceOverlap(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
  config: MatchingConfig,
): HardConstraintResult {
  const needServices = needNorm.requiredServices ?? []
  if (!needServices.length) return { ok: true }

  const offerServices = offerNorm.offeredServices ?? offerNorm.skills ?? []
  const overlap = serviceOverlapScore(needServices, offerServices)
  const minOverlap = config.MIN_REQUIRED_SERVICE_OVERLAP ?? 0.50

  if (overlap < minOverlap) {
    return { ok: false, reason: 'service_overlap_low', overlap, minOverlap }
  }
  return { ok: true, overlap }
}

export function passesPair(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
  config: MatchingConfig,
  ctx: HardConstraintContext = {},
): HardConstraintResult {
  if (config.HARD_CONSTRAINTS_ENABLED === false) {
    return { ok: true }
  }

  const needNorm = ctx.needNorm ?? needPost.normalized ?? {}
  const offerNorm = ctx.offerNorm ?? offerPost.normalized ?? {}

  const needRole = getNeedRole(needPost, needNorm)
  const offerRole = getOfferRole(offerPost, offerNorm)

  if (!needRole) return { ok: false, reason: 'role_missing', side: 'need' }
  if (!offerRole) return { ok: false, reason: 'role_missing', side: 'offer' }
  if (!rolesCompatible(needRole, offerRole, config)) {
    return { ok: false, reason: 'role_incompatible', needRole, offerRole }
  }

  const coreCheck = passesCoreSkills(needNorm, offerNorm)
  if (!coreCheck.ok) return coreCheck

  const serviceCheck = passesServiceOverlap(needNorm, offerNorm, config)
  if (!serviceCheck.ok) return serviceCheck

  return { ok: true, needRole, offerRole, overlap: serviceCheck.overlap }
}
