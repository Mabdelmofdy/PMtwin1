/**
 * Login Page Component
 */

const DEMO_WORKFLOW_PASSWORD = 'Pmtwin@2026';
const DEMO_ADMIN = { name: 'Platform Admin', role: 'Administrator', email: 'admin@pmtwin.com', password: 'admin123', group: 'admin', featured: true };
const DEMO_FEATURED_EMAILS = new Set([
    'admin@pmtwin.com',
    'khalid.alharbi@pmtwin.test',
    'abdullah.alrashid@pmtwin.test',
    'mansour.alzahrani@pmtwin.test',
    'contact@alriyadh-construction.test'
]);

const DEMO_WORKFLOW_COMPANIES_FALLBACK = [
    { name: 'Al-Riyadh Construction', role: 'General Contractor — owns needs 007, 023', email: 'contact@alriyadh-construction.test', featured: true },
    { name: 'Gulf Development Co', role: 'Developer — owns needs 005, 024', email: 'contact@gulf-development.test' },
    { name: 'Eastern Equipment & Supply', role: 'Equipment rental — owns offer 025', email: 'contact@eastern-equipment.test' },
    { name: 'Najd Investment Group', role: 'Investor — owns equity JV 028, 037', email: 'contact@najd-investment.test' },
    { name: 'Saudi Infrastructure Partners', role: 'Consortium lead — owns 014, 039', email: 'contact@sa-infra-partners.test' },
    { name: 'Red Sea Building Co', role: 'Mixed-use developer — owns 029, 034', email: 'contact@redsea-building.test' }
].map((r) => ({
    ...r,
    password: DEMO_WORKFLOW_PASSWORD,
    group: 'workflow-company',
    accountType: 'company',
    featured: r.featured || DEMO_FEATURED_EMAILS.has(r.email)
}));

/** Fallback when data service not available: the 18 canonical workflow users. */
function getDemoCredentialsFallback() {
    return [
        { name: 'Khalid Al-Harbi', role: 'Senior Architect — completed deal', email: 'khalid.alharbi@pmtwin.test', featured: true },
        { name: 'Sara Al-Mutairi', role: 'BIM Consultant', email: 'sara.almutairi@pmtwin.test' },
        { name: 'Faisal Al-Otaibi', role: 'Architect', email: 'faisal.alotaibi@pmtwin.test' },
        { name: 'Noura Al-Dossari', role: 'Architect — Interior & Fit-Out', email: 'noura.aldossari@pmtwin.test' },
        { name: 'Omar Al-Shehri', role: 'Civil Engineer', email: 'omar.alshehri@pmtwin.test' },
        { name: 'Hessa Al-Qahtani', role: 'Civil Engineer', email: 'hessa.alqahtani@pmtwin.test' },
        { name: 'Yousef Al-Ghamdi', role: 'Construction Manager', email: 'yousef.alghamdi@pmtwin.test' },
        { name: 'Mansour Al-Zahrani', role: 'MEP Engineer — barter negotiation', email: 'mansour.alzahrani@pmtwin.test', featured: true },
        { name: 'Layla Al-Subaie', role: 'Architect — barter exchange', email: 'layla.alsubaie@pmtwin.test' },
        { name: 'Abdullah Al-Rashid', role: 'Consortium lead PM', email: 'abdullah.alrashid@pmtwin.test', featured: true },
        { name: 'Reem Al-Harbi', role: 'Architect — consortium partner', email: 'reem.alharbi@pmtwin.test' },
        { name: 'Tariq Al-Maliki', role: 'Civil Engineer — consortium partner', email: 'tariq.almaliki@pmtwin.test' },
        { name: 'Bandar Al-Anazi', role: 'Heavy equipment provider', email: 'bandar.alanazi@pmtwin.test' },
        { name: 'Maha Al-Juhani', role: 'Real estate development', email: 'maha.aljuhani@pmtwin.test' },
        { name: 'Rana Al-Faraj', role: 'Accounting & finance', email: 'rana.alfaraj@pmtwin.test' },
        { name: 'Saad Al-Amri', role: 'Structural engineer', email: 'saad.alamri@pmtwin.test' },
        { name: 'Huda Al-Balawi', role: 'Project manager', email: 'huda.albalawi@pmtwin.test' },
        { name: 'Ziad Al-Harthy', role: 'MEP engineer', email: 'ziad.alharthy@pmtwin.test' }
    ].map((r) => ({
        ...r,
        password: DEMO_WORKFLOW_PASSWORD,
        group: 'workflow',
        featured: r.featured || DEMO_FEATURED_EMAILS.has(r.email)
    }));
}

