import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import type { DuplicateDraftCandidate } from '@pm-twin/validation'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { CollaborationSubModelFields } from '@/components/opportunity/collaboration-sub-model-fields.tsx'
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import {
  PmFormActions,
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
  PmFormSection,
  PmFormWizard,
  PmFormWizardStep,
} from '@/components/forms/pm-form-index'
import {
  ValueExchangeModesPanel,
  UserJourneyStrip,
} from '@/components/need-offer/need-offer-framework-panels'
import {
  PmButton,
  PmEmptyState,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmSurface,
} from '@/components/ui/pm-index'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import {
  clearLocalDraftSnapshot,
  formatLastSavedAt,
  readLocalDraftSnapshot,
  saveLocalDraftSnapshot,
  type AutosaveStatus,
} from '@/lib/wizard-local-draft.ts'
import { evaluateLiveOpportunityValidation } from '@/domain/opportunity-validation/index.ts'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import { LiveFieldStatus } from '@/components/opportunity/validation/field-validation-status.tsx'
import { SmartRightPanel } from '@/components/opportunity/wizard/smart-right-panel.tsx'
import { ContextualHelp } from '@/components/opportunity/wizard/contextual-help.tsx'
import { DuplicateDraftDialog } from '@/components/opportunity/wizard/duplicate-draft-dialog.tsx'
import {
  DraftRecoveryBanner,
  UnsavedChangesDialog,
} from '@/components/opportunity/wizard/wizard-guards.tsx'
import { CollaborationSummaryCard } from '@/components/opportunity/collaboration-summary-card.tsx'
import { FinancialSummaryCard } from '@/components/opportunity/ocx/financial-summary-card.tsx'
import { WorkPackageSummaryCard } from '@/components/opportunity/ocx/work-package-summary-card.tsx'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/providers/auth-provider'
import {
  buildViewerContext,
  canEditOpportunity,
} from '@/lib/entity-view-visibility.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import {
  deriveMatchingTopology,
  listMainCollaborationModels,
  listSubModelsForMain,
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'
import { evaluateOpportunityWizardReadiness } from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import { skillNames } from '@/domain/opportunity-creation'
import { buildOpportunityExplanationFromForm } from '@/services/explainability/index.ts'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import {
  WIZARD_STEPS,
  resolveWizardStepIndex,
  type WizardStepId,
} from './wizard-steps.ts'
import {
  buildCollaborationCommandPayload,
  buildOpportunityDraftInput,
  initialDraft,
  opportunityToDraft,
  toWizardDraft,
  type OpportunityDraft,
} from './draft-model.ts'
import { StructuredSkillsEditor, ServicesField } from './structured-skills-editor.tsx'
import { WorkPackagesEditor } from './work-packages-editor.tsx'
import { ResourcesCapacityEditor } from './resources-capacity-editor.tsx'
import { CommercialTermsStep } from './commercial-terms-step.tsx'
import { RichTimelineFields } from './rich-timeline-fields.tsx'
import { MarketplacePreviewPanel } from './marketplace-preview-panel.tsx'
import { MatchingInsightPanel } from './matching-insight-panel.tsx'
import { AiSuggestionsPanel } from './ai-suggestions-panel.tsx'

function resolveCompletedSteps(draft: OpportunityDraft): string[] {
  const readiness = evaluateOpportunityWizardReadiness(toWizardDraft(draft))
  const completed: string[] = []
  if (draft.intent) completed.push('type')
  if (readiness.stages.find((s) => s.id === 'basicInfo')?.complete) completed.push('basic')
  if (readiness.stages.find((s) => s.id === 'mainCollaborationModel')?.complete) {
    completed.push('collaboration')
  }
  if (
    draft.structuredSkills.length > 0 ||
    draft.workPackages.length > 0 ||
    draft.services ||
    readiness.stages.find((s) => s.id === 'subModel')?.complete
  ) {
    completed.push('attributes')
  }
  if (
    draft.exchangeMode ||
    Object.keys(draft.commercialTerms).length > 0 ||
    Object.keys(draft.commercialConstraints).length > 0
  ) {
    completed.push('commercial')
  }
  if (readiness.stages.find((s) => s.id === 'timelineLocationSkills')?.complete) {
    completed.push('timeline')
  }
  if (readiness.stages.find((s) => s.id === 'review')?.complete) completed.push('review')
  return completed
}

/** Soft gate before advancing — blocks only when the current step has a hard prerequisite. */
function validateWizardStepAdvance(
  stepId: string,
  draft: OpportunityDraft,
): string | null {
  switch (stepId) {
    case 'type':
      return draft.intent === 'need' || draft.intent === 'offer'
        ? null
        : 'Choose Need or Offer before continuing.'
    case 'basic':
      return draft.title.trim() && draft.description.trim()
        ? null
        : 'Add a title and description before continuing.'
    case 'collaboration':
      return draft.mainCollaborationModel.trim() &&
        draft.subModelType.trim() &&
        draft.paymentModes.length > 0
        ? null
        : 'Select a collaboration model, sub-model, and at least one value exchange mode.'
    default:
      return null
  }
}

