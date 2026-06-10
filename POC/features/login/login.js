/**
 * Login Page Component
 */

const DEMO_WORKFLOW_PASSWORD = 'Pmtwin@2026';
const DEMO_ADMIN = { name: 'Platform Admin', role: 'Administrator', email: 'admin@pmtwin.com', password: 'admin123', group: 'admin', featured: true };
const DEMO_FEATURED_EMAILS = new Set([
    'admin@pmtwin.com',
    'khalid.alharbi@pmtwin.test',
    'abdullah.alrashid@pmtwin.test',
    'mansour.alzahrani@pmtwin.test'
]);

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

/** Build demo credentials from data service so display names match profile.name. */
async function getDemoCredentials() {
    const rows = [{ ...DEMO_ADMIN }];
    const dataService = window.dataService || (typeof dataService !== 'undefined' ? dataService : null);
    if (dataService && typeof dataService.getUsers === 'function' && typeof dataService.getCompanies === 'function') {
        try {
            const [users, companies] = await Promise.all([dataService.getUsers(), dataService.getCompanies()]);
            const workflow = (users || []).filter((u) => /@pmtwin\.test$/.test(u.email || ''));
            workflow.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
            workflow.forEach((u) => {
                const email = u.email || '';
                rows.push({
                    name: (u.profile && u.profile.name) || email,
                    role: (u.profile && (u.profile.headline || u.profile.title)) || 'Workflow user',
                    email,
                    password: DEMO_WORKFLOW_PASSWORD,
                    group: 'workflow',
                    featured: DEMO_FEATURED_EMAILS.has(email)
                });
            });
            const demoPassword = 'demo123';
            const pending = (users || []).filter((u) => (u.email || '').startsWith('pending'));
            const demoUsers = (users || []).filter((u) => (u.email || '').match(/^demo\d+@demo\.test$/));
            const demoCompanies = (companies || []).filter((c) => (c.email || '').match(/^company\d+@demo\.test$/));
            pending.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            demoCompanies.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            demoUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            const legacy = []
                .concat(pending.map((u) => ({ name: (u.profile && u.profile.name) || u.email, role: 'Pending user', email: u.email, password: demoPassword, group: 'legacy' })))
                .concat(demoCompanies.map((c) => ({ name: (c.profile && c.profile.name) || c.email, role: 'Company account', email: c.email, password: demoPassword, group: 'legacy' })))
                .concat(demoUsers.map((u) => ({ name: (u.profile && u.profile.name) || u.email, role: 'Legacy demo user', email: u.email, password: demoPassword, group: 'legacy' })));
            rows.push(...legacy);
        } catch (_) {
            rows.push(...getDemoCredentialsFallback());
        }
    } else {
        rows.push(...getDemoCredentialsFallback());
    }
    return rows;
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
            data-group="${escapeHtml(row.group || 'workflow')}">
            <span class="pm-demo-credentials-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
            <span class="pm-demo-credentials-meta">
                <span class="pm-demo-credentials-name">${escapeHtml(row.name)}</span>
                <span class="pm-demo-credentials-role">${escapeHtml(row.role || '')}</span>
                <span class="pm-demo-credentials-email">${escapeHtml(row.email)}</span>
            </span>
            <span class="pm-demo-credentials-use">Use <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></span>
        </button>
    `;
}

function buildDemoCredentialsHTML(credentials) {
    const featured = credentials.filter((r) => r.featured);
    const workflow = credentials.filter((r) => r.group === 'workflow' && !r.featured);
    const legacy = credentials.filter((r) => r.group === 'legacy');
    const hasWorkflow = credentials.some((r) => r.group === 'workflow');
    const hasLegacy = legacy.length > 0;

    const quickHtml = featured.map((r) => buildDemoCredentialCard(r)).join('');
    const listHtml = workflow.concat(legacy).map((r) => buildDemoCredentialCard(r)).join('');

    return `
        <div class="pm-demo-credentials" id="demo-credentials-root">
            <p class="pm-demo-credentials-intro">Pick an account to fill the login form. All workflow demo users share one password.</p>
            <div class="pm-demo-credentials-passwords">
                <span class="pm-demo-credentials-pill"><strong>Admin</strong> <code>admin123</code></span>
                ${hasWorkflow ? `<span class="pm-demo-credentials-pill"><strong>Workflow users</strong> <code>${escapeHtml(DEMO_WORKFLOW_PASSWORD)}</code></span>` : ''}
                ${hasLegacy ? '<span class="pm-demo-credentials-pill"><strong>Legacy demo</strong> <code>demo123</code></span>' : ''}
            </div>
            <div class="pm-demo-credentials-search-wrap">
                <i class="ph-duotone ph-magnifying-glass" aria-hidden="true"></i>
                <input type="search" class="pm-demo-credentials-search" id="demo-credentials-search"
                    placeholder="Search by name, role, or email…" autocomplete="off" aria-label="Search demo accounts">
            </div>
            ${featured.length ? `<p class="pm-demo-credentials-section-title">Quick start</p><div class="pm-demo-credentials-quick" id="demo-credentials-quick">${quickHtml}</div>` : ''}
            <p class="pm-demo-credentials-section-title">${workflow.length ? 'All workflow accounts' : 'All accounts'}</p>
            <div class="pm-demo-credentials-list" id="demo-credentials-list">${listHtml}</div>
            <p class="pm-demo-credentials-empty" id="demo-credentials-empty" hidden>No accounts match your search.</p>
        </div>
    `;
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
        if (row.group === 'legacy' && (row.role || '').toLowerCase().includes('company')) {
            companyRadio.checked = true;
        } else {
            individualRadio.checked = true;
        }
    }
    emailInput.focus();
    if (window.modalService) modalService.close();
}

function mountDemoCredentialsModal(modal, credentials) {
    const root = modal.querySelector('#demo-credentials-root');
    if (!root) return;
    const searchInput = root.querySelector('#demo-credentials-search');
    const listEl = root.querySelector('#demo-credentials-list');
    const quickEl = root.querySelector('#demo-credentials-quick');
    const emptyEl = root.querySelector('#demo-credentials-empty');

    const onPick = (btn) => {
        const email = btn.getAttribute('data-email');
        const password = btn.getAttribute('data-password');
        const group = btn.getAttribute('data-group');
        const match = credentials.find((r) => r.email === email && r.password === password)
            || { email, password, group };
        applyDemoCredentialToForm(match);
    };

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.pm-demo-credentials-card');
        if (!btn || !root.contains(btn)) return;
        onPick(btn);
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            let visible = 0;
            root.querySelectorAll('.pm-demo-credentials-card').forEach((card) => {
                const text = card.textContent.toLowerCase();
                const show = !q || text.includes(q);
                card.hidden = !show;
                if (show) visible += 1;
            });
            if (emptyEl) emptyEl.hidden = visible > 0;
            if (listEl) listEl.hidden = visible === 0 && !q;
            if (quickEl) quickEl.hidden = !!q;
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
            const result = await authService.login(email, password, { rememberMe, accountType });
            
            if (result) {
                // Update navigation
                await layoutService.updateNavigation();
                // Redirect to profile if incomplete (demo flow: Profile setup then Dashboard)
                const user = authService.getCurrentUser();
                const profile = user?.profile || {};
                const isCompany = (user?.profile?.type === 'company') || (authService.isCompanyUser && authService.isCompanyUser());
                const hasSkills = Array.isArray(profile.skills) ? profile.skills.length > 0 : !!(profile.skills || '').toString().trim();
                const hasSectors = Array.isArray(profile.sectors) ? profile.sectors.length > 0 : !!(profile.sectors || profile.industry || '').toString().trim();
                const profileIncomplete = isCompany ? !hasSectors : !hasSkills;
                if (profileIncomplete && CONFIG.ROUTES.PROFILE) {
                    router.navigate(CONFIG.ROUTES.PROFILE);
                } else {
                    router.navigate(CONFIG.ROUTES.DASHBOARD);
                }
            }
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
