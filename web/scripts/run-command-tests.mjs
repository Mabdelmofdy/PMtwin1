import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(rootDir, '../src')

/** @param {string} dir */
function collectTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  /** @type {string[]} */
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

const testFiles = collectTestFiles(srcDir)

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx/esm', '--test', ...testFiles],
  {
    cwd: path.join(rootDir, '..'),
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: path.join(rootDir, '../tsconfig.test.json'),
    },
    stdio: 'inherit',
  },
)

process.exit(result.status ?? 1)
