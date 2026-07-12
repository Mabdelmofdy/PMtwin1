import { useMemo } from 'react'
import {
  commercialAgreementRepository,
  contractRepository,
  opportunityRepository,
  partyRepository,
  userRepository,
} from '@/repositories/index.ts'
import {
  formatContractPresentation,
  formatOpportunityPresentation,
} from '@/lib/enterprise-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmPage, PmPageHeader, PmStatCard, PmEmptyState } from '@/components/ui/pm-index'

type QualityIssue = {
  readonly id: string
  readonly category: string
  readonly label: string
  readonly detail: string
}

export function AdminDataQualityPage() {
  const version = useDataStoreVersion()
  const issues = useMemo(() => {
    const list: QualityIssue[] = []
    const users = new Set(userRepository.getAll().map((u) => u.id))
    const parties = new Set(partyRepository.getAll().map((p) => p.id))
    const cas = new Set(commercialAgreementRepository.getAll().map((c) => c.id))

    for (const opp of opportunityRepository.getAll()) {
      const view = formatOpportunityPresentation(opp)
      if (!opp.creatorId) {
        list.push({
          id: `opp-missing-creator-${opp.id}`,
          category: 'orphan',
          label: `${view.name} (${view.reference})`,
          detail: 'Missing creator account',
        })
      } else if (!users.has(opp.creatorId)) {
        list.push({
          id: `opp-orphan-creator-${opp.id}`,
          category: 'orphan',
          label: `${view.name} (${view.reference})`,
          detail: 'Creator account is missing from identity records',
        })
      }
      if (opp.ownerPartyId && !parties.has(opp.ownerPartyId)) {
        list.push({
          id: `opp-orphan-party-${opp.id}`,
          category: 'ref',
          label: `${view.name} (${view.reference})`,
          detail: 'Owner party reference is missing',
        })
      }
    }

    for (const c of contractRepository.getAll()) {
      const view = formatContractPresentation(c)
      const caId = c.commercialAgreementId ?? c.dealId
      if (caId && !cas.has(caId)) {
        list.push({
          id: `contract-orphan-ca-${c.id}`,
          category: 'ref',
          label: `${view.name} (${view.reference})`,
          detail: 'Linked commercial agreement is missing',
        })
      }
    }

    return list
  }, [version])

  const orphanCount = issues.filter((i) => i.category === 'orphan').length
  const refCount = issues.filter((i) => i.category === 'ref').length

  return (
    <PmPage
      header={
        <PmPageHeader
          label="System"
          title="Data Quality"
          description="Basic orphan and reference checks across LocalStorage repositories."
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard label="Issues found" value={issues.length} dense />
        <PmStatCard label="Orphan hints" value={orphanCount} dense />
        <PmStatCard label="Broken refs" value={refCount} dense />
      </PmMetricGrid>
      <PmContentCard title="Findings" className="mt-6" noPadding>
        {issues.length === 0 ? (
          <div className="p-4">
            <PmEmptyState title="No data-quality issues detected" size="compact" />
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {issues.map((issue) => (
              <li key={issue.id} className="px-4 py-3">
                <p className="font-medium">{issue.label}</p>
                <p className="text-sm text-muted-foreground">
                  [{issue.category}] {issue.detail}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PmContentCard>
    </PmPage>
  )
}
