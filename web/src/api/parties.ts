import {
  partyRepository,
  partyMembershipRepository,
} from '@/repositories/index.ts'

export const partiesApi = {
  listParties: () => partyRepository.getAll(),
  getParty: (id: string) => partyRepository.getById(id),
  listMembershipsForUser: (userId: string) =>
    partyMembershipRepository.listForUser(userId),
  getPrimaryMembership: (userId: string) =>
    partyMembershipRepository.getPrimaryForUser(userId),
  resolveActivePartyId(userId: string) {
    return partyMembershipRepository.getPrimaryForUser(userId)?.partyId ?? userId
  },
  resolveActiveParty(userId: string) {
    const partyId = partiesApi.resolveActivePartyId(userId)
    return partyRepository.getById(partyId)
  },
}