function journeyStripStep(activeStepId: string): string {
  switch (activeStepId) {
    case 'type':
      return 'post'
    case 'collaboration':
      return 'model'
    case 'attributes':
      return 'submodel'
    case 'review':
      return 'matching'
    default:
      return 'attributes'
  }
}

export function OpportunityWizardPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const opportunityId = mode === 'edit' ? id : undefined
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isPendingApproval } = useAuth()
  const [draft, setDraft] = useState<OpportunityDraft>(initialDraft)
  const [activeStepId, setActiveStepId] = useState<string>('type')
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoverySnapshot, setRecoverySnapshot] = useState<
    ReturnType<typeof readLocalDraftSnapshot>
  >(null)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [suppressDuplicate, setSuppressDuplicate] = useState(false)
  const [readinessTimeline, setReadinessTimeline] = useState<number[]>([])
  const existingOpportunity = opportunityId
    ? opportunitiesApi.get(opportunityId)
    : undefined
  const resolvedOpportunityId = opportunityId ?? createdOpportunityId
  const autosaveReadyRef = useRef(false)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const trackedStartRef = useRef(false)

  const mainModels = useMemo(() => listMainCollaborationModels(), [])
  const subModelOptions = useMemo(
    () => listSubModelsForMain(draft.mainCollaborationModel),
    [draft.mainCollaborationModel],
  )
  const derivedTopology = useMemo(
    () =>
      deriveMatchingTopology({
        mainCollaborationModel: draft.mainCollaborationModel,
        modelType: draft.modelType,
        subModelType: draft.subModelType,
        exchangeMode: draft.exchangeMode,
        acceptedExchangeModes: draft.paymentModes,
      }),
    [
      draft.mainCollaborationModel,
      draft.modelType,
      draft.subModelType,
      draft.exchangeMode,
      draft.paymentModes,
    ],
  )

  const existingDrafts = useMemo((): readonly DuplicateDraftCandidate[] => {
    if (!user?.id) return []
    return opportunitiesApi
      .list()
      .filter(
        (o) =>
          (o.status ?? '').toLowerCase() === 'draft' &&
          o.creatorId === user.id &&
          o.id !== resolvedOpportunityId,
      )
      .map((o) => ({
        id: o.id,
        title: o.title,
        ownerId: o.ownerPartyId,
        creatorId: o.creatorId,
        mainCollaborationModel: o.mainCollaborationModel,
        subModelType: o.subModelType,
        location: o.location,
        status: o.status,
      }))
  }, [user?.id, resolvedOpportunityId])

  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (!stepParam) return
    if (resolveWizardStepIndex(stepParam) >= 0) {
      setActiveStepId(stepParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (!trackedStartRef.current) {
      trackedStartRef.current = true
      trackOcxEvent('wizard_started', { mode })
    }
  }, [mode])

  useEffect(() => {
    trackOcxEvent('step_viewed', { stepId: activeStepId })
  }, [activeStepId])

  useEffect(() => {
    if (!existingOpportunity) return
    setDraft(opportunityToDraft(existingOpportunity))
    autosaveReadyRef.current = true
    setDirty(false)
  }, [existingOpportunity])

  useEffect(() => {
    const snapshot = readLocalDraftSnapshot(mode, opportunityId)
    if (!snapshot) return
    // Only offer recovery when local snapshot is newer than empty initial / stale page
    setRecoverySnapshot(snapshot)
    setShowRecovery(true)
  }, [mode, opportunityId])

  const opportunityDraft = useMemo(() => {
    const built = buildOpportunityDraftInput(draft)
    return resolvedOpportunityId
      ? { ...existingOpportunity, ...built, id: resolvedOpportunityId }
      : built
  }, [draft, existingOpportunity, resolvedOpportunityId])

  const wizardReadiness = useMemo(
    () => evaluateOpportunityWizardReadiness(toWizardDraft(draft)),
    [draft],
  )

  useEffect(() => {
    const score = Math.round(wizardReadiness.readinessScore)
    setReadinessTimeline((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === score) return prev
      return [...prev, score].slice(-8)
    })
  }, [wizardReadiness.readinessScore])

  const liveValidation = useMemo(
    () =>
      evaluateLiveOpportunityValidation(opportunityDraft as object, {
        existingDrafts,
      }),
    [opportunityDraft, existingDrafts],
  )

  useEffect(() => {
    if (liveValidation.issues.some((i) => i.severity === 'error' || i.severity === 'blocker')) {
      trackOcxEvent('validation_error_seen', {
        count: liveValidation.issues.filter(
          (i) => i.severity === 'error' || i.severity === 'blocker',
        ).length,
      })
    }
  }, [liveValidation.issues])

  useEffect(() => {
    if (
      liveValidation.duplicateDraftWarning &&
      !suppressDuplicate &&
      !duplicateOpen
    ) {
      setDuplicateOpen(true)
      trackOcxEvent('duplicate_warning_seen')
    }
  }, [
    liveValidation.duplicateDraftWarning,
    suppressDuplicate,
    duplicateOpen,
  ])

  const explanationBundle = useMemo(() => {
    if (!resolvedOpportunityId) return null
    return buildOpportunityExplanationFromForm(
      resolvedOpportunityId,
      opportunityDraft as Parameters<typeof buildOpportunityExplanationFromForm>[1],
    )
  }, [resolvedOpportunityId, opportunityDraft])

  const completedStepIds = useMemo(() => resolveCompletedSteps(draft), [draft])
  const errorStepIds = useMemo(() => {
    const steps = new Set<string>()
    for (const issue of liveValidation.issues) {
      if (issue.severity !== 'error' && issue.severity !== 'blocker') continue
      steps.add(resolveStepForValidationIssue(issue))
    }
    return [...steps]
  }, [liveValidation.issues])

  const activeStepIndex = resolveWizardStepIndex(activeStepId)
  const isReviewStep = activeStepId === 'review'
  const draftSubmitLabel = resolvedOpportunityId ? 'Save Draft' : 'Create Draft'

  const nextAction = useMemo(() => {
    const firstError = liveValidation.issues.find(
      (i) => i.severity === 'error' || i.severity === 'blocker',
    )
    if (firstError) {
      return {
        label: firstError.message.replace(/\.$/, '') + ' →',
        stepId: resolveStepForValidationIssue(firstError),
      }
    }
    if (!wizardReadiness.publishReady && wizardReadiness.missingRequired[0]) {
      return {
        label: `Add ${wizardReadiness.missingRequired[0]}`,
        stepId: 'review' as WizardStepId,
      }
    }
    return { label: 'Save draft, then publish from detail', stepId: 'review' as WizardStepId }
  }, [liveValidation.issues, wizardReadiness])

  const updateDraft = <K extends keyof OpportunityDraft>(
    key: K,
    value: OpportunityDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  const syncStructuredSkills = (skills: OpportunityDraft['structuredSkills']) => {
    const names = skillNames(skills)
    setDraft((current) => ({
      ...current,
      structuredSkills: skills,
      skills: names.length > 0 ? names.join(', ') : current.skills,
    }))
    setDirty(true)
  }

  const goToStep = (stepId: string) => {
    setActiveStepId(stepId)
  }

  const handleContinue = () => {
    const gateMessage = validateWizardStepAdvance(activeStepId, draft)
    if (gateMessage) {
      toast.error(gateMessage)
      return
    }
    if (activeStepIndex < 0 || activeStepIndex >= WIZARD_STEPS.length - 1) return
    trackOcxEvent('step_completed', { stepId: activeStepId })
    goToStep(WIZARD_STEPS[activeStepIndex + 1]!.id)
  }

  const handleBack = () => {
    if (activeStepIndex <= 0) {
      window.history.back()
      return
    }
    goToStep(WIZARD_STEPS[activeStepIndex - 1]!.id)
  }

  const handleSaveDraft = () => {
    if (isPendingApproval) {
      toast.error(
        'Account pending vetting. Opportunity creation is blocked until approval.',
      )
      return
    }
    if (!user) {
      toast.error('Sign in to save opportunities.')
      return
    }

    setSaving(true)
    try {
      if (!resolvedOpportunityId) {
        const payload = buildCollaborationCommandPayload(draft, user.id)
        const result = opportunityCommandService.createOpportunity(payload)
        if (!result.success) {
          toast.error(result.errors?.join('\n') ?? 'Could not create opportunity')
          return
        }
        const newId = result.aggregateId
        setCreatedOpportunityId(newId)
        clearLocalDraftSnapshot(mode, opportunityId)
        trackOcxEvent('draft_saved', { opportunityId: newId })
        setDirty(false)
        setAllowNavigation(true)
        toast.success('Draft opportunity created')
        navigate(`/opportunities/${newId}`)
        return
      }

      const updateResult = opportunityCommandService.updateOpportunity(
        resolvedOpportunityId,
        buildCollaborationCommandPayload(draft, user.id),
      )
      if (!updateResult.success) {
        toast.error(updateResult.errors?.join('\n') ?? 'Could not save draft')
        return
      }
      clearLocalDraftSnapshot(mode, resolvedOpportunityId)
      trackOcxEvent('draft_saved', { opportunityId: resolvedOpportunityId })
      setDirty(false)
      setAllowNavigation(true)
      toast.success('Draft saved')
      navigate(`/opportunities/${resolvedOpportunityId}`)
    } finally {
      setSaving(false)
    }
  }

  // Server autosave (authoritative draft update) + local recovery snapshot
  useEffect(() => {
    if (!user) return

    saveLocalDraftSnapshot({
      savedAt: new Date().toISOString(),
      mode,
      opportunityId: resolvedOpportunityId,
      draft,
      activeStepId,
    })

    if (!resolvedOpportunityId) return
    if (mode === 'edit' && !autosaveReadyRef.current) return
    if (mode === 'create' && !createdOpportunityId) return

    setAutosaveStatus('saving')
    const timer = window.setTimeout(() => {
      const result = opportunityCommandService.updateOpportunity(
        resolvedOpportunityId,
        buildCollaborationCommandPayload(draftRef.current, user.id),
      )
      if (!result.success) {
        setAutosaveStatus('error')
        return
      }
      const now = new Date().toISOString()
      setLastSavedAt(now)
      setAutosaveStatus('saved')
      setDirty(false)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [draft, resolvedOpportunityId, user, mode, createdOpportunityId, activeStepId])

  const blocker = useBlocker(dirty && !allowNavigation && !saving)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || allowNavigation) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty, allowNavigation])

  const autosaveLabel =
    autosaveStatus === 'saving'
      ? 'Saving…'
      : autosaveStatus === 'saved'
        ? `Saved · Last saved at ${formatLastSavedAt(lastSavedAt)}`
        : autosaveStatus === 'error'
          ? 'Autosave failed — use Save Draft'
          : null

  if (mode === 'edit' && opportunityId) {
    if (!existingOpportunity) {
      return (
        <PmPage
          header={
            <PmPageHeader
              title="Opportunity not found"
              description="This record may have been removed."
            />
          }
        >
          <PmEmptyState
            title="Opportunity not found"
            description="This record may have been removed or the link is invalid."
            action={
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/opportunities">Back to opportunities</Link>
              </PmButton>
            }
          />
        </PmPage>
      )
    }

    const viewer = buildViewerContext({
      userId: user?.id,
      role: user?.role,
      status: user?.status,
    })
    if (!canEditOpportunity(existingOpportunity, viewer)) {
      return (
        <PmPage
          header={
            <PmPageHeader
              title="Access denied"
              description="You do not have permission to edit this opportunity."
            />
          }
        >
          <EntityAccessDenied
            description="Only the opportunity owner or platform admin can edit this record."
            backHref={`/opportunities/${opportunityId}`}
            backLabel="Back to opportunity"
          />
        </PmPage>
      )
    }
  }

  return (
    <PmPage>
      {showRecovery && recoverySnapshot ? (
        <DraftRecoveryBanner
          savedAtLabel={formatLastSavedAt(recoverySnapshot.savedAt)}
          onContinue={() => {
            setDraft(recoverySnapshot.draft)
            setActiveStepId(recoverySnapshot.activeStepId)
            setShowRecovery(false)
            setDirty(true)
          }}
          onDiscard={() => {
            clearLocalDraftSnapshot(mode, opportunityId)
            setShowRecovery(false)
            setRecoverySnapshot(null)
          }}
        />
      ) : null}

      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => {
          trackOcxEvent('wizard_abandoned', { stepId: activeStepId })
          setAllowNavigation(true)
          blocker.proceed?.()
        }}
      />

      <DuplicateDraftDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        onOpenExisting={() => {
          const idToOpen = liveValidation.duplicateDraftWarning
            ? existingDrafts[0]?.id
            : undefined
          setDuplicateOpen(false)
          if (idToOpen) navigate(`/opportunities/${idToOpen}`)
        }}
        onCreateNew={() => {
          setSuppressDuplicate(true)
          setDuplicateOpen(false)
        }}
        onDuplicateAnyway={() => {
          setSuppressDuplicate(true)
          setDuplicateOpen(false)
        }}
      />

      <PmFormWizard
        stepper={{
          steps: [...WIZARD_STEPS],
          activeStepId,
          completedStepIds,
          errorStepIds,
          onStepClick: (stepId) => goToStep(stepId),
        }}
        rail={
          <SmartRightPanel
            statusLabel={resolvedOpportunityId ? 'Draft' : 'New draft'}
            issues={liveValidation.issues}
            readinessScore={wizardReadiness.readinessScore}
            readinessTimeline={readinessTimeline}
            nextActionLabel={nextAction.label}
            nextActionStepId={nextAction.stepId}
            publishReady={wizardReadiness.publishReady}
            publishBlockedWhy={
              wizardReadiness.missingRequired[0]
                ? `Missing: ${wizardReadiness.missingRequired[0]}`
                : undefined
            }
            summary={{
              skills: draft.structuredSkills.length,
              packages: draft.workPackages.length,
              budgetLabel: String(
                (draft.commercialTerms as Record<string, unknown>).budget ??
                  (draft.commercialTerms as Record<string, unknown>).cashAmount ??
                  '—',
              ),
              timelineLabel: draft.startDate || draft.tenderDeadline
                ? `${draft.startDate || '…'} → ${draft.tenderDeadline || '…'}`
                : '—',
            }}
            collaboration={{
              intent: formatOpportunityIntent(draft.intent),
              mainModel: resolveMainCollaborationModelLabel(draft.mainCollaborationModel),
              subModel: resolveSubModelLabel(draft.subModelType),
              exchangeMode: draft.exchangeMode
                ? formatCollaborationExchangeMode(draft.exchangeMode)
                : undefined,
              topology: formatFrameworkMatchTypeLabel(derivedTopology.topology),
              relationshipLabel: 'Company → Company',
              readyToPublish: wizardReadiness.publishReady,
            }}
            onNavigateIssue={(stepId) => goToStep(stepId)}
            onNextAction={(stepId) => goToStep(stepId)}
          />
        }
        footer={
          <div className="space-y-2">
            {autosaveLabel ? (
              <p
                className={cn(pmTypography.caption, 'text-muted-foreground')}
                aria-live="polite"
                data-testid="autosave-status"
              >
                {autosaveLabel}
              </p>
            ) : null}
            <PmFormActions
              onCancel={handleBack}
              cancelLabel={activeStepIndex <= 0 ? 'Cancel' : 'Back'}
              onSaveDraft={handleSaveDraft}
              saveDraftLabel="Save draft"
              onSubmit={isReviewStep ? handleSaveDraft : handleContinue}
              submitLabel={isReviewStep ? draftSubmitLabel : 'Continue'}
              loading={saving}
            />
          </div>
        }
      >
        <PmPageHeader
          label="Create"
          title={mode === 'edit' ? 'Edit opportunity' : 'Post an opportunity'}
          description="7-step draft-first wizard — Need or Offer through Review Draft. Publish from the opportunity detail page."
          tone="opportunity"
          metric={
            <PmPageHeroMetric
              value={`${Math.round(wizardReadiness.readinessScore)}%`}
              label="Opportunity Readiness"
            />
          }
          bordered={false}
          className="mb-2"
        />

        <UserJourneyStrip activeStepId={journeyStripStep(activeStepId)} compact />

        <PmFormWizardStep stepId="type" activeStepId={activeStepId}>
          <PmFormSection
            title="Post type"
            description="Need and Offer are first-class post types in the Need/Offer framework."
          >
            <PmFormGrid columns={2}>
              {(
                [
                  ['need', 'Need'],
                  ['offer', 'Offer'],
                ] as const
              ).map(([value, label]) => (
                <PmSurface
                  key={value}
                  variant={draft.intent === value ? 'elevated' : 'default'}
                  shadow={draft.intent === value ? 'card' : 'none'}
                  interactive
                  className={
                    draft.intent === value
                      ? 'border-primary/40 ring-1 ring-primary/20'
                      : undefined
                  }
                >
                  <button
                    type="button"
                    className="w-full cursor-pointer p-4 text-start"
                    onClick={() => updateDraft('intent', value)}
                  >
                    <span className="font-medium">{label}</span>
                    <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                      {value === 'need'
                        ? 'Post a need for services, skills, or project capacity.'
                        : 'Offer your services, skills, or available capacity.'}
                    </p>
                  </button>
                </PmSurface>
              ))}
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="basic" activeStepId={activeStepId}>
          <PmFormSection
            title="Basic details"
            description={
              draft.intent === 'need'
                ? 'Title, scope, and partner preferences for this Need.'
                : draft.intent === 'offer'
                  ? 'Title, scope, and positioning for this Offer.'
                  : 'Title, description, and category.'
            }
          >
            <PmFormGrid columns={2}>
              <PmFormGridItem span="full" gridColumns={2}>
                <div>
                  <PmFormField id="opp-title" label="Title" required>
                    <Input
                      value={draft.title}
                      onChange={(e) => updateDraft('title', e.target.value)}
                      placeholder="Opportunity title"
                    />
                  </PmFormField>
                  <LiveFieldStatus
                    view={liveValidation.field('title')}
                    hasValue={Boolean(draft.title.trim())}
                  />
                </div>
              </PmFormGridItem>
              <PmFormGridItem span="full" gridColumns={2}>
                <div>
                  <PmFormField id="opp-description" label="Description" required>
                    <Textarea
                      value={draft.description}
                      onChange={(e) => updateDraft('description', e.target.value)}
                      placeholder="Describe scope and expectations"
                    />
                  </PmFormField>
                  <LiveFieldStatus
                    view={liveValidation.field('description')}
                    hasValue={Boolean(draft.description.trim())}
                  />
                </div>
              </PmFormGridItem>
              <PmFormField id="opp-sector" label="Category / sector">
                <Input
                  value={draft.sector}
                  onChange={(e) => updateDraft('sector', e.target.value)}
                  placeholder="Construction"
                />
              </PmFormField>
              <PmFormField id="opp-role" label="Target role">
                <Input
                  value={draft.targetRole}
                  onChange={(e) => updateDraft('targetRole', e.target.value)}
                  placeholder="Architect"
                />
              </PmFormField>

              {draft.intent === 'need' ? (
                <>
                  <PmFormField id="opp-partner-type" label="Preferred partner type">
                    <Select
                      value={draft.preferredPartnerType || undefined}
                      onValueChange={(value) =>
                        updateDraft('preferredPartnerType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="general_contractor">
                          General contractor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </PmFormField>
                  <PmFormField
                    id="opp-attachments-need"
                    label="Required documents / attachments"
                    help="Comma-separated reference names"
                  >
                    <Input
                      value={draft.attachmentsText}
                      onChange={(e) => updateDraft('attachmentsText', e.target.value)}
                      placeholder="design-brief.pdf, RFP.pdf"
                    />
                  </PmFormField>
                  <PmFormField
                    id="opp-min-qual"
                    label="Minimum qualifications"
                    help="Need-side qualification ask"
                  >
                    <Textarea
                      value={draft.minimumQualifications}
                      onChange={(e) =>
                        updateDraft('minimumQualifications', e.target.value)
                      }
                      placeholder="PMP, 8+ years mega-project experience"
                      rows={2}
                    />
                  </PmFormField>
                </>
              ) : null}

              {draft.intent === 'offer' ? (
                <>
                  <PmFormField
                    id="opp-certifications"
                    label="Certifications"
                    help="Comma-separated"
                  >
                    <Input
                      value={draft.certificationsText}
                      onChange={(e) =>
                        updateDraft('certificationsText', e.target.value)
                      }
                      placeholder="PMP, LEED AP"
                    />
                  </PmFormField>
                  <PmFormField
                    id="opp-portfolio"
                    label="Portfolio / references"
                    help="Links or reference names"
                  >
                    <Textarea
                      value={draft.portfolioText}
                      onChange={(e) => updateDraft('portfolioText', e.target.value)}
                      placeholder="Portfolio URL or project references"
                      rows={2}
                    />
                  </PmFormField>
                  <PmFormField
                    id="opp-attachments-offer"
                    label="Attachments / portfolio files"
                    help="Comma-separated reference names"
                  >
                    <Input
                      value={draft.attachmentsText}
                      onChange={(e) => updateDraft('attachmentsText', e.target.value)}
                      placeholder="portfolio.pdf, case-study.pdf"
                    />
                  </PmFormField>
                </>
              ) : null}
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="collaboration" activeStepId={activeStepId}>
          <PmFormSection
            title="Collaboration model & exchange"
            description="Choose main collaboration model, sub-model, and value exchange mode. Matching topology is system-derived — not a user choice."
            actions={
              <div className="flex gap-1">
                <ContextualHelp topic="collaboration" subModelType={draft.subModelType} />
                <ContextualHelp topic="exchange" label="Exchange help" />
              </div>
            }
          >
            <div>
              <PmFormField id="opp-main-model" label="Main collaboration model" required>
                <Select
                  value={draft.mainCollaborationModel || undefined}
                  onValueChange={(value) => {
                    const firstSub = listSubModelsForMain(value)[0]
                    if (firstSub) {
                      setDraft((current) => ({
                        ...current,
                        mainCollaborationModel: value,
                        modelType: firstSub.modelType,
                        subModelType: firstSub.key,
                      }))
                    } else {
                      updateDraft('mainCollaborationModel', value)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collaboration model" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainModels.map((model) => (
                      <SelectItem key={model.key} value={model.key}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PmFormField>
              <LiveFieldStatus
                view={liveValidation.field('mainCollaborationModel')}
                hasValue={Boolean(draft.mainCollaborationModel)}
              />
            </div>

            <div className="mt-4">
              <PmFormField id="opp-sub-model" label="Sub-model" required>
                <Select
                  value={draft.subModelType || undefined}
                  onValueChange={(value) => {
                    const sub = subModelOptions.find((entry) => entry.key === value)
                    setDraft((current) => ({
                      ...current,
                      subModelType: value,
                      modelType: sub?.modelType ?? current.modelType,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-model" />
                  </SelectTrigger>
                  <SelectContent>
                    {subModelOptions.map((sub) => (
                      <SelectItem key={sub.key} value={sub.key}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PmFormField>
              <LiveFieldStatus
                view={liveValidation.field('subModelType')}
                hasValue={Boolean(draft.subModelType)}
              />
            </div>

            <div
              className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm"
              data-testid="recommended-matching-topology"
              aria-live="polite"
            >
              <p className={cn(pmTypography.label)}>Recommended Matching Topology</p>
              <p className="font-medium">
                System will match this as{' '}
                {formatFrameworkMatchTypeLabel(derivedTopology.topology)}
              </p>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                System-derived — based on your collaboration model and exchange mode.
              </p>
              <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                {derivedTopology.reason}
              </p>
            </div>

            <div className="mt-4">
              <ValueExchangeModesPanel
                selectedModes={draft.paymentModes}
                selectable
                onToggle={(modeKey) => {
                  const has = draft.paymentModes.includes(modeKey)
                  const nextModes = has
                    ? draft.paymentModes.filter((mode) => mode !== modeKey)
                    : [...draft.paymentModes, modeKey]
                  setDraft((current) => ({
                    ...current,
                    paymentModes: nextModes.length > 0 ? nextModes : [modeKey],
                    exchangeMode: nextModes[0] ?? modeKey,
                  }))
                }}
              />
            </div>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="attributes" activeStepId={activeStepId}>
          <PmFormSection
            title="Sub-model attributes"
            description="Registry-driven fields for the selected collaboration sub-model."
          >
            <CollaborationSubModelFields
              subModelType={draft.subModelType}
              values={draft.collaborationAttributes}
              exchangeMode={draft.exchangeMode}
              onChange={(key, value) => {
                setDraft((current) => ({
                  ...current,
                  collaborationAttributes: {
                    ...current.collaborationAttributes,
                    [key]: value,
                  },
                }))
              }}
            />
          </PmFormSection>

          <div className="mt-4 space-y-4">
            <StructuredSkillsEditor
              label={
                draft.intent === 'need'
                  ? 'Required skills'
                  : draft.intent === 'offer'
                    ? 'Provided skills'
                    : 'Skills'
              }
              skills={draft.structuredSkills}
              onChange={syncStructuredSkills}
              fieldStatus={
                <LiveFieldStatus
                  view={liveValidation.field('structuredSkills')}
                  hasValue={draft.structuredSkills.length > 0}
                />
              }
            />

            <ServicesField
              label={
                draft.intent === 'need'
                  ? 'Required services'
                  : draft.intent === 'offer'
                    ? 'Offered services'
                    : 'Services'
              }
              value={draft.services}
              onChange={(value) => updateDraft('services', value)}
            />

            {draft.subModelType === 'task_based' ? (
              <WorkPackagesEditor
                packages={draft.workPackages}
                onChange={(packages) => updateDraft('workPackages', packages)}
                fieldStatus={
                  <LiveFieldStatus
                    view={liveValidation.field('workPackages')}
                    hasValue={draft.workPackages.length > 0}
                  />
                }
              />
            ) : null}

            <ResourcesCapacityEditor
              resources={draft.resources}
              capacity={draft.capacity}
              workPackages={draft.workPackages}
              showCapacity={draft.intent === 'offer'}
              onResourcesChange={(resources) => updateDraft('resources', resources)}
              onCapacityChange={(capacity) => updateDraft('capacity', capacity)}
              fieldStatus={
                <LiveFieldStatus
                  view={liveValidation.field('capacity')}
                  hasValue={Boolean(
                    draft.capacity.availableCapacity != null ||
                      draft.capacity.maximumCapacity != null ||
                      draft.capacity.reservedCapacity != null ||
                      draft.capacity.availableFrom,
                  )}
                />
              }
            />

            {draft.intent === 'need' ? (
              <PmFormField
                id="opp-delivery-milestones"
                label="Delivery milestones"
                help="Comma-separated milestone titles"
              >
                <Input
                  value={draft.deliveryMilestonesText}
                  onChange={(e) =>
                    updateDraft('deliveryMilestonesText', e.target.value)
                  }
                  placeholder="Concept design, Delivery kickoff"
                />
              </PmFormField>
            ) : null}
          </div>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="commercial" activeStepId={activeStepId}>
          <CommercialTermsStep
            exchangeMode={draft.exchangeMode}
            paymentModes={draft.paymentModes}
            terms={draft.commercialTerms}
            constraints={draft.commercialConstraints}
            onTermsChange={(terms) => updateDraft('commercialTerms', terms)}
            onConstraintsChange={(constraints) =>
              updateDraft('commercialConstraints', constraints)
            }
            budgetStatus={
              <LiveFieldStatus
                view={liveValidation.field('budget')}
                hasValue={Boolean(
                  String(
                    (draft.commercialTerms as Record<string, unknown>).budget ?? '',
                  ).trim(),
                )}
              />
            }
          />
        </PmFormWizardStep>

        <PmFormWizardStep stepId="timeline" activeStepId={activeStepId}>
          <RichTimelineFields
            intent={draft.intent}
            location={draft.location}
            startDate={draft.startDate}
            tenderDeadline={draft.tenderDeadline}
            timeline={draft.richTimeline}
            onLocationChange={(value) => updateDraft('location', value)}
            onStartDateChange={(value) => updateDraft('startDate', value)}
            onDeadlineChange={(value) => updateDraft('tenderDeadline', value)}
            onTimelineChange={(timeline) => updateDraft('richTimeline', timeline)}
            locationStatus={
              <LiveFieldStatus
                view={liveValidation.field('location')}
                hasValue={Boolean(draft.location.trim())}
              />
            }
            startDateStatus={
              <LiveFieldStatus
                view={liveValidation.field('startDate')}
                hasValue={Boolean(draft.startDate)}
              />
            }
          />

          <PmFormSection
            title="Recommended details"
            description="Optional fields that raise Completion Score. Required fields alone unlock publish at 80%+."
            className="mt-4"
          >
            <PmFormGrid columns={2}>
              {draft.intent === 'need' ? (
                <>
                  <PmFormField id="opp-partner-type-tl" label="Preferred partner type">
                    <Select
                      value={draft.preferredPartnerType || undefined}
                      onValueChange={(value) =>
                        updateDraft('preferredPartnerType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="general_contractor">
                          General contractor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </PmFormField>
                  <PmFormField
                    id="opp-compliance"
                    label="Compliance requirements"
                    help="Comma-separated"
                  >
                    <Input
                      value={draft.complianceRequirementsText}
                      onChange={(e) =>
                        updateDraft('complianceRequirementsText', e.target.value)
                      }
                      placeholder="Saudi Building Code, PDPL"
                    />
                  </PmFormField>
                  <PmFormField
                    id="opp-attachments-tl-need"
                    label="Attachments"
                    help="Comma-separated reference names"
                  >
                    <Input
                      value={draft.attachmentsText}
                      onChange={(e) => updateDraft('attachmentsText', e.target.value)}
                      placeholder="design-brief.pdf, portfolio.pdf"
                    />
                  </PmFormField>
                </>
              ) : null}

              {draft.intent === 'offer' ? (
                <>
                  <PmFormField
                    id="opp-attachments-tl-offer"
                    label="Attachments / portfolio"
                    help="Comma-separated reference names"
                  >
                    <Input
                      value={draft.attachmentsText}
                      onChange={(e) => updateDraft('attachmentsText', e.target.value)}
                      placeholder="portfolio.pdf, case-study.pdf"
                    />
                  </PmFormField>
                  <PmFormField
                    id="opp-compliance-offer"
                    label="Compliance / standards met"
                    help="Comma-separated"
                  >
                    <Input
                      value={draft.complianceRequirementsText}
                      onChange={(e) =>
                        updateDraft('complianceRequirementsText', e.target.value)
                      }
                      placeholder="ISO 9001, Saudi Building Code"
                    />
                  </PmFormField>
                </>
              ) : null}
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="review" activeStepId={activeStepId}>
          <div className="space-y-4" data-testid="review-draft-step">
            <CollaborationSummaryCard
              intent={formatOpportunityIntent(draft.intent)}
              mainModelLabel={resolveMainCollaborationModelLabel(
                draft.mainCollaborationModel,
              )}
              subModelLabel={resolveSubModelLabel(draft.subModelType)}
              exchangeModeLabel={
                draft.exchangeMode
                  ? formatCollaborationExchangeMode(draft.exchangeMode)
                  : undefined
              }
              topologyLabel={formatFrameworkMatchTypeLabel(derivedTopology.topology)}
              relationshipLabel="Company → Company"
              readyToPublish={wizardReadiness.publishReady}
            />
            <PmFormSection
              title="General"
              description="Confirm the fundamentals before saving this draft."
              bordered
            >
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd className="font-medium">{draft.title || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Post type</dt>
                  <dd className="font-medium">
                    {formatOpportunityIntent(draft.intent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium">{draft.location || '—'}</dd>
                </div>
              </dl>
              <PmButton
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => goToStep('basic')}
              >
                Edit basic details →
              </PmButton>
            </PmFormSection>
            <FinancialSummaryCard
              exchangeMode={draft.exchangeMode}
              commercialTerms={draft.commercialTerms as Record<string, unknown>}
            />
            <WorkPackageSummaryCard
              workPackages={draft.workPackages}
              skills={draft.structuredSkills}
              resourcesCount={draft.resources.length}
              deliverablesCount={
                draft.deliveryMilestonesText
                  ? draft.deliveryMilestonesText.split(',').filter(Boolean).length
                  : 0
              }
            />
            <MarketplacePreviewPanel opportunity={opportunityDraft} />
            <MatchingInsightPanel
              intent={draft.intent}
              skills={draft.structuredSkills}
              location={draft.location}
              exchangeMode={draft.exchangeMode}
              topology={derivedTopology.topology}
              collaborationLabel={resolveMainCollaborationModelLabel(
                draft.mainCollaborationModel,
              )}
              readinessScore={wizardReadiness.readinessScore}
              missingRequired={wizardReadiness.missingRequired}
              onFixFactor={(stepId) => goToStep(stepId)}
            />
            <AiSuggestionsPanel
              bundle={explanationBundle}
              subModelType={draft.subModelType || undefined}
            />
            <PmFormSection
              title="Publish checklist"
              description="Save this draft first. Publish remains on the opportunity detail page when readiness ≥ 80% and your account is approved."
            >
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                {wizardReadiness.missingRequired.length > 0
                  ? `Still missing for publish: ${wizardReadiness.missingRequired
                      .slice(0, 5)
                      .join(', ')}`
                  : 'Core readiness looks complete — save draft, then open detail to publish.'}
              </p>
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                Validation and readiness are separate: validation checks correctness;
                readiness measures completeness for matching.
              </p>
            </PmFormSection>
            <PmFormSection
              title="Review actions"
              description="Export options — Print works now; PDF and Share are coming soon."
            >
              <div className="flex flex-wrap gap-2" data-testid="review-footer-actions">
                <PmButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  Print summary
                </PmButton>
                <PmButton type="button" size="sm" variant="outline" disabled title="Coming soon">
                  Export PDF (coming soon)
                </PmButton>
                <PmButton type="button" size="sm" variant="outline" disabled title="Coming soon">
                  Share draft (coming soon)
                </PmButton>
              </div>
            </PmFormSection>
          </div>
        </PmFormWizardStep>
      </PmFormWizard>
    </PmPage>
  )
}

export type OpportunityWizardPageProps = {
  mode: 'create' | 'edit'
}

/** Convenience re-export for step id typing in callers. */
export type { WizardStepId }
