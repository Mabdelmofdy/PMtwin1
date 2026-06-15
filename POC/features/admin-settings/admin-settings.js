/**
 * Admin Settings - tabbed hub for all platform configuration.
 *
 * Tabs: general, branding, security, matching, workflow, exchange, collab,
 *       notifications, lookups, audit, flags, data, about.
 *
 * Persistence: most settings live under SYSTEM_SETTINGS storage key;
 * LOOKUPS_OVERRIDE and SKILL_CANONICAL_OVERRIDE keep their own keys for
 * compatibility with admin-skills and skill-service.
 */

const ADMIN_SETTINGS_TABS = [
    'general', 'branding', 'security', 'matching', 'workflow', 'exchange',
    'collab', 'notifications', 'lookups', 'audit', 'flags', 'data', 'about'
];

const ADMIN_SETTINGS_DEFAULTS = {
    general: {
        platformName: 'PMTwin',
        appDescription: 'Construction Collaboration Platform',
        defaultLocale: 'en-US',
        defaultTimezone: 'Asia/Riyadh',
        maintenanceMode: false,
        maintenanceMessage: ''
    },
    branding: {
        primaryColor: '#0369a1',
        primaryDark: '#075985',
        accentColor: '#38bdf8',
        bgSecondary: '#f8fafc',
        logoUrl: '',
        faviconUrl: '',
        loginBackground: ''
    },
    security: {
        sessionDurationMs: 24 * 60 * 60 * 1000,
        resetTokenTtlMinutes: 30,
        passwordMinLength: 8,
        maxFailedAttempts: 5,
        passwordRequireDigit: false,
        passwordRequireSymbol: false,
        passwordRequireUppercase: false,
        enforce2fa: false
    },
    matching: {
        minThreshold: 0.70,
        autoNotifyThreshold: 0.80,
        postToPostThreshold: 0.50,
        candidateMax: 200,
        weights: {
            SKILL_MATCH: 0.25,
            EXCHANGE_COMPATIBILITY: 0.20,
            VALUE_COMPATIBILITY: 0.20,
            BUDGET_FIT: 0.10,
            TIMELINE: 0.10,
            LOCATION: 0.10,
            REPUTATION: 0.05
        },
        valueRiskFactors: {
            cash: 1.0,
            equity: 0.6,
            profit_share: 0.5,
            service: 0.85,
            equipment: 0.9,
            resource: 0.85,
            knowledge: 0.7,
            barter: 0.75,
            hybrid: 0.8
        },
        valueCompatibilityMaxPoints: 15,
        labelThresholdMatch: 1,
        labelThresholdPartial: 0.25,
        debug: false
    },
    workflow: {
        negotiationMaxRounds: 10,
        negotiationExpireDays: 14,
        consortiumMinParticipants: 2,
        maxReplacementAttempts: 5,
        consortiumReplacementAllowedStages: ['negotiating', 'draft', 'review', 'signing', 'active', 'execution']
    },
    exchangeRules: {
        campaigns: [],
        tiers: [],
        custom: {}
    },
    collaborationModels: null,
    subscriptions: {
        defaultPlanId: '',
        trialDays: 14,
        autoRenew: true
    },
    notifications: {
        channels: { inApp: true, email: false, sms: false },
        events: { matches: true, deals: true, contracts: true, negotiations: true, system: true, marketing: false },
        digest: 'instant',
        digestHour: 9
    },
    validSectors: [
        'Construction', 'Infrastructure', 'Technology', 'Energy', 'Manufacturing',
        'Real Estate', 'Transportation', 'Architecture', 'Engineering',
        'Hospitality', 'Industrial', 'Agriculture', 'Education', 'Legal Services'
    ],
    audit: {
        maxEntries: 1000,
        retentionDays: 365
    },
    featureFlags: {
        socialLogin: false,
        matchingDebug: false,
        betaCanvas: false,
        experimentalScoring: false
    }
};

const FEATURE_FLAG_DEFINITIONS = [
    { key: 'socialLogin', title: 'Social login (Google / LinkedIn)', desc: 'Show OAuth buttons on the login screen. POC placeholder until backend is wired.' },
    { key: 'matchingDebug', title: 'Matching debug logging', desc: 'Verbose matcher diagnostics in the browser console.' },
    { key: 'betaCanvas', title: 'Beta canvas surfaces', desc: 'Enable experimental dashboard widgets.' },
    { key: 'experimentalScoring', title: 'Experimental scoring profile', desc: 'Use the alternate scoring weights profile.' }
];

const ALL_DEAL_STAGES = ['negotiating', 'draft', 'review', 'signing', 'active', 'execution', 'delivery', 'completed'];

const WEIGHT_LABELS = {
    SKILL_MATCH: 'Skill match',
    EXCHANGE_COMPATIBILITY: 'Exchange compatibility',
    VALUE_COMPATIBILITY: 'Value compatibility',
    BUDGET_FIT: 'Budget fit',
    TIMELINE: 'Timeline',
    LOCATION: 'Location',
    REPUTATION: 'Reputation'
};

const WEIGHTS_BALANCED_PRESET = {
    SKILL_MATCH: 0.25, EXCHANGE_COMPATIBILITY: 0.20, VALUE_COMPATIBILITY: 0.20,
    BUDGET_FIT: 0.10, TIMELINE: 0.10, LOCATION: 0.10, REPUTATION: 0.05
};

const WEIGHTS_DESIGN_PRESET = {
    SKILL_MATCH: 0.40, EXCHANGE_COMPATIBILITY: 0, VALUE_COMPATIBILITY: 0,
    BUDGET_FIT: 0.30, TIMELINE: 0.15, LOCATION: 0.10, REPUTATION: 0.05
};

let _settingsState = null;

async function initAdminSettings() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.settings.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    _settingsState = loadFullSettings();

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminSettings
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminSettings);
    }

    gateWriteButtons();
    initTabRouting();

    initGeneralPanel();
    initBrandingPanel();
    initSecurityPanel();
    initMatchingPanel();
    initWorkflowPanel();
    initExchangePanel();
    await initCollabPanel();
    initNotificationsPanel();
    await initLookupsPanel();
    await initAuditPanel();
    initFlagsPanel();
    await initDataPanel();
    initAboutPanel();

    initJsonActions();
    initLastSavedDisplay();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}

