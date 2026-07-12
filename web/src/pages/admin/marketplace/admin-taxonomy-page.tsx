import { SUB_MODEL_TYPE_KEYS } from '@pm-twin/collaboration-models'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmPage, PmPageHeader, PmStatCard } from '@/components/ui/pm-index'

const PRODUCT_TARGET_SUB_MODELS = 15

export function AdminTaxonomyPage() {
  const implemented = SUB_MODEL_TYPE_KEYS.length
  const gap = Math.max(0, PRODUCT_TARGET_SUB_MODELS - implemented)

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Marketplace"
          title="Taxonomy"
          description="Collaboration sub-models from @pm-twin/collaboration-models — no invented models."
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard label="Implemented sub-models" value={implemented} dense />
        <PmStatCard label="Product target" value={PRODUCT_TARGET_SUB_MODELS} dense />
        <PmStatCard label="Gap" value={gap} dense />
      </PmMetricGrid>
      <PmContentCard title="SUB_MODEL_TYPE_KEYS" className="mt-6">
        <div className="flex flex-wrap gap-2">
          {SUB_MODEL_TYPE_KEYS.map((key) => (
            <PmBadge key={key} tone="muted" size="sm">
              {key}
            </PmBadge>
          ))}
        </div>
        {gap > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Product target is {PRODUCT_TARGET_SUB_MODELS} sub-models; {gap} remain unspecified
            in the package (not invented here).
          </p>
        ) : null}
      </PmContentCard>
    </PmPage>
  )
}
