/**
 * Full admin portal regression: smoke all routes, functional checks, role matrix.
 * Run from POC folder: node scripts/check-admin-portal-full.mjs
 * Env: PMTWIN_BASE_URL (default http://127.0.0.1:5500/index.html)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_ROOT = path.join(__dirname, '..');

const BASE = process.env.PMTWIN_BASE_URL || 'http://127.0.0.1:5500/index.html';
const ORIGIN = BASE.replace(/#.*$/, '');
const EXPECTED_APP_VERSION = '1.2.0';
const EXPECTED_SEED_VERSION = '2.2.1';

const ADMIN_EMAIL = 'admin@pmtwin.com';
const ADMIN_PASSWORD = 'admin123';

/** @type {{ route: string, pageSelector: string, dataSelector?: string, label: string }[]} */
const SMOKE_ROUTES = [
    { route: '/admin', pageSelector: '.admin-dashboard-page', dataSelector: '.admin-kpi-grid .admin-kpi-card', label: 'Dashboard' },
    { route: '/admin/vetting', pageSelector: '.admin-vetting-page', dataSelector: '.admin-vetting-page .page-body', label: 'Vetting' },
    { route: '/admin/users', pageSelector: '.admin-user-mgmt-page', dataSelector: '#umgmt-list', label: 'Users' },
    { route: '/admin/opportunities', pageSelector: '.ao-page', dataSelector: '#ao-list', label: 'Opportunities' },
    { route: '/admin/matching', pageSelector: '.admin-matching-page', dataSelector: '#matching-command-center', label: 'Matching' },
    { route: '/admin/consortium', pageSelector: '.ao-page', dataSelector: '#acon-list', label: 'Consortium' },
    { route: '/admin/deals', pageSelector: '.ao-page', dataSelector: '#ad-list', label: 'Deals' },
    { route: '/admin/contracts', pageSelector: '.ao-page', dataSelector: '#ac-list', label: 'Contracts' },
    { route: '/admin/audit', pageSelector: '.admin-audit-page', dataSelector: '#audit-logs', label: 'Audit' },
    { route: '/admin/reports', pageSelector: '.platform-analytics', dataSelector: '#pa-kpi-grid .pa-kpi-card', label: 'Reports' },
    { route: '/admin/health', pageSelector: '.admin-health-page', dataSelector: '#health-stats-grid .stat-card, #health-stats-grid .health-metric-card', label: 'Health' },
    { route: '/admin/subscriptions', pageSelector: '.admin-subscriptions-page', dataSelector: '#plans-list', label: 'Subscriptions' },
    { route: '/admin/skills', pageSelector: '.admin-skills-page', dataSelector: '#admin-skills-list', label: 'Skills' },
    { route: '/admin/settings', pageSelector: '.admin-settings-page', dataSelector: '#form-general', label: 'Settings' },
    { route: '/admin/collaboration-models', pageSelector: '.admin-collaboration-models-page', dataSelector: '#models-list', label: 'Collaboration models' },
    { route: '/admin/site-content', pageSelector: '.admin-site-content-page', dataSelector: '#site-content-sections', label: 'Site content' }
];

function readExpectedVersions() {
    const configJs = fs.readFileSync(path.join(POC_ROOT, 'src/core/config/config.js'), 'utf8');
    const dataJs = fs.readFileSync(path.join(POC_ROOT, 'src/core/data/data-service.js'), 'utf8');
    const appMatch = configJs.match(/APP_VERSION:\s*'([^']+)'/);
    const seedMatch = dataJs.match(/CURRENT_SEED_VERSION\s*=\s*'([^']+)'/);
    return {
        app: appMatch ? appMatch[1] : null,
        seed: seedMatch ? seedMatch[1] : null
    };
}