function decodeDemoPassword(entity) {
    if (!entity || !entity.passwordHash) return null;
    try {
        return atob(entity.passwordHash);
    } catch (_) {
        return null;
    }
}

function inferDemoPasswordByEmail(email) {
    if (email === 'admin@pmtwin.com') return 'admin123';
    if (/@pmtwin\.test$/i.test(email || '')) return DEMO_WORKFLOW_PASSWORD;
    if (/@demo\.test$/i.test(email || '')) return 'demo123';
    return 'password123';
}

function classifyDemoCredential(entity, isCompany) {
    const email = entity.email || '';
    const role = entity.role || '';
    if (role === 'admin' || email === 'admin@pmtwin.com') {
        return { group: 'admin', accountType: 'individual', featured: DEMO_FEATURED_EMAILS.has(email) };
    }
    if (isCompany) {
        const group = (entity.id || '').startsWith('seed-co-corp-')
            ? 'workflow-company'
            : /@demo\.test$/i.test(email) ? 'legacy' : 'company';
        return { group, accountType: 'company', featured: DEMO_FEATURED_EMAILS.has(email) };
    }
    if (/@pmtwin\.test$/i.test(email)) {
        return { group: 'workflow', accountType: 'individual', featured: DEMO_FEATURED_EMAILS.has(email) };
    }
    if (/^pending/i.test(email) || /^demo\d+@demo\.test$/i.test(email)) {
        return { group: 'legacy', accountType: 'individual', featured: false };
    }
    return { group: 'other', accountType: 'individual', featured: false };
}

function rowFromDemoEntity(entity, isCompany) {
    const email = (entity.email || '').trim();
    if (!email) return null;
    const profile = entity.profile || {};
    const { group, accountType, featured } = classifyDemoCredential(entity, isCompany);
    return {
        name: profile.name || email,
        role: profile.headline || profile.title || (isCompany ? 'Company account' : (entity.role || 'User')),
        email,
        password: decodeDemoPassword(entity) || inferDemoPasswordByEmail(email),
        group,
        accountType,
        featured
    };
}

const DEMO_GROUP_ORDER = { admin: 0, 'workflow-company': 1, workflow: 2, legacy: 3, company: 4, other: 5 };

function sortDemoCredentials(rows) {
    return rows.slice().sort((a, b) => {
        const ga = DEMO_GROUP_ORDER[a.group] ?? 99;
        const gb = DEMO_GROUP_ORDER[b.group] ?? 99;
        if (ga !== gb) return ga - gb;
        return (a.name || a.email || '').localeCompare(b.name || b.email || '', undefined, { sensitivity: 'base' });
    });
}

/** Build demo credentials from data service so every seeded user and company appears. */
async function getDemoCredentials() {
    const dataService = window.dataService || (typeof dataService !== 'undefined' ? dataService : null);
    if (dataService && typeof dataService.getUsers === 'function' && typeof dataService.getCompanies === 'function') {
        try {
            const [users, companies] = await Promise.all([dataService.getUsers(), dataService.getCompanies()]);
            const byEmail = new Map();
            const addRow = (row) => {
                if (!row || !row.email) return;
                byEmail.set(row.email.toLowerCase(), row);
            };
            (users || []).forEach((u) => addRow(rowFromDemoEntity(u, false)));
            (companies || []).forEach((c) => addRow(rowFromDemoEntity(c, true)));
            const rows = sortDemoCredentials(Array.from(byEmail.values()));
            if (rows.length) return rows;
        } catch (_) {
            /* fall through to static fallback */
        }
    }
    return sortDemoCredentials([{ ...DEMO_ADMIN }, ...getDemoCredentialsFallback(), ...DEMO_WORKFLOW_COMPANIES_FALLBACK]);
}

