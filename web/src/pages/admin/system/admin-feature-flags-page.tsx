import { productFlags } from '@/config/product-flags.ts'
import { runtimeFeatureFlags } from '@/config/runtime-feature-flags.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminFeatureFlagsPage() {
  const runtimeEntries = Object.entries(runtimeFeatureFlags)
  const productEntries = Object.entries(productFlags)

  return (
    <PmPage
      header={
        <PmPageHeader
          label="System"
          title="Feature Flags"
          description="Read-only runtime and product flags for this Demo/UAT build."
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PmContentCard title="Runtime feature flags" noPadding>
          <ul className="divide-y divide-border/60">
            {runtimeEntries.map(([key, value]) => (
              <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium">{key}</span>
                <PmBadge tone="muted" size="sm">
                  {String(value)}
                </PmBadge>
              </li>
            ))}
          </ul>
        </PmContentCard>
        <PmContentCard title="Product flags" noPadding>
          <ul className="divide-y divide-border/60">
            {productEntries.map(([key, value]) => (
              <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium">{key}</span>
                <PmBadge tone="muted" size="sm">
                  {String(value)}
                </PmBadge>
              </li>
            ))}
          </ul>
        </PmContentCard>
      </div>
    </PmPage>
  )
}