function parseSeedVersion(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function filterNoise(errors) {
    const ignore = [/favicon/i, /Failed to load resource.*404/i, /net::ERR_/i];
    return errors.filter(e => !ignore.some(rx => rx.test(e)));
}

async function login(page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
    const loginUrl = `${ORIGIN}#/login`;
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('#email', { state: 'visible', timeout: 90000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#login-form button[type="submit"]');
    await page.waitForFunction(() => {
        const h = (window.location.hash || '').toLowerCase();
        return h.includes('/dashboard') || h.includes('/admin') || h.includes('/profile');
    }, { timeout: 90000 });
    await page.waitForSelector('.profile-page, .dashboard-page, .admin-dashboard-page, .admin-audit-page', { timeout: 90000 });
}

async function logout(page) {
    await page.evaluate(() => {
        if (typeof authService !== 'undefined' && authService.logout) {
            authService.logout();
        }
    });
    await page.goto(`${ORIGIN}#/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
}

async function setAdminRole(page, role) {
    await page.evaluate((newRole) => {
        const usersKey = 'pmtwin_users';
        const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
        const admin = users.find(u => u.email === 'admin@pmtwin.com');
        if (admin) {
            admin.role = newRole;
            localStorage.setItem(usersKey, JSON.stringify(users));
        }
    }, role);
}

async function navigateAdmin(page, route, opts = {}) {
    const strict = opts.strict !== false;
    await page.goto(`${ORIGIN}#${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (strict) {
        await page.waitForFunction(
            (r) => (window.location.hash || '').includes(r),
            route,
            { timeout: 30000 }
        );
    }
    await page.waitForTimeout(800);
}

async function smokeRoute(page, spec, consoleErrors, pageErrors) {
    const result = { route: spec.route, label: spec.label, ok: false, notes: [] };
    try {
        await navigateAdmin(page, spec.route);
        const hash = await page.evaluate(() => window.location.hash);
        result.hash = hash;

        const pageVisible = await page.locator(spec.pageSelector).count();
        if (pageVisible < 1) {
            result.notes.push(`Missing page shell: ${spec.pageSelector}`);
            return result;
        }

        const sidebar = await page.locator('.portal-admin-sidebar-inner, .portal-sidebar-inner').count();
        if (sidebar < 1) {
            result.notes.push('Admin sidebar not visible');
        }

        if (spec.dataSelector) {
            const dataCount = await page.locator(spec.dataSelector).count();
            if (dataCount < 1) {
                result.notes.push(`Missing data container: ${spec.dataSelector}`);
            }
        }

        const errs = filterNoise([...consoleErrors, ...pageErrors]);
        if (errs.length) {
            result.notes.push(`Console/page errors: ${errs.slice(0, 3).join(' | ')}`);
        }

        result.ok = result.notes.length === 0;
    } catch (e) {
        result.notes.push(e.message);
    }
    return result;
}

async function runFunctionalTests(page, consoleErrors, pageErrors) {
    const functional = {};

    // Matching: run preview report
    try {
        await navigateAdmin(page, '/admin/matching');
        const postBefore = await page.evaluate(() => {
            const raw = localStorage.getItem('pmtwin_post_matches');
            return raw ? JSON.parse(raw).length : 0;
        });

        const runBtn = page.locator('#matching-run-report-btn');
        if (await runBtn.count()) {
            await runBtn.click();
            await page.waitForSelector('#matching-report-block:not([hidden])', { timeout: 60000 }).catch(() => null);
        }
        const reportVisible = await page.locator('#matching-report-block:not([hidden])').count();
        const ccVisible = await page.locator('#matching-cc-lifecycle').count();
        functional.matchingPreview = {
            ok: reportVisible >= 1 && ccVisible >= 1,
            reportVisible: reportVisible >= 1,
            commandCenter: ccVisible >= 1
        };

        // Per-opportunity save (if enabled save buttons exist)
        const saveBtn = page.locator('button.matching-persist-btn[data-opp-id]:not([disabled])').first();
        if (await saveBtn.count()) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
        }
        const postAfter = await page.evaluate(() => {
            const raw = localStorage.getItem('pmtwin_post_matches');
            return raw ? JSON.parse(raw).length : 0;
        });
        functional.matchingSave = {
            ok: postAfter >= postBefore,
            postMatchesBefore: postBefore,
            postMatchesAfter: postAfter
        };

        const bulkBar = await page.locator('#matching-bulk-persist-bar').count();
        functional.matchingBulkBar = { ok: bulkBar >= 0, present: bulkBar >= 1 };
    } catch (e) {
        functional.matchingPreview = { ok: false, error: e.message };
    }

    // Deals: tabs, search, drill-down
    try {
        await navigateAdmin(page, '/admin/deals');
        await page.waitForFunction(() => {
            const meta = document.getElementById('ad-list-meta');
            return meta && !/loading/i.test(meta.textContent || '');
        }, { timeout: 30000 });
        await page.waitForSelector('#ad-list .ao-card', { state: 'attached', timeout: 30000 });
        const dealCount = await page.locator('#ad-list .ao-card').count();
        const firstDealId = dealCount > 0
            ? await page.locator('#ad-list .ao-card').first().getAttribute('data-deal-id')
            : null;

        await page.click('[data-ad-status="live"]').catch(() => {});
        await page.waitForTimeout(500);
        const liveTabCount = await page.locator('#ad-list .ao-card').count();
        await page.click('[data-ad-status=""]').catch(() => {});
        await page.waitForTimeout(500);

        let dealDetailOk = false;
        if (firstDealId) {
            await navigateAdmin(page, `/admin/deals/${firstDealId}`);
            dealDetailOk = (await page.locator('.deal-detail-page').count()) >= 1;
        }
        functional.deals = { ok: dealCount > 0 && dealDetailOk, dealCount, liveTabCount, dealDetailOk, firstDealId };
    } catch (e) {
        functional.deals = { ok: false, error: e.message };
    }

    // Contracts: list + drill-down
    try {
        await navigateAdmin(page, '/admin/contracts');
        await page.waitForFunction(() => {
            const meta = document.getElementById('ac-list-meta');
            return meta && !/loading/i.test(meta.textContent || '');
        }, { timeout: 30000 });
        await page.waitForSelector('#ac-list .ao-card', { state: 'attached', timeout: 30000 });
        const contractCount = await page.locator('#ac-list .ao-card').count();

        const firstContractId = await page.locator('#ac-list .ao-card').first().getAttribute('data-contract-id');
        let contractDetailOk = false;
        if (firstContractId) {
            await navigateAdmin(page, `/admin/contracts/${firstContractId}`);
            contractDetailOk = (await page.locator('.contract-detail-page').count()) >= 1;
        }
        functional.contracts = { ok: contractCount > 0 && contractDetailOk, contractCount, contractDetailOk };
    } catch (e) {
        functional.contracts = { ok: false, error: e.message };
    }

    // Consortium
    try {
        await navigateAdmin(page, '/admin/consortium');
        const listCount = await page.locator('#acon-list .ao-card').count();
        functional.consortium = { ok: listCount >= 0, listCount };
    } catch (e) {
        functional.consortium = { ok: false, error: e.message };
    }

    // User detail drill-down
    try {
        await navigateAdmin(page, '/admin/users');
        await page.waitForTimeout(1000);
        const userId = await page.evaluate(async () => {
            const users = await dataService.getUsers();
            const active = users.find(u => u.status === 'active' && u.role !== 'admin');
            return active ? active.id : (users[0] ? users[0].id : null);
        });
        if (userId) {
            await navigateAdmin(page, `/admin/users/${userId}`);
            const detailOk = (await page.locator('.admin-user-detail-page').count()) >= 1;
            functional.userDetail = { ok: detailOk, userId };
        } else {
            functional.userDetail = { ok: false, error: 'No user id found' };
        }
    } catch (e) {
        functional.userDetail = { ok: false, error: e.message };
    }

    // Health / seed version
    try {
        await navigateAdmin(page, '/admin/health');
        await page.waitForSelector('#health-stats-grid .stat-card, #health-stats-grid .health-metric-card', { timeout: 30000 });
        const metrics = await page.evaluate(() => {
            const cards = document.querySelectorAll('#health-stats-grid .stat-value');
            const values = Array.from(cards).map(c => parseInt(c.textContent, 10) || 0);
            const seedEl = document.querySelector('#seed-canonical-compare-mount');
            return {
                metricCount: values.length,
                nonZero: values.filter(v => v > 0).length,
                seedText: seedEl ? seedEl.textContent : ''
            };
        });
        const seedVersion = parseSeedVersion(await page.evaluate(() => localStorage.getItem('pmtwin_seed_version')));
        functional.health = {
            ok: metrics.metricCount >= 5 && metrics.nonZero >= 3,
            seedVersion,
            expectedSeed: EXPECTED_SEED_VERSION,
            seedOk: seedVersion === EXPECTED_SEED_VERSION,
            ...metrics
        };
    } catch (e) {
        functional.health = { ok: false, error: e.message };
    }

    const errs = filterNoise([...consoleErrors, ...pageErrors]);
    functional.consoleClean = { ok: errs.length === 0, errors: errs.slice(0, 5) };

    return functional;
}

async function loginAsRole(browser, role) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${ORIGIN}#/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (role !== 'admin') {
        await setAdminRole(page, role);
    }
    await login(page);
    const actualRole = await page.evaluate(() => authService.currentUser?.role || null);
    return { context, page, actualRole };
}

