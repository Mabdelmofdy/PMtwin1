import { PmEmptyState, PmButton } from '@/components/ui/pm-index'
import { useNavigate } from 'react-router-dom'

export type AdminPermissionDeniedProps = {
  readonly title?: string
  readonly description?: string
  readonly backHref?: string
}

export function AdminPermissionDenied({
  title = 'Permission denied',
  description = 'You do not have the required admin capability for this surface.',
  backHref = '/admin',
}: AdminPermissionDeniedProps) {
  const navigate = useNavigate()
  return (
    <PmEmptyState
      title={title}
      description={description}
      size="compact"
      action={
        <PmButton size="sm" variant="outline" type="button" onClick={() => navigate(backHref)}>
          Return to Command Center
        </PmButton>
      }
    />
  )
}
