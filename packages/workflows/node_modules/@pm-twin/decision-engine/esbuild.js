import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/index.js',
    platform: 'browser',
    treeShaking: true,
    minify: false,
  })
  .catch(() => process.exit(1))
