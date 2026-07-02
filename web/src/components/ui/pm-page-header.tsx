import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { pmTypography } from '@/components/shared/pm-design-tokens'



export type PmPageHeaderProps = {

  label?: string

  title: string

  description?: string

  /** Optional hero metric — KPI or summary count beside the title block. */

  metric?: ReactNode

  /** Contextual badges (status, environment, etc.). */

  badges?: ReactNode

  actions?: ReactNode

  className?: string

  bordered?: boolean

  /** Contextual visual intent per workflow entity/page purpose. */
  tone?: 'default' | 'mission' | 'opportunity' | 'match' | 'negotiation' | 'deal' | 'contract'

}



export function PmPageHeader({

  label,

  title,

  description,

  metric,

  badges,

  actions,

  className,

  bordered = true,

  tone = 'default',

}: PmPageHeaderProps) {
  const toneClass = {
    default: 'from-surface via-surface/96 to-surface/90',
    mission: 'from-indigo-500/[0.11] via-surface to-surface/95',
    opportunity: 'from-cyan-500/[0.13] via-surface to-surface/95',
    match: 'from-violet-500/[0.12] via-surface to-surface/95',
    negotiation: 'from-amber-500/[0.11] via-surface to-surface/95',
    deal: 'from-emerald-500/[0.12] via-surface to-surface/95',
    contract: 'from-slate-500/[0.16] via-surface to-surface/95',
  }[tone]
  const purposeLabel = {
    default: 'My Workspace context',
    mission: 'Mission control',
    opportunity: 'Entity identity',
    match: 'Relationship review',
    negotiation: 'Decision workspace',
    deal: 'Execution readiness',
    contract: 'Agreement status',
  }[tone]

  return (
    <header
      data-slot="pm-page-header"
      className={cn(
        'pm-enter-hero relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-7',
        toneClass,
        bordered && 'border-border/70 pm-shadow-card',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 start-0 hidden w-1 rounded-full bg-gradient-to-b from-primary/50 via-primary/10 to-transparent lg:block"
        aria-hidden
      />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {label ? (
            <p className={pmTypography.overline}>{label}</p>
          ) : null}
          <p className={cn(pmTypography.caption, 'font-semibold uppercase tracking-[0.12em] text-muted-foreground/85')}>
            {purposeLabel}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            <h1 className={cn(pmTypography.h1, 'break-words')}>{title}</h1>
            {description ? (
              <p className={cn(pmTypography.bodySm, 'max-w-2xl text-muted-foreground md:text-base')}>
                {description}
              </p>
            ) : null}
          </div>
          {metric ? (
            <div className="min-w-0 max-w-full shrink-0 sm:border-s sm:border-border/70 sm:ps-6">
              {metric}
            </div>
          ) : null}
        </div>
        {badges ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">{badges}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}

