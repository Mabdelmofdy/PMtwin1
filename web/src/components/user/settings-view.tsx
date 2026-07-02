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

import { usePmDirection } from '@/components/layout/pm-direction-provider'

import { Input } from '@/components/ui/input'

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select'

import { pmTypography } from '@/components/shared/pm-design-tokens'

import { useAuth } from '@/providers/auth-provider'
import { formatUserRoleLabel } from '@/components/user/user-display'

import { cn } from '@/lib/utils'

import type { DocumentDirection } from '@/components/layout/pm-direction-bridge'



const DIRECTION_OPTIONS: { value: DocumentDirection; label: string; hint: string }[] = [

  { value: 'ltr', label: 'English (LTR)', hint: 'Left-to-right layout' },

  { value: 'rtl', label: 'العربية (RTL)', hint: 'Right-to-left layout' },

]



/** User settings page — account, preferences, security stubs preserved. */

export function SettingsView() {

  const { user } = useAuth()

  const { direction, setDirection } = usePmDirection()



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

            <PmFormReadonlyField label="Account type" value={formatUserRoleLabel(user?.role)} />

          </PmFormReadonlySection>

        </PmFormReadonly>

      </PmFormSection>



      <PmFormSection title="Preferences" description="My Workspace and locale preferences.">

        <PmFormField id="layout-direction" label="Layout direction">

          <div className="space-y-2">

            <Select

              value={direction}

              onValueChange={(value) => setDirection(value as DocumentDirection)}

            >

              <SelectTrigger id="layout-direction" className="w-full max-w-xs">

                <SelectValue placeholder="Select direction" />

              </SelectTrigger>

              <SelectContent>

                {DIRECTION_OPTIONS.map((option) => (

                  <SelectItem key={option.value} value={option.value}>

                    {option.label}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>

              {DIRECTION_OPTIONS.find((o) => o.value === direction)?.hint}

              {' — '}

              Full i18n copy will wire when settings API is connected.

            </p>

          </div>

        </PmFormField>

      </PmFormSection>



      <PmFormSection title="Appearance" description="Theme and display density.">

        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>

          Use the theme toggle in the header for light/dark mode.

        </p>

      </PmFormSection>



      <PmFormSection title="Notifications" description="Email and in-app alert preferences.">

        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>

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

