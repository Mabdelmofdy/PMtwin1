import type { CreatedByActor } from '@pm-twin/identity'

export type OwnershipDisplayModel = {
  readonly businessOwnerLabel: string
  readonly createdByLabel: string
  readonly workspaceLabel: string
  readonly representedByLabel?: string
  readonly actionPerformedByLabel?: string
  readonly platformRoleLabel?: string
}

/**
 * Business-friendly ownership labels — never expose raw repository IDs.
 */
export function buildOwnershipDisplay(input: {
  readonly ownerPartyName?: string | null
  readonly workspaceName?: string | null
  readonly createdByUserName?: string | null
  readonly actorUserName?: string | null
  readonly actorWorkspaceRoleLabel?: string | null
  readonly platformRoleLabel?: string | null
  readonly createdByActor?: CreatedByActor | null
  readonly isPersonalWorkspace?: boolean
}): OwnershipDisplayModel {
  const owner =
    input.ownerPartyName?.trim() ||
    (input.isPersonalWorkspace ? 'Personal Workspace owner' : 'Organization')
  const createdBy =
    input.createdByActor?.actorType === 'system'
      ? 'System'
      : input.createdByUserName?.trim() ||
        input.createdByActor?.actorUserId ||
        'Unknown'
  const workspace =
    input.workspaceName?.trim() ||
    (input.isPersonalWorkspace ? 'Personal Workspace' : 'Company Workspace')

  return {
    businessOwnerLabel: owner,
    createdByLabel: createdBy === input.createdByActor?.actorUserId ? 'Unknown' : createdBy,
    workspaceLabel: workspace,
    representedByLabel: input.actorUserName?.trim() || undefined,
    actionPerformedByLabel: input.actorUserName?.trim() || undefined,
    platformRoleLabel: input.platformRoleLabel?.trim() || undefined,
  }
}

export function formatOwnershipSummary(model: OwnershipDisplayModel): string {
  const lines = [
    `Owned by: ${model.businessOwnerLabel}`,
    `Created by: ${model.createdByLabel}`,
    `Workspace: ${model.workspaceLabel}`,
  ]
  if (model.actionPerformedByLabel) {
    lines.push(`Action performed by: ${model.actionPerformedByLabel}`)
  }
  if (model.platformRoleLabel) {
    lines.push(`Platform role: ${model.platformRoleLabel}`)
  }
  return lines.join('\n')
}
