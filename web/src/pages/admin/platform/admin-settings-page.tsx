import { Link } from 'react-router-dom'
import {
  PmForm,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'

/** Platform settings without EnvironmentManagementPanel (moved to /admin/environments). */
export function AdminSettingsPage() {
  return (
    <PmPage
      header={
        <PmPageHeader
          title="Platform settings"
          description="General, branding, security, matching, and feature flags. Environment controls live under System → Environments."
        />
      }
    >
      <PmForm onSubmit={(e) => e.preventDefault()} readOnly>
        <PmFormSection
          title="General"
          description="Vertical settings tabs — wire to system_settings."
        >
          <p className="text-sm text-muted-foreground">
            Settings form migration placeholder. Connect fields when backend wiring is ready.
          </p>
        </PmFormSection>
        <PmFormSection title="Security" description="Authentication and access policies.">
          <p className="text-sm text-muted-foreground">Read-only until settings API is connected.</p>
        </PmFormSection>
        <PmFormSection title="Environments">
          <p className="text-sm text-muted-foreground">
            Environment bootstrap and LocalStorage namespace controls moved to{' '}
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/environments">
              /admin/environments
            </Link>
            .
          </p>
        </PmFormSection>
      </PmForm>
    </PmPage>
  )
}
