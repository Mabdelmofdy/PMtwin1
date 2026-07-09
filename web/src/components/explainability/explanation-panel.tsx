import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ExplanationBundle, KnowledgeExtension } from '@pm-twin/explainability'
import { ExplanationBlockers } from '@/components/explainability/explanation-blockers.tsx'
import { ExplanationBreakdown } from '@/components/explainability/explanation-breakdown.tsx'
import { ExplanationRecommendations } from '@/components/explainability/explanation-recommendations.tsx'
import { ExplanationSummary } from '@/components/explainability/explanation-summary.tsx'
import { ExplanationTimeline } from '@/components/explainability/explanation-timeline.tsx'
import { PmButton } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { serializeBundleForAi } from '@/services/explainability/ai-gateway-service.ts'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'

function resolveKnowledgeExtension(bundle: ExplanationBundle): KnowledgeExtension | undefined {
  const knowledge = bundle.metadata.extensions?.knowledge
  if (!knowledge || typeof knowledge !== 'object') return undefined
  return knowledge as KnowledgeExtension
}

function ExplanationKnowledgeHints({ knowledge }: { knowledge: KnowledgeExtension }) {
  return (
    <section
      className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3"
      data-slot="explanation-knowledge-hints"
    >
      <p className={cn(pmTypography.label, 'text-muted-foreground')}>Knowledge hints</p>
      {knowledge.whatIsIt ? (
        <p className={cn(pmTypography.bodySm)}>
          <span className="font-medium">What: </span>
          {knowledge.whatIsIt}
        </p>
      ) : null}
      {knowledge.whyUseIt ? (
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
          <span className="font-medium text-foreground">Why: </span>
          {knowledge.whyUseIt}
        </p>
      ) : null}
      {knowledge.risks && knowledge.risks.length > 0 ? (
        <div>
          <p className={cn(pmTypography.caption, 'font-medium text-muted-foreground')}>Risks</p>
          <ul className={cn(pmTypography.bodySm, 'list-disc ps-5')}>
            {knowledge.risks.slice(0, 4).map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {knowledge.compliance ? (
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Compliance:{' '}
          {[
            knowledge.compliance.requiresLegalReview ? 'legal review' : null,
            knowledge.compliance.requiresFinancialReview ? 'financial review' : null,
            knowledge.compliance.requiresKyc ? 'KYC' : null,
            knowledge.compliance.requiresBoardApproval ? 'board approval' : null,
          ]
            .filter(Boolean)
            .join(', ') || 'standard gates'}
        </p>
      ) : null}
      {knowledge.lifecycle?.recommendedNextStage ? (
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Lifecycle next: {knowledge.lifecycle.recommendedNextStage}
        </p>
      ) : null}
    </section>
  )
}

function ExplanationAiPayloadFooter({ bundle }: { bundle: ExplanationBundle }) {
  const [expanded, setExpanded] = useState(false)
  const payload = useMemo(() => serializeBundleForAi(bundle), [bundle])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      toast.success('AI explanation payload copied')
    } catch {
      toast.error('Could not copy payload')
    }
  }

  return (
    <footer className="border-t border-border/60 pt-3" data-slot="explanation-ai-payload">
      <div className="flex flex-wrap items-center gap-2">
        <PmButton size="sm" variant="ghost" type="button" onClick={handleCopy}>
          Copy for AI
        </PmButton>
        <PmButton
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Hide payload' : 'Show payload'}
        </PmButton>
      </div>
      {expanded ? (
        <pre className={cn('mt-2 max-h-40 overflow-auto rounded bg-muted/40 p-2', pmTypography.caption)}>
          {payload}
        </pre>
      ) : null}
    </footer>
  )
}

export type ExplanationPanelProps = {
  bundle: ExplanationBundle
  className?: string
  scoreLabel?: string
  compact?: boolean
  showBreakdown?: boolean
  showTimeline?: boolean
  showBlockers?: boolean
  showRecommendations?: boolean
  showKnowledgeHints?: boolean
  showAiPayload?: boolean
}

/** Composes ExplanationBundle sections into a single inspector panel. */
export function ExplanationPanel({
  bundle,
  className,
  scoreLabel,
  compact = false,
  showBreakdown = true,
  showTimeline = !compact,
  showBlockers = true,
  showRecommendations = true,
  showKnowledgeHints = true,
  showAiPayload = false,
}: ExplanationPanelProps) {
  const { locale } = useProductLanguage()
  const knowledge = resolveKnowledgeExtension(bundle)

  return (
    <div
      className={cn('space-y-4', className)}
      data-slot="explanation-panel"
      data-engine={bundle.engine}
      data-locale={locale}
    >
      <ExplanationSummary bundle={bundle} scoreLabel={scoreLabel} />
      {showKnowledgeHints && knowledge ? <ExplanationKnowledgeHints knowledge={knowledge} /> : null}
      {showBlockers ? <ExplanationBlockers bundle={bundle} /> : null}
      {showRecommendations ? (
        <ExplanationRecommendations bundle={bundle} compact={compact} />
      ) : null}
      {showBreakdown ? <ExplanationBreakdown bundle={bundle} /> : null}
      {showTimeline ? <ExplanationTimeline bundle={bundle} /> : null}
      {showAiPayload ? <ExplanationAiPayloadFooter bundle={bundle} /> : null}
    </div>
  )
}
