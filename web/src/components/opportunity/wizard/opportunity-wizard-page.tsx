import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import type { DuplicateDraftCandidate } from '@pm-twin/validation'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import {
  clearLocalDraftRecoveryDismissal,
  clearLocalDraftSnapshot,
  dismissLocalDraftRecovery,
  formatLastSavedAt,
  readLocalDraftRecoveryDismissal,
  readLocalDraftSnapshot,
  saveLocalDraftSnapshot,
  shouldOfferLocalDraftRecovery,
  type AutosaveStatus,
  type LocalDraftSnapshot,
} from '@/lib/wizard-local-draft.ts'
import { evaluateLiveOpportunityValidation } from '@/domain/opportunity-validation/index.ts'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import { DuplicateDraftDialog } from '@/components/opportunity/wizard/duplicate-draft-dialog.tsx'
import { validateCreateOpportunityDraft } from '@/components/opportunity/wizard/create-validation.ts'
import {
  DraftRecoveryBanner,
  UnsavedChangesDialog,
} from '@/components/opportunity/wizard/wizard-guards.tsx'
import { useAuth } from '@/providers/auth-provider'
import {
  buildViewerContext,
  canEditOpportunity,
} from '@/lib/entity-view-visibility.ts'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'
import { evaluateOpportunityWizardReadiness } from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import {
  publishOpportunityUiAction,
  resolveProfileKindFromUser,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { pmWizardSticky } from '@/tokens/layers/layout.ts'
import { cn } from '@/lib/utils'
import {
  WIZARD_STEPS,
  normalizeWizardStepId,
  resolveWizardStepIndex,
  type WizardStepId,
} from './wizard-steps.ts'
import {
  buildCollaborationCommandPayload,
  buildOpportunityDraftInput,
  initialDraft,
  opportunityToDraft,
  syncDraftExchangeFromCommercialStructure,
  toWizardDraft,
  type OpportunityDraft,
} from './draft-model.ts'
import {
  CollaborationStep,
  CommercialStructureStep,
  OpportunityFormFooter,
  OpportunityStep,
  OpportunityStepper,
  ReadinessDrawer,
  ReadinessSummaryCard,
  ReviewPublishStep,
  ScopeWorkStep,
} from '@/components/opportunities/create'
import {
  focusReadinessTarget,
  groupReadinessIssues,
  readinessIssueToActionTarget,
  type ReadinessUserMessage,
} from '@/presentation/readiness'
import { productLanguage } from '@/lib/product-language.ts'

function resolveCompletedSteps(draft: OpportunityDraft): string[] {
  const readiness = evaluateOpportunityWizardReadiness(toWizardDraft(draft))
  const completed: string[] = []
  if (draft.intent && draft.title.trim() && draft.description.trim()) {
    completed.push('opportunity')
  }
  if (
    readiness.stages.find((s) => s.id === 'mainCollaborationModel')?.complete
    && draft.subModelType
  ) {
    completed.push('collaboration')
  }
  if (
    draft.structuredSkills.length > 0
    || draft.workPackages.length > 0
    || draft.services
  ) {
    completed.push('scope_work')
  }
  if (draft.commercialStructure.components.some((c) => c.enabled)) {
    completed.push('commercial')
  }
  if (readiness.stages.find((s) => s.id === 'review')?.complete) {
    completed.push('review')
  }
  return completed
}

function validateWizardStepAdvance(
  stepId: string,
  draft: OpportunityDraft,
): string | null {
  switch (stepId) {
    case 'opportunity':
      if (draft.intent !== 'need' && draft.intent !== 'offer') {
        return 'Choose Need or Offer before continuing.'
      }
      if (!draft.title.trim() || !draft.description.trim()) {
        return 'Add a title and description before continuing.'
      }
      if (!draft.sector.trim()) {
        return 'Add a category or profession before continuing.'
      }
      if (!draft.targetRole.trim()) {
        return 'Add a target role before continuing.'
      }
      if (!draft.location.trim()) {
        return 'Add a primary location before continuing.'
      }
      if (!draft.startDate.trim()) {
        return 'Add a start date before continuing.'
      }
      return null
    case 'collaboration':
      if (!draft.mainCollaborationModel.trim() || !draft.subModelType.trim()) {
        return 'Select a collaboration model and sub-model before continuing.'
      }
      return null
    case 'scope_work': {
      const hasSkill = draft.structuredSkills.some((skill) => skill.name.trim())
      if (!hasSkill) {
        return draft.intent === 'offer'
          ? 'Add at least one offered skill before continuing.'
          : 'Add at least one required skill before continuing.'
      }
      if (!draft.services.trim()) {
        return draft.intent === 'offer'
          ? 'Add services offered before continuing.'
          : 'Add services required before continuing.'
      }
      if (!draft.richTimeline.estimatedDuration?.trim()) {
        return 'Add an estimated duration before continuing.'
      }
      return null
    }
    default:
      return null
  }
}

export function OpportunityWizardPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const opportunityId = mode === 'edit' ? id : undefined
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isPendingApproval, activeWorkspace, activeParty, canAccessAdmin } = useAuth()
  const existingOpportunity = useMemo(
    () => (opportunityId ? opportunitiesApi.get(opportunityId) : undefined),
    [opportunityId],
  )
  const [draft, setDraft] = useState<OpportunityDraft>(() =>
    existingOpportunity ? opportunityToDraft(existingOpportunity) : initialDraft,
  )
  const [activeStepId, setActiveStepId] = useState<WizardStepId>('opportunity')
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [recoverySnapshot, setRecoverySnapshot] = useState<LocalDraftSnapshot | null>(
    null,
  )
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryResolved, setRecoveryResolved] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [suppressDuplicate, setSuppressDuplicate] = useState(false)
  const [readinessDrawerOpen, setReadinessDrawerOpen] = useState(false)
  const [showFieldValidation, setShowFieldValidation] = useState(false)
  const resolvedOpportunityId = opportunityId ?? createdOpportunityId
  const autosaveReadyRef = useRef(Boolean(existingOpportunity))
  const draftRef = useRef(draft)
  draftRef.current = draft
  const trackedStartRef = useRef(false)

  const existingDrafts = useMemo((): readonly DuplicateDraftCandidate[] => {
    if (!user?.id) return []
    return opportunitiesApi
      .list()
      .filter(
        (o) =>
          (o.status ?? '').toLowerCase() === 'draft'
          && o.creatorId === user.id
          && o.id !== resolvedOpportunityId,
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
    setActiveStepId(normalizeWizardStepId(stepParam))
  }, [searchParams])

  useEffect(() => {
    if (!trackedStartRef.current) {
      trackedStartRef.current = true
      trackOcxEvent('opportunity_wizard_started', { mode })
      trackOcxEvent('wizard_started', { mode })
    }
  }, [mode])

  useEffect(() => {
    trackOcxEvent('opportunity_step_viewed', { stepId: activeStepId })
    trackOcxEvent('step_viewed', { stepId: activeStepId })
  }, [activeStepId])

  useEffect(() => {
    const snapshot = readLocalDraftSnapshot(mode, opportunityId)
    const authoritativeDraft = existingOpportunity
      ? opportunityToDraft(existingOpportunity)
      : initialDraft
    const dismissal = readLocalDraftRecoveryDismissal(mode, opportunityId)
    const offer = shouldOfferLocalDraftRecovery({
      snapshot,
      authoritativeDraft,
      opportunityStatus: existingOpportunity?.status,
      opportunityMissing: mode === 'edit' && Boolean(opportunityId) && !existingOpportunity,
      dismissal,
    })
    if (offer && snapshot) {
      setRecoverySnapshot(snapshot)
      setShowRecovery(true)
    } else {
      setRecoverySnapshot(null)
      setShowRecovery(false)
    }
    setRecoveryResolved(true)
  }, [mode, opportunityId, existingOpportunity])

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

  const liveValidation = useMemo(
    () =>
      evaluateLiveOpportunityValidation(opportunityDraft as object, {
        existingDrafts,
      }),
    [opportunityDraft, existingDrafts],
  )

  useEffect(() => {
    if (
      liveValidation.duplicateDraftWarning
      && !suppressDuplicate
      && !duplicateOpen
    ) {
      setDuplicateOpen(true)
    }
  }, [liveValidation.duplicateDraftWarning, suppressDuplicate, duplicateOpen])

  // Local autosave every draft/step change (paused while recovery is pending)
  useEffect(() => {
    if (!recoveryResolved || showRecovery) return
    saveLocalDraftSnapshot({
      savedAt: new Date().toISOString(),
      mode,
      opportunityId: resolvedOpportunityId,
      draft,
      activeStepId,
    })
  }, [
    draft,
    activeStepId,
    mode,
    resolvedOpportunityId,
    recoveryResolved,
    showRecovery,
  ])

  // Server autosave 2s after id exists
  useEffect(() => {
    if (!resolvedOpportunityId || !autosaveReadyRef.current || !dirty) return
    const timer = window.setTimeout(() => {
      setAutosaveStatus('saving')
      try {
        const payload = buildCollaborationCommandPayload(draftRef.current, user?.id)
        const result = opportunityCommandService.updateOpportunity(
          resolvedOpportunityId,
          payload,
        )
        if (!result.success) {
          setAutosaveStatus('error')
          return
        }
        setAutosaveStatus('saved')
        setLastSavedAt(new Date().toISOString())
        setDirty(false)
        trackOcxEvent('draft_saved', { opportunityId: resolvedOpportunityId, autosave: true })
      } catch {
        setAutosaveStatus('error')
      }
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [draft, dirty, resolvedOpportunityId, user?.id])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty
      && !allowNavigation
      && currentLocation.pathname !== nextLocation.pathname,
  )

  const completedStepIds = useMemo(() => resolveCompletedSteps(draft), [draft])
  const errorStepIds = useMemo(() => {
    const steps = new Set<string>()
    for (const issue of liveValidation.issues) {
      if (issue.severity !== 'error' && issue.severity !== 'blocker') continue
      steps.add(resolveStepForValidationIssue(issue))
    }
    return [...steps]
  }, [liveValidation.issues])

  const scopeWorkValidationMessages = useMemo(() => {
    return liveValidation.issues
      .filter((issue) => {
        if (issue.severity !== 'error' && issue.severity !== 'blocker') return false
        return resolveStepForValidationIssue(issue) === 'scope_work'
      })
      .map((issue) => issue.message)
  }, [liveValidation.issues])

  useEffect(() => {
    if (errorStepIds.includes(activeStepId)) {
      setShowFieldValidation(true)
    }
  }, [activeStepId, errorStepIds])

  const readinessGroups = useMemo(() => {
    const recommendedLabels = [
      ...(draft.preferredPartnerType ? [] : ['Add a preferred partner type']),
      ...(draft.attachmentsText ? [] : ['Add portfolio references']),
      ...(draft.milestones.length > 0
        ? []
        : ['Add delivery milestones']),
      ...(draft.complianceRequirementsText
        ? []
        : ['Add compliance requirements']),
    ]
    const completedLabels = [
      ...(draft.title ? ['Title'] : []),
      ...(draft.description ? ['Description'] : []),
      ...(draft.mainCollaborationModel ? ['Collaboration model'] : []),
      ...(draft.commercialStructure.components.some((c) => c.enabled)
        ? ['Commercial structure']
        : []),
    ]
    return groupReadinessIssues({
      missingRequired: wizardReadiness.missingRequired,
      missingRecommended: recommendedLabels,
      completedLabels,
    })
  }, [draft, wizardReadiness.missingRequired])

  const activeStepIndex = resolveWizardStepIndex(activeStepId)

  const patchDraft = (patch: Partial<OpportunityDraft>) => {
    setDraft((current) => {
      let next = { ...current, ...patch }
      if (patch.commercialStructure || patch.structuredSkills) {
        if (patch.commercialStructure) {
          next = syncDraftExchangeFromCommercialStructure(next)
        }
        if (patch.structuredSkills) {
          next = {
            ...next,
            skills: patch.structuredSkills
              .map((s) => s.name.trim())
              .filter(Boolean)
              .join(', '),
          }
        }
      }
      return next
    })
    setDirty(true)
    autosaveReadyRef.current = true
  }

  const goToStep = (stepId: WizardStepId, sectionId?: string) => {
    setActiveStepId(stepId)
    const params = new URLSearchParams(searchParams)
    params.set('step', stepId)
    setSearchParams(params, { replace: true })
    if (sectionId) {
      window.setTimeout(() => {
        focusReadinessTarget({
          stepId,
          sectionId,
          hash: `section-${sectionId}`,
        })
      }, 80)
    }
  }

  const handleContinue = () => {
    const gateMessage = validateWizardStepAdvance(activeStepId, draft)
    if (gateMessage) {
      setShowFieldValidation(true)
      toast.error(gateMessage)
      trackOcxEvent('opportunity_step_validation_failed', { stepId: activeStepId })
      return
    }
    if (activeStepIndex < 0 || activeStepIndex >= WIZARD_STEPS.length - 1) return
    trackOcxEvent('opportunity_step_completed', { stepId: activeStepId })
    goToStep(WIZARD_STEPS[activeStepIndex + 1]!.id as WizardStepId)
  }

  const handleBackOrCancel = () => {
    if (activeStepIndex <= 0) {
      navigate('/opportunities')
      return
    }
    goToStep(WIZARD_STEPS[activeStepIndex - 1]!.id as WizardStepId)
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
        const createCheck = validateCreateOpportunityDraft(draft)
        if (!createCheck.valid) {
          setShowFieldValidation(true)
          toast.error(createCheck.errors.join('\n'))
          return
        }
        const payload = buildCollaborationCommandPayload(draft, user.id)
        const result = opportunityCommandService.createOpportunity(payload)
        if (!result.success) {
          setShowFieldValidation(true)
          toast.error(result.errors?.join('\n') ?? 'Could not create opportunity')
          return
        }
        const newId = result.aggregateId
        setCreatedOpportunityId(newId)
        setShowFieldValidation(false)
        clearLocalDraftSnapshot(mode, opportunityId)
        clearLocalDraftRecoveryDismissal(mode, opportunityId)
        trackOcxEvent('draft_saved', { opportunityId: newId })
        setDirty(false)
        setAllowNavigation(true)
        toast.success('Draft opportunity created')
        navigate(`/opportunities/${newId}`)
        return
      }

      const payload = buildCollaborationCommandPayload(draft, user.id)
      const result = opportunityCommandService.updateOpportunity(
        resolvedOpportunityId,
        payload,
      )
      if (!result.success) {
        toast.error(result.errors?.join('\n') ?? 'Could not save draft')
        return
      }
      clearLocalDraftSnapshot(mode, opportunityId)
      clearLocalDraftRecoveryDismissal(mode, opportunityId)
      trackOcxEvent('draft_saved', { opportunityId: resolvedOpportunityId })
      setDirty(false)
      setAllowNavigation(true)
      setLastSavedAt(new Date().toISOString())
      setAutosaveStatus('saved')
      toast.success('Draft saved')
      navigate(`/opportunities/${resolvedOpportunityId}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = () => {
    if (!resolvedOpportunityId) {
      toast.error('Save the draft before publishing.')
      return
    }
    if (!user) {
      toast.error('Sign in to publish opportunities.')
      return
    }
    setPublishing(true)
    trackOcxEvent('opportunity_publish_attempted', {
      opportunityId: resolvedOpportunityId,
    })
    try {
      // Persist latest draft first
      const payload = buildCollaborationCommandPayload(draft, user.id)
      opportunityCommandService.updateOpportunity(resolvedOpportunityId, payload)
      const opportunity = opportunitiesApi.get(resolvedOpportunityId)
      if (!opportunity) {
        toast.error('Opportunity not found')
        return
      }
      const result = publishOpportunityUiAction(resolvedOpportunityId, {
        profile: user.profile ?? user,
        profileKind: resolveProfileKindFromUser(user),
        opportunity,
        profileId: user.id,
        vettingApproved: !isPendingApproval,
      })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      trackOcxEvent('opportunity_published', {
        opportunityId: resolvedOpportunityId,
      })
      trackOcxEvent('published_from_detail', {
        opportunityId: resolvedOpportunityId,
      })
      setDirty(false)
      setAllowNavigation(true)
      clearLocalDraftSnapshot(mode, opportunityId)
      clearLocalDraftRecoveryDismissal(mode, opportunityId)
      toast.success('Opportunity published')
      navigate(`/opportunities/${resolvedOpportunityId}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleReadinessIssue = (issue: ReadinessUserMessage) => {
    const target = readinessIssueToActionTarget(issue)
    trackOcxEvent('readiness_issue_clicked', { title: issue.title })
    goToStep(target.stepId, target.sectionId)
    window.setTimeout(() => focusReadinessTarget(target), 120)
  }

  if (mode === 'edit' && opportunityId && !existingOpportunity) {
    return (
      <PmPage>
        <EntityAccessDenied entity="opportunity" title="Opportunity not found" />
      </PmPage>
    )
  }

  if (mode === 'edit' && existingOpportunity && user) {
    const viewer = buildViewerContext({
      userId: user.id,
      role: user.role,
      status: user.status,
      canAccessAdmin,
      activeWorkspaceId: activeWorkspace?.id,
      activePartyId: activeParty?.id,
      profile: user.profile,
    })
    if (!canEditOpportunity(existingOpportunity, viewer)) {
      return (
        <PmPage>
          <EntityAccessDenied entity="opportunity" />
        </PmPage>
      )
    }
  }

  return (
    <PmPage data-slot="opportunity-create-shell">
      <PmPageHeader
        title={
          mode === 'edit'
            ? `Edit ${productLanguage.label('opportunity')}`
            : productLanguage.actionLabel('createOpportunity')
        }
        description="Five-step opportunity creation — draft anytime, publish when ready."
      />

      {showRecovery && recoverySnapshot ? (
        <DraftRecoveryBanner
          savedAtLabel={formatLastSavedAt(recoverySnapshot.savedAt)}
          onContinue={() => {
            setDraft({
              ...initialDraft,
              ...recoverySnapshot.draft,
              commercialStructure:
                recoverySnapshot.draft.commercialStructure
                ?? initialDraft.commercialStructure,
              workPackages: recoverySnapshot.draft.workPackages ?? [],
              deliverables: recoverySnapshot.draft.deliverables ?? [],
              milestones: recoverySnapshot.draft.milestones ?? [],
            })
            setActiveStepId(normalizeWizardStepId(recoverySnapshot.activeStepId))
            dismissLocalDraftRecovery({
              mode,
              opportunityId,
              decision: 'continue',
              snapshot: recoverySnapshot,
            })
            setRecoverySnapshot(null)
            setShowRecovery(false)
            setDirty(true)
            trackOcxEvent('draft_recovered')
            toast.success('Draft recovered')
          }}
          onDiscard={() => {
            dismissLocalDraftRecovery({
              mode,
              opportunityId,
              decision: 'discard',
              snapshot: recoverySnapshot,
            })
            setRecoverySnapshot(null)
            setShowRecovery(false)
            trackOcxEvent('draft_discarded')
          }}
        />
      ) : null}

      <OpportunityStepper
        activeStepId={activeStepId}
        completedStepIds={completedStepIds}
        errorStepIds={errorStepIds}
        onStepClick={(stepId) => {
          const canOpen =
            stepId === activeStepId
            || completedStepIds.includes(stepId)
            || errorStepIds.includes(stepId)
          if (!canOpen) return
          if (errorStepIds.includes(stepId)) {
            setShowFieldValidation(true)
          }
          goToStep(stepId)
        }}
      />

      <div
        className={cn(
          'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)]',
          pmWizardSticky.contentPad,
        )}
      >
        <div className="min-w-0 space-y-6">
          {activeStepId === 'opportunity' ? (
            <OpportunityStep
              draft={draft}
              onChange={patchDraft}
              showValidation={showFieldValidation}
            />
          ) : null}
          {activeStepId === 'collaboration' ? (
            <CollaborationStep
              draft={draft}
              onChange={patchDraft}
              showValidation={showFieldValidation}
            />
          ) : null}
          {activeStepId === 'scope_work' ? (
            <ScopeWorkStep
              draft={draft}
              onChange={patchDraft}
              showValidation={showFieldValidation}
              validationMessages={scopeWorkValidationMessages}
            />
          ) : null}
          {activeStepId === 'commercial' ? (
            <CommercialStructureStep draft={draft} onChange={patchDraft} />
          ) : null}
          {activeStepId === 'review' ? (
            <ReviewPublishStep
              draft={draft}
              validationIssues={liveValidation.issues}
              onEdit={(stepId, sectionId) => {
                if (errorStepIds.includes(stepId)) {
                  setShowFieldValidation(true)
                }
                goToStep(stepId, sectionId)
              }}
            />
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-[calc(var(--environment-banner-height,0px)+var(--app-header-height)+var(--wizard-stepper-height))] lg:self-start">
          <ReadinessSummaryCard
            score={wizardReadiness.readinessScore}
            requiredCount={readinessGroups.required.length}
            recommendedCount={readinessGroups.recommended.length}
            onViewDetails={() => {
              setReadinessDrawerOpen(true)
              trackOcxEvent('readiness_details_opened')
            }}
          />
        </aside>
      </div>

      <OpportunityFormFooter
        activeStepId={activeStepId}
        saving={saving}
        publishing={publishing}
        autosaveStatus={autosaveStatus}
        lastSavedAt={lastSavedAt}
        onBackOrCancel={handleBackOrCancel}
        onSaveDraft={handleSaveDraft}
        onContinue={handleContinue}
        onPublish={handlePublish}
      />

      <ReadinessDrawer
        open={readinessDrawerOpen}
        onClose={() => setReadinessDrawerOpen(false)}
        required={readinessGroups.required}
        recommended={readinessGroups.recommended}
        completed={readinessGroups.completed}
        onIssueClick={handleReadinessIssue}
      />

      <DuplicateDraftDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        onOpenExisting={() => {
          const idToOpen = existingDrafts[0]?.id
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

      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => {
          trackOcxEvent('wizard_abandoned', { stepId: activeStepId })
          setAllowNavigation(true)
          blocker.proceed?.()
        }}
      />
    </PmPage>
  )
}
