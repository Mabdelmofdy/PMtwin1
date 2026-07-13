import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthMarketingColumn,
  AuthMarketingShell,
  MarketingButton,
  MarketingCard,
} from '@/components/marketing/marketing-index'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { useAuth } from '@/providers/auth-provider'
import { resolveBreadcrumbHomeHref } from '@/components/layout/workspace-display'
import {
  submitWizardRegistration,
  validateWizardStep,
  toRegistrationInput,
  createInitialWizardData,
  COMPANY_ROLES,
  INDIVIDUAL_SUBTYPES,
  type WizardStep,
  type RegistrationWizardData,
  type WizardErrors,
  type IndividualType,
  type AccountType,
} from '@/lib/registration-wizard'
import {
  registrationContracts,
  type RegistrationResult,
  type RegistrationValidationErrors,
} from '@/lib/registration-service.ts'
import { resolveOtpDelivery } from '@/domain/otp'
import {
  clearOnboardingDraft,
  isMeaningfulOnboardingDraft,
  readOnboardingDraft,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft-store.ts'

const STEPS = ['Account Type', 'Role', 'Profile Info', 'Documents', 'Review', 'Verification'] as const
const NEXT_STEP: Record<WizardStep, WizardStep> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 }
const PREV_STEP: Record<WizardStep, WizardStep> = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }

type CompletionState = {
  partyType: 'individual' | 'company'
  runtimeLabel: string
}

function runtimeLabel(mode: string): string {
  if (mode === 'demo') return 'Demo'
  if (mode === 'uat') return 'UAT'
  return 'Production'
}