window.initAdminSettings = initAdminSettings;

// ============================================================================
// Storage helpers
// ============================================================================

function deepMerge(target, source) {
    if (source == null) return target;
    const out = Array.isArray(target) ? target.slice() : { ...(target || {}) };
    Object.keys(source).forEach(k => {
        const sv = source[k];
        if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
            out[k] = deepMerge(out[k] || {}, sv);
        } else {
            out[k] = sv;
        }
    });
    return out;
}

function loadFullSettings() {
    const persisted = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    return deepMerge(structuredClone(ADMIN_SETTINGS_DEFAULTS), persisted);
}

function persistSettings(patch) {
    const current = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    const merged = deepMerge(current, patch);
    merged.lastSavedAt = new Date().toISOString();
    storageService.set(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS, merged);
    _settingsState = deepMerge(_settingsState || {}, patch);
    _settingsState.lastSavedAt = merged.lastSavedAt;
    updateLastSavedDisplay();
    return merged;
}

function canWrite() {
    return !!(authService.hasAdminCapability && authService.hasAdminCapability('admin.settings.write'));
}

function gateWriteButtons() {
    const allowed = canWrite();
    document.querySelectorAll('[data-write-cap]').forEach(btn => {
        if (!allowed) {
            btn.disabled = true;
            btn.title = 'You do not have permission to change settings.';
        }
    });
}

async function assertWrite() {
    try {
        authService.assertAdminCapability('admin.settings.write');
        return true;
    } catch (err) {
        await notifyError(err && err.message ? err.message : 'You do not have permission.');
        return false;
    }
}

// ============================================================================
// Toast / modal helpers
// ============================================================================

async function notifySuccess(message, title = 'Saved') {
    if (window.modalService && typeof window.modalService.success === 'function') {
        await window.modalService.success(message, title);
    } else {
        alert(message);
    }
}

async function notifyError(message, title = 'Error') {
    if (window.modalService && typeof window.modalService.error === 'function') {
        await window.modalService.error(message, title);
    } else {
        alert(message);
    }
}

async function confirmAction(message, title = 'Confirm', confirmText = 'Confirm', type = 'warning') {
    if (window.modalService && typeof window.modalService.confirm === 'function') {
        return await window.modalService.confirm(message, title, { confirmText, type });
    }
    return window.confirm(message);
}

// ============================================================================
// Tab routing
// ============================================================================

function initTabRouting() {
    const navItems = document.querySelectorAll('.admin-settings-nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
            try {
                const u = new URL(window.location.href);
                u.searchParams.set('tab', tab);
                const logicalPath = window.router && typeof window.router.getCurrentPath === 'function' ? window.router.getCurrentPath() : '';
                window.history.replaceState({ path: logicalPath }, '', u.pathname + u.search);
            } catch (_) { /* ignore */ }
        });
    });

    const requested = getRequestedTab();
    if (requested && ADMIN_SETTINGS_TABS.includes(requested)) {
        switchTab(requested);
    } else {
        switchTab('general');
    }

    window.addEventListener('popstate', () => {
        const t = getRequestedTab();
        if (t && ADMIN_SETTINGS_TABS.includes(t)) switchTab(t);
    });
}

function getRequestedTab() {
    try {
        const params = new URLSearchParams(window.location.search || '');
        return params.get('tab');
    } catch (_) {
        return null;
    }
}

function switchTab(tab) {
    document.querySelectorAll('.admin-settings-nav-item').forEach(b => {
        const active = b.getAttribute('data-tab') === tab;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.admin-settings-panel').forEach(p => {
        const active = p.getAttribute('data-tab-panel') === tab;
        p.hidden = !active;
        p.classList.toggle('is-active', active);
    });
}

// ============================================================================
// Last saved
// ============================================================================

function initLastSavedDisplay() { updateLastSavedDisplay(); }
function updateLastSavedDisplay() {
    const el = document.getElementById('settings-last-saved');
    if (!el) return;
    const ts = _settingsState && _settingsState.lastSavedAt;
    if (!ts) {
        el.textContent = 'Settings have never been saved.';
        return;
    }
    try {
        el.textContent = `Last saved: ${new Date(ts).toLocaleString()}`;
    } catch (_) {
        el.textContent = `Last saved: ${ts}`;
    }
}

// ============================================================================
// GENERAL
// ============================================================================

function initGeneralPanel() {
    const s = _settingsState.general;
    setVal('platform-name', s.platformName);
    setVal('app-description', s.appDescription);
    setVal('default-locale', s.defaultLocale);
    setVal('default-timezone', s.defaultTimezone);
    setCheck('maintenance-mode', s.maintenanceMode);
    setVal('maintenance-message', s.maintenanceMessage);

    const form = document.getElementById('form-general');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const patch = {
            general: {
                platformName: (getVal('platform-name') || 'PMTwin').trim(),
                appDescription: (getVal('app-description') || '').trim(),
                defaultLocale: getVal('default-locale'),
                defaultTimezone: getVal('default-timezone'),
                maintenanceMode: getCheck('maintenance-mode'),
                maintenanceMessage: (getVal('maintenance-message') || '').trim()
            }
        };
        persistSettings(patch);
        CONFIG.APP_NAME = patch.general.platformName;
        CONFIG.APP_DESCRIPTION = patch.general.appDescription || CONFIG.APP_DESCRIPTION;
        if (window.layoutService && typeof window.layoutService.updateNavigation === 'function') {
            try { await window.layoutService.updateNavigation(); } catch (_) { /* ignore */ }
        }
        await notifySuccess('General settings saved.');
    });
}

// ============================================================================
// BRANDING
// ============================================================================

