/**
 * CI / dev diagnostic — scans normalized domain health from seed data.
 * Non-blocking: always exits 0 unless --strict is passed and health is poor.
 */
import { logValidationSummary } from '../src/domain/normalized/validation/diagnostics.ts'
import { scanNormalizedDomainHealth } from '../src/domain/normalized/validation/health-scan.ts'

const strict = process.argv.includes('--strict')
const report = scanNormalizedDomainHealth()

logValidationSummary(report, { enabled: true })

const output = {
  healthScore: report.overallHealthScore,
  totalErrors: report.errorSummary.totalErrors,
  strict,
  byEntity: Object.fromEntries(
    Object.entries(report.byEntity).map(([kind, stats]) => [
      kind,
      {
        total: stats.total,
        validPercent: stats.validPercent,
        invalid: stats.invalid,
      },
    ]),
  ),
  relationshipAnomalies: report.relationshipAnomalies.length,
}

console.log(JSON.stringify(output, null, 2))

if (strict && report.overallHealthScore < 50) {
  console.error('Strict mode: domain health score below threshold (50)')
  process.exit(1)
}

process.exit(0)
