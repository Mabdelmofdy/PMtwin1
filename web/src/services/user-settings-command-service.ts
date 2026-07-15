import type {
  CommandResult,
  UpdateUserSettingsCommand,
} from '@pm-twin/commands'
import type { UserSettingsPreferences } from '@/domain/user-settings/types.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'

function requestId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `settings-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function updateUserSettingsThroughCommand(
  userId: string,
  settingsPatch: Partial<UserSettingsPreferences>,
): CommandResult {
  const command: UpdateUserSettingsCommand = {
    commandType: 'UpdateUserSettings',
    aggregateId: userId,
    clientRequestId: requestId(),
    payload: {
      userId,
      settingsPatch,
    },
  }
  return getApplicationCommandGateway().execute(command)
}
