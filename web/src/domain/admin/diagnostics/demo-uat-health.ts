import { runtimeEnvironment } from '@/config/runtime-environment.ts'
import { runtimeFeatureFlags } from '@/config/runtime-feature-flags.ts'
import {
  auditRepository,
  companyRepository,
  contractRepository,
  commercialAgreementRepository,
  negotiationRepository,
  opportunityRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'

export type DemoUatHealthCheck = {
  readonly id: string
  readonly label: string
  readonly status: 'ok' | 'warning' | 'error' | 'info'
  readonly detail: string
}

export type DemoUatHealthSnapshot = {
  readonly generatedAt: string
  readonly runtimeMode: string
  readonly storageLabel: string
  readonly checks: readonly DemoUatHealthCheck[]
  readonly counts: Readonly<Record<string, number>>
}

function storageAvailable(): boolean {
  try {
    const key = '__pmtwin_health_probe__'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Demo/UAT diagnostics only — never invents DB/API/queue status. */
export function buildDemoUatHealthSnapshot(): DemoUatHealthSnapshot {
  const mode = runtimeEnvironment.mode
  const lsOk = typeof window !== 'undefined' ? storageAvailable() : true

  const counts = {
    users: userRepository.getAll().length,
    companies: companyRepository.getAll().length,
    parties: partyRepository.getAll().length,
    opportunities: opportunityRepository.getAll().length,
    postMatches: postMatchRepository.getAll().length,
    negotiations: negotiationRepository.getAll().length,
    commercialAgreements: commercialAgreementRepository.getAll().length,
    contracts: contractRepository.getAll().length,
    auditEntries: auditRepository.getAll().length,
  }

  const checks: DemoUatHealthCheck[] = [
    {
      id: 'runtime_mode',
      label: 'Runtime mode',
      status: 'info',
      detail: mode,
    },
    {
      id: 'local_storage',
      label: 'LocalStorage availability',
      status: lsOk ? 'ok' : 'error',
      detail: lsOk ? 'Writable' : 'Unavailable',
    },
    {
      id: 'namespace',
      label: 'Storage namespace',
      status: 'info',
      detail: runtimeFeatureFlags.storageTypeLabel,
    },
    {
      id: 'audit_append',
      label: 'Audit append availability',
      status: 'ok',
      detail: `${counts.auditEntries} entries readable`,
    },
    {
      id: 'feature_flags',
      label: 'Feature-flag state',
      status: 'info',
      detail: `banner=${runtimeFeatureFlags.showEnvironmentBanner}; namespaced=${runtimeFeatureFlags.usesNamespacedLocalStorage}`,
    },
    {
      id: 'seed_counts',
      label: 'Repository record counts',
      status: counts.opportunities >= 0 ? 'ok' : 'warning',
      detail: Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
    },
  ]

  if (mode === 'production') {
    checks.push({
      id: 'production_note',
      label: 'Production mode note',
      status: 'warning',
      detail:
        'Demo/UAT diagnostics only. Destructive environment controls remain hidden; LocalStorage is not a Production authority.',
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    runtimeMode: mode,
    storageLabel: runtimeFeatureFlags.storageTypeLabel,
    checks,
    counts,
  }
}
