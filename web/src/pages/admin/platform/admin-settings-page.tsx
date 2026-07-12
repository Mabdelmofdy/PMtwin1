import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ADMIN_SETTINGS_REGISTRY,
  executeResetAdminSettingsSection,
  executeUpdateAdminSettingsSection,
  getEffectiveAdminSettings,
  type AdminSettingsSectionId,
  type AdminSettingsSections,
} from '@/domain/admin/settings/index.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { formatDate } from '@/lib/format'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPage, PmPageHeader } from '@/components/ui/pm-index'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function canManageSection(role: string | undefined, capability: string): boolean {
  return (
    hasAdminCapability(role, 'admin.settings.manage') ||
    hasAdminCapability(role, capability as never)
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>
  )
}

function textInputClassName(): string {
  return 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
}

export function AdminSettingsPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const document = useMemo(() => getEffectiveAdminSettings(), [version])
  const [activeSection, setActiveSection] = useState<AdminSettingsSectionId>('general')
  const [draft, setDraft] = useState<AdminSettingsSections>(document.sections)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(document.sections)
    setDirty(false)
    setFieldErrors({})
    setSaveState('idle')
  }, [document, activeSection, version])

  const def = ADMIN_SETTINGS_REGISTRY.find((entry) => entry.id === activeSection)!
  const canEdit = canManageSection(user?.role, def.capability)
  const meta = document.sectionMeta[activeSection]

  function updateField<K extends keyof AdminSettingsSections[typeof activeSection]>(
    key: K,
    value: AdminSettingsSections[typeof activeSection][K],
  ): void {
    setDraft((prev) => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        [key]: value,
      },
    }))
    setDirty(true)
    setSaveState('idle')
  }

  function handleCancel(): void {
    setDraft(document.sections)
    setDirty(false)
    setFieldErrors({})
    setSaveState('idle')
  }

  function handleSave(): void {
    if (!user?.id) {
      toast.error('Signed-in admin required')
      return
    }
    if (!canEdit) {
      toast.error('Missing capability to edit this section')
      return
    }
    setSaveState('saving')
    const result = executeUpdateAdminSettingsSection({
      sectionId: activeSection,
      value: draft[activeSection],
      actorId: user.id,
      actorRole: user.role,
    })
    if (!result.ok) {
      setSaveState('error')
      setFieldErrors(result.fieldErrors ?? {})
      toast.error(result.error ?? 'Save failed')
      return
    }
    setFieldErrors({})
    setDirty(false)
    setSaveState('saved')
    toast.success(`${def.title} settings saved`)
  }

  function handleResetSection(): void {
    if (!user?.id || !canEdit) return
    const confirmed = window.confirm(`Reset ${def.title} to Demo/UAT defaults?`)
    if (!confirmed) return
    const result = executeResetAdminSettingsSection({
      sectionId: activeSection,
      actorId: user.id,
      actorRole: user.role,
    })
    if (!result.ok) {
      toast.error(result.error ?? 'Reset failed')
      return
    }
    toast.success(`${def.title} reset to defaults`)
  }

  const sectionValue = draft[activeSection]

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Platform Configuration"
          title="Settings"
          description={`Functional Demo/UAT configuration persisted in the ${environmentContext.runtimeMode.toUpperCase()} LocalStorage namespace.`}
          badges={
            <div className="flex flex-wrap gap-2">
              <PmBadge tone="muted">{environmentContext.runtimeMode.toUpperCase()}</PmBadge>
              {canEdit ? (
                <PmBadge tone="success">Editable</PmBadge>
              ) : (
                <PmBadge tone="warning">Read-only</PmBadge>
              )}
              {dirty ? <PmBadge tone="warning">Unsaved changes</PmBadge> : null}
              {saveState === 'saved' ? <PmBadge tone="success">Saved</PmBadge> : null}
              {saveState === 'error' ? <PmBadge tone="danger">Error</PmBadge> : null}
            </div>
          }
        />
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {ADMIN_SETTINGS_REGISTRY.map((entry) => (
          <PmButton
            key={entry.id}
            size="sm"
            variant={entry.id === activeSection ? 'default' : 'outline'}
            onClick={() => {
              if (dirty && entry.id !== activeSection) {
                const leave = window.confirm('Discard unsaved changes in this section?')
                if (!leave) return
              }
              setActiveSection(entry.id)
            }}
          >
            {entry.title}
          </PmButton>
        ))}
        <Link
          className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
          to="/admin/feature-flags"
        >
          Feature Flags
        </Link>
        <Link
          className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
          to="/admin/audit"
        >
          Audit
        </Link>
      </div>

      <PmContentCard
        title={def.title}
        description={def.description}
      >
        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
          <p>
            Last modified:{' '}
            {meta?.updatedAt ? formatDate(meta.updatedAt) : 'Defaults (never overridden)'}
          </p>
          <p>Modified by: {meta?.updatedBy ?? 'system defaults'}</p>
          {meta?.updatedByRole ? <p>Role: {meta.updatedByRole}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {activeSection === 'general' && (
            <>
              <Field label="Platform display name" error={fieldErrors.platformDisplayName}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).platformDisplayName}
                  disabled={!canEdit}
                  onChange={(e) => updateField('platformDisplayName' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Support email" error={fieldErrors.supportEmail}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).supportEmail}
                  disabled={!canEdit}
                  onChange={(e) => updateField('supportEmail' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Default country" error={fieldErrors.defaultCountry}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).defaultCountry}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultCountry' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Default currency" error={fieldErrors.defaultCurrency}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).defaultCurrency}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultCurrency' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Timezone" error={fieldErrors.timezone}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).timezone}
                  disabled={!canEdit}
                  onChange={(e) => updateField('timezone' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Default locale">
                <select
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).defaultLocale}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultLocale' as never, e.target.value as never)}
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </Field>
              <Field label="Default landing path" error={fieldErrors.defaultLandingPath}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['general']).defaultLandingPath}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultLandingPath' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Registration open">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['general']).registrationOpen}
                  disabled={!canEdit}
                  onChange={(e) => updateField('registrationOpen' as never, e.target.checked as never)}
                />
              </Field>
            </>
          )}

          {activeSection === 'access' && (
            <>
              <Field label="Default invite role">
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['access']).defaultInviteRole}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultInviteRole' as never, e.target.value as never)}
                />
              </Field>
              <Field label="Invitation expiry (days)" error={fieldErrors.invitationExpiryDays}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['access']).invitationExpiryDays}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('invitationExpiryDays' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Local session idle (minutes)" error={fieldErrors.localSessionIdleMinutes}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['access']).localSessionIdleMinutes}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('localSessionIdleMinutes' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Require reason on sensitive actions">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['access']).requireReasonOnSensitiveActions
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('requireReasonOnSensitiveActions' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Confirm dangerous Admin actions">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['access']).confirmDangerousAdminActions
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('confirmDangerousAdminActions' as never, e.target.checked as never)
                  }
                />
              </Field>
            </>
          )}

          {activeSection === 'vetting' && (
            <>
              <Field label="At-risk days" error={fieldErrors.atRiskDays}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['vetting']).atRiskDays}
                  disabled={!canEdit}
                  onChange={(e) => updateField('atRiskDays' as never, Number(e.target.value) as never)}
                />
              </Field>
              <Field label="Overdue days" error={fieldErrors.overdueDays}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['vetting']).overdueDays}
                  disabled={!canEdit}
                  onChange={(e) => updateField('overdueDays' as never, Number(e.target.value) as never)}
                />
              </Field>
              <Field label="Clarification max requests" error={fieldErrors.clarificationMaxRequests}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['vetting']).clarificationMaxRequests}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('clarificationMaxRequests' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Expiry warning days">
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['vetting']).expiryWarningDays}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('expiryWarningDays' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Escalate after days">
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['vetting']).escalateAfterDays}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('escalateAfterDays' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Auto-assign reviewers">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['vetting']).autoAssignReviewers}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('autoAssignReviewers' as never, e.target.checked as never)
                  }
                />
              </Field>
            </>
          )}

          {activeSection === 'matching' && (
            <>
              <Field label="Candidate max" error={fieldErrors.candidateMax}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['matching']).candidateMax}
                  disabled={!canEdit}
                  onChange={(e) => updateField('candidateMax' as never, Number(e.target.value) as never)}
                />
              </Field>
              <Field label="Post-to-post threshold" error={fieldErrors.postToPostThreshold}>
                <input
                  type="number"
                  step="0.01"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['matching']).postToPostThreshold}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('postToPostThreshold' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Min skill score" error={fieldErrors.minSkillScoreForMatch}>
                <input
                  type="number"
                  step="0.01"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['matching']).minSkillScoreForMatch}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('minSkillScoreForMatch' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="High-match UI threshold" error={fieldErrors.highMatchUiThreshold}>
                <input
                  type="number"
                  step="0.01"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['matching']).highMatchUiThreshold}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('highMatchUiThreshold' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Matching algorithm, topology derivation, and hard business rules are unchanged —
                these values feed the existing matching config adapter only.
              </p>
            </>
          )}

          {activeSection === 'marketplace' && (
            <>
              <Field label="Show taxonomy gap (13/15) in Admin">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['marketplace']).showUnimplementedTaxonomyGap
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('showUnimplementedTaxonomyGap' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Moderation requires reason">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['marketplace']).moderationRequireReason
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('moderationRequireReason' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Featured opportunity highlight">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['marketplace']).featuredOpportunityHighlight
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('featuredOpportunityHighlight' as never, e.target.checked as never)
                  }
                />
              </Field>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                No Match Type picker. Taxonomy remains package-authored (13 implemented / target 15 /
                gap 2). Public marketplace stays published-only.
              </p>
            </>
          )}

          {activeSection === 'commercial' && (
            <>
              <Field label="Enabled currencies (comma-separated)" error={fieldErrors.enabledCurrencies}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['commercial']).enabledCurrencies.join(
                    ', ',
                  )}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField(
                      'enabledCurrencies' as never,
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean) as never,
                    )
                  }
                />
              </Field>
              <Field label="VAT rate %" error={fieldErrors.vatRatePercent}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['commercial']).vatRatePercent}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('vatRatePercent' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Show VAT-inclusive labels">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['commercial']).showVatInclusiveLabels
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('showVatInclusiveLabels' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Require award confirm reason">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['commercial']).requireAwardConfirmReason
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('requireAwardConfirmReason' as never, e.target.checked as never)
                  }
                />
              </Field>
            </>
          )}

          {activeSection === 'contract' && (
            <>
              <Field label="Contract number prefix" error={fieldErrors.contractNumberPrefix}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['contract']).contractNumberPrefix}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('contractNumberPrefix' as never, e.target.value as never)
                  }
                />
              </Field>
              <Field label="Expiry warning days" error={fieldErrors.expiryWarningDays}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['contract']).expiryWarningDays}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('expiryWarningDays' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <Field label="Show legal review badge">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['contract']).showLegalReviewBadge}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('showLegalReviewBadge' as never, e.target.checked as never)
                  }
                />
              </Field>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <Field label="In-app notifications enabled">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['notifications']).inAppEnabled}
                  disabled={!canEdit}
                  onChange={(e) => updateField('inAppEnabled' as never, e.target.checked as never)}
                />
              </Field>
              <Field label="Notify vetting overdue">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['notifications']).notifyVettingOverdue
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('notifyVettingOverdue' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Notify matching completed">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['notifications']).notifyMatchingCompleted
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('notifyMatchingCompleted' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Preview external templates (no delivery)">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['notifications']).previewExternalTemplates
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('previewExternalTemplates' as never, e.target.checked as never)
                  }
                />
              </Field>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                External email/SMS/WhatsApp delivery is a Future Production Dependency. Preview
                templates do not send messages.
              </p>
            </>
          )}

          {activeSection === 'localization' && (
            <>
              <Field label="Enable English" error={fieldErrors.enableEnglish}>
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['localization']).enableEnglish}
                  disabled={!canEdit}
                  onChange={(e) => updateField('enableEnglish' as never, e.target.checked as never)}
                />
              </Field>
              <Field label="Enable Arabic">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={(sectionValue as AdminSettingsSections['localization']).enableArabic}
                  disabled={!canEdit}
                  onChange={(e) => updateField('enableArabic' as never, e.target.checked as never)}
                />
              </Field>
              <Field label="Default direction">
                <select
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['localization']).defaultDirection}
                  disabled={!canEdit}
                  onChange={(e) => updateField('defaultDirection' as never, e.target.value as never)}
                >
                  <option value="auto">Auto</option>
                  <option value="ltr">LTR</option>
                  <option value="rtl">RTL</option>
                </select>
              </Field>
            </>
          )}

          {activeSection === 'branding' && (
            <>
              <Field label="Primary color" error={fieldErrors.brandPrimaryColor}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['branding']).brandPrimaryColor}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('brandPrimaryColor' as never, e.target.value as never)
                  }
                />
              </Field>
              <Field label="Accent color" error={fieldErrors.brandAccentColor}>
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['branding']).brandAccentColor}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('brandAccentColor' as never, e.target.value as never)
                  }
                />
              </Field>
              <Field label="Logo URL">
                <input
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['branding']).logoUrl}
                  disabled={!canEdit}
                  onChange={(e) => updateField('logoUrl' as never, e.target.value as never)}
                />
              </Field>
            </>
          )}

          {activeSection === 'readiness' && (
            <>
              <Field label="Show readiness warnings in Admin">
                <input
                  type="checkbox"
                  className="mt-2 h-4 w-4"
                  checked={
                    (sectionValue as AdminSettingsSections['readiness']).showReadinessWarningsInAdmin
                  }
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('showReadinessWarningsInAdmin' as never, e.target.checked as never)
                  }
                />
              </Field>
              <Field label="Warn below score (presentation)" error={fieldErrors.warnBelowScore}>
                <input
                  type="number"
                  className={textInputClassName()}
                  value={(sectionValue as AdminSettingsSections['readiness']).warnBelowScore}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateField('warnBelowScore' as never, Number(e.target.value) as never)
                  }
                />
              </Field>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Readiness engine thresholds are not forked — this section controls Admin presentation
                only.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {canEdit ? (
            <>
              <PmButton onClick={handleSave} disabled={!dirty || saveState === 'saving'}>
                {saveState === 'saving' ? 'Saving…' : 'Save section'}
              </PmButton>
              <PmButton variant="outline" onClick={handleCancel} disabled={!dirty}>
                Cancel
              </PmButton>
              <PmButton variant="destructive" onClick={handleResetSection}>
                Reset section to defaults
              </PmButton>
            </>
          ) : (
            <PmBadge tone="warning">Your role cannot mutate this section</PmBadge>
          )}
        </div>
      </PmContentCard>

      <PmContentCard className="mt-4" title="Future Production Dependencies">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Server-authenticated settings API and multi-tenant secrets management</li>
          <li>Real email / SMS / WhatsApp delivery integrations</li>
          <li>Skills catalog editor and CMS site-content publishing</li>
          <li>Production authentication / password policy enforcement</li>
        </ul>
      </PmContentCard>
    </PmPage>
  )
}
