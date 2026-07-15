import type {
  Command,
  CommandResult,
  PublishProfileCommand,
  SetProfileVisibilityCommand,
  UnpublishProfileCommand,
  UpdateProfileCommand,
} from '@pm-twin/commands'
import type { AuditEntry, PersonProfile } from '@/types/domain.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { ProfileRepository } from '@/repositories/profile-repository.ts'
import type {
  ProfileSubject,
  ProfileSubjectLookup,
} from '@/domain/profile/profile-subject-resolver.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'

type ProfileCommand =
  | UpdateProfileCommand
  | SetProfileVisibilityCommand
  | PublishProfileCommand
  | UnpublishProfileCommand

export type ProfileCommandHandlerDeps = {
  readonly profileRepository: ProfileRepository
  readonly auditRepository?: AuditRepository | null
  readonly resolveSubject: (
    lookup: ProfileSubjectLookup,
  ) => ProfileSubject | undefined
  readonly resolveActor: () => CommandPermissionActor | null
}

function result(
  command: Command,
  success: boolean,
  errors?: readonly string[],
): CommandResult {
  return {
    success,
    aggregateId: command.aggregateId,
    commandType: command.commandType,
    ...(errors ? { errors } : {}),
  }
}

function subjectLookup(command: ProfileCommand): ProfileSubjectLookup {
  return {
    partyId: command.payload.partyId,
    workspaceId: command.payload.workspaceId,
    legacyAccountId: command.payload.legacyAccountId,
  }
}

export class ProfileCommandHandler {
  private readonly profileRepository: ProfileRepository
  private readonly auditRepository?: AuditRepository | null
  private readonly resolveSubject: ProfileCommandHandlerDeps['resolveSubject']
  private readonly resolveActor: ProfileCommandHandlerDeps['resolveActor']

  constructor(deps: ProfileCommandHandlerDeps) {
    this.profileRepository = deps.profileRepository
    this.auditRepository = deps.auditRepository
    this.resolveSubject = deps.resolveSubject
    this.resolveActor = deps.resolveActor
  }

  handle(command: Command): CommandResult {
    if (!command.aggregateId?.trim() || !command.clientRequestId?.trim()) {
      return result(command, false, ['aggregateId and clientRequestId are required'])
    }
    if (!this.isProfileCommand(command)) {
      return result(command, false, [`Unsupported profile command "${command.commandType}"`])
    }

    const subject = this.resolveSubject(subjectLookup(command))
    if (!subject) {
      return result(command, false, ['Profile subject could not be resolved'])
    }
    if (!this.canEdit(subject)) {
      return result(command, false, ['You do not have permission to edit this profile'])
    }

    if (command.commandType === 'UpdateProfile') {
      const updated = this.profileRepository.updateProfile(
        subject,
        command.payload.profilePatch as Partial<PersonProfile>,
      )
      if (!updated) return result(command, false, ['Profile update failed'])
      this.appendAudit(command, subject, 'profile.updated')
      return result(command, true)
    }

    const isPublic =
      command.commandType === 'PublishProfile'
        ? true
        : command.commandType === 'UnpublishProfile'
          ? false
          : command.payload.isPublic
    if (isPublic) {
      const readiness = evaluateProfileReadiness({
        profile: this.profileRepository.getProfile(subject),
        profileKind: subject.profileKind,
      })
      if (readiness.missingRequired.length > 0) {
        return result(command, false, [
          `Complete required profile fields before publishing: ${readiness.missingRequired.join(', ')}`,
        ])
      }
    }

    const updated = this.profileRepository.setPublished(subject, isPublic)
    if (!updated) return result(command, false, ['Profile visibility update failed'])
    this.appendAudit(
      command,
      subject,
      isPublic ? 'profile.published' : 'profile.unpublished',
    )
    return result(command, true)
  }

  private canEdit(subject: ProfileSubject): boolean {
    const actor = this.resolveActor()
    if (!actor) return false
    if ((actor.platformRoles?.length ?? 0) > 0) return true
    if (actor.activePartyId && actor.activePartyId === subject.partyId) {
      return actor.workspaceRole !== 'viewer'
    }
    return (
      subject.profileKind === 'individual' &&
      actor.userId === subject.sourceEntityId
    )
  }

  private isProfileCommand(command: Command): command is ProfileCommand {
    return [
      'UpdateProfile',
      'SetProfileVisibility',
      'PublishProfile',
      'UnpublishProfile',
    ].includes(command.commandType)
  }

  private appendAudit(
    command: Command,
    subject: ProfileSubject,
    action: string,
  ): void {
    if (!this.auditRepository) return
    const entry: Omit<AuditEntry, 'id' | 'timestamp'> = {
      action,
      entityType: 'profile',
      entityId: subject.profileId,
      requestId: command.clientRequestId,
      partyId: subject.partyId,
      workspaceId: subject.workspaceId,
      details: {
        profileKind: subject.profileKind,
        sourceEntityId: subject.sourceEntityId,
      },
    }
    this.auditRepository.append(entry)
  }
}