function initBrandingPanel() {
    const b = _settingsState.branding;
    const pairs = [
        ['branding-primary-color', 'branding-primary-color-hex', b.primaryColor],
        ['branding-primary-dark', 'branding-primary-dark-hex', b.primaryDark],
        ['branding-accent', 'branding-accent-hex', b.accentColor],
        ['branding-bg-secondary', 'branding-bg-secondary-hex', b.bgSecondary]
    ];
    pairs.forEach(([colorId, hexId, value]) => {
        const colorEl = document.getElementById(colorId);
        const hexEl = document.getElementById(hexId);
        if (colorEl) colorEl.value = value;
        if (hexEl) hexEl.value = value;
        if (colorEl && hexEl) {
            colorEl.addEventListener('input', () => { hexEl.value = colorEl.value; updateBrandingPreview(); });
            hexEl.addEventListener('input', () => {
                const v = hexEl.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    colorEl.value = v;
                    updateBrandingPreview();
                }
            });
        }
    });
    setVal('branding-logo-url', b.logoUrl);
    setVal('branding-favicon-url', b.faviconUrl);
    setVal('branding-login-bg', b.loginBackground);

    updateBrandingPreview();

    const resetBtn = document.getElementById('branding-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        const d = ADMIN_SETTINGS_DEFAULTS.branding;
        document.getElementById('branding-primary-color').value = d.primaryColor;
        document.getElementById('branding-primary-color-hex').value = d.primaryColor;
        document.getElementById('branding-primary-dark').value = d.primaryDark;
        document.getElementById('branding-primary-dark-hex').value = d.primaryDark;
        document.getElementById('branding-accent').value = d.accentColor;
        document.getElementById('branding-accent-hex').value = d.accentColor;
        document.getElementById('branding-bg-secondary').value = d.bgSecondary;
        document.getElementById('branding-bg-secondary-hex').value = d.bgSecondary;
        setVal('branding-logo-url', '');
        setVal('branding-favicon-url', '');
        setVal('branding-login-bg', '');
        updateBrandingPreview();
    });

    const form = document.getElementById('form-branding');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const patch = {
            branding: {
                primaryColor: getVal('branding-primary-color-hex') || '#0369a1',
                primaryDark: getVal('branding-primary-dark-hex') || '#075985',
                accentColor: getVal('branding-accent-hex') || '#38bdf8',
                bgSecondary: getVal('branding-bg-secondary-hex') || '#f8fafc',
                logoUrl: (getVal('branding-logo-url') || '').trim(),
                faviconUrl: (getVal('branding-favicon-url') || '').trim(),
                loginBackground: (getVal('branding-login-bg') || '').trim()
            }
        };
        persistSettings(patch);
        applyBrandingVars(patch.branding);
        await notifySuccess('Branding saved. Colors applied to this session.');
    });
}

function applyBrandingVars(branding) {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primaryColor) root.style.setProperty('--primary-color', branding.primaryColor);
    if (branding.primaryDark) root.style.setProperty('--primary-dark', branding.primaryDark);
    if (branding.bgSecondary) root.style.setProperty('--bg-secondary', branding.bgSecondary);
    if (branding.faviconUrl) {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = branding.faviconUrl;
    }
}

function updateBrandingPreview() {
    const primary = document.getElementById('branding-primary-color-hex')?.value;
    const dark = document.getElementById('branding-primary-dark-hex')?.value;
    const accent = document.getElementById('branding-accent-hex')?.value;
    const chip1 = document.getElementById('preview-primary');
    const chip2 = document.getElementById('preview-primary-dark');
    const chip3 = document.getElementById('preview-accent');
    if (chip1 && primary) chip1.style.background = primary;
    if (chip2 && dark) chip2.style.background = dark;
    if (chip3 && accent) chip3.style.background = accent;
}

// ============================================================================
// SECURITY
// ============================================================================

function initSecurityPanel() {
    const s = _settingsState.security;
    setVal('session-duration', Math.round((s.sessionDurationMs || (24 * 3600 * 1000)) / (3600 * 1000)));
    setVal('reset-token-ttl', s.resetTokenTtlMinutes);
    setVal('password-min-length', s.passwordMinLength);
    setVal('max-failed-attempts', s.maxFailedAttempts);
    setCheck('password-require-digit', s.passwordRequireDigit);
    setCheck('password-require-symbol', s.passwordRequireSymbol);
    setCheck('password-require-uppercase', s.passwordRequireUppercase);
    setCheck('enforce-2fa', s.enforce2fa);
    setCheck('social-login-enabled', _settingsState.featureFlags.socialLogin);

    renderCapabilityMatrix();

    const form = document.getElementById('form-security');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const hours = Math.max(1, parseInt(getVal('session-duration'), 10) || 24);
        const patch = {
            security: {
                sessionDurationMs: hours * 3600 * 1000,
                resetTokenTtlMinutes: parseInt(getVal('reset-token-ttl'), 10) || 30,
                passwordMinLength: parseInt(getVal('password-min-length'), 10) || 8,
                maxFailedAttempts: parseInt(getVal('max-failed-attempts'), 10) || 5,
                passwordRequireDigit: getCheck('password-require-digit'),
                passwordRequireSymbol: getCheck('password-require-symbol'),
                passwordRequireUppercase: getCheck('password-require-uppercase'),
                enforce2fa: getCheck('enforce-2fa')
            },
            featureFlags: {
                socialLogin: getCheck('social-login-enabled')
            }
        };
        if (typeof window.validateAdminSettings === 'function') {
            const check = window.validateAdminSettings(patch);
            if (!check.isValid) {
                await notifyError(check.errors[0] || 'Invalid security settings.');
                return;
            }
        }
        persistSettings(patch);
        CONFIG.SESSION_DURATION = patch.security.sessionDurationMs;
        CONFIG.AUTH = CONFIG.AUTH || {};
        CONFIG.AUTH.SOCIAL_LOGIN_ENABLED = patch.featureFlags.socialLogin;
        await notifySuccess('Security settings saved.');
    });
}

function renderCapabilityMatrix() {
    const container = document.getElementById('capability-matrix');
    if (!container) return;
    const caps = (authService && authService.ADMIN_CAPABILITIES) || {};
    const capList = Object.entries(caps);
    if (!capList.length) {
        container.innerHTML = '<p class="admin-settings-help">Capability matrix is not available.</p>';
        return;
    }

    const roleNames = ['admin', 'moderator', 'auditor'];
    const headerCells = ['<div class="cap-head">Capability</div>']
        .concat(roleNames.map(r => `<div class="cap-head">${r}</div>`));

    const rows = capList.map(([_, capability]) => {
        const cells = [`<div class="cap-name">${capability}</div>`];
        roleNames.forEach(role => {
            const allowed = (typeof window.hasAdminCapability === 'function')
                ? window.hasAdminCapability(role, capability)
                : false;
            cells.push(`<div class="cap-cell ${allowed ? 'has-cap' : ''}">${allowed ? '\u2713' : '\u2014'}</div>`);
        });
        return cells.join('');
    }).join('');

    container.innerHTML = headerCells.join('') + rows;
}

