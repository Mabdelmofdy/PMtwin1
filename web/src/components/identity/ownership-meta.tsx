import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import {
  buildOwnershipDisplay,
  type OwnershipDisplayModel,
} from '@/domain/identity/ownership-display.ts'

type OwnershipMetaProps = {
  readonly ownerPartyName?: string | null
  readonly workspaceName?: string | null
  readonly createdByUserName?: string | null
  readonly actorUserName?: string | null
  readonly platformRoleLabel?: string | null
  readonly isPersonalWorkspace?: boolean
  readonly className?: string
  readonly model?: OwnershipDisplayModel
}

export function OwnershipMeta({
  ownerPartyName,
  workspaceName,
  createdByUserName,
  actorUserName,
  platformRoleLabel,
  isPersonalWorkspace,
  className,
  model: modelProp,
}: OwnershipMetaProps) {
  const model =
    modelProp ??
    buildOwnershipDisplay({
      ownerPartyName,
      workspaceName,
      createdByUserName,
      actorUserName,
      platformRoleLabel,
      isPersonalWorkspace,
    })

  return (
    <dl className={cn('grid gap-1 text-start', className)}>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Owned by</dt>
        <dd className={pmTypography.bodySm}>{model.businessOwnerLabel}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Created by</dt>
        <dd className={pmTypography.bodySm}>{model.createdByLabel}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Workspace</dt>
        <dd className={pmTypography.bodySm}>{model.workspaceLabel}</dd>
      </div>
      {model.actionPerformedByLabel ? (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Action performed by
          </dt>
          <dd className={pmTypography.bodySm}>{model.actionPerformedByLabel}</dd>
        </div>
      ) : null}
      {model.platformRoleLabel ? (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Platform role
          </dt>
          <dd className={pmTypography.bodySm}>{model.platformRoleLabel}</dd>
        </div>
      ) : null}
    </dl>
  )
}
