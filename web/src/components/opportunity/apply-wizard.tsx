import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { negotiationService } from '@/services/negotiation-service.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmFormField } from '@/components/forms/pm-form-index'
import { PmButton } from '@/components/ui/pm-button'
import { PmBadge } from '@/components/ui/pm-badge'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { productFlags } from '@/config/product-flags.ts'

const STEPS = ['Proposal', 'Value', 'Review'] as const

export function ApplyWizard({
  opportunityId,
  applicantId,
  onSubmitted,
  legacy: _legacy = true,
}: {
  opportunityId: string
  applicantId: string
  onSubmitted: () => void
  /** Always legacy in current product — direct applications are secondary to PostMatch. */
  legacy?: boolean
}) {
  const [step, setStep] = useState(1)
  const [proposal, setProposal] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('SAR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  if (!productFlags.showLegacyApplications) {
    return null
  }

  const submit = () => {
    if (isSubmittingRef.current) return
    if (!proposal.trim()) {
      toast.error('Please add a proposal summary.')
      return
    }
    isSubmittingRef.current = true
    setIsSubmitting(true)
    const created = negotiationService.submitApplication({
      opportunityId,
      applicantId,
      status: 'pending',
      proposal: proposal.trim(),
      application_value: {
        amount: amount ? Number(amount) : undefined,
        currency,
      },
    })
    isSubmittingRef.current = false
    setIsSubmitting(false)
    if (!created) {
      toast.error('You have already submitted a legacy application for this opportunity.')
      return
    }
    toast.success('Legacy application submitted')
    onSubmitted()
  }

  return (
    <PmContentCard
      title="Legacy direct application"
      description="Optional hiring path — PostMatch remains the primary collaboration route."
      className="border-border/50 bg-surface-muted/40"
    >
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <PmBadge
            key={label}
            tone={step === i + 1 ? 'primary' : 'muted'}
            size="sm"
          >
            {i + 1}. {label}
          </PmBadge>
        ))}
      </div>

      {step === 1 ? (
        <PmFormField id="proposal" label="Proposal summary" className="mt-4">
          <Textarea
            id="proposal"
            rows={5}
            placeholder="Describe your approach, deliverables, and relevant experience…"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
        </PmFormField>
      ) : null}

      {step === 2 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PmFormField id="amount" label="Requested value">
            <Input
              id="amount"
              type="number"
              placeholder="250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </PmFormField>
          <PmFormField id="currency" label="Currency">
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </PmFormField>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={cn('mt-4 space-y-2 rounded-lg bg-surface-muted p-4', pmTypography.bodySm)}>
          <p className="font-medium">Review your legacy application</p>
          <p className="text-muted-foreground">{proposal}</p>
          {amount ? (
            <p className="text-muted-foreground">
              Value: {Number(amount).toLocaleString()} {currency}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex justify-between gap-2">
        <PmButton
          variant="ghost"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </PmButton>
        {step < 3 ? (
          <PmButton onClick={() => setStep((s) => s + 1)}>Continue</PmButton>
        ) : (
          <PmButton disabled={isSubmitting} onClick={submit}>
            {isSubmitting ? 'Submitting…' : 'Submit legacy application'}
          </PmButton>
        )}
      </div>
    </PmContentCard>
  )
}
