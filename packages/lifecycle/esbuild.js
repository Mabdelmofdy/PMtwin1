import esbuild from 'esbuild'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distFile = join(__dirname, 'dist', 'index.js')
const pocVendorFile = join(
  __dirname,
  '..',
  '..',
  'POC',
  'vendor',
  '@pm-twin',
  'lifecycle',
  'index.js',
)

esbuild
  .build({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    outfile: distFile,
    platform: 'browser',
    treeShaking: true,
    minify: false,
  })
  .then(() => {
    mkdirSync(dirname(pocVendorFile), { recursive: true })
    copyFileSync(distFile, pocVendorFile)
  })
  .catch(() => process.exit(1))