// ============================================================================
// MATCHING
// ============================================================================

function initMatchingPanel() {
    const m = _settingsState.matching;
    setVal('matching-threshold', Math.round((m.minThreshold ?? 0.7) * 100));
    setVal('auto-notify-threshold', Math.round((m.autoNotifyThreshold ?? 0.8) * 100));
    setVal('post-to-post-threshold', Math.round((m.postToPostThreshold ?? 0.5) * 100));
    setVal('candidate-max', m.candidateMax ?? 200);
    setVal('value-compat-max', m.valueCompatibilityMaxPoints ?? 15);
    setVal('label-threshold-match', m.labelThresholdMatch ?? 1);
    setVal('label-threshold-partial', m.labelThresholdPartial ?? 0.25);
    setCheck('matching-debug', m.debug);

    renderWeightsGrid(m.weights);
    renderValueRiskGrid(m.valueRiskFactors);

    document.getElementById('apply-balanced-preset')?.addEventListener('click', () => {
        renderWeightsGrid(WEIGHTS_BALANCED_PRESET);
    });
    document.getElementById('apply-design-preset')?.addEventListener('click', () => {
        renderWeightsGrid(WEIGHTS_DESIGN_PRESET);
    });

    const form = document.getElementById('form-matching');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const weights = readWeightsFromGrid();
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        if (Math.abs(total - 1) > 0.001) {
            await notifyError(`Score weights must total 100%. Current total: ${Math.round(total * 100)}%.`);
            return;
        }
        const valueRiskFactors = readValueRiskFromGrid();
        const patch = {
            matching: {
                minThreshold: parseFloat(getVal('matching-threshold')) / 100,
                autoNotifyThreshold: parseFloat(getVal('auto-notify-threshold')) / 100,
                postToPostThreshold: parseFloat(getVal('post-to-post-threshold')) / 100,
                candidateMax: parseInt(getVal('candidate-max'), 10) || 200,
                weights,
                valueRiskFactors,
                valueCompatibilityMaxPoints: parseInt(getVal('value-compat-max'), 10) || 15,
                labelThresholdMatch: parseFloat(getVal('label-threshold-match')) || 1,
                labelThresholdPartial: parseFloat(getVal('label-threshold-partial')) || 0.25,
                debug: getCheck('matching-debug')
            }
        };
        persistSettings(patch);
        applyMatchingToConfig(patch.matching);
        if (window.matchingService && typeof window.matchingService.refreshFromConfig === 'function') {
            try { window.matchingService.refreshFromConfig(); } catch (_) { /* ignore */ }
        }
        await notifySuccess('Matching settings saved.');
    });
}

function applyMatchingToConfig(m) {
    if (!CONFIG.MATCHING) CONFIG.MATCHING = {};
    CONFIG.MATCHING.MIN_THRESHOLD = m.minThreshold;
    CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD = m.autoNotifyThreshold;
    CONFIG.MATCHING.POST_TO_POST_THRESHOLD = m.postToPostThreshold;
    CONFIG.MATCHING.CANDIDATE_MAX = m.candidateMax;
    CONFIG.MATCHING.VALUE_COMPATIBILITY_MAX_POINTS = m.valueCompatibilityMaxPoints;
    CONFIG.MATCHING.LABEL_THRESHOLDS = { MATCH: m.labelThresholdMatch, PARTIAL: m.labelThresholdPartial };
    CONFIG.MATCHING.DEBUG = m.debug;
    CONFIG.MATCHING.WEIGHTS = Object.assign({}, CONFIG.MATCHING.WEIGHTS, m.weights, {
        ATTRIBUTE_OVERLAP: m.weights.SKILL_MATCH,
        BUDGET_FIT_LEGACY: m.weights.BUDGET_FIT
    });
    CONFIG.MATCHING.VALUE_RISK_FACTORS = Object.assign({}, CONFIG.MATCHING.VALUE_RISK_FACTORS, m.valueRiskFactors);
}

function renderWeightsGrid(weights) {
    const grid = document.getElementById('weights-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(WEIGHT_LABELS).forEach(key => {
        const value = weights[key] != null ? weights[key] : 0;
        const item = document.createElement('div');
        item.className = 'admin-settings-weight';
        item.innerHTML = `
            <div class="admin-settings-weight-head">
                <span>${WEIGHT_LABELS[key]}</span>
                <span class="admin-settings-weight-value" data-weight-display="${key}">${Math.round(value * 100)}%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value="${Math.round(value * 100)}" data-weight-key="${key}">
        `;
        grid.appendChild(item);
    });
    grid.querySelectorAll('input[data-weight-key]').forEach(input => {
        input.addEventListener('input', () => {
            const key = input.getAttribute('data-weight-key');
            const display = grid.querySelector(`[data-weight-display="${key}"]`);
            if (display) display.textContent = `${input.value}%`;
            updateWeightsTotal();
        });
    });
    updateWeightsTotal();
}

function readWeightsFromGrid() {
    const out = {};
    document.querySelectorAll('#weights-grid input[data-weight-key]').forEach(input => {
        const key = input.getAttribute('data-weight-key');
        out[key] = (parseInt(input.value, 10) || 0) / 100;
    });
    return out;
}

function updateWeightsTotal() {
    const totalEl = document.getElementById('weights-total');
    if (!totalEl) return;
    const w = readWeightsFromGrid();
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    const pct = Math.round(sum * 100);
    totalEl.textContent = `Total: ${pct}%`;
    let state = 'ok';
    if (pct !== 100) state = Math.abs(pct - 100) <= 5 ? 'warn' : 'bad';
    totalEl.setAttribute('data-state', state);
}

function renderValueRiskGrid(factors) {
    const grid = document.getElementById('value-risk-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(factors || {}).forEach(([key, val]) => {
        const item = document.createElement('div');
        item.className = 'admin-settings-risk-item';
        item.innerHTML = `
            <label>${key.replace(/_/g, ' ')}</label>
            <input type="number" min="0" max="1" step="0.05" value="${val}" data-risk-key="${key}">
        `;
        grid.appendChild(item);
    });
}

