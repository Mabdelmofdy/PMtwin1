/**
 * Login Page Component
 */

/** Build demo credentials list from data service so display names match profile.name (real names). */
async function getDemoCredentials() {
    const rows = [
        { type: 'Admin', email: 'admin@pmtwin.com', password: 'admin123' }
    ];
    const dataService = window.dataService || (typeof dataService !== 'undefined' ? dataService : null);
    if (dataService && typeof dataService.getUsers === 'function' && typeof dataService.getCompanies === 'function') {
        try {
            const [users, companies] = await Promise.all([dataService.getUsers(), dataService.getCompanies()]);
            const demoPassword = 'demo123';
            const pending = (users || []).filter((u) => (u.email || '').startsWith('pending'));
            const demoUsers = (users || []).filter((u) => (u.email || '').match(/^demo\d+@demo\.test$/));
            const demoCompanies = (companies || []).filter((c) => (c.email || '').match(/^company\d+@demo\.test$/));
            pending.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            demoCompanies.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            demoUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            pending.forEach((u) => rows.push({ type: (u.profile && u.profile.name) || u.email, email: u.email, password: demoPassword }));
            demoCompanies.forEach((c) => rows.push({ type: (c.profile && c.profile.name) || c.email, email: c.email, password: demoPassword }));
            demoUsers.forEach((u) => rows.push({ type: (u.profile && u.profile.name) || u.email, email: u.email, password: demoPassword }));
        } catch (_) {
            rows.push(...getDemoCredentialsFallback());
        }
    } else {
        rows.push(...getDemoCredentialsFallback());
    }
    return rows;
}

/** Fallback when data service not available: use static list with generic labels. */
function getDemoCredentialsFallback() {
    return [
        { type: 'Pending (vetting)', email: 'pending01@demo.test', password: 'demo123' },
        { type: 'Pending (clarification)', email: 'pending02@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company01@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company02@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company03@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company04@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company05@demo.test', password: 'demo123' },
        { type: 'Company', email: 'company06@demo.test', password: 'demo123' }
    ].concat(
        Array.from({ length: 35 }, (_, i) => ({
            type: 'User',
            email: `demo${String(i + 1).padStart(2, '0')}@demo.test`,
            password: 'demo123'
        }))
    );
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
        
        // Hide previous errors
        errorDiv.style.display = 'none';
        
        try {
            const result = await authService.login(email, password, { rememberMe });
            
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
            const tableRows = credentials.map(
                (row) => `<tr class="cursor-pointer hover:bg-blue-50 border-b border-gray-100" data-email="${escapeHtml(row.email)}" data-password="${escapeHtml(row.password)}" title="Click to use this account"><td class="py-2 px-3">${escapeHtml(row.type)}</td><td class="py-2 px-3">${escapeHtml(row.email)}</td><td class="py-2 px-3">${escapeHtml(row.password)}</td></tr>`
            ).join('');
            const contentHTML = `
                <p class="text-sm text-gray-600 mb-2">Click a row to fill the login form with that account.</p>
                <div class="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="py-2 px-3 font-semibold text-gray-900">Name</th>
                                <th class="py-2 px-3 font-semibold text-gray-900">Email</th>
                                <th class="py-2 px-3 font-semibold text-gray-900">Password</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            `;
            if (window.modalService && typeof window.modalService.showCustom === 'function') {
                modalService.showCustom(contentHTML, 'Demo user credentials');
            } else {
                alert(credentials.map((r) => `${r.type}: ${r.email} / ${r.password}`).join('\n'));
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

    document.body.addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-email]');
        if (!row) return;
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer || modalContainer.style.display === 'none') return;
        const email = row.getAttribute('data-email');
        const password = row.getAttribute('data-password');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (email && password && emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            if (window.modalService) modalService.close();
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
