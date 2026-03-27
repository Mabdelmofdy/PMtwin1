/**
 * Render docs/manuals/*.html to A4 PDF.
 * Run: cd POC && node scripts/render-manual-pdf.mjs [manual.html] [out.pdf]
 * Defaults: pmtwin-user-training-manual.html -> PMTwin-User-Training-Manual-A4.pdf
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANUAL_DIR = path.resolve(__dirname, '..', '..', 'docs', 'manuals');
const MANUAL_FILE = process.argv[2] || 'pmtwin-user-training-manual.html';
const OUT_PDF = path.join(
    MANUAL_DIR,
    process.argv[3] ||
        (MANUAL_FILE.includes('admin')
            ? 'PMTwin-Admin-Training-Manual-A4.pdf'
            : 'PMTwin-User-Training-Manual-A4.pdf')
);
const PORT = process.env.MANUAL_PDF_PORT
    ? Number(process.env.MANUAL_PDF_PORT)
    : MANUAL_FILE.includes('admin')
      ? 9889
      : 9888;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'text/javascript; charset=utf-8'
};

function safeJoin(root, reqPath) {
    const decoded = decodeURIComponent(reqPath.split('?')[0]);
    const rel = decoded.replace(/^\/+/, '');
    const rootResolved = path.resolve(root);
    const full = path.normalize(path.join(rootResolved, rel));
    const relToRoot = path.relative(rootResolved, full);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) return null;
    return full;
}

function startStaticServer(root) {
    const server = http.createServer((req, res) => {
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/' || urlPath === '') urlPath = '/pmtwin-user-training-manual.html';
        const filePath = safeJoin(root, urlPath);
        if (!filePath) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        fs.stat(filePath, (err, st) => {
            if (err || !st.isFile()) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        });
    });
    return new Promise((resolve, reject) => {
        server.listen(PORT, '127.0.0.1', () => resolve(server));
        server.on('error', reject);
    });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const htmlPath = path.join(MANUAL_DIR, MANUAL_FILE);
    if (!fs.existsSync(htmlPath)) {
        throw new Error('Manual HTML not found: ' + htmlPath);
    }

    const server = await startStaticServer(MANUAL_DIR, MANUAL_FILE);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        const url = `http://127.0.0.1:${PORT}/${MANUAL_FILE}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
        await delay(2500);
        await page.waitForFunction(
            () => {
                const nodes = document.querySelectorAll('.mermaid');
                if (!nodes.length) return true;
                return Array.from(nodes).every((n) => n.querySelector('svg'));
            },
            undefined,
            { timeout: 90000 }
        ).catch(() => console.warn('Mermaid: some diagrams may not have rendered; PDF will still be generated.'));
        await delay(500);

        await page.pdf({
            path: OUT_PDF,
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate:
                '<div style="font-size:9px;width:100%;text-align:center;color:#6b7280;padding:0 12mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
        });

        console.log('Wrote PDF:', OUT_PDF);
    } finally {
        await browser.close();
        server.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