function getDemoCredentialsInitials(name, email) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function buildDemoCredentialCard(row, extraClass) {
    const initials = getDemoCredentialsInitials(row.name, row.email);
    const groupClass = row.group === 'admin' ? ' pm-demo-credentials-card--admin' : '';
    const featuredClass = row.featured ? ' pm-demo-credentials-card--featured' : '';
    return `
        <button type="button" class="pm-demo-credentials-card${groupClass}${featuredClass}${extraClass || ''}"
            data-email="${escapeHtml(row.email)}"
            data-password="${escapeHtml(row.password)}"
            data-group="${escapeHtml(row.group || 'workflow')}"
            data-account-type="${escapeHtml(row.accountType || 'individual')}">
            <span class="pm-demo-credentials-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
            <span class="pm-demo-credentials-meta">
                <span class="pm-demo-credentials-name">${escapeHtml(row.name)}</span>
                <span class="pm-demo-credentials-role">${escapeHtml(row.role || '')}</span>
                <span class="pm-demo-credentials-email">${escapeHtml(row.email)}</span>
            </span>
            <span class="pm-demo-credentials-use">Open <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></span>
        </button>
    `;
}

const DEMO_CREDENTIAL_TABS = [
    { id: 'professionals', label: 'Professionals' },
    { id: 'companies', label: 'Companies' },
    { id: 'admin', label: 'Admin' }
];

function getDemoCredentialTab(row) {
    if (!row) return 'professionals';
    if (row.group === 'admin') return 'admin';
    if (row.accountType === 'company' || row.group === 'workflow-company' || row.group === 'company') return 'companies';
    if (row.group === 'legacy' && (row.role || '').toLowerCase().includes('company')) return 'companies';
    return 'professionals';
}

function bucketDemoCredentials(credentials) {
    const buckets = { professionals: [], companies: [], admin: [] };
    (credentials || []).forEach((row) => {
        const tab = getDemoCredentialTab(row);
        buckets[tab].push(row);
    });
    return buckets;
}

function buildDemoCredentialsHTML(credentials) {
    const hasWorkflow = credentials.some((r) => r.group === 'workflow' || r.group === 'workflow-company');
    const hasLegacy = credentials.some((r) => r.group === 'legacy');
    const hasOther = credentials.some((r) => r.group === 'other' || r.group === 'company');
    const buckets = bucketDemoCredentials(credentials);

    const tabsHtml = DEMO_CREDENTIAL_TABS.map((tab, index) => `
        <button type="button" role="tab" class="pm-demo-credentials-tabs__btn${index === 0 ? ' is-active' : ''}"
            id="demo-credentials-tab-${tab.id}" data-demo-tab="${tab.id}"
            aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="demo-credentials-panel-${tab.id}">
            ${escapeHtml(tab.label)} <span class="pm-demo-credentials-tabs__count">(${buckets[tab.id].length})</span>
        </button>
    `).join('');

    const panelsHtml = DEMO_CREDENTIAL_TABS.map((tab, index) => {
        const listHtml = buckets[tab.id].map((r) => buildDemoCredentialCard(r)).join('');
        return `
            <div class="pm-demo-credentials-tab-panel${index === 0 ? ' is-active' : ''}"
                id="demo-credentials-panel-${tab.id}" data-demo-tab-panel="${tab.id}" role="tabpanel"
                aria-labelledby="demo-credentials-tab-${tab.id}"${index === 0 ? '' : ' hidden'}>
                <div class="pm-demo-credentials-list" data-demo-list="${tab.id}">${listHtml}</div>
                <p class="pm-demo-credentials-empty" data-demo-empty="${tab.id}" hidden>No accounts match your search.</p>
            </div>
        `;
    }).join('');

    return `
        <div class="pm-demo-credentials" id="demo-credentials-root">
            <p class="pm-demo-credentials-intro">Pick an account to sign in instantly. Workflow users and companies share one password; company accounts open with the Company account type.</p>
            <div class="pm-demo-credentials-passwords">
                <span class="pm-demo-credentials-pill"><strong>Admin</strong> <code>admin123</code></span>
                ${hasWorkflow ? `<span class="pm-demo-credentials-pill"><strong>Workflow accounts</strong> <code>${escapeHtml(DEMO_WORKFLOW_PASSWORD)}</code></span>` : ''}
                ${hasLegacy ? '<span class="pm-demo-credentials-pill"><strong>Legacy demo</strong> <code>demo123</code></span>' : ''}
                ${hasOther ? '<span class="pm-demo-credentials-pill"><strong>Other seeded</strong> <code>password123</code></span>' : ''}
            </div>
            <div class="pm-demo-credentials-search-wrap">
                <i class="ph-duotone ph-magnifying-glass" aria-hidden="true"></i>
                <input type="search" class="pm-demo-credentials-search" id="demo-credentials-search"
                    placeholder="Search by name, role, or email…" autocomplete="off" aria-label="Search demo accounts">
            </div>
            <div class="pm-demo-credentials-tabs" role="tablist" aria-label="Demo account types">${tabsHtml}</div>
            <div class="pm-demo-credentials-scroll">${panelsHtml}</div>
        </div>
    `;
}

