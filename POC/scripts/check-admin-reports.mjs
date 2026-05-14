/**
 * Smoke test: login as admin, open Platform Analytics, assert key UI + no console errors.
 * Run from POC folder: node scripts/check-admin-reports.mjs
 * Env: PMTWIN_BASE_URL (optional, default http://127.0.0.1:5500/POC/index.html)
 * Requires: Live Server + Playwright Chromium (npx playwright install chromium).
 */
import { chromium } from 'playwright';

const BASE = process.env.PMTWIN_BASE_URL || 'http://127.0.0.1:5500/POC/index.html';
const ORIGIN = BASE.replace(/#.*$/, '');

const consoleErrors = [];
const pageErrors = [];

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const loginUrl = BASE.includes('#') ? BASE.replace(/#.*$/, '#/login') : `${BASE}#/login`;
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('#email', { state: 'visible', timeout: 90000 });
    await page.fill('#email', 'admin@pmtwin.com');
    await page.fill('#password', 'admin123');
    await page.click('#login-form button[type="submit"]');

    await page.waitForFunction(() => {
        const h = (window.location.hash || '').toLowerCase();
        return h.includes('/dashboard') || h.includes('/admin') || h.includes('/profile');
    }, { timeout: 90000 });

    // Post-login shell must exist; loadPage now queues the next navigation instead of dropping it.
    await page.waitForSelector('.profile-page, .dashboard-page', { timeout: 90000 });

    await page.goto(`${ORIGIN}#/admin/reports`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => (window.location.hash || '').includes('/admin/reports'), { timeout: 30000 });

    await page.waitForSelector('.platform-analytics', { timeout: 90000 });
    await page.waitForSelector('#pa-kpi-grid .pa-kpi-card', { timeout: 30000 });

    const kpiCount = await page.locator('#pa-kpi-grid .pa-kpi-card').count();
    const title = await page.locator('.pa-hero-title').textContent();

    await page.click('.pa-tab[data-module="geography"]');
    await page.waitForTimeout(1200);
    await page.click('.pa-tab[data-module="audit"]');
    await page.waitForTimeout(800);

    const mapPresent = await page.locator('#pa-map').count();
    const canvasCount = await page.locator('canvas').count();
    const hash = await page.evaluate(() => window.location.hash);
    const snippet = await page.evaluate(() => {
        const el = document.querySelector('.platform-analytics');
        return el ? el.innerText.slice(0, 120) : '';
    });

    await browser.close();

    const ok = consoleErrors.length === 0 && pageErrors.length === 0 && kpiCount >= 10 && canvasCount >= 5;
    console.log(JSON.stringify({
        ok,
        hash,
        snippet,
        title: title?.trim(),
        kpiCards: kpiCount,
        mapPresent: mapPresent >= 1,
        canvasCount,
        consoleErrors,
        pageErrors
    }, null, 2));

    if (!ok) process.exit(1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