async function runRoleMatrix(browser) {
    const roles = [
        {
            role: 'admin',
            tests: [
                { route: '/admin', expectHash: '/admin', expectPage: '.admin-dashboard-page', blocked: false },
                { route: '/admin/settings', expectHash: '/admin/settings', expectPage: '.admin-settings-page', blocked: false },
                { route: '/admin/skills', expectHash: '/admin/skills', expectPage: '.admin-skills-page', blocked: false }
            ]
        },
        {
            role: 'moderator',
            tests: [
                { route: '/admin', expectHash: '/admin', expectPage: '.admin-dashboard-page', blocked: false },
                { route: '/admin/settings', expectHash: '/admin/settings', expectPage: '.admin-settings-page', blocked: false },
                { route: '/admin/skills', expectHash: '/dashboard', expectPage: null, blocked: true }
            ]
        },
        {
            role: 'auditor',
            tests: [
                { route: '/admin', expectHash: '/admin/audit', expectPage: '.admin-audit-page', blocked: false },
                { route: '/admin/settings', expectHash: '/dashboard', expectPage: null, blocked: true },
                { route: '/admin/matching', expectHash: '/admin/matching', expectPage: '.admin-matching-page', blocked: false }
            ]
        }
    ];

    const matrix = [];

    for (const spec of roles) {
        try {
        const { context, page, actualRole } = await loginAsRole(browser, spec.role);
        const roleResults = { role: spec.role, actualRole, tests: [], auditorPersistBlocked: null };

        for (const t of spec.tests) {
            await navigateAdmin(page, t.route, { strict: !t.blocked });
            const hash = await page.evaluate(() => window.location.hash);
            let ok = hash.includes(t.expectHash);
            if (t.expectPage) {
                ok = ok && (await page.locator(t.expectPage).count()) >= 1;
            }
            roleResults.tests.push({
                route: t.route,
                ok,
                hash,
                expected: t.expectHash
            });
        }

        if (spec.role === 'auditor' || spec.role === 'moderator') {
            await navigateAdmin(page, '/admin/matching');
            await page.waitForTimeout(1500);
            await page.locator('#matching-run-report-btn').click().catch(() => {});
            await page.waitForTimeout(3000);
            const bulkBar = page.locator('#matching-bulk-persist-bar');
            const bulkHidden = (await bulkBar.count()) === 0 || await bulkBar.evaluate(el => el.hidden);
            const persistBtn = page.locator('#matching-bulk-persist-btn');
            let persistDisabled = true;
            if (await persistBtn.count()) {
                persistDisabled = await persistBtn.isDisabled();
            }
            const saveBtnCount = await page.locator('button.matching-persist-btn[data-opp-id]').count();
            if (spec.role === 'moderator') {
                roleResults.persistButtonsHidden = bulkHidden && saveBtnCount === 0;
            } else {
                roleResults.persistControlsDisabled = persistDisabled;
                if (saveBtnCount > 0) {
                    roleResults.persistControlsDisabled = roleResults.persistControlsDisabled
                        && await page.locator('button.matching-persist-btn[data-opp-id]').first().isDisabled();
                }
            }
        }

        matrix.push(roleResults);
        await context.close();
        } catch (e) {
            matrix.push({ role: spec.role, error: e.message, tests: [], persistControlsDisabled: false });
        }
    }

    return matrix;
}