function readValueRiskFromGrid() {
    const out = {};
    document.querySelectorAll('#value-risk-grid input[data-risk-key]').forEach(input => {
        const key = input.getAttribute('data-risk-key');
        out[key] = parseFloat(input.value);
    });
    return out;
}

// ============================================================================
// WORKFLOW
// ============================================================================

function initWorkflowPanel() {
    const w = _settingsState.workflow;
    setVal('negotiation-max-rounds', w.negotiationMaxRounds);
    setVal('negotiation-expire-days', w.negotiationExpireDays);
    setVal('consortium-min-participants', w.consortiumMinParticipants);
    setVal('max-replacement-attempts', w.maxReplacementAttempts);
    renderStageChips(w.consortiumReplacementAllowedStages);
    renderWorkflowRules();

    const form = document.getElementById('form-workflow');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const stages = Array.from(document.querySelectorAll('#consortium-stages .admin-settings-chip.is-active'))
            .map(el => el.getAttribute('data-stage'));
        const patch = {
            workflow: {
                negotiationMaxRounds: parseInt(getVal('negotiation-max-rounds'), 10) || 10,
                negotiationExpireDays: parseInt(getVal('negotiation-expire-days'), 10) || 14,
                consortiumMinParticipants: parseInt(getVal('consortium-min-participants'), 10) || 2,
                maxReplacementAttempts: parseInt(getVal('max-replacement-attempts'), 10) || 5,
                consortiumReplacementAllowedStages: stages
            }
        };
        if (typeof window.validateAdminSettings === 'function') {
            const check = window.validateAdminSettings(patch);
            if (!check.isValid) {
                await notifyError(check.errors[0] || 'Invalid workflow settings.');
                return;
            }
        }
        persistSettings(patch);
        applyWorkflowToConfig(patch.workflow);
        await notifySuccess('Workflow settings saved.');
    });
}

function applyWorkflowToConfig(w) {
    if (!CONFIG.MATCHING) CONFIG.MATCHING = {};
    CONFIG.MATCHING.NEGOTIATION = Object.assign({}, CONFIG.MATCHING.NEGOTIATION, {
        MAX_ROUNDS: w.negotiationMaxRounds,
        EXPIRE_DAYS: w.negotiationExpireDays
    });
    CONFIG.MATCHING.CONSORTIUM_MIN_PARTICIPANTS = w.consortiumMinParticipants;
    CONFIG.MATCHING.MAX_REPLACEMENT_ATTEMPTS = w.maxReplacementAttempts;
    CONFIG.MATCHING.CONSORTIUM_REPLACEMENT_ALLOWED_STAGES = w.consortiumReplacementAllowedStages.slice();
}

function renderStageChips(active) {
    const container = document.getElementById('consortium-stages');
    if (!container) return;
    const set = new Set(active || []);
    container.innerHTML = ALL_DEAL_STAGES.map(stage => {
        const on = set.has(stage);
        return `<button type="button" class="admin-settings-chip is-toggle ${on ? 'is-active' : ''}" data-stage="${stage}">${stage}</button>`;
    }).join('');
    container.querySelectorAll('button.is-toggle').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('is-active'));
    });
}

function renderWorkflowRules() {
    const container = document.getElementById('workflow-rules');
    if (!container) return;
    const rules = {
        post_match: { pending: ['confirmed', 'declined', 'expired'] },
        deal: {
            negotiating: ['draft', 'cancelled'], draft: ['review', 'cancelled'],
            review: ['signing', 'draft', 'cancelled'], signing: ['active', 'cancelled'],
            active: ['execution', 'cancelled'], execution: ['delivery', 'cancelled'],
            delivery: ['completed', 'cancelled'], completed: ['closed']
        },
        contract: { pending: ['active', 'terminated'], active: ['completed', 'terminated'] },
        opportunity: {
            draft: ['published', 'cancelled'], published: ['in_negotiation', 'closed', 'cancelled'],
            in_negotiation: ['contracted'], contracted: ['in_execution'],
            in_execution: ['completed'], completed: ['closed']
        }
    };
    container.innerHTML = Object.entries(rules).map(([entity, map]) => `
        <div class="admin-settings-workflow-entity">
            <strong>${entity}</strong>
            <ul>${Object.entries(map).map(([from, tos]) => `<li>${from} &rarr; ${tos.join(', ') || '(terminal)'}</li>`).join('')}</ul>
        </div>
    `).join('');
}

// ============================================================================
// EXCHANGE RULES
// ============================================================================

function initExchangePanel() {
    const er = _settingsState.exchangeRules || { campaigns: [], tiers: [], custom: {} };
    const campaignsList = Array.isArray(er.campaigns)
        ? er.campaigns.slice()
        : Object.keys(er.campaigns || {});
    const tiersList = Array.isArray(er.tiers)
        ? er.tiers.slice()
        : Object.keys(er.tiers || {});

    renderTagInput('exchange-campaigns-tags', 'exchange-campaigns-input', campaignsList, 'campaign-tag');
    renderTagInput('exchange-tiers-tags', 'exchange-tiers-input', tiersList, 'tier-tag');

    const customEl = document.getElementById('exchange-custom-json');
    if (customEl) {
        try {
            customEl.value = JSON.stringify(er.custom || {}, null, 2);
        } catch (_) {
            customEl.value = '{}';
        }
    }

    renderExchangeDefaults();

    const form = document.getElementById('form-exchange');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const campaigns = getTags('exchange-campaigns-tags');
        const tiers = getTags('exchange-tiers-tags');
        let custom = {};
        try {
            const txt = (customEl && customEl.value || '').trim();
            custom = txt ? JSON.parse(txt) : {};
        } catch (err) {
            await notifyError(`Custom rules JSON is invalid: ${err.message}`);
            return;
        }
        persistSettings({
            exchangeRules: { campaigns, tiers, custom }
        });
        await notifySuccess('Exchange rules saved. New conversions use the updated overrides.');
    });
}

