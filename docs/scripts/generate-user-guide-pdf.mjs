/**
 * Generate docs/PM-Twin-Complete-User-Guide.pdf from the Markdown user guide.
 * Renders Mermaid workflow diagrams as large visual charts.
 * Usage (from repo root): node docs/scripts/generate-user-guide-pdf.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(docsDir, '..')
const mdPath = path.join(docsDir, 'PM-Twin-Complete-User-Guide.md')
const logoSvgPath = path.join(docsDir, 'assets', 'pmtwin-logo.svg')
const outHtmlPath = path.join(docsDir, 'PM-Twin-Complete-User-Guide.print.html')
const outPdfPath = path.join(docsDir, 'PM-Twin-Complete-User-Guide.pdf')

function ensureMarked() {
  const depsDir = path.join(__dirname, '.pdf-deps')
  const pkgJson = path.join(depsDir, 'package.json')
  const markedEsm = path.join(depsDir, 'node_modules', 'marked', 'lib', 'marked.esm.js')
  if (!fs.existsSync(pkgJson)) {
    fs.mkdirSync(depsDir, { recursive: true })
    fs.writeFileSync(
      pkgJson,
      JSON.stringify({ name: 'pmtwin-pdf-deps', private: true, type: 'module' }, null, 2),
    )
  }
  if (!fs.existsSync(markedEsm)) {
    console.log('Installing marked...')
    execSync('npm install marked@15 --no-package-lock', { cwd: depsDir, stdio: 'inherit' })
  }
  if (!fs.existsSync(markedEsm)) {
    throw new Error(`marked was not installed at ${markedEsm}`)
  }
  return markedEsm
}

function findPlaywright() {
  const candidates = [
    path.join(repoRoot, 'POC', 'node_modules', 'playwright'),
    path.join(repoRoot, 'web', 'node_modules', 'playwright'),
    path.join(repoRoot, 'node_modules', 'playwright'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error('Playwright not found. Install it under POC/ or web/.')
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Strip cover duplicates already shown on the PDF cover page. */
function prepareMarkdownForPdf(md) {
  return md
    .replace(/^<p align="center">[\s\S]*?<\/p>\s*/m, '')
    .replace(/^# PM-Twin Complete User Guide\s*/m, '')
    .replace(/^\*\*Official User Manual[^*]*\*\*\s*/m, '')
}

function configureMarked(marked) {
  const renderer = new marked.Renderer()
  const originalCode = renderer.code.bind(renderer)

  renderer.code = function code(token) {
    const lang = token.lang || ''
    const text = token.text || ''
    if (lang === 'mermaid') {
      return `<div class="mermaid-wrap"><pre class="mermaid">${escapeHtml(text.trim())}</pre></div>`
    }
    return originalCode(token)
  }

  marked.setOptions({ gfm: true, breaks: false })
  marked.use({ renderer })
}

async function main() {
  const markedPath = ensureMarked()
  const { marked } = await import(pathToFileURL(markedPath).href)
  configureMarked(marked)

  const md = prepareMarkdownForPdf(fs.readFileSync(mdPath, 'utf8'))
  const logoSvg = fs.readFileSync(logoSvgPath, 'utf8')
  const bodyHtml = marked.parse(md)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PM-Twin Complete User Guide</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page { size: A4; margin: 12mm 10mm 14mm 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #0f172a;
    }
    .cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 28mm 12mm 24mm;
      break-after: page;
      page-break-after: always;
    }
    .cover-logo { width: 360px; max-width: 88%; margin-bottom: 12mm; }
    .cover-logo svg { width: 100%; height: auto; display: block; }
    .cover .tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 8mm;
    }
    .cover h1 {
      border: none;
      font-size: 28pt;
      margin: 0 0 6mm;
      color: #0f172a;
      page-break-after: avoid;
    }
    .cover .subtitle {
      font-size: 13pt;
      color: #334155;
      max-width: 150mm;
      margin: 0 auto 10mm;
    }
    .cover .meta { color: #64748b; font-size: 10pt; margin: 0; }
    .doc-body { max-width: 100%; margin: 0; padding: 0; }
    h1 {
      font-size: 18pt;
      border-bottom: 2px solid #0369a1;
      padding-bottom: 4px;
      margin: 0.8em 0 0.45em;
      break-after: avoid;
      page-break-after: avoid;
    }
    h2 {
      font-size: 13.5pt;
      color: #0369a1;
      margin: 0.95em 0 0.35em;
      break-after: avoid;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      color: #0f172a;
      margin: 0.8em 0 0.3em;
      break-after: avoid;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10.5pt;
      color: #334155;
      margin: 0.7em 0 0.25em;
      break-after: avoid;
      page-break-after: avoid;
    }
    p { margin: 0.45em 0; }
    ul, ol { margin: 0.4em 0; padding-left: 1.2em; }
    li { margin: 0.15em 0; }
    a { color: #0369a1; text-decoration: none; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.8pt;
      margin: 8px 0 12px;
    }
    th, td { border: 1px solid #cbd5e1; padding: 5px 7px; vertical-align: top; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    blockquote {
      margin: 8px 0;
      padding: 7px 10px;
      border-left: 4px solid #0369a1;
      background: #f0f9ff;
      color: #0f172a;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 8.8pt;
      background: #f8fafc;
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre:not(.mermaid) {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      overflow: hidden;
      font-size: 8pt;
    }
    .mermaid-wrap {
      margin: 10px 0 14px;
      padding: 14px 8px 10px;
      background: #0b1220;
      border: 1px solid #1e293b;
      border-radius: 10px;
      overflow: hidden;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      max-height: 780px;
    }
    .mermaid-wrap .mermaid,
    pre.mermaid {
      background: transparent !important;
      border: none !important;
      margin: 0 auto !important;
      padding: 0 !important;
      text-align: center;
      color: #e2e8f0;
      display: block;
      min-height: 0 !important;
    }
    .mermaid-wrap svg {
      display: block !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: 720px !important;
      min-height: 0 !important;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 10px 0;
    }
    .page-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 6mm;
      padding-bottom: 3mm;
      border-bottom: 1px solid #e2e8f0;
    }
    .page-header-logo { width: 130px; }
    .page-header-logo svg { width: 100%; height: auto; display: block; }
    .page-header-title { font-size: 9pt; color: #64748b; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="tag">Official User Manual</div>
    <div class="cover-logo" aria-label="PM-Twin logo">${logoSvg}</div>
    <h1>Complete User Guide</h1>
    <p class="subtitle">Construction Collaboration Marketplace for Saudi Arabia and the GCC</p>
    <p class="meta">For end users, company owners, employees, administrators, trainers, and customers</p>
  </section>

  <div class="doc-body">
    <div class="page-header">
      <div class="page-header-logo">${logoSvg}</div>
      <div class="page-header-title">Complete User Guide</div>
    </div>
    ${bodyHtml}
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Segoe UI, Arial, Helvetica, sans-serif',
      themeVariables: {
        fontSize: '16px',
        darkMode: true,
        background: '#0b1220',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#94a3b8',
        lineColor: '#cbd5e1',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a',
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
        useMaxWidth: true,
        nodeSpacing: 28,
        rankSpacing: 36,
        padding: 12,
      },
      state: {
        useMaxWidth: true,
      },
    });

    function enlargeDiagrams() {
      document.querySelectorAll('.mermaid-wrap svg').forEach(function (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        svg.style.maxHeight = '720px';
        svg.style.minHeight = '0';
      });
    }

    mermaid.run({ querySelector: '.mermaid' })
      .then(function () {
        enlargeDiagrams();
        document.documentElement.setAttribute('data-mermaid', 'ready');
      })
      .catch(function (err) {
        console.error(err);
        document.documentElement.setAttribute('data-mermaid', 'error');
      });
  </script>
