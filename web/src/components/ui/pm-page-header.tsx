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

}: PmPageHeaderProps) {

  return (

    <header

      data-slot="pm-page-header"

      className={cn(

        'flex flex-col gap-5 rounded-2xl border border-transparent bg-gradient-to-b from-surface to-surface/85 px-5 py-5 lg:flex-row lg:items-end lg:justify-between',

        bordered && 'border-border/70 pm-shadow-card',

        className,

      )}

    >

      <div className="min-w-0 space-y-2">

        {label ? (

          <p className={pmTypography.overline}>{label}</p>

        ) : null}

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

