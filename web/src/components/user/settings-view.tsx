import {

  PmForm,

  PmFormActions,

  PmFormField,

  PmFormReadonly,

  PmFormReadonlyField,

  PmFormReadonlySection,

  PmFormSection,

} from '@/components/forms/pm-form-index'
import { useState } from 'react'

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
import { useProductLanguage } from '@/providers/product-language-provider'
import type { ProductLanguageOverrides } from '../../../../packages/product-language/src/index.ts'

import type { DocumentDirection } from '@/components/layout/pm-direction-bridge'



const DIRECTION_OPTIONS: { value: DocumentDirection; label: string; hint: string }[] = [

  { value: 'ltr', label: 'English (LTR)', hint: 'Left-to-right layout' },

  { value: 'rtl', label: 'العربية (RTL)', hint: 'Right-to-left layout' },

]



/** User settings page — account, preferences, security stubs preserved. */

export function SettingsView() {

  const { user } = useAuth()

  const { direction, setDirection } = usePmDirection()
  const {
    locale,
    tenantId,
    canEdit,
    settings,
    productLanguage,
    updateSettings,
  } = useProductLanguage()

  const [languageDraft, setLanguageDraft] = useState<ProductLanguageOverrides>(() => settings?.overrides ?? {})

  function setEntityLabelField(
    entity: 'opportunity' | 'negotiation' | 'commercialAgreement' | 'contract' | 'execution',
    field: 'label' | 'plural',
    value: string,
  ) {
    setLanguageDraft((prev) => ({
      ...prev,
      entities: {
        ...prev.entities,
        [entity]: {
          ...prev.entities?.[entity],
          [field]: value,
        },
      },
    }))
  }

  function setActionField(
    action:
      | 'createOpportunity'
      | 'startNegotiation'
      | 'createCommercialAgreement'
      | 'generateContract'
      | 'startExecution',
    value: string,
  ) {
    setLanguageDraft((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        [action]: value,
      },
    }))
  }



  return (

    <PmForm
      onSubmit={(e) => {
        e.preventDefault()
        if (canEdit) {
          updateSettings(languageDraft)
        }
      }}

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

      <PmFormSection
        title="Product Language"
        description="Customize user-facing terminology by tenant and locale without changing domain models."
      >
        <div className="space-y-4">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Tenant: {tenantId} · Locale: {locale} · {canEdit ? 'Editable by admin/owner' : 'Read-only for your role'}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <PmFormField id="opportunity-label" label="Opportunity label">
              <Input
                id="opportunity-label"
                value={languageDraft.entities?.opportunity?.label ?? productLanguage.label('opportunity')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('opportunity', 'label', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="opportunity-plural-label" label="Opportunity plural label">
              <Input
                id="opportunity-plural-label"
                value={languageDraft.entities?.opportunity?.plural ?? productLanguage.plural('opportunity')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('opportunity', 'plural', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="negotiation-label" label="Negotiation label">
              <Input
                id="negotiation-label"
                value={languageDraft.entities?.negotiation?.label ?? productLanguage.label('negotiation')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('negotiation', 'label', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="negotiation-plural-label" label="Negotiation plural label">
              <Input
                id="negotiation-plural-label"
                value={languageDraft.entities?.negotiation?.plural ?? productLanguage.plural('negotiation')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('negotiation', 'plural', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="commercial-agreement-label" label="Commercial Agreement label">
              <Input
                id="commercial-agreement-label"
                value={languageDraft.entities?.commercialAgreement?.label ?? productLanguage.label('commercialAgreement')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('commercialAgreement', 'label', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="commercial-agreement-plural-label" label="Commercial Agreement plural label">
              <Input
                id="commercial-agreement-plural-label"
                value={languageDraft.entities?.commercialAgreement?.plural ?? productLanguage.plural('commercialAgreement')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('commercialAgreement', 'plural', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="contract-label" label="Contract label">
              <Input
                id="contract-label"
                value={languageDraft.entities?.contract?.label ?? productLanguage.label('contract')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('contract', 'label', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="contract-plural-label" label="Contract plural label">
              <Input
                id="contract-plural-label"
                value={languageDraft.entities?.contract?.plural ?? productLanguage.plural('contract')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('contract', 'plural', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="execution-label" label="Execution label">
              <Input
                id="execution-label"
                value={languageDraft.entities?.execution?.label ?? productLanguage.label('execution')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('execution', 'label', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="execution-plural-label" label="Execution plural label">
              <Input
                id="execution-plural-label"
                value={languageDraft.entities?.execution?.plural ?? productLanguage.plural('execution')}
                disabled={!canEdit}
                onChange={(event) => setEntityLabelField('execution', 'plural', event.target.value)}
              />
            </PmFormField>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PmFormField id="create-opportunity-label" label="Create Opportunity">
              <Input
                id="create-opportunity-label"
                value={languageDraft.actions?.createOpportunity ?? productLanguage.actionLabel('createOpportunity')}
                disabled={!canEdit}
                onChange={(event) => setActionField('createOpportunity', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="start-negotiation-label" label="Start Negotiation">
              <Input
                id="start-negotiation-label"
                value={languageDraft.actions?.startNegotiation ?? productLanguage.actionLabel('startNegotiation')}
                disabled={!canEdit}
                onChange={(event) => setActionField('startNegotiation', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="create-commercial-agreement-label" label="Create Commercial Agreement">
              <Input
                id="create-commercial-agreement-label"
                value={languageDraft.actions?.createCommercialAgreement ?? productLanguage.actionLabel('createCommercialAgreement')}
                disabled={!canEdit}
                onChange={(event) => setActionField('createCommercialAgreement', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="generate-contract-label" label="Generate Contract">
              <Input
                id="generate-contract-label"
                value={languageDraft.actions?.generateContract ?? productLanguage.actionLabel('generateContract')}
                disabled={!canEdit}
                onChange={(event) => setActionField('generateContract', event.target.value)}
              />
            </PmFormField>
            <PmFormField id="start-execution-label" label="Start Execution">
              <Input
                id="start-execution-label"
                value={languageDraft.actions?.startExecution ?? productLanguage.actionLabel('startExecution')}
                disabled={!canEdit}
                onChange={(event) => setActionField('startExecution', event.target.value)}
              />
            </PmFormField>
          </div>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Last updated: {settings?.updatedAt ?? '—'} by {settings?.updatedBy ?? '—'}
          </p>
        </div>
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



      <PmFormSection title="Security" description="Password and session management.">
        <div className="space-y-3">
          <PmFormField id="current-password" label="Current password">
            <Input type="password" placeholder="Current password" />
          </PmFormField>
          <PmFormField id="new-password" label="New password">
            <Input type="password" placeholder="New password" />
          </PmFormField>
        </div>
      </PmFormSection>



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