function renderExchangeDefaults() {
    const container = document.getElementById('exchange-defaults');
    if (!container) return;
    const ER = window.ExchangeRules;
    const defaults = ER && ER.DEFAULT_RULES ? ER.DEFAULT_RULES : {};
    container.innerHTML = Object.keys(defaults).map(key => {
        const rule = defaults[key];
        return `<div class="admin-settings-defaults-item">
            <strong>${rule.name || key}</strong>
            <span>${rule.fromAsset} &rarr; ${rule.toAsset}</span>
        </div>`;
    }).join('') || '<p class="admin-settings-help">Default rules not loaded.</p>';
}

// ============================================================================
// COLLABORATION MODELS
// ============================================================================

async function initCollabPanel() {
    const list = document.getElementById('collab-models-list');
    if (!list) return;

    const modelsConfig = (window.CONFIG && window.CONFIG.MODELS) || {};
    const saved = _settingsState.collaborationModels || {};

    const modelKeys = Object.values(modelsConfig);
    list.innerHTML = modelKeys.map((key, idx) => {
        const cfg = saved[key] || {};
        const enabled = cfg.enabled !== false;
        const label = cfg.label || prettify(key);
        const order = cfg.order != null ? cfg.order : idx + 1;
        return `
            <div class="admin-settings-collab-row" data-model="${key}">
                <label class="toggle-only">
                    <span class="admin-settings-switch">
                        <input type="checkbox" data-collab-enabled ${enabled ? 'checked' : ''}>
                        <span class="admin-settings-switch-slider"></span>
                    </span>
                </label>
                <input type="text" class="form-input" data-collab-label value="${escapeAttr(label)}" placeholder="${prettify(key)}">
                <code style="font-size:0.75rem;color:var(--text-muted);">${key}</code>
                <input type="number" class="form-input" data-collab-order value="${order}" min="1" max="99">
            </div>
        `;
    }).join('');

    renderEligibilityList();

    const form = document.getElementById('form-collab');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const result = {};
        list.querySelectorAll('.admin-settings-collab-row').forEach(row => {
            const key = row.getAttribute('data-model');
            result[key] = {
                enabled: row.querySelector('[data-collab-enabled]').checked,
                label: row.querySelector('[data-collab-label]').value.trim() || prettify(key),
                order: parseInt(row.querySelector('[data-collab-order]').value, 10) || 0
            };
        });
        persistSettings({ collaborationModels: result });
        await notifySuccess('Collaboration models saved.');
    });
}

function renderEligibilityList() {
    const container = document.getElementById('eligibility-list');
    if (!container) return;
    const rules = (window.CONFIG && window.CONFIG.MODEL_ELIGIBILITY) || {};
    const items = Object.entries(rules);
    if (!items.length) {
        container.innerHTML = '<p class="admin-settings-help">No eligibility restrictions defined.</p>';
        return;
    }
    container.innerHTML = items.map(([key, rule]) => `
        <div class="admin-settings-defaults-item">
            <strong>${prettify(key)}</strong>
            <span>Allowed: ${(rule.allowedEntityTypes || []).join(', ')}</span>
        </div>
    `).join('');
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function initNotificationsPanel() {
    const n = _settingsState.notifications;
    setCheck('channel-inapp', n.channels.inApp);
    setCheck('channel-email', n.channels.email);
    setCheck('channel-sms', n.channels.sms);
    setCheck('event-matches', n.events.matches);
    setCheck('event-deals', n.events.deals);
    setCheck('event-contracts', n.events.contracts);
    setCheck('event-negotiations', n.events.negotiations !== false);
    setCheck('event-system', n.events.system);
    setCheck('event-marketing', n.events.marketing);
    setVal('digest-frequency', n.digest);
    setVal('digest-hour', n.digestHour);

    const form = document.getElementById('form-notifications');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        persistSettings({
            notifications: {
                channels: {
                    inApp: getCheck('channel-inapp'),
                    email: getCheck('channel-email'),
                    sms: getCheck('channel-sms')
                },
                events: {
                    matches: getCheck('event-matches'),
                    deals: getCheck('event-deals'),
                    contracts: getCheck('event-contracts'),
                    negotiations: getCheck('event-negotiations'),
                    system: getCheck('event-system'),
                    marketing: getCheck('event-marketing')
                },
                digest: getVal('digest-frequency'),
                digestHour: Math.min(23, Math.max(0, parseInt(getVal('digest-hour'), 10) || 0))
            }
        });
        await notifySuccess('Notification settings saved.');
    });
}

// ============================================================================
// LOOKUPS & TAXONOMY
// ============================================================================

async function initLookupsPanel() {
    const lookupsEl = document.getElementById('lookups-override-json');
    const canonicalEl = document.getElementById('skill-canonical-json');

    const lookupsOverride = storageService.get(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE);
    const canonicalOverride = storageService.get(CONFIG.STORAGE_KEYS.SKILL_CANONICAL_OVERRIDE);

    if (lookupsEl) {
        lookupsEl.value = lookupsOverride ? safeStringify(lookupsOverride) : '';
        lookupsEl.placeholder = 'No override active. Click "Load default" to start from data/lookups.json.';
    }
    if (canonicalEl) {
        canonicalEl.value = canonicalOverride ? safeStringify(canonicalOverride) : '';
        canonicalEl.placeholder = 'No override active. Click "Load default" to start from data/skill-canonical.json.';
    }

    document.getElementById('lookups-load-default')?.addEventListener('click', async () => {
        const data = await fetchDataJson('lookups.json');
        if (data && lookupsEl) lookupsEl.value = safeStringify(data);
    });
    document.getElementById('canonical-load-default')?.addEventListener('click', async () => {
        const data = await fetchDataJson('skill-canonical.json');
        if (data && canonicalEl) canonicalEl.value = safeStringify(data);
    });

    document.getElementById('lookups-clear')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        if (!(await confirmAction('Remove the lookups override and revert to defaults?', 'Clear override', 'Clear', 'warning'))) return;
        storageService.remove(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE);
        if (lookupsEl) lookupsEl.value = '';
        await notifySuccess('Lookups override cleared.');
    });
    document.getElementById('canonical-clear')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        if (!(await confirmAction('Remove the skill canonical override and revert to defaults?', 'Clear override', 'Clear', 'warning'))) return;
        storageService.remove(CONFIG.STORAGE_KEYS.SKILL_CANONICAL_OVERRIDE);
        if (canonicalEl) canonicalEl.value = '';
        await notifySuccess('Skill canonical override cleared.');
    });

    document.getElementById('lookups-save')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        const txt = (lookupsEl && lookupsEl.value || '').trim();
        if (!txt) {
            storageService.remove(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE);
            await notifySuccess('Lookups override cleared (empty).');
            return;
        }
        try {
            const parsed = JSON.parse(txt);
            storageService.set(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE, parsed);
            await notifySuccess('Lookups override saved.');
        } catch (err) {
            await notifyError(`Invalid JSON: ${err.message}`);
        }
    });
    document.getElementById('canonical-save')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        const txt = (canonicalEl && canonicalEl.value || '').trim();
        if (!txt) {
            storageService.remove(CONFIG.STORAGE_KEYS.SKILL_CANONICAL_OVERRIDE);
            await notifySuccess('Canonical override cleared (empty).');
            return;
        }
        try {
            const parsed = JSON.parse(txt);
            storageService.set(CONFIG.STORAGE_KEYS.SKILL_CANONICAL_OVERRIDE, parsed);
            await notifySuccess('Skill canonical override saved.');
        } catch (err) {
            await notifyError(`Invalid JSON: ${err.message}`);
        }
    });

    renderTagInput('valid-sectors-tags', 'valid-sectors-input',
        _settingsState.validSectors.slice(), 'sector-tag');
    document.getElementById('form-sectors')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const sectors = getTags('valid-sectors-tags');
        persistSettings({ validSectors: sectors });
        await notifySuccess('Valid sectors saved.');
    });
}

