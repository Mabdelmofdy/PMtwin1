import { Link } from 'react-router-dom'
import { PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmStatCard } from '@/components/ui/pm-index'

export type AdminKpiStripItem = {
  readonly label: string
  readonly value: string | number
  readonly href?: string
  readonly hint?: string
}

export type AdminKpiStripProps = {
  readonly items: readonly AdminKpiStripItem[]
  readonly columns?: 3 | 4
  readonly className?: string
}

export function AdminKpiStrip({ items, columns = 4, className }: AdminKpiStripProps) {
  if (items.length === 0) return null

  return (
    <PmMetricGrid columns={columns} className={className}>
      {items.map((item) => {
        const card = (
          <PmStatCard label={item.label} value={item.value} hint={item.hint} dense />
        )

        if (!item.href) {
          return <div key={item.label}>{card}</div>
        }

        return (
          <Link
            key={item.label}
            to={item.href}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {card}
          </Link>
        )
      })}
    </PmMetricGrid>
  )
}
