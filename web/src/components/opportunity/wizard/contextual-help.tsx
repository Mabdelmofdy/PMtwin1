import { HelpCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getEducationalContent } from '@pm-twin/collaboration-models'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'

const FALLBACK_HELP: Readonly<Record<string, string>> = {
  collaboration:
    'Choose the main collaboration model that best describes how you will work with partners.',
  subModel:
    'Sub-models refine the engagement pattern (for example task-based vs employment).',
  exchange:
    'Exchange mode defines how value is exchanged: cash, equity, profit sharing, barter, or hybrid.',
  commercial:
    'Commercial terms capture budget, VAT, advance, retention, equity, or profit-share details.',
  workPackages:
    'Work packages break delivery into titled scope items with skills and deadlines.',
  skills:
    'Structured skills clarify required or provided capabilities and improve matching quality.',
  documents:
    'Attach compliance documents when required (for example CR or insurance) before publish.',
}

export type ContextualHelpTopic =
  | 'collaboration'
  | 'subModel'
  | 'exchange'
  | 'commercial'
  | 'workPackages'
  | 'skills'
  | 'documents'

/**
 * Contextual help from Knowledge Registry reads when available; static fallback otherwise.
 * Does not modify Knowledge Registry data.
 */
export function ContextualHelp({
  topic,
  subModelType,
  label = 'Help',
}: {
  readonly topic: ContextualHelpTopic
  readonly subModelType?: string
  readonly label?: string
}) {
  const [open, setOpen] = useState(false)

  const body = useMemo(() => {
    if ((topic === 'subModel' || topic === 'collaboration') && subModelType) {
      try {
        const education = getEducationalContent(subModelType)
        if (education?.whatIsIt) {
          return [education.whatIsIt, education.whyUseIt].filter(Boolean).join(' ')
        }
      } catch {
        // fall through
      }
    }
    return FALLBACK_HELP[topic] ?? 'Review this section carefully before saving your draft.'
  }, [topic, subModelType])

  return (
    <div className="relative inline-flex" data-testid={`contextual-help-${topic}`}>
      <PmButton
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 gap-1 px-1.5 text-muted-foreground"
        aria-expanded={open}
        aria-controls={`ocx-help-${topic}`}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle className="size-3.5" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
      </PmButton>
      {open ? (
        <PmSurface
          id={`ocx-help-${topic}`}
          role="dialog"
          aria-label={`${label} for ${topic}`}
          variant="elevated"
          shadow="floating"
          className="absolute end-0 top-full z-20 mt-1 w-72 p-3"
        >
          <p className={cn(pmTypography.bodySm, 'text-foreground')}>{body}</p>
          <PmButton
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setOpen(false)}
          >
            Close
          </PmButton>
        </PmSurface>
      ) : null}
    </div>
  )
}
