import { useMemo, useState } from 'react'
import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import { CollaborationSubModelFields } from '@/components/opportunity/collaboration-sub-model-fields.tsx'
import { PmFormSection } from '@/components/forms/pm-form-index'
import {
  deriveMatchingTopology,
  listMainCollaborationModels,
  listSubModelsForMain,
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import { PmButton, PmSurface } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type CollaborationStepProps = {
  draft: OpportunityDraft
  onChange: (patch: Partial<OpportunityDraft>) => void
}

const MODEL_BLURBS: Record<string, { description: string; example: string }> = {
  cash_subcontracting: {
    description:
      'Engage another company or professional to deliver defined work for payment.',
    example: 'Concrete pumping subcontract for a construction project.',
  },
  service_exchange: {
    description: 'Exchange complementary services without a pure cash transaction.',
    example: 'Design capacity exchanged for site supervision.',
  },
  joint_venture: {
    description: 'Partner to pursue a shared project or business outcome.',
    example: 'SPV for a mixed-use development bid.',
  },
  resource_sharing: {
    description: 'Share equipment, people, or materials across parties.',
    example: 'Shared crane fleet across two contractors.',
  },
  hiring: {
    description: 'Hire a professional or consultant for an engagement.',
    example: 'Senior PM for a 6-month program.',
  },
}

export function CollaborationStep({ draft, onChange }: CollaborationStepProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const mainModels = useMemo(() => listMainCollaborationModels(), [])
  const subModels = useMemo(
    () => listSubModelsForMain(draft.mainCollaborationModel),
    [draft.mainCollaborationModel],
  )
  const derived = useMemo(
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

  return (
    <div data-slot="collaboration-step" className="space-y-8">
      <div>
        <h2 className={cn(pmTypography.h2)}>Collaboration</h2>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Choose how parties will work together. Matching structure is derived automatically.
        </p>
      </div>

      <PmFormSection
        id="section-main-model"
        title="Main Collaboration Model"
        description="Select the engagement model that best fits this opportunity."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {mainModels.map((model) => {
            const id = model.key
            const selected = draft.mainCollaborationModel === id
            const blurb = MODEL_BLURBS[id]
            const count = listSubModelsForMain(id).length
            return (
              <button
                key={id}
                type="button"
                data-field-id="mainCollaborationModel"
                aria-pressed={selected}
                className={cn(
                  'rounded-lg border p-4 text-start transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-surface-muted',
                )}
                onClick={() => {
                  const subs = listSubModelsForMain(id)
                  const first = subs[0]
                  onChange({
                    mainCollaborationModel: id,
                    modelType: first?.modelType ?? model.defaultModelType,
                    subModelType: first?.key ?? '',
                  })
                }}
              >
                <p className={cn(pmTypography.label)}>
                  {model.name || resolveMainCollaborationModelLabel(id)}
                </p>
                <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                  {blurb?.description ?? model.description}
                </p>
                {blurb?.example ? (
                  <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                    Example: {blurb.example}
                  </p>
                ) : null}
                <p className={cn(pmTypography.caption, 'mt-2 text-foreground')}>
                  {count} available engagement model{count === 1 ? '' : 's'}
                </p>
              </button>
            )
          })}
        </div>
      </PmFormSection>

      {draft.mainCollaborationModel ? (
        <PmFormSection
          id="section-sub-model"
          title="Sub-model"
          description="Available engagement models for the selected collaboration model."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {subModels.map((sub) => {
              const id = sub.key
              const selected = draft.subModelType === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    'rounded-md border px-3 py-2.5 text-start',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-surface-muted',
                  )}
                  onClick={() =>
                    onChange({
                      subModelType: id,
                      modelType: sub.modelType,
                    })
                  }
                >
                  <span className={cn(pmTypography.label)}>
                    {resolveSubModelLabel(id)}
                  </span>
                </button>
              )
            })}
          </div>
        </PmFormSection>
      ) : null}

      {draft.mainCollaborationModel && draft.subModelType ? (
        <PmSurface className="space-y-2 p-4" id="section-matching-structure">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                Recommended matching structure
              </p>
              <p className={cn(pmTypography.label)}>
                {formatFrameworkMatchTypeLabel(derived.topology)}
              </p>
              <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                Derived automatically from the selected collaboration model, sub-model,
                and value exchange configuration.
              </p>
            </div>
            <PmButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setWhyOpen((v) => !v)}
              aria-expanded={whyOpen}
            >
              Why?
            </PmButton>
          </div>
          {whyOpen ? (
            <p className={cn(pmTypography.bodySm, 'rounded-md bg-surface-muted p-3')}>
              {derived.reason ||
                'The matching topology is system-derived and cannot be selected manually.'}
            </p>
          ) : null}
        </PmSurface>
      ) : null}

      {draft.subModelType ? (
        <PmFormSection id="section-collaboration-details" title="Collaboration Details">
          <CollaborationSubModelFields
            subModelType={draft.subModelType}
            values={draft.collaborationAttributes}
            exchangeMode={draft.exchangeMode}
            onChange={(key, value) =>
              onChange({
                collaborationAttributes: {
                  ...draft.collaborationAttributes,
                  [key]: value,
                },
              })
            }
          />
        </PmFormSection>
      ) : null}
    </div>
  )
}
