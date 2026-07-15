import type { Party } from '@pm-twin/party'
import type { BusinessWorkspace } from '@pm-twin/identity'
import type { PlatformUser } from '@/types/domain.ts'

export type ProfileSubjectKind = 'individual' | 'company'

export type ProfileSubject = {
  readonly partyId?: string
  readonly workspaceId?: string
  readonly sourceEntityId: string
  readonly profileId: string
  readonly profileKind: ProfileSubjectKind
  readonly account: PlatformUser
}

export type ProfileSubjectLookup = {
  readonly partyId?: string
  readonly workspaceId?: string
  readonly legacyAccountId?: string
}

export type ProfileSubjectResolverDeps = {
  readonly getPartyById: (id: string) => Party | undefined
  readonly getWorkspaceById: (id: string) => BusinessWorkspace | undefined
  readonly getUserById: (id: string) => PlatformUser | undefined
  readonly getCompanyById: (id: string) => PlatformUser | undefined
}

function subjectFromParty(
  party: Party,
  deps: ProfileSubjectResolverDeps,
): ProfileSubject | undefined {
  const profileKind: ProfileSubjectKind =
    party.sourceEntityType === 'company' || party.partyType === 'company'
      ? 'company'
      : 'individual'
  const account =
    profileKind === 'company'
      ? deps.getCompanyById(party.sourceEntityId)
      : deps.getUserById(party.sourceEntityId)
  if (!account) return undefined

  return {
    partyId: party.id,
    workspaceId: party.workspaceId,
    sourceEntityId: party.sourceEntityId,
    profileId:
      profileKind === 'company'
        ? party.companyProfileId ?? party.sourceEntityId
        : party.individualProfileId ?? party.sourceEntityId,
    profileKind,
    account,
  }
}

/**
 * Resolves the profile aggregate owner from canonical identity references first.
 * Legacy account IDs are accepted only as a compatibility fallback.
 */
export function resolveProfileSubject(
  lookup: ProfileSubjectLookup,
  deps: ProfileSubjectResolverDeps,
): ProfileSubject | undefined {
  if (lookup.partyId) {
    const party = deps.getPartyById(lookup.partyId)
    if (party) {
      const subject = subjectFromParty(party, deps)
      if (subject) return subject
    }
  }

  if (lookup.workspaceId) {
    const workspace = deps.getWorkspaceById(lookup.workspaceId)
    if (workspace) {
      const party = deps.getPartyById(workspace.ownerPartyId)
      if (party) {
        const subject = subjectFromParty(party, deps)
        if (subject) {
          return { ...subject, workspaceId: workspace.id }
        }
      }
    }
  }

  if (!lookup.legacyAccountId) return undefined
  const company = deps.getCompanyById(lookup.legacyAccountId)
  if (company) {
    return {
      sourceEntityId: company.id,
      profileId: company.id,
      profileKind: 'company',
      account: company,
    }
  }
  const user = deps.getUserById(lookup.legacyAccountId)
  if (!user) return undefined
  return {
    sourceEntityId: user.id,
    profileId: user.id,
    profileKind: 'individual',
    account: user,
  }
}
