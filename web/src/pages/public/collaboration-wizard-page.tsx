import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PUBLIC_CTA } from '@/config/public-marketing'
import { PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import {
  COLLABORATION_MODEL_CATALOG,
  isWizardComplete,
  recommendCollaborationModels,
  type CollaborationWizardAnswers,
  type WizardEngagementScope,
  type WizardExchangePreference,
  type WizardPriority,
} from '@/lib/collaboration-model-selector'
import {
  MarketingButton,
  MarketingHero,
  MarketingSection,
  useMarketingMotion,
} from '@/components/marketing/marketing-index'

const EXCHANGE_OPTIONS: { id: WizardExchangePreference; label: string; hint: string }[] = [
  { id: 'cash', label: 'Cash payment', hint: 'Pay for defined deliverables' },
  { id: 'barter', label: 'Service or resource trade', hint: 'Exchange value without cash' },
  { id: 'partnership', label: 'Shared partnership', hint: 'Co-invest and co-deliver' },
  { id: 'pooling', label: 'Pooled resources', hint: 'Share equipment or capacity' },
]

const SCOPE_OPTIONS: { id: WizardEngagementScope; label: string }[] = [
  { id: 'defined_package', label: 'A defined scope or package' },
  { id: 'swap', label: 'Complementary capability swap' },
  { id: 'multi_party', label: 'Multi-party joint objective' },
  { id: 'capacity', label: 'Shared capacity across projects' },
]

const PRIORITY_OPTIONS: { id: WizardPriority; label: string }[] = [
  { id: 'payment_clarity', label: 'Clear payment milestones' },
  { id: 'liquidity', label: 'Reduce cash pressure' },
  { id: 'governance', label: 'Align partner governance' },
  { id: 'utilization', label: 'Improve resource utilization' },
]

type WizardStep = 1 | 2 | 3 | 'results'

export function CollaborationWizardPage() {
  const [step, setStep] = useState<WizardStep>(1)
  const [answers, setAnswers] = useState<CollaborationWizardAnswers>({
    exchangePreference: '',
    engagementScope: '',
    priority: '',
  })
  const { tabPanel, reducedMotion } = useMarketingMotion()

  const recommendations = isWizardComplete(answers)
    ? recommendCollaborationModels(answers)
    : []

  const goResults = () => {
    if (isWizardComplete(answers)) setStep('results')
  }

  const restart = () => {
    setAnswers({ exchangePreference: '', engagementScope: '', priority: '' })
    setStep(1)
  }

  return (
    <div className="legacy-poc-page mkt-page mkt-wizard-page">
      <MarketingHero
        centered
        compact
        eyebrow={
          <>
            <i className="ph-duotone ph-path" aria-hidden="true" />
            Guided model selector
          </>
        }
        title="Find a collaboration model that fits your opportunity"
        subtitle="A transparent, rule-based guide — not AI. Answer three questions to see which models align with your inputs."
      />

      <MarketingSection animate={false} wide>
        <div className="mkt-wizard-shell">
          <ol className="mkt-wizard-progress" aria-label="Wizard progress">
            {(['Exchange', 'Scope', 'Priority', 'Results'] as const).map((label, index) => {
              const stepNum = index + 1
              const active =
                step === 'results' ? index === 3 : typeof step === 'number' && step >= stepNum
              return (
                <li key={label} className={active ? 'is-active' : undefined}>
                  <span>{stepNum}</span>
                  {label}
                </li>
              )
            })}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={String(step)}
              className="mkt-wizard-step"
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              exit="exit"
              variants={tabPanel}
            >
              {step === 1 ? (
                <WizardQuestion
                  title="How do you prefer to structure value exchange?"
                  options={EXCHANGE_OPTIONS.map((o) => ({
                    id: o.id,
                    label: o.label,
                    hint: o.hint,
                  }))}
                  value={answers.exchangePreference}
                  onSelect={(id) =>
                    setAnswers((a) => ({ ...a, exchangePreference: id as WizardExchangePreference }))
                  }
                  onNext={() => setStep(2)}
                />
              ) : null}

              {step === 2 ? (
                <WizardQuestion
                  title="What best describes the engagement?"
                  options={SCOPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                  value={answers.engagementScope}
                  onSelect={(id) =>
                    setAnswers((a) => ({ ...a, engagementScope: id as WizardEngagementScope }))
                  }
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              ) : null}

              {step === 3 ? (
                <WizardQuestion
                  title="What is your top priority?"
                  options={PRIORITY_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                  value={answers.priority}
                  onSelect={(id) => setAnswers((a) => ({ ...a, priority: id as WizardPriority }))}
                  onBack={() => setStep(2)}
                  onNext={goResults}
                  nextLabel="See recommendations"
                />
              ) : null}

              {step === 'results' ? (
                <div className="mkt-wizard-results">
                  <h2>Recommended collaboration models</h2>
                  <p className="mkt-wizard-results-intro">
                    Based on your answers, these models from the {PUBLIC_BRAND_NAME} library are the
                    closest fit. Scores reflect simple rules — not machine learning.
                  </p>

                  <ul className="mkt-wizard-result-list">
                    {recommendations.map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong>
                        <span className="mkt-wizard-score">Fit score: {item.score}</span>
                        <p>{item.reason}</p>
                        <p className="mkt-wizard-summary">
                          {COLLABORATION_MODEL_CATALOG[item.id].summary}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mkt-wizard-result-actions">
                    <MarketingButton to="/find" variant="primary">
                      {PUBLIC_CTA.exploreMarketplace}
                    </MarketingButton>
                    <MarketingButton to="/knowledge-base" variant="secondary">
                      Read Knowledge Base
                    </MarketingButton>
                    <MarketingButton to="/contact" variant="secondary">
                      {PUBLIC_CTA.contactSales}
                    </MarketingButton>
                    <MarketingButton type="button" variant="ghost" onClick={restart}>
                      Start over
                    </MarketingButton>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </MarketingSection>
    </div>
  )
}

function WizardQuestion({
  title,
  options,
  value,
  onSelect,
  onBack,
  onNext,
  nextLabel = 'Continue',
}: {
  title: string
  options: { id: string; label: string; hint?: string }[]
  value: string
  onSelect: (id: string) => void
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
}) {
  return (
    <fieldset className="mkt-wizard-fieldset">
      <legend className="mkt-wizard-legend">{title}</legend>
      <div className="mkt-wizard-options" role="radiogroup" aria-label={title}>
        {options.map((option) => (
          <label
            key={option.id}
            className={`mkt-wizard-option${value === option.id ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name={title}
              value={option.id}
              className="sr-only"
              checked={value === option.id}
              onChange={() => onSelect(option.id)}
            />
            <span className="mkt-wizard-option-label">{option.label}</span>
            {option.hint ? <span className="mkt-wizard-option-hint">{option.hint}</span> : null}
          </label>
        ))}
      </div>
      <div className="mkt-wizard-nav">
        {onBack ? (
          <button type="button" className="mkt-btn mkt-btn-ghost" onClick={onBack}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="mkt-btn mkt-btn-primary"
          disabled={!value}
          onClick={onNext}
        >
          {nextLabel}
        </button>
      </div>
    </fieldset>
  )
}
