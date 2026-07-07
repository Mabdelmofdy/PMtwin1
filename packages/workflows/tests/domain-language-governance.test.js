import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const workflowsRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = join(workflowsRoot, 'src')

const LEGACY_COMPAT_ALLOWLIST = [
  'types.ts',
] // retains deprecated linkage aliases for migration compatibility

const FORBIDDEN_PATTERNS = [
  { label: 'create_deal_from_* action key', regex: /\bcreate_deal_from_[a-z_]+\b/ },
  { label: 'create_contract_from_deal action key', regex: /\bcreate_contract_from_deal\b/ },
  { label: 'deal.created audit action', regex: /\bdeal\.created\b/ },
]

function listFiles(root) {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(absolute))
      continue
    }
    if (!entry.name.endsWith('.ts')) continue
    files.push(absolute)
  }
  return files
}

describe('domain language governance', () => {
  it('uses Commercial Agreement terminology in workflow source', () => {
    const violations = []
    for (const absolutePath of listFiles(sourceRoot)) {
      const path = relative(sourceRoot, absolutePath).replaceAll('\\', '/')
      if (LEGACY_COMPAT_ALLOWLIST.includes(path)) continue

      const source = readFileSync(absolutePath, 'utf8')
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.regex.test(source)) {
          violations.push(`${path}: ${rule.label}`)
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Legacy deal workflow terms found:\n${violations.join('\n')}`,
    )
  })
})
