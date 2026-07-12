import { Link } from 'react-router-dom'
import type { AdminDistributionBucket, AdminTrendPoint } from '@/domain/admin/read-models/admin-analytics-adapter.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminDistributionChartProps = {
  readonly title: string
  readonly description?: string
  readonly buckets: readonly AdminDistributionBucket[]
  readonly className?: string
}

/** Horizontal bar distribution with drill-down links. */
export function AdminDistributionChart({
  title,
  description,
  buckets,
  className,
}: AdminDistributionChartProps) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  return (
    <PmContentCard title={title} description={description} className={className}>
      {buckets.length === 0 ? (
        <PmEmptyState title="No data for this distribution" size="compact" />
      ) : (
        <ul className="space-y-2" aria-label={title}>
          {buckets.map((bucket) => {
            const width =
              bucket.count <= 0 ? 0 : Math.round((bucket.count / max) * 100)
            return (
              <li key={bucket.id}>
                <Link
                  to={bucket.href}
                  className={cn(
                    'block rounded-md px-1 py-1 hover:bg-muted/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <span className={pmTypography.label}>{bucket.label}</span>
                    <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                      {bucket.count <= 0 ? 'No data' : bucket.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    {width > 0 ? (
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${width}%` }}
                      />
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </PmContentCard>
  )
}

export type AdminTrendChartProps = {
  readonly title: string
  readonly description?: string
  readonly points: readonly AdminTrendPoint[]
  readonly href?: string
  readonly className?: string
}

/** Simple SVG column trend from discrete live buckets (no fabricated points). */
export function AdminTrendChart({
  title,
  description,
  points,
  href,
  className,
}: AdminTrendChartProps) {
  const max = Math.max(1, ...points.map((p) => p.value))
  const width = 320
  const height = 120
  const pad = 16
  const barGap = 8
  const barWidth =
    points.length > 0
      ? (width - pad * 2 - barGap * (points.length - 1)) / points.length
      : 0

  const chart = (
    <PmContentCard title={title} description={description} className={className}>
      {points.length === 0 || points.every((p) => p.value <= 0) ? (
        <PmEmptyState title="Awaiting activity" description="Not enough data to chart yet." size="compact" />
      ) : (
        <div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-32 w-full"
            role="img"
            aria-label={title}
          >
            {points.map((point, index) => {
              if (point.value <= 0) {
                const x = pad + index * (barWidth + barGap)
                return (
                  <g key={point.id}>
                    <text
                      x={x + barWidth / 2}
                      y={height - 2}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px]"
                    >
                      {point.label}
                    </text>
                  </g>
                )
              }
              const h = (point.value / max) * (height - pad * 2)
              const x = pad + index * (barWidth + barGap)
              const y = height - pad - h
              return (
                <g key={point.id}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={3}
                    className="fill-primary"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={height - 2}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {point.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </PmContentCard>
  )

  if (!href) return chart
  return (
    <Link
      to={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {chart}
    </Link>
  )
}

export type AdminConversionFunnelProps = {
  readonly title?: string
  readonly stages: readonly AdminDistributionBucket[]
  readonly className?: string
}

export function AdminConversionFunnel({
  title = 'Pipeline composition',
  stages,
  className,
}: AdminConversionFunnelProps) {
  const hasActivity = stages.some((s) => s.count > 0)
  if (!hasActivity) {
    return (
      <PmContentCard title={title} className={className}>
        <PmEmptyState
          title="Awaiting activity"
          description="Pipeline stages will appear when marketplace records exist."
          size="compact"
        />
      </PmContentCard>
    )
  }
  return (
    <AdminDistributionChart
      title={title}
      description="Current distribution across operational stages. Drill into any stage to open the related list."
      buckets={stages}
      className={className}
    />
  )
}

export type AdminMetricTileProps = {
  readonly label: string
  readonly value: string | number
  readonly href?: string
  readonly hint?: string
}

export function AdminMetricTile({ label, value, href, hint }: AdminMetricTileProps) {
  const body = (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{label}</p>
      <p className={cn(pmTypography.stat, 'mt-1 text-xl')}>{value}</p>
      {hint ? (
        <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>{hint}</p>
      ) : null}
    </div>
  )
  if (!href) return body
  return (
    <Link
      to={href}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {body}
    </Link>
  )
}
