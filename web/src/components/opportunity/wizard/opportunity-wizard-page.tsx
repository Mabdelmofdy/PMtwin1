import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import { OpportunityReadinessCard } from '@/components/readiness'
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
  const existingOpportunity = opportunityId
    ? opportunitiesApi.get(opportunityId)
    : undefined
  const resolvedOpportunityId = opportunityId ?? createdOpportunityId
  const autosaveReadyRef = useRef(false)
  const draftRef = useRef(draft)
  draftRef.current = draft

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

  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (!stepParam) return
    if (resolveWizardStepIndex(stepParam) >= 0) {
      setActiveStepId(stepParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (!existingOpportunity) return
    setDraft(opportunityToDraft(existingOpportunity))
    autosaveReadyRef.current = true
  }, [existingOpportunity])

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

  const explanationBundle = useMemo(() => {
    if (!resolvedOpportunityId) return null
    return buildOpportunityExplanationFromForm(
      resolvedOpportunityId,
      opportunityDraft as Parameters<typeof buildOpportunityExplanationFromForm>[1],
    )
  }, [resolvedOpportunityId, opportunityDraft])

  const completedStepIds = useMemo(() => resolveCompletedSteps(draft), [draft])
  const activeStepIndex = resolveWizardStepIndex(activeStepId)
  const isReviewStep = activeStepId === 'review'
  const draftSubmitLabel = resolvedOpportunityId ? 'Save Draft' : 'Create Draft'

  const updateDraft = <K extends keyof OpportunityDraft>(
    key: K,
    value: OpportunityDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const syncStructuredSkills = (skills: OpportunityDraft['structuredSkills']) => {
    const names = skillNames(skills)
    setDraft((current) => ({
      ...current,
      structuredSkills: skills,
      skills: names.length > 0 ? names.join(', ') : current.skills,
    }))
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
      toast.success('Draft saved')
      navigate(`/opportunities/${resolvedOpportunityId}`)
    } finally {
      setSaving(false)
    }
  }

  // Autosave: debounce update when a persisted opportunity id exists.
  useEffect(() => {
    if (!resolvedOpportunityId || !user) return
    if (mode === 'edit' && !autosaveReadyRef.current) return
    if (mode === 'create' && !createdOpportunityId) return

    const timer = window.setTimeout(() => {
      const result = opportunityCommandService.updateOpportunity(
        resolvedOpportunityId,
        buildCollaborationCommandPayload(draftRef.current, user.id),
      )
      if (!result.success) {
        // Silent failure — user can still Save Draft explicitly.
        return
      }
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [draft, resolvedOpportunityId, user, mode, createdOpportunityId])

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
      <PmFormWizard
        stepper={{
          steps: [...WIZARD_STEPS],
          activeStepId,
          completedStepIds,
          onStepClick: (stepId) => goToStep(stepId),
        }}
        rail={
          <OpportunityReadinessCard
            opportunity={opportunityDraft}
            opportunityId={opportunityId}
            suppressCta
            title="Opportunity Readiness"
            result={wizardReadiness.fieldReadiness}
          />
        }
        footer={
          <PmFormActions
            onCancel={handleBack}
            cancelLabel={activeStepIndex <= 0 ? 'Cancel' : 'Back'}
            onSaveDraft={handleSaveDraft}
            saveDraftLabel="Save draft"
            onSubmit={isReviewStep ? handleSaveDraft : handleContinue}
            submitLabel={isReviewStep ? draftSubmitLabel : 'Continue'}
            loading={saving}
          />
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
                <PmFormField id="opp-title" label="Title" required>
                  <Input
                    value={draft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    placeholder="Opportunity title"
                  />
                </PmFormField>
              </PmFormGridItem>
              <PmFormGridItem span="full" gridColumns={2}>
                <PmFormField id="opp-description" label="Description" required>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                    placeholder="Describe scope and expectations"
                  />
                </PmFormField>
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
          >
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

            <PmFormField id="opp-sub-model" label="Sub-model" required className="mt-4">
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
              />
            ) : null}

            <ResourcesCapacityEditor
              resources={draft.resources}
              capacity={draft.capacity}
              workPackages={draft.workPackages}
              showCapacity={draft.intent === 'offer'}
              onResourcesChange={(resources) => updateDraft('resources', resources)}
              onCapacityChange={(capacity) => updateDraft('capacity', capacity)}
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
          <PmFormSection
            title="Review draft"
            description="Confirm details, then save as draft. Publish from the opportunity detail page when ready."
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
                <dt className="text-muted-foreground">Main model</dt>
                <dd className="font-medium">
                  {resolveMainCollaborationModelLabel(draft.mainCollaborationModel)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sub-model</dt>
                <dd className="font-medium">
                  {resolveSubModelLabel(draft.subModelType)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Recommended Matching Topology</dt>
                <dd className="font-medium">
                  System will match this as{' '}
                  {formatFrameworkMatchTypeLabel(derivedTopology.topology)}
                </dd>
                <dd className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  System-derived — based on your collaboration model and exchange mode
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Value exchange</dt>
                <dd className="font-medium">
                  {draft.paymentModes.map(formatCollaborationExchangeMode).join(', ') ||
                    '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Skills</dt>
                <dd className="font-medium">
                  {skillNames(draft.structuredSkills).join(', ') ||
                    draft.skills ||
                    '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Work packages</dt>
                <dd className="font-medium">
                  {draft.workPackages.length > 0
                    ? `${draft.workPackages.length} package(s)`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">{draft.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Readiness</dt>
                <dd className="font-medium">
                  {Math.round(wizardReadiness.readinessScore)}%
                  {wizardReadiness.publishReady
                    ? ' — publish-ready after save'
                    : ' — complete required fields before publish'}
                </dd>
              </div>
            </dl>
          </PmFormSection>

          <div className="mt-4 space-y-4">
            <MarketplacePreviewPanel opportunity={opportunityDraft} />
            <MatchingInsightPanel
              intent={draft.intent}
              skills={draft.structuredSkills}
              location={draft.location}
              exchangeMode={draft.exchangeMode}
              readinessScore={wizardReadiness.readinessScore}
              missingRequired={wizardReadiness.missingRequired}
            />
            <AiSuggestionsPanel
              bundle={explanationBundle}
              subModelType={draft.subModelType || undefined}
            />
            <PmFormSection
              title="Draft readiness"
              description="Saving creates or updates a draft. Publish remains on the opportunity detail page when readiness ≥ 80% and your account is approved."
            >
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                {wizardReadiness.missingRequired.length > 0
                  ? `Still missing for publish: ${wizardReadiness.missingRequired
                      .slice(0, 5)
                      .join(', ')}${
                      wizardReadiness.missingRequired.length > 5 ? '…' : ''
                    }`
                  : 'Required fields look complete. You can save this draft and publish from detail when ready.'}
              </p>
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                Primary action: {draftSubmitLabel} — you will be taken to the opportunity
                detail page.
              </p>
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
