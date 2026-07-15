import {
  companyRepository,
  partyRepository,
  userRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import {
  resolveProfileSubject,
  type ProfileSubject,
  type ProfileSubjectLookup,
} from '@/domain/profile/profile-subject-resolver.ts'

export function resolveRuntimeProfileSubject(
  lookup: ProfileSubjectLookup,
): ProfileSubject | undefined {
  return resolveProfileSubject(lookup, {
    getPartyById: (id) => partyRepository.getById(id),
    getWorkspaceById: (id) => workspaceRepository.getById(id),
    getUserById: (id) => userRepository.getById(id),
    getCompanyById: (id) => companyRepository.getById(id),
  })
}
