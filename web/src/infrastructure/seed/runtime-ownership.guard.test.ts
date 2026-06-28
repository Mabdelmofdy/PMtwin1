/**
 * Phase 10.3 guard — web/src must not couple to POC runtime or legacy @poc-data naming.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const webSrcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const FORBIDDEN_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: '@poc-data imports', pattern: /@poc-data\// },
  { label: 'POC/src runtime paths', pattern: /POC\/src/ },
  { label: 'POC data-service runtime import', pattern: /data-service\.js/ },
  { label: 'POC auth-service runtime import', pattern: /POC\/.*auth-service/ },
  { label: 'POC matching-service runtime import', pattern: /POC\/.*matching-service/ },
  { label: 'relative import into POC runtime', pattern: /from ['"][^'"]*\/POC\/src/ },
]

/** @param {string} dir */
function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath))
    } else if (
      entry.isFile()
      && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
      && !entry.name.endsWith('.guard.test.ts')
    ) {
      files.push(fullPath)
    }
  }
  return files
}

describe('runtime ownership guard', () => {
  it('web/src has no POC runtime coupling or legacy @poc-data imports', () => {
    const violations: string[] = []

    for (const filePath of collectSourceFiles(webSrcRoot)) {
      const content = readFileSync(filePath, 'utf8')
      const relativePath = filePath.slice(webSrcRoot.length + 1).replace(/\\/g, '/')

      for (const { label, pattern } of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${relativePath}: ${label}`)
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Forbidden POC runtime coupling in web/src:\n${violations.join('\n')}`,
    )
  })
})