</body>
</html>`

  fs.writeFileSync(outHtmlPath, html, 'utf8')
  console.log('Wrote', outHtmlPath)

  const playwrightPath = findPlaywright()
  const { chromium } = await import(pathToFileURL(path.join(playwrightPath, 'index.mjs')).href)
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } })
    await page.goto(pathToFileURL(outHtmlPath).href, { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-mermaid') === 'ready',
      { timeout: 60000 },
    )
    await page.waitForTimeout(800)

    const tmpPdfPath = `${outPdfPath}.tmp.pdf`
    await page.pdf({
      path: tmpPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '10mm', right: '8mm', bottom: '12mm', left: '8mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#64748b;padding:0 12mm;display:flex;justify-content:space-between;"><span>PM-Twin Complete User Guide</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    })

    try {
      if (fs.existsSync(outPdfPath)) fs.unlinkSync(outPdfPath)
      fs.renameSync(tmpPdfPath, outPdfPath)
      console.log('Wrote', outPdfPath)
    } catch {
      const altPath = path.join(docsDir, 'PM-Twin-Complete-User-Guide-with-diagrams.pdf')
      fs.copyFileSync(tmpPdfPath, altPath)
      try { fs.unlinkSync(tmpPdfPath) } catch { /* ignore */ }
      console.log('Original PDF is locked. Wrote', altPath)
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
