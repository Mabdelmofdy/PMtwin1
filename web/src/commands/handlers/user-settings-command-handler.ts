import type {
  Command,
  CommandResult,
  UpdateUserSettingsCommand,
} from '@pm-twin/commands'
import type { AuditEntry } from '@/types/domain.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { UserSettingsRepository } from '@/repositories/user-settings-repository.ts'
import type { UserSettingsPreferences } from '@/domain/user-settings/types.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

export type UserSettingsCommandHandlerDeps = {
  readonly repository: UserSettingsRepository
  readonly auditRepository?: AuditRepository | null
  readonly resolveActor: () => CommandPermissionActor | null
}

export class UserSettingsCommandHandler {
  private readonly repository: UserSettingsRepository
  private readonly auditRepository?: AuditRepository | null
  private readonly resolveActor: () => CommandPermissionActor | null

  constructor(deps: UserSettingsCommandHandlerDeps) {
    this.repository = deps.repository
    this.auditRepository = deps.auditRepository
    this.resolveActor = deps.resolveActor
  }

  handle(command: Command): CommandResult {
    if (command.commandType !== 'UpdateUserSettings') {
      return this.result(command, false, ['Unsupported settings command'])
    }
    const typed = command as UpdateUserSettingsCommand
    const actor = this.resolveActor()
    const isPlatformOperator = (actor?.platformRoles?.length ?? 0) > 0
    if (!actor || (actor.userId !== typed.payload.userId && !isPlatformOperator)) {
      return this.result(command, false, ['You can only update your own settings'])
    }

    const current = this.repository.get(typed.payload.userId)
    const patch =
      typed.payload.settingsPatch as Partial<UserSettingsPreferences>
    const next: UserSettingsPreferences = {
      privacy: {
        ...current.privacy,
        ...patch.privacy,
        contactOptIns: {
          ...current.privacy.contactOptIns,
          ...patch.privacy?.contactOptIns,
        },
        publicProfile: {
          ...current.privacy.publicProfile,
          ...patch.privacy?.publicProfile,
        },
      },
      notifications: {
        ...current.notifications,
        ...patch.notifications,
        inApp: {
          ...current.notifications.inApp,
          ...patch.notifications?.inApp,
        },
      },
      interface: {
        ...current.interface,
        ...patch.interface,
      },
      matching: {
        ...current.matching,
        ...patch.matching,
      },
    }

    try {
      this.repository.upsert(typed.payload.userId, next)
    } catch (error) {
      return this.result(command, false, [
        error instanceof Error ? error.message : 'Settings update failed',
      ])
    }

    const audit: Omit<AuditEntry, 'id' | 'timestamp'> = {
      action: 'user_settings.updated',
      entityType: 'user_settings',
      entityId: typed.payload.userId,
      userId: actor.userId,
      requestId: typed.clientRequestId,
      details: {
        sections: Object.keys(typed.payload.settingsPatch),
      },
    }
    this.auditRepository?.append(audit)
    return this.result(command, true)
  }

  private result(
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
}
