#!/usr/bin/env node
/**
 * PM-Twin design governance static guard (DDS-003).
 * Scans web/src for token architecture violations.
 *
 * Usage:
 *   node scripts/design/validate-design-governance.mjs
 *   node scripts/design/validate-design-governance.mjs --strict
 *
 * Default: reports violations, exits 0 (baseline mode).
 * --strict: exits 1 if non-baseline violations exist.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BASELINE_EXCEPTION_KEYS,
  checkLine,
  isBaselineException,
  violationKey,
} from './design-governance-rules.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')
const WEB_SRC = join(REPO_ROOT, 'web', 'src')

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git'])
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const strict = process.argv.includes('--strict')

/** @param {string} dir */
function collectSourceFiles(dir) {
  /** @type {string[]} */
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full))
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'))
      if (SCAN_EXTENSIONS.has(ext)) {
        files.push(full)
      }
    }
  }
  return files
}

/** @param {string} filePath */
function scanFile(filePath) {
  const relPath = relative(WEB_SRC, filePath).replace(/\\/g, '/')
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  /** @type {Array<{ file: string; line: number; type: string; message: string; suggestion: string; excerpt: string; baseline: boolean }>} */
  const violations = []

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    const found = checkLine(relPath, lineNumber, lines[i])
    for (const v of found) {
      const baseline = isBaselineException(relPath, v.line, v.type)
      violations.push({
        file: relPath,
        line: v.line,
        type: v.type,
        message: v.message,
        suggestion: v.suggestion,
        excerpt: v.excerpt,
        baseline,
      })
    }
  }

  return violations
}

function main() {
  if (!statSync(WEB_SRC, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`web/src not found at ${WEB_SRC}`)
    process.exit(1)
  }

  const files = collectSourceFiles(WEB_SRC)
  const allViolations = files.flatMap(scanFile)
  const baselineViolations = allViolations.filter((v) => v.baseline)
  const newViolations = allViolations.filter((v) => !v.baseline)

  const byType = /** @type {Record<string, number>} */ ({})
  for (const v of allViolations) {
    byType[v.type] = (byType[v.type] ?? 0) + 1
  }

  console.log('PM-Twin Design Governance Guard (DDS-003)')
  console.log('========================================')
  console.log(`Files scanned: ${files.length}`)
  console.log(`Total violations: ${allViolations.length}`)
  console.log(`Baseline exceptions: ${baselineViolations.length}`)
  console.log(`Non-baseline (actionable): ${newViolations.length}`)
  console.log(`Baseline registry keys: ${BASELINE_EXCEPTION_KEYS.size}`)
  console.log('')

  if (Object.keys(byType).length > 0) {
    console.log('By category:')
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`)
    }
    console.log('')
  }

  const toPrint = newViolations.length > 0 ? newViolations : allViolations
  const label =
    newViolations.length > 0 ? 'Actionable violations' : 'All violations (baseline mode)'

  if (toPrint.length === 0) {
    console.log('No violations detected.')
  } else {
    console.log(label + ':')
    for (const v of toPrint) {
      const tag = v.baseline ? '[baseline]' : '[NEW]'
      console.log(`  ${tag} ${v.file}:${v.line} ${v.type}`)
      console.log(`         ${v.message}`)
      console.log(`         → ${v.suggestion}`)
      if (v.excerpt) {
        console.log(`         ${v.excerpt}`)
      }
    }
  }

  console.log('')
  if (strict && newViolations.length > 0) {
    console.error(`FAILED: ${newViolations.length} non-baseline violation(s).`)
    process.exit(1)
  }

  console.log(
    strict
      ? 'PASSED (strict mode — no non-baseline violations).'
      : 'PASSED (baseline mode — exit 0). Use --strict to fail on new violations.',
  )
  process.exit(0)
}

main()