function getAccountTypeForDemoRow(row) {
    if (!row) return 'individual';
    if (row.accountType === 'company' || row.group === 'workflow-company' || row.group === 'company') return 'company';
    if (row.group === 'legacy' && (row.role || '').toLowerCase().includes('company')) return 'company';
    if (row.group === 'admin') return 'auto';
    return 'individual';
}

function applyDemoCredentialToForm(row) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (!emailInput || !passwordInput || !row) return;
    emailInput.value = row.email || '';
    passwordInput.value = row.password || '';
    const companyRadio = document.getElementById('account-type-company');
    const individualRadio = document.getElementById('account-type-individual');
    if (companyRadio && individualRadio) {
        const isCompany = getAccountTypeForDemoRow(row) === 'company';
        if (isCompany) {
            companyRadio.checked = true;
        } else {
            individualRadio.checked = true;
        }
    }
}

async function performLoginAndRedirect(email, password, accountType) {
    const result = await authService.login(email, password, { rememberMe: false, accountType });
    if (!result) return;
    await layoutService.updateNavigation();
    const user = authService.getCurrentUser();
    const profile = user?.profile || {};
    const isCompany = (user?.profile?.type === 'company') || (authService.isCompanyUser && authService.isCompanyUser());
    const hasSkills = Array.isArray(profile.skills) ? profile.skills.length > 0 : !!(profile.skills || '').toString().trim();
    const hasSectors = Array.isArray(profile.sectors) ? profile.sectors.length > 0 : !!(profile.sectors || profile.industry || '').toString().trim();
    const returnUrl = sessionStorage.getItem('pmtwin_return_url');
    if (returnUrl) {
        sessionStorage.removeItem('pmtwin_return_url');
    }
    const profileIncomplete = isCompany ? !hasSectors : !hasSkills;
    if (profileIncomplete && CONFIG.ROUTES.PROFILE) {
        router.navigate(CONFIG.ROUTES.PROFILE);
    } else if (returnUrl) {
        router.navigate(returnUrl);
    } else {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
    }
}

async function useDemoCredential(row) {
    if (!row) return;
    if (window.modalService) modalService.close();
    applyDemoCredentialToForm(row);
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.style.display = 'none';
    try {
        await performLoginAndRedirect(row.email, row.password, getAccountTypeForDemoRow(row));
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    }
}

function getActiveDemoCredentialsTab(root) {
    return root.querySelector('.pm-demo-credentials-tabs__btn.is-active')?.getAttribute('data-demo-tab') || 'professionals';
}

