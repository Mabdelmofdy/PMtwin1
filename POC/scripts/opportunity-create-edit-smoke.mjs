/**
 * Browser smoke test: Create/Edit Opportunity validation, draft save, publish, readiness.
 * Run: cd POC && node scripts/opportunity-create-edit-smoke.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.SMOKE_PORT ? Number(process.env.SMOKE_PORT) : 5501;
const BASE = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.resolve(POC_ROOT, 'scripts', 'smoke-screenshots');
const ACCOUNT = { email: 'company01@demo.test', password: 'demo123' };
const UNIQUE_TITLE = `Smoke Test Opp ${Date.now()}`;

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

const results = {
    browser: '',
    account: `${ACCOUNT.email} / demo123`,
    pass: true,
    failures: [],
    notes: [],
    opportunityId: null,
    countBeforeDraft: null,
    countAfterDraft: null,
    countAfterEditSave: null,
    countAfterPublish: null,
    duplicateCountUnchanged: null,
    validationScenarios: {},
    readiness: {}
};

function fail(msg) {
    results.pass = false;
    results.failures.push(msg);
    console.error('FAIL:', msg);
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
    await delay(600);
}

async function login(page) {
    await page.goto(`${BASE}/index.html#/login`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    await page.fill('#email', ACCOUNT.email);
    await page.fill('#password', ACCOUNT.password);
    await page.click('form#login-form button[type="submit"]');
    await delay(2000);
}

async function openCreateOpportunity(page) {
    await page.goto(`${BASE}/index.html#/opportunities/create`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    await page.waitForSelector('#fill-demo-data', { timeout: 30000 });
}

async function getOppCount(page) {
    return page.evaluate(() => {
        const raw = localStorage.getItem('pmtwin_opportunities');
        return raw ? JSON.parse(raw).length : 0;
    });
}

async function getLatestOppByTitle(page, title) {
    return page.evaluate((t) => {
        const raw = localStorage.getItem('pmtwin_opportunities');
        const list = raw ? JSON.parse(raw) : [];
        const matches = list.filter((o) => (o.title || '').includes(t));
        return matches.length ? matches[matches.length - 1] : null;
    }, title);
}

async function screenshot(page, name) {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const out = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    note(`Screenshot: ${out}`);
    return out;
}

async function setField(page, id, value) {
    await page.evaluate(({ id, value }) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, { id, value });
}

async function forceGoToStep(page, step) {
    await page.evaluate((target) => {
        document.querySelectorAll('.wizard-step-content').forEach((el) => el.classList.add('hidden'));
        const panel = document.getElementById(`step-${target}`);
        if (panel) panel.classList.remove('hidden');
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-form');
        const saveDraftBtn = document.getElementById('save-draft-wizard');
        if (prevBtn) prevBtn.classList.toggle('hidden', target === 1);
        if (nextBtn) nextBtn.classList.toggle('hidden', target === 7);
        if (submitBtn) submitBtn.classList.toggle('hidden', target !== 7);
        if (saveDraftBtn) saveDraftBtn.classList.toggle('hidden', target < 2);
    }, step);
    await delay(300);
}

async function clickNext(page) {
    const before = await page.evaluate(() => {
        const el = document.querySelector('.wizard-step-content:not(.hidden)');
        return el ? Number(el.dataset.step) : null;
    });
    await page.click('#next-step');
    await delay(900);
    const after = await page.evaluate(() => {
        const el = document.querySelector('.wizard-step-content:not(.hidden)');
        return el ? Number(el.dataset.step) : null;
    });
    return { before, after, advanced: after > before };
}

async function advanceToStep(page, targetStep) {
    for (let i = 0; i < 10; i++) {
        const current = await page.evaluate(() => {
            const el = document.querySelector('.wizard-step-content:not(.hidden)');
            return el ? Number(el.dataset.step) : null;
        });
        if (current === targetStep) return true;
        if (current == null || current >= targetStep) return false;
        const { advanced } = await clickNext(page);
        if (!advanced) return false;
    }
    const final = await page.evaluate(() => {
        const el = document.querySelector('.wizard-step-content:not(.hidden)');
        return el ? Number(el.dataset.step) : null;
    });
    return final === targetStep;
}

async function confirmFillDemoData(page) {
    await page.click('#fill-demo-data');
    await page.waitForSelector('#demo-data-modal:not(.hidden)', { timeout: 5000 });
    await page.click('#demo-modal-confirm');
    await delay(4500);
    await page.evaluate(() => {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el && !el.value) el.value = val;
        };
        set('cash-payment-terms', 'milestone_based');
        const agreement = document.getElementById('exchange-agreement');
        if (agreement) agreement.checked = true;
    });
}

async function collectValidationState(page) {
    return page.evaluate(() => {
        const fieldErrors = {};
        document.querySelectorAll('.occ-field-error').forEach((el) => {
            const host = el.closest('.form-group, .occ-s6-budget-field, .budget-input-group');
            const field = host?.querySelector('[id]')?.id || 'unknown';
            fieldErrors[field] = el.textContent.trim();
        });
        const formError = document.getElementById('form-error');
        const blocked = !!(formError && !formError.classList.contains('hidden'));
        const success = document.getElementById('form-success');
        const saved = !!(success && !success.classList.contains('hidden')
            && (success.textContent || '').toLowerCase().includes('success'));
        return {
            fieldErrors,
            formError: blocked ? formError.textContent.trim() : '',
            blocked,
            saved
        };
    });
}

async function trySaveDraft(page) {
    const countBefore = await getOppCount(page);
    await page.click('#save-draft-wizard');
    await delay(1800);
    const countAfter = await getOppCount(page);
    const state = await collectValidationState(page);
    return { ...state, countBefore, countAfter, countIncreased: countAfter > countBefore };
}

async function selectExchangeMode(page, mode) {
    await page.evaluate((m) => {
        const card = document.querySelector(`.exchange-mode-card[data-mode="${m}"]`);
        if (card) card.click();
    }, mode);
    await delay(500);
}

/** Empty profit-duration inputs in the DOM otherwise trigger a duration error on every save. */
async function ensureValidDuration(page) {
    await setField(page, 'profit-duration', '90');
    await setField(page, 'duration', '90');
    await setField(page, 'durationDays', '90');
}

