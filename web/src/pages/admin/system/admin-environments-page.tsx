import { EnvironmentManagementPanel } from '@/components/admin/environment-management-panel.tsx'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminEnvironmentsPage() {
  return (
    <PmPage
      header={
        <PmPageHeader
          label="System"
          title="Environments"
          description="Demo/UAT environment bootstrap and LocalStorage namespace controls."
        />
      }
    >
      <EnvironmentManagementPanel />
    </PmPage>
  )
}