async function fetchDataJson(name) {
    try {
        const base = (window.CONFIG && window.CONFIG.BASE_PATH) || '/';
        const url = `${base}data/${name}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        await notifyError(`Could not load default ${name}: ${err.message}`);
        return null;
    }
}

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

async function initAuditPanel() {
    const a = _settingsState.audit;
    setVal('audit-max-entries', a.maxEntries);
    setVal('audit-retention-days', a.retentionDays);

    const logs = storageService.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
    const oldest = logs[0];
    const newest = logs[logs.length - 1];
    setText('audit-current-count', logs.length);
    setText('audit-oldest', oldest ? formatTs(oldest.timestamp) : '-');
    setText('audit-newest', newest ? formatTs(newest.timestamp) : '-');

    document.getElementById('form-audit')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const patch = {
            audit: {
                maxEntries: parseInt(getVal('audit-max-entries'), 10) || 1000,
                retentionDays: parseInt(getVal('audit-retention-days'), 10) || 365
            }
        };
        persistSettings(patch);
        CONFIG.AUDIT_MAX_ENTRIES = patch.audit.maxEntries;
        await notifySuccess('Audit settings saved.');
    });

    document.getElementById('audit-export')?.addEventListener('click', () => {
        downloadJson('pmtwin-audit-log.json', logs);
    });
    document.getElementById('audit-clear')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        if (!(await confirmAction('Permanently clear the entire audit log? This cannot be undone.', 'Clear audit log', 'Clear log', 'error'))) return;
        storageService.set(CONFIG.STORAGE_KEYS.AUDIT, []);
        setText('audit-current-count', '0');
        setText('audit-oldest', '-');
        setText('audit-newest', '-');
        await notifySuccess('Audit log cleared.');
    });
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

function initFlagsPanel() {
    const list = document.getElementById('feature-flags-list');
    if (!list) return;
    const flags = _settingsState.featureFlags;
    list.innerHTML = FEATURE_FLAG_DEFINITIONS.map(def => {
        const on = !!flags[def.key];
        return `
            <div class="admin-settings-flag-row">
                <div class="admin-settings-flag-info">
                    <strong>${def.title}</strong>
                    <span>${def.desc}</span>
                </div>
                <label class="admin-settings-switch">
                    <input type="checkbox" data-flag-key="${def.key}" ${on ? 'checked' : ''}>
                    <span class="admin-settings-switch-slider"></span>
                </label>
            </div>
        `;
    }).join('');

    document.getElementById('form-flags')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!(await assertWrite())) return;
        const next = {};
        list.querySelectorAll('input[data-flag-key]').forEach(input => {
            next[input.getAttribute('data-flag-key')] = input.checked;
        });
        persistSettings({ featureFlags: next });
        applyFlagsToConfig(next);
        await notifySuccess('Feature flags saved.');
        const securitySocial = document.getElementById('social-login-enabled');
        if (securitySocial) securitySocial.checked = !!next.socialLogin;
    });
}

function applyFlagsToConfig(flags) {
    CONFIG.AUTH = CONFIG.AUTH || {};
    CONFIG.AUTH.SOCIAL_LOGIN_ENABLED = !!flags.socialLogin;
    if (CONFIG.MATCHING) CONFIG.MATCHING.DEBUG = !!flags.matchingDebug;
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

async function initDataPanel() {
    await refreshDataPanel();

    document.getElementById('data-export')?.addEventListener('click', () => {
        const payload = {};
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('pmtwin_')) {
                try { payload[k] = JSON.parse(localStorage.getItem(k)); }
                catch (_) { payload[k] = localStorage.getItem(k); }
            }
        });
        downloadJson(`pmtwin-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
    });

    document.getElementById('data-import')?.addEventListener('change', async e => {
        if (!(await assertWrite())) { e.target.value = ''; return; }
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const confirmed = await confirmAction(
            `Importing will overwrite the matching keys in localStorage. Continue with "${file.name}"?`,
            'Import data', 'Import', 'warning'
        );
        if (!confirmed) { e.target.value = ''; return; }
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(k => {
                    if (k.startsWith('pmtwin_')) {
                        try {
                            localStorage.setItem(k, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]));
                        } catch (_) { /* ignore */ }
                    }
                });
                await notifySuccess('Data imported. The page will reload to apply changes.');
                window.location.reload();
            } else {
                await notifyError('Import file did not contain a JSON object.');
            }
        } catch (err) {
            await notifyError(`Import failed: ${err.message}`);
        } finally {
            e.target.value = '';
        }
    });

    document.getElementById('data-reset')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        if (!(await confirmAction(
            'This will erase all platform data and reseed from the bundled JSON files. This cannot be undone.',
            'Reset to seed', 'Reset', 'error'
        ))) return;
        if (typeof dataService.reseedFromJSON === 'function') {
            try { await dataService.reseedFromJSON(); } catch (err) { console.error(err); }
        }
        try { sessionStorage.clear(); } catch (_) { /* ignore */ }
        window.location.reload();
    });

    document.getElementById('data-clear-settings')?.addEventListener('click', async () => {
        if (!(await assertWrite())) return;
        if (!(await confirmAction(
            'Reset every settings tab to its default values? Plan, lookup, and skill overrides are preserved.',
            'Reset settings', 'Reset', 'warning'
        ))) return;
        storageService.set(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS, {});
        await notifySuccess('Settings reset. Reloading...');
        window.location.reload();
    });
}

