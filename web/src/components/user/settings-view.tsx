import {
  PmForm,
  PmFormActions,
  PmFormField,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'

/** User settings page — account, preferences, security stubs preserved. */
export function SettingsView() {
  const { user } = useAuth()

  return (
    <PmForm
      onSubmit={(e) => e.preventDefault()}
      footer={
        <PmFormActions
          submitLabel="Save changes"
          onSubmit={() => {}}
        />
      }
    >
      <PmFormSection title="Account" description="Your account identity and contact details.">
        <PmFormReadonly>
          <PmFormReadonlySection>
            <PmFormReadonlyField label="Email" value={user?.email} copyable />
            <PmFormReadonlyField label="User ID" value={user?.id} copyable />
            <PmFormReadonlyField label="Role" value={user?.role} />
          </PmFormReadonlySection>
        </PmFormReadonly>
      </PmFormSection>

      <PmFormSection title="Preferences" description="Workspace and locale preferences.">
        <p className="text-sm text-muted-foreground">
          Preference controls will wire when settings API is connected.
        </p>
      </PmFormSection>

      <PmFormSection title="Appearance" description="Theme and display density.">
        <p className="text-sm text-muted-foreground">
          Use the theme toggle in the header for light/dark mode.
        </p>
      </PmFormSection>

      <PmFormSection title="Notifications" description="Email and in-app alert preferences.">
        <p className="text-sm text-muted-foreground">
          Notification preference toggles — placeholder until settings API is connected.
        </p>
      </PmFormSection>

      <PmContentCard title="Security" description="Password and session management.">
        <div className="space-y-3">
          <PmFormField id="current-password" label="Current password">
            <Input type="password" placeholder="Current password" />
          </PmFormField>
          <PmFormField id="new-password" label="New password">
            <Input type="password" placeholder="New password" />
          </PmFormField>
        </div>
      </PmContentCard>

      <PmFormSection title="Read-only information" description="Platform metadata.">
        <PmFormReadonly>
          <PmFormReadonlySection>
            <PmFormReadonlyField label="Account status" value={user?.status} />
            <PmFormReadonlyField
              label="Member since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            />
          </PmFormReadonlySection>
        </PmFormReadonly>
      </PmFormSection>
    </PmForm>
  )
}
