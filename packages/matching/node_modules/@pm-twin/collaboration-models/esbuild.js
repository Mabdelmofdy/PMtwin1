import esbuild from 'esbuild'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distFile = join(__dirname, 'dist', 'index.js')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: distFile,
    platform: 'neutral',
    treeShaking: true,
    minify: false,
  })
  .catch(() => process.exit(1))