async function refreshDataPanel() {
    let users = [], companies = [], opps = [], deals = [], contracts = [];
    try { users = await dataService.getUsers(); } catch (_) {}
    try { companies = await dataService.getCompanies(); } catch (_) {}
    try { opps = await dataService.getOpportunities(); } catch (_) {}
    try { deals = await dataService.getDeals(); } catch (_) {}
    try { contracts = await dataService.getContracts(); } catch (_) {}
    const notifs = storageService.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];

    setText('data-users-count', users.length);
    setText('data-companies-count', companies.length);
    setText('data-opps-count', opps.length);
    setText('data-deals-count', deals.length);
    setText('data-contracts-count', contracts.length);
    setText('data-notifs-count', notifs.length);

    const ESTIMATED_QUOTA = 5 * 1024 * 1024;
    let totalBytes = 0;
    const perKey = [];
    Object.keys(localStorage).forEach(k => {
        if (!k.startsWith('pmtwin_')) return;
        const val = localStorage.getItem(k) || '';
        const bytes = new Blob([val]).size;
        totalBytes += bytes;
        let count = '';
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) count = `${parsed.length} items`;
        } catch (_) { /* not JSON */ }
        perKey.push({ key: k, bytes, count });
    });
    perKey.sort((a, b) => b.bytes - a.bytes);

    const pct = Math.min(100, Math.round((totalBytes / ESTIMATED_QUOTA) * 100));
    const fill = document.getElementById('storage-bar-fill');
    if (fill) fill.style.width = `${pct}%`;
    setText('storage-usage-line', `${formatBytes(totalBytes)} used (~${pct}% of ~5 MB browser quota), ${perKey.length} keys.`);

    const table = document.getElementById('storage-keys-table');
    if (table) {
        const header = '<div class="head">Key</div><div class="head num">Items</div><div class="head num">Size</div>';
        const rows = perKey.map(r => `
            <div>${r.key}</div>
            <div class="num">${r.count || '-'}</div>
            <div class="num">${formatBytes(r.bytes)}</div>
        `).join('');
        table.innerHTML = header + rows;
    }

    if (window.seedStorageIndicator) {
        void window.seedStorageIndicator.renderCompareStrip('#seed-canonical-compare-mount');
    }
}

// ============================================================================
// ABOUT
// ============================================================================

function initAboutPanel() {
    setText('about-app-name', CONFIG.APP_NAME);
    setText('about-app-version', CONFIG.APP_VERSION);
    setText('about-base-path', CONFIG.BASE_PATH || '/');
    setText('about-api-base', (CONFIG.API && CONFIG.API.BASE_URL) || '-');
    setText('about-last-saved', _settingsState.lastSavedAt ? formatTs(_settingsState.lastSavedAt) : 'Never');
    const u = authService.currentUser;
    setText('about-current-admin', u ? `${u.email || u.id} (${u.role})` : '-');
}

// ============================================================================
// JSON action buttons (validate / format)
// ============================================================================

function initJsonActions() {
    document.querySelectorAll('[data-json-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const target = document.getElementById(btn.getAttribute('data-json-target'));
            if (!target) return;
            const action = btn.getAttribute('data-json-action');
            const txt = (target.value || '').trim();
            if (!txt) {
                await notifyError('No JSON to process.');
                return;
            }
            try {
                const parsed = JSON.parse(txt);
                if (action === 'format') {
                    target.value = JSON.stringify(parsed, null, 2);
                } else {
                    await notifySuccess('JSON is valid.', 'Validation');
                }
            } catch (err) {
                await notifyError(`Invalid JSON: ${err.message}`);
            }
        });
    });
}

// ============================================================================
// Tag input helpers
// ============================================================================

function renderTagInput(tagsContainerId, inputId, initialTags, _name) {
    const container = document.getElementById(tagsContainerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;

    const tags = Array.isArray(initialTags) ? initialTags.slice() : [];
    function render() {
        container.innerHTML = tags.map((tag, i) => `
            <span class="admin-settings-chip">${escapeHtml(String(tag))}<button type="button" aria-label="Remove" data-tag-remove="${i}">&times;</button></span>
        `).join('');
        container.dataset.tags = JSON.stringify(tags);
        container.querySelectorAll('[data-tag-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-tag-remove'), 10);
                tags.splice(idx, 1);
                render();
            });
        });
    }
    render();

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const v = input.value.trim().replace(/,$/, '');
            if (v && !tags.includes(v)) {
                tags.push(v);
                render();
            }
            input.value = '';
        } else if (e.key === 'Backspace' && !input.value && tags.length) {
            tags.pop();
            render();
        }
    });
}

function getTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    try {
        return JSON.parse(container.dataset.tags || '[]');
    } catch (_) {
        return Array.from(container.querySelectorAll('.admin-settings-chip'))
            .map(el => el.firstChild ? el.firstChild.textContent.trim() : '')
            .filter(Boolean);
    }
}

// ============================================================================
// Utilities
// ============================================================================

function setVal(id, v) {
    const el = document.getElementById(id);
    if (el != null && v != null) el.value = v;
}
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}
function setCheck(id, v) {
    const el = document.getElementById(id);
    if (el) el.checked = !!v;
}
function getCheck(id) {
    const el = document.getElementById(id);
    return !!(el && el.checked);
}
function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
}

function safeStringify(v) {
    try { return JSON.stringify(v, null, 2); } catch (_) { return ''; }
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
}

function prettify(key) {
    return String(key || '').split(/[_\s]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function formatTs(iso) {
    try { return new Date(iso).toLocaleString(); } catch (_) { return iso; }
}

function formatBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadJson(filename, payload) {
    try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
        console.error('downloadJson:', err);
    }
}