export function LegacyRegisterPage() {
  const { isAuthenticated, isCompanyUser, registerAndSignIn } = useAuth()
  const navigate = useNavigate()
  const runtimeMode = environmentContext.runtimeMode
  const isLocalSignupRuntime = runtimeMode === 'demo' || runtimeMode === 'uat'

  const [step, setStep] = useState<WizardStep>(0)
  const [form, setForm] = useState<RegistrationWizardData>(createInitialWizardData)
  const [fieldErrors, setFieldErrors] = useState<WizardErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completion, setCompletion] = useState<CompletionState | null>(null)
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)
  const recoveredKeys = useRef(new Set<string>())

  useEffect(() => {
    const emailKey =
      form.accountType === 'company'
        ? form.businessEmail.trim()
        : form.email.trim()
    if (!emailKey || !isMeaningfulOnboardingDraft(form)) return
    const kind =
      form.accountType === 'company' ? 'company' : 'individual'
    const handle = window.setTimeout(() => {
      saveOnboardingDraft({
        savedAt: new Date().toISOString(),
        kind,
        identityKey: emailKey,
        activeStep: step,
        data: form,
        profileCompletionPercent: 0,
      })
    }, 600)
    return () => window.clearTimeout(handle)
  }, [form, step])

  useEffect(() => {
    const emailKey =
      form.accountType === 'company'
        ? form.businessEmail.trim()
        : form.email.trim()
    if (!emailKey || form.otpVerified) return
    const recoverKey = `${form.accountType ?? 'individual'}:${emailKey}`
    if (recoveredKeys.current.has(recoverKey)) return
    const kind =
      form.accountType === 'company' ? 'company' : 'individual'
    const draft = readOnboardingDraft(kind, emailKey)
    if (!draft || !isMeaningfulOnboardingDraft(draft.data)) return
    recoveredKeys.current.add(recoverKey)
    setForm(draft.data)
    setStep(draft.activeStep as WizardStep)
    setDraftNotice(`Draft restored from ${new Date(draft.savedAt).toLocaleString()}`)
  }, [form.email, form.businessEmail, form.accountType, form.otpVerified])

  const accountTypeLabel = useMemo(() => (form.accountType === 'company' ? 'Company' : 'Individual'), [form.accountType])
  const branchTitle = useMemo(() => {
    if (form.accountType === 'company') return 'Company verification path'
    if (form.individualType === 'consultant') return 'Consultant verification path'
    return 'Professional verification path'
  }, [form.accountType, form.individualType])

  if (isAuthenticated && !completion) {
    navigate(resolveBreadcrumbHomeHref('/', isCompanyUser), { replace: true })
    return null
  }

  const update = <K extends keyof RegistrationWizardData>(key: K, value: RegistrationWizardData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  const onNext = () => {
    const errors = validateWizardStep(step, form)
    setFieldErrors(errors)
    setSubmitError(null)
    if (Object.keys(errors).length > 0) return
    setStep((prev) => NEXT_STEP[prev])
  }

  const onBack = () => {
    setSubmitError(null)
    setStep((prev) => PREV_STEP[prev])
  }

  const registrationEmail =
    form.accountType === 'company' ? form.businessEmail.trim() : form.email.trim()

  const sendOtp = async () => {
    setOtpBusy(true)
    setOtpMessage(null)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.otpCode
      return next
    })
    const otp = resolveOtpDelivery()
    const result = await otp.send({
      channel: 'email',
      destination: registrationEmail,
      purpose: 'registration',
    })
    setOtpBusy(false)
    if (!result.ok) {
      setOtpMessage(result.message)
      return
    }
    update('otpChallengeId', result.challenge.challengeId)
    update('otpVerified', false)
    update('otpDebugHint', result.challenge.debugCode ?? '')
    setOtpMessage(
      result.challenge.debugCode
        ? `Code sent. Demo/UAT code: ${result.challenge.debugCode}`
        : 'Verification code sent to your email.',
    )
  }

  const verifyOtp = async () => {
    if (!form.otpChallengeId) {
      setOtpMessage('Send a verification code first.')
      return
    }
    setOtpBusy(true)
    setOtpMessage(null)
    const otp = resolveOtpDelivery()
    const result = await otp.verify({
      challengeId: form.otpChallengeId,
      code: form.otpCode,
    })
    setOtpBusy(false)
    if (!result.ok) {
      setOtpMessage(result.message)
      update('otpVerified', false)
      return
    }
    update('otpVerified', true)
    update('verificationChoice', 'complete')
    setOtpMessage('Email verified successfully.')
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const stepErrors = validateWizardStep(step, form)
    setFieldErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    setSubmitError(null)
    setNotice(null)
    setIsSubmitting(true)

    const input = toRegistrationInput(form)
    const result: RegistrationResult = isLocalSignupRuntime
      ? await registerAndSignIn(input)
      : await submitWizardRegistration(form)
    setIsSubmitting(false)

    if (!result.ok) {
      const serviceFieldErrors = (result.fieldErrors ?? {}) as RegistrationValidationErrors
      setFieldErrors(serviceFieldErrors)
      if (result.code === 'BACKEND_UNAVAILABLE') {
        setNotice(
          'Registration details are ready, but the production registration API is not active yet. No account has been created.',
        )
        return
      }
      setSubmitError(result.message)
      return
    }

    setCompletion({
      partyType: result.partyType,
      runtimeLabel: runtimeLabel(runtimeMode),
    })
    const emailKey =
      form.accountType === 'company'
        ? form.businessEmail.trim()
        : form.email.trim()
    if (emailKey) {
      clearOnboardingDraft(
        form.accountType === 'company' ? 'company' : 'individual',
        emailKey,
      )
    }
  }

  const continueToDashboard = () => {
    navigate(resolveBreadcrumbHomeHref('/', resultPartyIsCompany(completion)), {
      replace: true,
    })
  }

  const mappedRequest = useMemo(() => toRegistrationInput(form), [form])

  return (
    <AuthMarketingShell
      pageClassName="pm-register-page"
      formLabel="Registration wizard"
      marketing={
        <AuthMarketingColumn
          kicker="Registration"
          kickerIcon="ph-user-plus"
          title="Create your workspace in guided steps."
          description="Choose a Personal Workspace or Company Workspace, then complete your profile."
        />
      }
    >
      <div className="reg-main-card">
        {completion ? (
          <section className="reg-completion-screen" aria-label="Registration complete">
            <header className="reg-header mb-6">
              <h1 className="reg-header-title text-2xl font-bold text-gray-900">
                {completion.partyType === 'company'
                  ? 'Company Workspace Created'
                  : 'Personal Workspace Created'}
              </h1>
              <p className="reg-header-subtitle mt-1 text-gray-600">
                Account created and pending review. You can browse now, and full actions unlock
                after approval.
              </p>
            </header>
            <dl className="mb-6 space-y-3 text-sm">
              {completion.partyType === 'company' ? (
                <>
                  <ReviewRow label="Party" value="Company Party" />
                  <ReviewRow label="Primary Membership" value="Owner" />
                </>
              ) : (
                <>
                  <ReviewRow label="Party" value="Individual" />
                  <ReviewRow label="Primary Role" value="Owner" />
                </>
              )}
              <ReviewRow label="Runtime" value={completion.runtimeLabel} />
            </dl>
            <MarketingButton type="button" variant="primary" onClick={continueToDashboard}>
              Continue to Dashboard
            </MarketingButton>
          </section>
        ) : (
          <>
        <header className="reg-header mb-5">
          <h1 className="reg-header-title text-2xl font-bold text-gray-900">Create your workspace</h1>
          <p className="reg-header-subtitle mt-1 text-gray-600">
            {isLocalSignupRuntime
              ? 'Quick setup — saved locally in this browser for Demo/UAT.'
              : 'Complete a few steps to join PM-Twin.'}
          </p>
        </header>

        <div className="reg-wizard-progress" aria-label="Registration progress">
          <div className="reg-wizard-progress-track">
            <div
              className="reg-wizard-progress-fill"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="reg-wizard-progress-meta">
            <span>
              Step <strong>{step + 1}</strong> of {STEPS.length}
            </span>
            <strong>{STEPS[step]}</strong>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {step === 0 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Account type">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">Select workspace type</h2>
              <p className="mb-6 text-gray-600">Choose a Personal Workspace or Company Workspace.</p>
              <AccountTypeGrid accountType={form.accountType} onChange={(type) => update('accountType', type)} />
              {fieldErrors.accountType ? <ErrorText text={fieldErrors.accountType} /> : null}
            </section>
          ) : null}

          {step === 1 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Role selection">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">Role</h2>
              {form.accountType === 'company' ? (
                <>
                  <SelectField
                    id="company-role"
                    label="Company role"
                    value={form.companyRole}
                    options={COMPANY_ROLES.map((role) => ({ value: role, label: role }))}
                    onChange={(value) => update('companyRole', value)}
                    error={fieldErrors.companyRole}
                  />
                  <Field
                    id="company-subtype"
                    label="Sub-type (optional)"
                    value={form.companySubType}
                    onChange={(value) => update('companySubType', value)}
                  />
                </>
              ) : (
                <>
                  <div className="reg-account-type-grid grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {(
                      [
                        ['professional', 'Professional', 'Delivery and execution specialists'],
                        ['consultant', 'Consultant', 'Advisory and strategic specialists'],
                      ] as const
                    ).map(([value, title, body]) => (
                      <label
                        key={value}
                        className={`reg-account-card relative flex cursor-pointer flex-col rounded-xl border-2 p-4 ${form.individualType === value ? 'border-primary' : 'border-gray-200'}`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name="individualType"
                          value={value}
                          checked={form.individualType === value}
                          onChange={() => {
                            update('individualType', value as IndividualType)
                            update('individualSubType', '')
                          }}
                        />
                        <span className="mb-1 font-semibold text-gray-900">{title}</span>
                        <span className="text-sm text-gray-600">{body}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.individualType ? <ErrorText text={fieldErrors.individualType} /> : null}
                  <SelectField
                    id="individual-subtype"
                    label="Sub-type"
                    value={form.individualSubType}
                    options={(form.individualType ? INDIVIDUAL_SUBTYPES[form.individualType] : []).map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) => update('individualSubType', value)}
                    error={fieldErrors.individualSubType}
                  />
                </>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Profile details">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">{accountTypeLabel} profile information</h2>
              <p className="mb-6 text-sm text-gray-600">
                Required fields are validated before progression. Password minimum is {registrationContracts.minimumPasswordLength} characters.
              </p>
              {form.accountType === 'company' ? (
                <>
                  <Field id="company-name" label="Company name" value={form.companyName} onChange={(v) => update('companyName', v)} error={fieldErrors.companyName} />
                  <Field id="business-email" label="Business email" type="email" value={form.businessEmail} onChange={(v) => update('businessEmail', v)} error={fieldErrors.businessEmail} />
                  <Field id="contact-person" label="Contact person" value={form.contactPerson} onChange={(v) => update('contactPerson', v)} error={fieldErrors.contactPerson} />
                  <Field id="company-mobile" label="Mobile" value={form.mobile} onChange={(v) => update('mobile', v)} error={fieldErrors.mobile} />
                  <Field id="company-country" label="Country" value={form.country} onChange={(v) => update('country', v)} error={fieldErrors.country} />
                  <Field id="company-region" label="Region" value={form.region} onChange={(v) => update('region', v)} />
                  <Field id="company-city" label="City" value={form.city} onChange={(v) => update('city', v)} />
                  <Field id="company-website" label="Website (optional)" value={form.website} onChange={(v) => update('website', v)} />
                  <Field id="company-industry" label="Industry (optional)" value={form.industry} onChange={(v) => update('industry', v)} />
                  <Field id="company-size" label="Company size (optional)" value={form.companySize} onChange={(v) => update('companySize', v)} />
                  <Field id="company-description" label="Description (optional)" value={form.companyDescription} onChange={(v) => update('companyDescription', v)} />
                  <Field id="company-cr" label="CR number (optional)" value={form.crNumber} onChange={(v) => update('crNumber', v)} />
                  <Field id="company-tax-id" label="Tax ID (optional)" value={form.taxId} onChange={(v) => update('taxId', v)} />
                  <Field id="company-auth-name" label="Authorized representative name (optional)" value={form.authRepName} onChange={(v) => update('authRepName', v)} />
                  <Field id="company-auth-role" label="Authorized representative role (optional)" value={form.authRepRole} onChange={(v) => update('authRepRole', v)} />
                </>
              ) : (
                <>
                  <Field id="full-name" label="Full name" value={form.fullName} onChange={(v) => { update('fullName', v); update('name', v) }} error={fieldErrors.fullName} />
                  <Field id="individual-email" label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} error={fieldErrors.email} />
                  <Field id="individual-mobile" label="Mobile" value={form.mobile} onChange={(v) => update('mobile', v)} error={fieldErrors.mobile} />
                  <Field id="individual-country" label="Country" value={form.country} onChange={(v) => update('country', v)} error={fieldErrors.country} />
                  <Field id="individual-region" label="Region" value={form.region} onChange={(v) => update('region', v)} />
                  <Field id="individual-city" label="City" value={form.city} onChange={(v) => update('city', v)} />
                  <Field id="current-role" label="Current role (optional)" value={form.currentRole} onChange={(v) => update('currentRole', v)} />
                  <Field id="years-experience" label="Years of experience (optional)" value={form.yearsExperience} onChange={(v) => update('yearsExperience', v)} />
                  <Field id="skills" label="Skills (optional)" value={form.skills} onChange={(v) => update('skills', v)} />
                  <Field id="languages" label="Languages (optional)" value={form.languages} onChange={(v) => update('languages', v)} />
                  <Field id="linkedin" label="LinkedIn URL (optional)" value={form.linkedin} onChange={(v) => update('linkedin', v)} />
                  {form.individualType === 'professional' ? (
                    <Field id="specialty" label="Discipline / specialty" value={form.specialty} onChange={(v) => update('specialty', v)} error={fieldErrors.specialty} />
                  ) : (
                    <Field id="expertise" label="Expertise area" value={form.expertise} onChange={(v) => update('expertise', v)} error={fieldErrors.expertise} />
                  )}
                </>
              )}
              <div className="reg-goal-grid mt-6" role="radiogroup" aria-label="Registration intent">
                {(
                  [
                    ['publish', 'Publish opportunities'],
                    ['partner', 'Find partners'],
                    ['explore', 'Explore platform'],
                  ] as const
                ).map(([id, title]) => (
                  <label key={id} className={`reg-goal-card${form.intent === id ? ' is-selected' : ''}`}>
                    <input type="radio" className="sr-only" checked={form.intent === id} onChange={() => update('intent', id)} />
                    <strong>{title}</strong>
                  </label>
                ))}
              </div>
              <Field id="password" label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} error={fieldErrors.password} />
              <Field id="confirm-password" label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} error={fieldErrors.confirmPassword} />
            </section>
          ) : null}

          {step === 3 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Documents and terms">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">Documents & terms</h2>
              <p className="mb-4 text-sm text-gray-600">
                This mirrors POC structure. Document details are collected in UI only and are not submitted to backend yet.
              </p>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MarketingCard title="Required document set">
                  <p className="text-sm text-slate-600">
                    {form.accountType === 'company'
                      ? 'Commercial Registration, representative identity, and compliance records.'
                      : 'Identity and qualification documents aligned with your role.'}
                  </p>
                </MarketingCard>
                <MarketingCard title="Data handling">
                  <p className="text-sm text-slate-600">
                    Sensitive files are not uploaded in this phase. Final submission remains blocked until production API is active.
                  </p>
                </MarketingCard>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.termsAccepted} onChange={(event) => update('termsAccepted', event.target.checked)} className="mt-0.5" />
                <span>
                  I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link>.
                </span>
              </label>
              {fieldErrors.termsAccepted ? <ErrorText text={fieldErrors.termsAccepted} /> : null}
            </section>
          ) : null}

          {step === 4 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Review details">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">Review & submit</h2>
              <p className="mb-4 text-sm text-gray-600">Review key registration information before final verification.</p>
              <dl className="space-y-2 text-sm">
                <ReviewRow label="Path" value={branchTitle} />
                <ReviewRow
                  label="Display name"
                  value={mappedRequest.accountType === 'company' ? mappedRequest.companyName : mappedRequest.name}
                />
                <ReviewRow
                  label="Email"
                  value={mappedRequest.accountType === 'company' ? mappedRequest.businessEmail : mappedRequest.email}
                />
                <ReviewRow label="Intent" value={mappedRequest.intent || '—'} />
                <ReviewRow label="Terms" value={form.termsAccepted ? 'Accepted' : 'Not accepted'} />
              </dl>
            </section>
          ) : null}

          {step === 5 ? (
            <section className="reg-step-content reg-step-card mb-6" aria-label="Email verification">
              <h2 className="reg-step-title mb-2 text-lg font-semibold text-gray-900">
                Verify your email
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                Enter the one-time code sent to <strong>{registrationEmail || 'your email'}</strong>.
                The same verification UX will use SMS/email providers in production.
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="reg-wizard-btn reg-wizard-btn--secondary"
                  onClick={() => void sendOtp()}
                  disabled={otpBusy || !registrationEmail}
                >
                  {form.otpChallengeId ? 'Resend code' : 'Send code'}
                </button>
              </div>
              <Field
                id="otp-code"
                label="Verification code"
                value={form.otpCode}
                onChange={(v) => {
                  update('otpCode', v)
                  update('otpVerified', false)
                }}
                autoComplete="one-time-code"
                error={fieldErrors.otpCode}
              />
              <button
                type="button"
                className="reg-wizard-btn reg-wizard-btn--primary mb-3"
                onClick={() => void verifyOtp()}
                disabled={otpBusy || !form.otpCode.trim()}
              >
                Verify code
              </button>
              {form.otpVerified ? (
                <p className="mb-2 text-sm font-medium text-emerald-700" role="status">
                  Email verified
                </p>
              ) : null}
              {otpMessage ? (
                <p className="mb-2 text-sm text-gray-700" role="status">
                  {otpMessage}
                </p>
              ) : null}
              {isLocalSignupRuntime && form.otpDebugHint ? (
                <p className="text-xs text-amber-700">
                  Demo/UAT debug code: {form.otpDebugHint}
                </p>
              ) : null}
            </section>
          ) : null}

          {submitError ? <div className="alert alert-error mb-4" role="alert">{submitError}</div> : null}
          {notice ? <div className="reg-preview-notice mb-4" role="status">{notice}</div> : null}
          {draftNotice ? (
            <div className="reg-preview-notice mb-4" role="status">
              {draftNotice}
            </div>
          ) : null}

          <div className="reg-wizard-footer">
            <button
              id="reg-btn-back"
              type="button"
              className="reg-wizard-btn reg-wizard-btn--secondary"
              onClick={onBack}
              disabled={step === 0 || isSubmitting}
            >
              Back
            </button>
            {step < 5 ? (
              <button
                id="reg-btn-next"
                type="button"
                className="reg-wizard-btn reg-wizard-btn--primary"
                onClick={onNext}
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                id="reg-btn-submit"
                type="submit"
                className="reg-wizard-btn reg-wizard-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            )}
          </div>
        </form>

        <p className="reg-wizard-signin-hint">
          Already have an account? <Link to="/login">{PUBLIC_CTA.signInDemo}</Link>
        </p>
          </>
        )}
      </div>
    </AuthMarketingShell>
  )
}

