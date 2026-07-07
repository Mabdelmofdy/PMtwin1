import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

export type ExecutiveEntityMetadataProps = {
  mainModel?: string | null
  subModel?: string | null
  exchangeMode?: string | null
  topology?: string | null
  confidence?: string | null
  readiness?: string | null
  status?: string | null
  className?: string
}

function normalize(value?: string | null): string {
  if (!value) return '—'
  return value
}

export function ExecutiveEntityMetadata({
  mainModel,
  subModel,
  exchangeMode,
  topology,
  confidence,
  readiness,
  status,
  className,
}: ExecutiveEntityMetadataProps) {
  const rows = [
    { label: 'Model', value: normalize(mainModel) },
    { label: 'Sub-model', value: normalize(subModel) },
    { label: 'Exchange', value: normalize(exchangeMode) },
    { label: 'Topology', value: normalize(topology) },
    { label: 'Confidence', value: normalize(confidence) },
    { label: 'Readiness', value: normalize(readiness) },
    { label: 'Status', value: normalize(status) },
  ]

  return (
    <dl className={cn(pmTypography.caption, 'grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground', className)}>
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="truncate">{row.label}</dt>
          <dd className="truncate font-medium text-foreground/80">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
