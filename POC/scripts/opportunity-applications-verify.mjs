/**
 * Phase 2 verification: opportunity detail applications matrix.
 * Run: cd POC && node scripts/opportunity-applications-verify.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.SMOKE_PORT ? Number(process.env.SMOKE_PORT) : 5502;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'Pmtwin@2026';
const ADMIN_PASSWORD = 'admin123';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const OWNER_MATRIX = [
    {
        opportunityId: 'seed-opp-001',
        login: { email: 'khalid.alharbi@pmtwin.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-001', applicantId: 'seed-user-002', status: 'accepted' }],
        notes: 'negotiation/deal badges if data present'
    },
    {
        opportunityId: 'seed-opp-005',
        login: { email: 'contact@gulf-development.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-002', applicantId: 'seed-user-002', status: 'in_negotiation' }],
        notes: 'phase banner if in_negotiation'
    },
    {
        opportunityId: 'seed-opp-007',
        login: { email: 'contact@alriyadh-construction.test', password: PASSWORD },
        expectedCount: 2,
        apps: [
            { id: 'seed-app-003', applicantId: 'seed-user-006', status: 'reviewing' },
            { id: 'seed-app-004', applicantId: 'seed-user-012', status: 'pending' }
        ],
        notes: 'sort by value score'
    },
    {
        opportunityId: 'seed-opp-023',
        login: { email: 'contact@alriyadh-construction.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-005', applicantId: 'seed-user-002', status: 'shortlisted' }],
        notes: 'manage actions visible'
    },
    {
        opportunityId: 'seed-opp-024',
        login: { email: 'contact@gulf-development.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-006', applicantId: 'seed-user-010', status: 'pending' }],
        notes: 'Discuss terms button'
    },
    {
        opportunityId: 'seed-opp-026',
        login: { email: 'khalid.alharbi@pmtwin.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-010', applicantId: 'seed-user-002', status: 'in_negotiation' }],
        notes: 'negotiation subsection + match badge'
    },
    {
        opportunityId: 'seed-opp-031',
        login: { email: 'hessa.alqahtani@pmtwin.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-007', applicantId: 'seed-user-008', status: 'reviewing' }]
    },
    {
        opportunityId: 'seed-opp-032',
        login: { email: 'yousef.alghamdi@pmtwin.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-008', applicantId: 'seed-user-017', status: 'pending' }]
    },
    {
        opportunityId: 'seed-opp-037',
        login: { email: 'contact@najd-investment.test', password: PASSWORD },
        expectedCount: 1,
        apps: [{ id: 'seed-app-009', applicantId: 'seed-user-016', status: 'shortlisted' }]
    }
];

const APPLICANT_MATRIX = [
    {
        opportunityId: 'seed-opp-007',
        login: { email: 'hessa.alqahtani@pmtwin.test', password: PASSWORD },
        expectedStatus: 'reviewing'
    },
    {
        opportunityId: 'seed-opp-026',
        login: { email: 'sara.almutairi@pmtwin.test', password: PASSWORD },
        expectedStatus: 'in_negotiation'
    },
    {
        opportunityId: 'seed-opp-001',
        login: { email: 'sara.almutairi@pmtwin.test', password: PASSWORD },
        expectedStatus: 'accepted'
    }
];

const results = { pass: true, failures: [], checks: [], notes: [] };

function fail(msg) {
    results.pass = false;
    results.failures.push(msg);
    console.error('FAIL:', msg);
}

function passCheck(msg) {
    results.checks.push(msg);
    console.log('PASS:', msg);
}

function note(msg) {
    results.notes.push(msg);
    console.log('NOTE:', msg);
}

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

function loadJson(relPath) {
    const raw = fs.readFileSync(path.join(POC_ROOT, relPath), 'utf8');
    return JSON.parse(raw);
}

function buildApplicantNameMap() {
    const map = new Map();
    for (const u of loadJson('data/seed-controlled-users.json').data || []) {
        map.set(u.id, u.profile?.name || u.email);
    }
    for (const c of loadJson('data/demo-companies.json').data || []) {
        map.set(c.id, c.profile?.name || c.email);
    }
    return map;
}

async function waitAppReady(page) {
    await page.waitForSelector('#main-content', { timeout: 120000 });
    await delay(400);
}

async function waitOpportunityDetail(page) {
    await page.waitForSelector('#content', { state: 'visible', timeout: 60000 });
    await page.waitForFunction(
        () => {
            const loading = document.getElementById('loading');
            const content = document.getElementById('content');
            if (!content || content.style.display === 'none') return false;
            if (loading && loading.style.display !== 'none') return false;
            return !!document.getElementById('opportunity-title')?.textContent?.trim();
        },
        undefined,
        { timeout: 60000 }
    );
    await delay(800);
}

async function freshSession(page) {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
}

function isCompanyLoginEmail(email) {
    return /^contact@.+\.test$/i.test(email);
}

async function login(page, email, password) {
    await page.goto(`${BASE}/index.html#/login`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    const accountType = isCompanyLoginEmail(email) ? 'company' : 'individual';
    await page.evaluate((type) => {
        const el = document.getElementById(type === 'company' ? 'account-type-company' : 'account-type-individual');
        if (el) el.checked = true;
    }, accountType);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('form#login-form button[type="submit"]');
    await page.waitForFunction(
        () => !document.querySelector('form#login-form') || window.location.hash !== '#/login',
        undefined,
        { timeout: 15000 }
    ).catch(() => {});
    await delay(1200);
    const loginError = await page.evaluate(() => {
        const err = document.getElementById('login-error');
        return err && err.style.display !== 'none' ? err.textContent.trim() : '';
    });
    if (loginError) {
        throw new Error(`Login failed for ${email}: ${loginError}`);
    }
}

async function openOpportunity(page, opportunityId) {
    await page.goto(`${BASE}/index.html#/opportunities/${opportunityId}`, { waitUntil: 'domcontentloaded' });
    await waitOpportunityDetail(page);
}

async function readApplicationsUi(page) {
    return page.evaluate(() => {
        const section = document.getElementById('applications-section');
        const applied = document.getElementById('already-applied-section');
        const countEl = document.getElementById('applications-count');
        const cards = Array.from(document.querySelectorAll('#applications-list .application-card')).map((card) => {
            const header = card.querySelector('.application-header');
            const proposal = card.querySelector('.application-proposal');
            const meta = card.querySelector('.application-meta');
            const badges = Array.from(card.querySelectorAll('.application-header .badge')).map((b) => b.textContent.trim());
            const applicantName = header?.querySelector('strong')?.textContent?.trim() || '';
            const viewBtn = !!card.querySelector('.btn-view-application');
            const discussBtn = !!card.querySelector('.btn-start-negotiation');
            const manageSelect = !!card.querySelector('.application-status-select');
            const negotiation = card.querySelector('.application-negotiation-subsection');
            return {
                applicationId: card.dataset.applicationId || '',
                applicantName,
                badges,
                proposal: proposal?.textContent?.trim() || '',
                appliedMeta: meta?.textContent?.trim() || '',
                hasViewBtn: viewBtn,
                hasDiscussTerms: discussBtn,
                hasManageSelect: manageSelect,
                hasNegotiationSubsection: !!negotiation,
                hasFromMatchBadge: badges.some((b) => /from match/i.test(b)),
                html: card.innerHTML.slice(0, 500)
            };
        });
        return {
            applicationsSectionVisible: section ? getComputedStyle(section).display !== 'none' : false,
            alreadyAppliedVisible: applied ? getComputedStyle(applied).display !== 'none' : false,
            countText: countEl?.textContent?.trim() || '0',
            cards,
            appliedStatus: document.getElementById('applied-status')?.textContent?.trim() || '',
            applySectionVisible: (() => {
                const el = document.getElementById('apply-section');
                return el ? getComputedStyle(el).display !== 'none' : false;
            })()
        };
    });
}

async function verifyOwnerRow(page, row, applicantNames) {
    const label = `owner ${row.opportunityId} (${row.login.email})`;
    await freshSession(page);
    await login(page, row.login.email, row.login.password);
    await openOpportunity(page, row.opportunityId);
    const ui = await readApplicationsUi(page);

    if (!ui.applicationsSectionVisible) {
        fail(`${label}: #applications-section not visible`);
        return;
    }
    passCheck(`${label}: applications section visible`);

    if (ui.countText !== String(row.expectedCount)) {
        fail(`${label}: expected count ${row.expectedCount}, got "${ui.countText}"`);
    } else {
        passCheck(`${label}: count = ${row.expectedCount}`);
    }

    if (ui.cards.length !== row.expectedCount) {
        fail(`${label}: expected ${row.expectedCount} cards, found ${ui.cards.length}`);
        return;
    }

    for (const expected of row.apps) {
        const card = ui.cards.find((c) => c.applicationId === expected.id);
        if (!card) {
            fail(`${label}: missing card for ${expected.id}`);
            continue;
        }
        const expectedName = applicantNames.get(expected.applicantId);
        if (!expectedName) {
            note(`${label}: no name map for ${expected.applicantId}`);
        } else if (card.applicantName === 'Unknown' || !card.applicantName) {
            fail(`${label}: applicant ${expected.applicantId} shows "${card.applicantName || '(empty)'}"`);
        } else if (!card.applicantName.includes(expectedName.split(' ')[0])) {
            fail(`${label}: expected applicant name containing "${expectedName}", got "${card.applicantName}"`);
        } else {
            passCheck(`${label}: ${expected.id} applicant "${card.applicantName}"`);
        }

        if (!card.proposal || card.proposal === 'No proposal') {
            fail(`${label}: ${expected.id} missing proposal text`);
        } else {
            passCheck(`${label}: ${expected.id} has proposal`);
        }

        if (!card.appliedMeta.toLowerCase().includes('applied')) {
            fail(`${label}: ${expected.id} missing applied date meta`);
        } else {
            passCheck(`${label}: ${expected.id} applied date rendered`);
        }

        const statusToken = expected.status.replace(/_/g, ' ');
        const hasStatusBadge = card.badges.some((b) => b.toLowerCase().includes(statusToken) || b.toLowerCase().includes(expected.status));
        if (!hasStatusBadge) {
            fail(`${label}: ${expected.id} status badge not found (badges: ${card.badges.join(', ')})`);
        } else {
            passCheck(`${label}: ${expected.id} status badge present`);
        }

        if (!card.hasViewBtn) {
            fail(`${label}: ${expected.id} missing View button`);
        } else {
            passCheck(`${label}: ${expected.id} View button present`);
        }

        if (expected.status === 'pending' && row.notes?.includes('Discuss terms') && !card.hasDiscussTerms) {
            fail(`${label}: expected Discuss terms button for pending app`);
        } else if (expected.status === 'pending' && row.notes?.includes('Discuss terms')) {
            passCheck(`${label}: Discuss terms button present`);
        }

        if (expected.status === 'shortlisted' && row.notes?.includes('manage actions') && !card.hasManageSelect) {
            fail(`${label}: expected manage status dropdown for shortlisted app`);
        } else if (expected.status === 'shortlisted' && row.notes?.includes('manage actions')) {
            passCheck(`${label}: manage actions visible`);
        }

        if (expected.status === 'in_negotiation' && row.notes?.includes('negotiation subsection') && !card.hasNegotiationSubsection) {
            fail(`${label}: expected negotiation subsection for in_negotiation app`);
        } else if (expected.status === 'in_negotiation' && row.notes?.includes('negotiation subsection')) {
            passCheck(`${label}: negotiation subsection present`);
        }

        if (row.notes?.includes('match badge') && expected.id === 'seed-app-010' && !card.hasFromMatchBadge) {
            fail(`${label}: expected From Match badge`);
        } else if (row.notes?.includes('match badge') && expected.id === 'seed-app-010') {
            passCheck(`${label}: From Match badge present`);
        }
    }
}

async function verifyApplicantRow(page, row) {
    const label = `applicant ${row.opportunityId} (${row.login.email})`;
    await freshSession(page);
    await login(page, row.login.email, row.login.password);
    await openOpportunity(page, row.opportunityId);
    const ui = await readApplicationsUi(page);

    if (ui.applicationsSectionVisible) {
        fail(`${label}: #applications-section should be hidden for non-owner`);
    } else {
        passCheck(`${label}: applications list hidden`);
    }

    if (!ui.alreadyAppliedVisible) {
        fail(`${label}: #already-applied-section not visible`);
        return;
    }
    passCheck(`${label}: already-applied section visible`);

    const statusToken = row.expectedStatus.replace(/_/g, ' ');
    if (!ui.appliedStatus.toLowerCase().includes(statusToken) && !ui.appliedStatus.toLowerCase().includes(row.expectedStatus)) {
        fail(`${label}: expected status "${row.expectedStatus}", got "${ui.appliedStatus}"`);
    } else {
        passCheck(`${label}: status "${ui.appliedStatus}"`);
    }

    if (row.expectedStatus === 'accepted' && ui.applySectionVisible) {
        fail(`${label}: apply CTA should be hidden when accepted`);
    } else if (row.expectedStatus === 'accepted') {
        passCheck(`${label}: no apply CTA`);
    }
}

async function verifyAdmin(page) {
    const opportunityId = 'seed-opp-007';
    const label = `admin ${opportunityId}`;
    await freshSession(page);
    await login(page, 'admin@pmtwin.com', ADMIN_PASSWORD);
    await openOpportunity(page, opportunityId);
    const ui = await readApplicationsUi(page);
    if (!ui.applicationsSectionVisible) {
        fail(`${label}: admin cannot see applications section`);
    } else if (ui.countText !== '2') {
        fail(`${label}: admin expected count 2, got ${ui.countText}`);
    } else {
        passCheck(`${label}: applications list visible with count 2`);
    }
}

async function main() {
    const applicantNames = buildApplicantNameMap();
    const server = await startStaticServer();
    note(`Static server on ${BASE}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        note('--- Owner matrix (9 opportunities) ---');
        for (const row of OWNER_MATRIX) {
            await verifyOwnerRow(page, row, applicantNames);
        }

        note('--- Applicant self-view (3 cases) ---');
        for (const row of APPLICANT_MATRIX) {
            await verifyApplicantRow(page, row);
        }

        note('--- Admin read access ---');
        await verifyAdmin(page);
    } catch (err) {
        fail(`Unhandled error: ${err.message}`);
        console.error(err);
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n=== Phase 2 Applications Verification Summary ===');
    console.log(`Result: ${results.pass ? 'PASS' : 'FAIL'}`);
    console.log(`Checks passed: ${results.checks.length}`);
    if (results.failures.length) {
        console.log('Failures:');
        results.failures.forEach((f) => console.log(`  - ${f}`));
    }
    process.exit(results.pass ? 0 : 1);
}

main();
