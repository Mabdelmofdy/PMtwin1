/**
 * Capture UI screenshots for docs/manuals (A4 user training manual).
 * Run from repo: cd POC && node scripts/capture-manual-screenshots.mjs
 * Requires: npm install (playwright) and npx playwright install chromium
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.resolve(POC_ROOT, '..', 'docs', 'manuals', 'assets');
const PORT = process.env.MANUAL_SCREENSHOT_PORT ? Number(process.env.MANUAL_SCREENSHOT_PORT) : 9877;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEWPORT = { width: 1366, height: 768 };

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
    '.webp': 'image/webp'
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

function startStaticServer() {
    const server = http.createServer((req, res) => {
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
        const filePath = safeJoin(POC_ROOT, urlPath);
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

async function waitAppReady(page) {
    await page.waitForSelector('#main-content', { timeout: 120000 });
    await page.waitForFunction(
        () => {
            const mc = document.querySelector('#main-content');
            if (!mc) return false;
            const h = mc.querySelector('h1');
            const err = mc.querySelector('.error');
            return !!(h && h.textContent) || !!err;
        },
        undefined,
        { timeout: 120000 }
    );
    await delay(1500);
}

async function login(page, email, password) {
    await page.goto(`${BASE}/index.html#/login`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('form#login-form button[type="submit"]');
    await delay(2500);
}

async function shot(page, name) {
    const out = path.join(ASSETS_DIR, `${name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);
}

async function main() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    const server = await startStaticServer();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: VIEWPORT,
        locale: 'en-US'
    });
    const page = await context.newPage();

    try {
        // --- Public: Register ---
        await page.goto(`${BASE}/index.html#/register`, { waitUntil: 'load' });
        await waitAppReady(page);
        await shot(page, '01-register');

        // --- Public: Login ---
        await page.goto(`${BASE}/index.html#/login`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '02-login');

        // --- Authenticated (demo user with matches, deals, contracts) ---
        await login(page, 'demo06@demo.test', 'demo123');

        await page.goto(`${BASE}/index.html#/dashboard`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '03-dashboard');

        await page.goto(`${BASE}/index.html#/profile`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '04-profile');

        await page.goto(`${BASE}/index.html#/opportunities/create`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '05-opportunity-create');

        await page.goto(`${BASE}/index.html#/matches`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '06-matches-list');

        await page.goto(`${BASE}/index.html#/matches/demo-pm-oneway-01`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '07-match-detail');

        await page.goto(`${BASE}/index.html#/deals`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '08-deals-list');

        await page.goto(`${BASE}/index.html#/deals/demo-deal-01`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '09-deal-detail-execution');

        await page.goto(`${BASE}/index.html#/contracts`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '10-contracts-list');

        await page.goto(`${BASE}/index.html#/contracts/demo-contract-01`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '11-contract-detail');

        await page.goto(`${BASE}/index.html#/notifications`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '12-notifications');

        await page.goto(`${BASE}/index.html#/pipeline`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '13-pipeline-opportunities');

        await page.goto(`${BASE}/index.html#/pipeline/applications`, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await shot(page, '14-pipeline-applications');

        await page.close();

        // --- Admin (separate context so session does not clash with demo user) ---
        const adminCtx = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
        const ap = await adminCtx.newPage();

        await login(ap, 'admin@pmtwin.com', 'admin123');

        const adminShot = async (route, file) => {
            await ap.goto(`${BASE}/index.html#${route}`, { waitUntil: 'domcontentloaded' });
            await waitAppReady(ap);
            const out = path.join(ASSETS_DIR, file);
            await ap.screenshot({ path: out, fullPage: false });
            console.log('Saved', out);
        };

        await adminShot('/admin', 'admin-a1-dashboard.png');
        await adminShot('/admin/users', 'admin-a2-users.png');
        await adminShot('/admin/vetting', 'admin-a3-vetting.png');
        await adminShot('/admin/opportunities', 'admin-a4-opportunities.png');
        await adminShot('/admin/matching', 'admin-a5-matching.png');
        await adminShot('/admin/deals', 'admin-a6-deals.png');
        await adminShot('/admin/contracts', 'admin-a7-contracts.png');
        await adminShot('/admin/audit', 'admin-a8-audit.png');
        await adminShot('/admin/health', 'admin-a9-health.png');

        await adminCtx.close();
    } finally {
        await browser.close();
        server.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