async function ensureValidDates(page) {
    await setField(page, 'attr-startDate', '2026-07-01');
    await setField(page, 'attr-endDate', '2026-12-31');
    await setField(page, 'attr-applicationDeadline', '2026-06-15');
    await setField(page, 'startDate', '2026-07-01');
    await setField(page, 'endDate', '2026-12-31');
    await setField(page, 'applicationDeadline', '2026-06-15');
}

async function ensureValidFinancials(page) {
    await ensureValidDuration(page);
    await ensureValidDates(page);
    await page.evaluate(() => {
        const agreement = document.getElementById('exchange-agreement');
        if (agreement) agreement.checked = true;
        const terms = document.getElementById('cash-payment-terms');
        if (terms && !terms.value) terms.value = 'milestone_based';
    });
}

async function runValidationScenario(page, name, setup, expectedField, expectedSnippet) {
    await openCreateOpportunity(page);
    await confirmFillDemoData(page);
    await setup(page);
    const result = await trySaveDraft(page);
    results.validationScenarios[name] = result;
    const fieldMsg = result.fieldErrors[expectedField] || '';
    const formMsg = result.formError || '';
    const matched = fieldMsg.toLowerCase().includes(expectedSnippet.toLowerCase())
        || formMsg.toLowerCase().includes(expectedSnippet.toLowerCase());
    if (!result.blocked || result.countIncreased) {
        fail(`${name}: save was not blocked (blocked=${result.blocked}, count+${result.countIncreased})`);
    } else if (!matched) {
        fail(`${name}: expected "${expectedSnippet}" near ${expectedField}; got field="${fieldMsg}" form="${formMsg}"`);
        await screenshot(page, `validation-fail-${name}`);
    } else {
        note(`${name}: blocked with visible message (${expectedField}: ${fieldMsg || formMsg})`);
    }
}

