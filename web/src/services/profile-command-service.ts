import type {
  CommandResult,
  ProfileSubjectPayload,
  SetProfileVisibilityCommand,
  UpdateProfileCommand,
} from '@pm-twin/commands'
import type { PersonProfile } from '@/types/domain.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'

function requestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function updateProfileThroughCommand(
  subject: ProfileSubjectPayload,
  profilePatch: Partial<PersonProfile>,
): CommandResult {
  const aggregateId =
    subject.partyId ?? subject.legacyAccountId ?? subject.workspaceId ?? 'profile'
  const command: UpdateProfileCommand = {
    commandType: 'UpdateProfile',
    aggregateId,
    clientRequestId: requestId(),
    payload: {
      ...subject,
      profilePatch,
    },
  }
  return getApplicationCommandGateway().execute(command)
}

export function setProfileVisibilityThroughCommand(
  subject: ProfileSubjectPayload,
  isPublic: boolean,
): CommandResult {
  const aggregateId =
    subject.partyId ?? subject.legacyAccountId ?? subject.workspaceId ?? 'profile'
  const command: SetProfileVisibilityCommand = {
    commandType: 'SetProfileVisibility',
    aggregateId,
    clientRequestId: requestId(),
    payload: {
      ...subject,
      isPublic,
    },
  }
  return getApplicationCommandGateway().execute(command)
}
