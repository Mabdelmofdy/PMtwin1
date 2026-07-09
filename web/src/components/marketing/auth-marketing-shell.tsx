import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type AuthMarketingShellProps = {
  marketing: ReactNode
  children: ReactNode
  formLabel: string
  pageClassName?: string
}

/** Split auth layout matching Login — marketing column + animated form zone. */
export function AuthMarketingShell({
  marketing,
  children,
  formLabel,
  pageClassName,
}: AuthMarketingShellProps) {
  const { reducedMotion } = useMarketingMotion()

  return (
    <div
      className={[
        'legacy-poc-page page-container pm-auth-page pm-auth-page--marketing',
        pageClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <section className="pm-auth-visual" aria-label="PM-Twin product reassurance">
        {marketing}
      </section>

      <section className="pm-auth-form-zone" aria-label={formLabel}>
        <motion.div
          className="pm-login-card pm-auth-card-enter"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {children}
        </motion.div>
      </section>
    </div>
  )
}

type AuthMarketingColumnProps = {
  kicker: string
  kickerIcon?: string
  title: string
  description: string
}

export function AuthMarketingColumn({
  kicker,
  kickerIcon = 'ph-shield-check',
  title,
  description,
}: AuthMarketingColumnProps) {
  return (
    <>
      <div className="pm-auth-grid" aria-hidden="true" />
      <div className="pm-auth-visual-content">
        <p className="pm-auth-kicker">
          <i className={`ph-duotone ${kickerIcon}`} aria-hidden="true" />
          {kicker}
        </p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="pm-auth-model" aria-hidden="true">
          <span className="pm-auth-block pm-auth-block-a" />
          <span className="pm-auth-block pm-auth-block-b" />
          <span className="pm-auth-block pm-auth-block-c" />
          <span className="pm-auth-line pm-auth-line-a" />
          <span className="pm-auth-line pm-auth-line-b" />
        </div>
      </div>
    </>
  )
}