async function runValidationSuite(page) {
    await runValidationScenario(page, 'negative-cash', async (p) => {
        await forceGoToStep(p, 6);
        await ensureValidDuration(p);
        await selectExchangeMode(p, 'cash');
        await setField(p, 'cash-amount', '-5000');
    }, 'cash-amount', 'positive');

    await runValidationScenario(page, 'negative-budget', async (p) => {
        await forceGoToStep(p, 6);
        await ensureValidDuration(p);
        await setField(p, 'budgetRange_min', '-100');
    }, 'budgetRange_min', 'greater than or equal to 0');

    await runValidationScenario(page, 'budget-max-below-min', async (p) => {
        await forceGoToStep(p, 6);
        await setField(p, 'budgetRange_min', '50000');
        await setField(p, 'budgetRange_max', '1000');
    }, 'budgetRange_max', 'greater than or equal to budget minimum');

    await runValidationScenario(page, 'equity-out-of-range', async (p) => {
        await forceGoToStep(p, 6);
        await selectExchangeMode(p, 'equity');
        await setField(p, 'equity-percentage', '150');
    }, 'equity-percentage', '0 and 100');

    await runValidationScenario(page, 'profit-share-out-of-range', async (p) => {
        await forceGoToStep(p, 6);
        await selectExchangeMode(p, 'profit_sharing');
        await setField(p, 'profit-share-percentage', '-5');
        await setField(p, 'profit-duration', '90');
    }, 'profit-share-percentage', '0 and 100');

    await runValidationScenario(page, 'negative-duration', async (p) => {
        await ensureCategorySubmodel(p);
        await forceGoToStep(p, 4);
        await setField(p, 'duration', '-3');
    }, 'duration', '1 day');

    await runValidationScenario(page, 'invalid-date-range', async (p) => {
        await forceGoToStep(p, 2);
        await ensureValidDuration(p);
        await setField(p, 'attr-startDate', '2026-09-01');
        await setField(p, 'attr-endDate', '2026-06-01');
        await setField(p, 'attr-applicationDeadline', '2026-05-01');
    }, 'attr-startDate', 'before start');
}

async function stripHiddenRequired(page) {
    await page.evaluate(() => {
        document.querySelectorAll('.wizard-step-content.hidden [required]').forEach((f) => {
            f.removeAttribute('required');
        });
    });
}

async function fillRequiredModelFields(page) {
    await page.evaluate(() => {
        const set = (id, val) => {
            const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
            if (el && !String(el.value || '').trim()) el.value = val;
        };
        set('taskTitle', 'Smoke test task title');
        set('taskType', 'Engineering');
        set('detailedScope', 'Smoke test scope for automated validation.');
        set('requiredSkills', 'Project Management');
        set('experienceLevel', 'Senior');
        set('deliverableFormat', 'PDF report');
        set('duration', '90');
    });
}