function resultPartyIsCompany(completion: CompletionState | null): boolean {
  return completion?.partyType === 'company'
}

function AccountTypeGrid({
  accountType,
  onChange,
}: {
  accountType: AccountType | null
  onChange: (type: AccountType) => void
}) {
  return (
    <div className="reg-account-type-grid grid grid-cols-1 gap-5 sm:grid-cols-2">
      {(
        [
          ['company', 'Company Workspace', 'For teams looking for collaborations and partnerships.', 'ph-buildings'],
          ['individual', 'Personal Workspace', 'For professionals and consultants working independently.', 'ph-user'],
        ] as const
      ).map(([value, title, body, icon]) => (
        <label
          key={value}
          className={`reg-account-card relative flex cursor-pointer flex-col rounded-xl border-2 p-6 transition-all hover:border-primary/70 hover:shadow-lg${
            accountType === value ? ' border-primary' : ' border-gray-200'
          }`}
        >
          <span className="reg-account-card-check absolute end-4 top-4 text-primary" aria-hidden="true">
            <i className="ph-fill ph-check-circle text-xl" />
          </span>
          <input
            type="radio"
            name="accountType"
            value={value}
            className="sr-only"
            checked={accountType === value}
            onChange={() => onChange(value as AccountType)}
          />
          <span
            className="reg-account-icon mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <i className={`ph-duotone ${icon} text-3xl`} />
          </span>
          <span className="mb-1 font-semibold text-gray-900">{title}</span>
          <p className="text-sm text-gray-600">{body}</p>
        </label>
      ))}
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  error?: string
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-900">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-gray-300 px-4 py-3"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-900">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <ErrorText text={error} /> : null}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem,1fr] gap-2 rounded border border-slate-100 px-3 py-2">
      <dt className="font-medium text-slate-900">{label}</dt>
      <dd className="text-slate-600">{value}</dd>
    </div>
  )
}

function ErrorText({ text }: { text: string }) {
  return <p className="mt-2 text-sm text-red-600">{text}</p>
}
