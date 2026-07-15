import type { Command } from '../types.ts'

export type ProfileSubjectPayload = {
  readonly partyId?: string
  readonly workspaceId?: string
  readonly legacyAccountId?: string
}

export type UpdateProfileCommand = Command & {
  readonly commandType: 'UpdateProfile'
  readonly payload: ProfileSubjectPayload & {
    readonly profilePatch: Readonly<Record<string, unknown>>
  }
}

export type SetProfileVisibilityCommand = Command & {
  readonly commandType: 'SetProfileVisibility'
  readonly payload: ProfileSubjectPayload & {
    readonly isPublic: boolean
  }
}

export type PublishProfileCommand = Command & {
  readonly commandType: 'PublishProfile'
  readonly payload: ProfileSubjectPayload
}

export type UnpublishProfileCommand = Command & {
  readonly commandType: 'UnpublishProfile'
  readonly payload: ProfileSubjectPayload
}

export type UpdateUserSettingsCommand = Command & {
  readonly commandType: 'UpdateUserSettings'
  readonly payload: {
    readonly userId: string
    readonly settingsPatch: Readonly<Record<string, unknown>>
  }
}