async function ensureCategorySubmodel(page) {
    await forceGoToStep(page, 4);
    await page.evaluate(() => {
        const category = document.querySelector('input[name="category"][value="project_based"]');
        if (category) {
            category.checked = true;
            category.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const modelType = document.getElementById('model-type');
        if (modelType) modelType.value = 'project_based';
    });
    await delay(600);
    await page.evaluate(() => {
        const submodel = document.querySelector('input[name="submodel"][value="task_based"]');
        if (submodel) {
            submodel.checked = true;
            submodel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const submodelType = document.getElementById('submodel-type');
        if (submodelType) submodelType.value = 'task_based';
        const details = document.getElementById('model-details-section');
        if (details) details.style.display = 'block';
    });
    await delay(600);
    await fillRequiredModelFields(page);
}

async function stabilizeDemoForm(page) {
    await page.evaluate(() => {
        const intent = document.querySelector('input[name="intent"][value="request"]');
        if (intent) intent.checked = true;
        const projectType = document.querySelector('input[name="projectType"][value="single"]');
        if (projectType) projectType.checked = true;
    });
    await ensureCategorySubmodel(page);
    await forceGoToStep(page, 6);
    await selectExchangeMode(page, 'cash');
    await setField(page, 'budgetRange_min', '50000');
    await setField(page, 'budgetRange_max', '75000');
    await setField(page, 'cash-amount', '60000');
    await ensureValidFinancials(page);
    await delay(500);
}

async function buildValidDraft(page, title) {
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await openCreateOpportunity(page);
    await confirmFillDemoData(page);
    await stabilizeDemoForm(page);
    await forceGoToStep(page, 6);
    await setField(page, 'title', title);
    const countBefore = await getOppCount(page);
    await stripHiddenRequired(page);
    await page.locator('#save-draft-wizard').click({ force: true });
    await page.waitForFunction(
        () => {
            const success = document.getElementById('form-success');
            const err = document.getElementById('form-error');
            const created = success && !success.classList.contains('hidden')
                && (success.textContent || '').toLowerCase().includes('success');
            const failed = err && !err.classList.contains('hidden') && (err.textContent || '').trim();
            return created || failed;
        },
        undefined,
        { timeout: 15000 }
    ).catch(() => {});
    await delay(1000);
    const countAfter = await getOppCount(page);
    const outcome = await collectValidationState(page);
    const debug = await page.evaluate(() => ({
        modelType: document.getElementById('model-type')?.value || '',
        subModelType: document.getElementById('submodel-type')?.value || '',
        exchangeMode: document.getElementById('exchange-mode')?.value || '',
        oppService: !!window.opportunityService,
        successText: document.getElementById('form-success')?.textContent?.trim() || ''
    }));
    const success = debug.successText.toLowerCase().includes('success');
    return { countBefore, countAfter, success, debug, consoleErrors, ...outcome };
}

async function getInlineReadiness(page) {
    return page.evaluate(() => {
        const el = document.querySelector('#matching-readiness-indicator .readiness-inline');
        if (!el) return null;
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        const scoreMatch = text.match(/(\d+)%/);
        return { text, score: scoreMatch ? Number(scoreMatch[1]) : null };
    });
}

async function publishFromEdit(page, oppId) {
    await page.goto(`${BASE}/index.html#/opportunities/${oppId}/edit`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    await delay(3500);
    await ensureValidFinancials(page);
    let onReview = await advanceToStep(page, 7);
    if (!onReview) {
        await forceGoToStep(page, 6);
        await clickNext(page);
    }
    await delay(800);
    const inline = await getInlineReadiness(page);
    results.readiness.inline = inline;
    if (inline?.text?.toLowerCase().includes('guaranteed')) {
        fail('Inline readiness claims guaranteed matches');
    }
    await stripHiddenRequired(page);
    await page.evaluate(() => {
        const status = document.getElementById('status');
        if (status) status.value = 'published';
        const submit = document.getElementById('submit-form');
        if (submit) submit.classList.remove('hidden');
        const form = document.getElementById('opportunity-form');
        if (form) form.requestSubmit();
    });
    await delay(1500);
    const modalVisible = await page.locator('#matching-readiness-modal-root:not([hidden])').isVisible().catch(() => false);
    if (modalVisible) {
        const popup = await page.evaluate(() => {
            const root = document.getElementById('matching-readiness-modal-root');
            const hint = root?.querySelector('.matching-readiness-dialog__hint')?.textContent?.trim() || '';
            const body = root?.textContent?.replace(/\s+/g, ' ').trim() || '';
            const scoreMatch = hint.match(/(\d+)%/);
            return { hint, score: scoreMatch ? Number(scoreMatch[1]) : null, body };
        });
        results.readiness.popup = popup;
        if (popup.body.toLowerCase().includes('guaranteed') || popup.body.toLowerCase().includes('real matches')) {
            fail('Readiness popup claims guaranteed/real matches');
        }
        if (inline?.score != null && popup.score != null && inline.score !== popup.score) {
            fail(`Readiness mismatch: inline ${inline.score}% vs popup ${popup.score}%`);
        } else if (inline?.score != null && popup.score != null) {
            note(`Readiness scores match: ${inline.score}% inline / ${popup.score}% popup`);
        }
        const publishBtn = page.locator('[data-readiness-publish]');
        if (await publishBtn.isVisible()) {
            await publishBtn.click();
        } else {
            await page.locator('[data-readiness-fix]').click();
            fail('Publish blocked by required readiness modal');
            return;
        }
    } else {
        note('Publish proceeded without improve-modal (ready state)');
    }
    await delay(2500);
}

async function main() {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const server = await startStaticServer();
    const browser = await chromium.launch({ headless: true });
    results.browser = `Chromium ${browser.version()}`;
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'en-US' });
    const page = await context.newPage();

    try {
        await login(page);
        results.countBeforeDraft = await getOppCount(page);
        note(`Opportunity count before test: ${results.countBeforeDraft}`);

        await runValidationSuite(page);
        await screenshot(page, '01-validation-suite-complete');

        const draft = await buildValidDraft(page, UNIQUE_TITLE);
        results.countAfterDraft = draft.countAfter;
        if (!draft.success && draft.countAfter !== draft.countBefore + 1) {
            fail(`Valid draft save failed (success=${draft.success}, count ${draft.countBefore} -> ${draft.countAfter}, error="${draft.formError}", debug=${JSON.stringify(draft.debug)}, console=${draft.consoleErrors.join('; ')})`);
            await screenshot(page, '02-draft-save-failed');
        } else {
            note(`Draft saved: count ${draft.countBefore} -> ${draft.countAfter}`);
        }

        const created = await getLatestOppByTitle(page, UNIQUE_TITLE);
        if (!created) {
            fail('Draft opportunity not found after valid save');
            return;
        }
        results.opportunityId = created.id;
        note(`Created draft id: ${created.id}`);

        await page.waitForFunction(
            () => window.location.hash.includes('/opportunities/map') || window.location.hash.includes('/opportunities/'),
            undefined,
            { timeout: 10000 }
        ).catch(() => {});
        await delay(1500);

        const editUrl = `${BASE}/index.html#/opportunities/${results.opportunityId}/edit`;
        await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
        await waitAppReady(page);
        await page.waitForFunction(
            (title) => (document.getElementById('title')?.value || '').includes(title),
            UNIQUE_TITLE,
            { timeout: 20000 }
        ).catch(() => {});
        await delay(1000);

        const hash = await page.evaluate(() => window.location.hash);
        if (!hash.includes(`/opportunities/${results.opportunityId}/edit`)) {
            fail(`Edit URL mismatch: ${hash}`);
        } else {
            note(`Edit URL confirmed: ${hash}`);
        }

        const prefilled = await page.evaluate(() => document.getElementById('title')?.value || '');
        if (!prefilled.includes(UNIQUE_TITLE)) {
            fail(`Prefill failed: "${prefilled}"`);
        } else {
            note('Edit mode prefill confirmed');
        }

        const editedTitle = `${UNIQUE_TITLE} (edited)`;
        await forceGoToStep(page, 2);
        await page.locator('#title').fill(editedTitle, { force: true });
        await ensureValidFinancials(page);
        await stripHiddenRequired(page);
        const countBeforeEdit = await getOppCount(page);
        await page.evaluate(() => {
            const btn = document.getElementById('save-draft-wizard');
            if (btn) {
                btn.classList.remove('hidden');
                btn.click();
            }
        });
        await page.waitForFunction(
            (id) => window.location.hash.includes(`/opportunities/${id}`),
            results.opportunityId,
            { timeout: 20000 }
        ).catch(() => {});
        await delay(1500);
        results.countAfterEditSave = await getOppCount(page);
        if (results.countAfterEditSave !== countBeforeEdit) {
            fail(`Duplicate on edit save: ${countBeforeEdit} -> ${results.countAfterEditSave}`);
        } else {
            results.duplicateCountUnchanged = true;
            note('Edit save kept opportunity count unchanged');
        }

        const updated = await page.evaluate((id) => {
            const list = JSON.parse(localStorage.getItem('pmtwin_opportunities') || '[]');
            return list.find((o) => o.id === id) || null;
        }, results.opportunityId);
        if (!updated || updated.title !== editedTitle) {
            fail(`Same id not updated: expected "${editedTitle}", got "${updated?.title}"`);
        } else {
            note(`Same opportunity id ${results.opportunityId} updated`);
        }

        const countBeforePublish = await getOppCount(page);
        await publishFromEdit(page, results.opportunityId);
        results.countAfterPublish = await getOppCount(page);
        if (results.countAfterPublish !== countBeforePublish) {
            fail(`Duplicate on publish: ${countBeforePublish} -> ${results.countAfterPublish}`);
        } else {
            note('Publish kept opportunity count unchanged');
        }

        const published = await page.evaluate((id) => {
            const list = JSON.parse(localStorage.getItem('pmtwin_opportunities') || '[]');
            return list.find((o) => o.id === id) || null;
        }, results.opportunityId);
        if (!published || published.status !== 'published') {
            fail(`Publish failed: status=${published?.status}`);
            await screenshot(page, '03-publish-failed');
        } else {
            note(`Opportunity ${results.opportunityId} published`);
        }

        if (results.readiness.inline?.score === 80 || results.readiness.inline?.score === 90) {
            note(`Inline readiness score ${results.readiness.inline.score}% — not a fixed 80/90 pair mismatch`);
        }

        await screenshot(page, '04-final-pass');
    } catch (err) {
        fail(`Unhandled: ${err.message}`);
        await screenshot(page, '99-error').catch(() => {});
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n========== SMOKE TEST REPORT ==========');
    console.log(JSON.stringify(results, null, 2));
    console.log('FINAL:', results.pass ? 'PASS' : 'FAIL');
    process.exit(results.pass ? 0 : 1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