function setActiveDemoCredentialsTab(root, tabId) {
    root.querySelectorAll('.pm-demo-credentials-tabs__btn').forEach((btn) => {
        const active = btn.getAttribute('data-demo-tab') === tabId;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    root.querySelectorAll('.pm-demo-credentials-tab-panel').forEach((panel) => {
        const active = panel.getAttribute('data-demo-tab-panel') === tabId;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
    });
}

function filterDemoCredentialsPanel(root, tabId, query) {
    const panel = root.querySelector(`[data-demo-tab-panel="${tabId}"]`);
    if (!panel) return 0;
    const q = (query || '').trim().toLowerCase();
    const listEl = panel.querySelector('.pm-demo-credentials-list');
    const emptyEl = panel.querySelector('.pm-demo-credentials-empty');
    let visible = 0;
    panel.querySelectorAll('.pm-demo-credentials-card').forEach((card) => {
        const text = card.textContent.toLowerCase();
        const show = !q || text.includes(q);
        card.hidden = !show;
        if (show) visible += 1;
    });
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (listEl) listEl.hidden = visible === 0 && !!q;
    return visible;
}

function mountDemoCredentialsModal(modal, credentials) {
    const root = modal.querySelector('#demo-credentials-root');
    if (!root) return;
    const searchInput = root.querySelector('#demo-credentials-search');
    const buckets = bucketDemoCredentials(credentials);

    const onPick = async (btn) => {
        const email = btn.getAttribute('data-email');
        const password = btn.getAttribute('data-password');
        const group = btn.getAttribute('data-group');
        const accountType = btn.getAttribute('data-account-type');
        const match = credentials.find((r) => r.email === email && r.password === password)
            || { email, password, group, accountType };
        btn.disabled = true;
        try {
            await useDemoCredential(match);
        } finally {
            btn.disabled = false;
        }
    };

    root.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.pm-demo-credentials-tabs__btn');
        if (tabBtn && root.contains(tabBtn)) {
            const tabId = tabBtn.getAttribute('data-demo-tab');
            if (tabId) {
                setActiveDemoCredentialsTab(root, tabId);
                if (searchInput) filterDemoCredentialsPanel(root, tabId, searchInput.value);
            }
            return;
        }
        const btn = e.target.closest('.pm-demo-credentials-card');
        if (!btn || !root.contains(btn) || btn.disabled) return;
        onPick(btn);
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const tabId = getActiveDemoCredentialsTab(root);
            const visible = filterDemoCredentialsPanel(root, tabId, searchInput.value);
            const tabBtn = root.querySelector(`#demo-credentials-tab-${tabId}`);
            const countEl = tabBtn?.querySelector('.pm-demo-credentials-tabs__count');
            const total = (buckets[tabId] || []).length;
            if (countEl) {
                const q = searchInput.value.trim();
                countEl.textContent = q ? `(${visible}/${total})` : `(${total})`;
            }
        });
        setTimeout(() => searchInput.focus(), 50);
    }
}

function initLogin() {
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    
    if (!loginForm) return;

    const flash = sessionStorage.getItem('pmtwin_flash');
    if (flash) {
        try {
            const { type, message } = JSON.parse(flash);
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
        } catch (_) {}
        sessionStorage.removeItem('pmtwin_flash');
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me') ? document.getElementById('remember-me').checked : false;
        const accountTypeEl = loginForm.querySelector('input[name="accountType"]:checked');
        const accountType = accountTypeEl ? accountTypeEl.value : 'auto';
        
        // Hide previous errors
        errorDiv.style.display = 'none';
        
        try {
            await performLoginAndRedirect(email, password, accountType);
        } catch (error) {
            // Show error
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
    
    const btnViewDemo = document.getElementById('btn-view-demo-credentials');
    if (btnViewDemo) {
        btnViewDemo.addEventListener('click', async () => {
            const credentials = await getDemoCredentials();
            const contentHTML = buildDemoCredentialsHTML(credentials);
            if (window.modalService && typeof window.modalService.showCustom === 'function') {
                modalService.showCustom(contentHTML, 'Demo accounts', {
                    confirmText: 'Close',
                    modalClass: 'modal-dialog--demo-credentials',
                    onMount: (modal) => mountDemoCredentialsModal(modal, credentials)
                });
            } else {
                alert(credentials.map((r) => `${r.name}: ${r.email} / ${r.password}`).join('\n'));
            }
        });
    }

    const googleBtn = document.getElementById('btn-login-google');
    const linkedInBtn = document.getElementById('btn-login-linkedin');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            if (window.CONFIG?.AUTH?.SOCIAL_LOGIN_ENABLED) {
                // Future: authService.loginWithGoogle();
            } else {
                alert('Social login is coming soon. Please use email and password for now.');
            }
        });
    }
    if (linkedInBtn) {
        linkedInBtn.addEventListener('click', () => {
            if (window.CONFIG?.AUTH?.SOCIAL_LOGIN_ENABLED) {
                // Future: authService.loginWithLinkedIn();
            } else {
                alert('Social login is coming soon. Please use email and password for now.');
            }
        });
    }

}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
