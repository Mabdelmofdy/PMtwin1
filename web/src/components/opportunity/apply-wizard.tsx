import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { negotiationService } from '@/services/negotiation-service.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ApplyWizard({
  opportunityId,
  applicantId,
  onSubmitted,
}: {
  opportunityId: string
  applicantId: string
  onSubmitted: () => void
}) {
  const [step, setStep] = useState(1)
  const [proposal, setProposal] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('SAR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

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
      toast.error('You have already submitted an application for this opportunity.')
      return
    }
    toast.success('Application submitted')
    onSubmitted()
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Apply to this opportunity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 text-xs">
          {['Proposal', 'Value', 'Review'].map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 font-medium ${
                step === i + 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="proposal">Proposal summary</Label>
            <Textarea
              id="proposal"
              rows={5}
              placeholder="Describe your approach, deliverables, and relevant experience…"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Requested value</Label>
              <Input
                id="amount"
                type="number"
                placeholder="250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
            <p className="font-medium">Review your application</p>
            <p className="text-muted-foreground">{proposal}</p>
            {amount ? (
              <p className="text-muted-foreground">
                Value: {Number(amount).toLocaleString()} {currency}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-between gap-2">
          <Button
            variant="ghost"
            className="cursor-pointer"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button className="cursor-pointer" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              className="cursor-pointer"
              disabled={isSubmitting}
              onClick={submit}
            >
              {isSubmitting ? 'Submitting…' : 'Submit application'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