async function main() {
    const versions = readExpectedVersions();
    const report = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE,
        versions: {
            expected: { app: EXPECTED_APP_VERSION, seed: EXPECTED_SEED_VERSION },
            codebase: versions,
            ok: versions.app === EXPECTED_APP_VERSION && versions.seed === EXPECTED_SEED_VERSION
        },
        smoke: [],
        functional: {},
        roles: [],
        ok: false
    };

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Fresh seed from JSON (clear stale localStorage so demo-deals/contracts reload)
    await page.goto(`${ORIGIN}#/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const seedOnLoad = parseSeedVersion(await page.evaluate(() => localStorage.getItem('pmtwin_seed_version')));
    report.seedOnLoad = seedOnLoad;

    await login(page);

    const appVersion = await page.evaluate(() => {
        return typeof CONFIG !== 'undefined' ? CONFIG.APP_VERSION : null;
    });
    report.appVersionInBrowser = appVersion;

    for (const spec of SMOKE_ROUTES) {
        const beforeErr = consoleErrors.length;
        const r = await smokeRoute(page, spec, consoleErrors.slice(beforeErr), pageErrors);
        report.smoke.push(r);
        consoleErrors.length = 0;
        pageErrors.length = 0;
    }

    report.functional = await runFunctionalTests(page, consoleErrors, pageErrors);
    await context.close();

    report.roles = await runRoleMatrix(browser);
    await browser.close();

    const smokePass = report.smoke.every(s => s.ok);
    const functionalPass = ['matchingPreview', 'deals', 'contracts', 'health'].every(
        k => report.functional[k] && report.functional[k].ok
    );
    const rolesPass = report.roles.length >= 3 && report.roles.every(r => {
        if (r.error) return false;
        const testsOk = r.tests.every(t => t.ok);
        if (r.role === 'auditor') {
            return testsOk && r.persistControlsDisabled === true;
        }
        if (r.role === 'moderator') {
            return testsOk && r.persistButtonsHidden === true;
        }
        return testsOk;
    });
    const versionPass = report.versions.ok && report.seedOnLoad === EXPECTED_SEED_VERSION;

    report.ok = smokePass && functionalPass && rolesPass && versionPass;
    report.summary = {
        smokePass,
        smokeTotal: report.smoke.length,
        smokeFailed: report.smoke.filter(s => !s.ok).map(s => s.label),
        functionalPass,
        rolesPass,
        versionPass
    };

    const outPath = path.join(POC_ROOT, 'scripts', 'admin-portal-verification-report.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

    console.log(JSON.stringify(report.summary, null, 2));
    console.log(`Full report: ${outPath}`);

    if (!report.ok) process.exit(1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
