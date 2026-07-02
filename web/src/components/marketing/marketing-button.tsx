import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type MarketingButtonVariant = 'primary' | 'secondary' | 'ghost'

type MarketingButtonProps = {
  children: ReactNode
  variant?: MarketingButtonVariant
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  to?: string
  href?: string
}

const variantClass: Record<MarketingButtonVariant, string> = {
  primary: 'mkt-btn mkt-btn-primary',
  secondary: 'mkt-btn mkt-btn-secondary',
  ghost: 'mkt-btn mkt-btn-ghost',
}

export function MarketingButton({
  children,
  variant = 'primary',
  className,
  type = 'button',
  disabled,
  onClick,
  to,
  href,
}: MarketingButtonProps) {
  const { reducedMotion } = useMarketingMotion()
  const classes = cn(variantClass[variant], className)

  const motionProps = reducedMotion
    ? {}
    : {
        whileHover: { y: -1 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.15 },
      }

  if (to) {
    return (
      <motion.div className="mkt-btn-wrap" {...motionProps}>
        <Link to={to} className={classes}>
          {children}
        </Link>
      </motion.div>
    )
  }

  if (href) {
    return (
      <motion.div className="mkt-btn-wrap" {...motionProps}>
        <a href={href} className={classes}>
          {children}
        </a>
      </motion.div>
    )
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.button>
  )
}
