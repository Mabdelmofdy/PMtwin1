/**
 * Admin Collaboration Models Management
 * Toggle enabled/disabled, set display label and order for CONFIG.MODELS; stored in SYSTEM_SETTINGS.
 */

function escapeHtml(s) {
    if (s == null || s === '') return '';
    const t = String(s);
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getDefaultModelName(configKey) {
    const models = window.OPPORTUNITY_MODELS || {};
    const slug = CONFIG.MODELS && CONFIG.MODELS[configKey] != null ? CONFIG.MODELS[configKey] : configKey;
    return (models[slug] && models[slug].name) || String(slug).replace(/_/g, ' ');
}

function getOverrides() {
    const settings = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    return settings.collaborationModels || {};
}

function getLastSavedIso() {
    const settings = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    return settings.collaborationModelsLastSaved || null;
}

function saveOverrides(overrides) {
    const settings = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    settings.collaborationModels = overrides;
    settings.collaborationModelsLastSaved = new Date().toISOString();
    storageService.set(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS, settings);
}

function formatSavedLabel(iso) {
    if (!iso) return 'Not yet';
    try {
        const d = new Date(iso);
        return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return 'Not yet';
    }
}

function updateMetaStrip(modelKeys, overrides) {
    const totalEl = document.getElementById('cm-meta-total');
    const enabledEl = document.getElementById('cm-meta-enabled');
    const savedEl = document.getElementById('cm-meta-saved');
    if (totalEl) totalEl.textContent = String(modelKeys.length);
    let enabled = 0;
    modelKeys.forEach((key, index) => {
        const o = overrides[key] || {};
        const defEnabled = o.enabled !== false;
        if (defEnabled) enabled++;
    });
    if (enabledEl) enabledEl.textContent = String(enabled);
    if (savedEl) savedEl.textContent = formatSavedLabel(getLastSavedIso());
}

function setSaveStatus(message, state) {
    const el = document.getElementById('cm-save-status');
    const wrap = document.querySelector('.admin-collaboration-models-page .cm-save-state');
    if (el) el.textContent = message;
    if (wrap) {
        wrap.classList.toggle('is-saved', state === 'saved');
        wrap.classList.toggle('is-dirty', state === 'dirty');
    }
}

function bindModelsListChangeHandlers() {
    const container = document.getElementById('models-list');
    if (!container || container.dataset.cmBound === '1') return;
    container.dataset.cmBound = '1';
    container.addEventListener('change', () => {
        setSaveStatus('Unsaved changes', 'dirty');
        const modelKeys = Object.keys(CONFIG.MODELS || {});
        updateMetaStrip(modelKeys, readOverridesFromDom());
    });
    container.addEventListener('input', () => {
        setSaveStatus('Unsaved changes', 'dirty');
    });
}

function readOverridesFromDom() {
    const container = document.getElementById('models-list');
    const out = {};
    if (!container) return out;
    container.querySelectorAll('.cm-model-card').forEach(row => {
        const key = row.dataset.key;
        if (!key) return;
        const enabledEl = row.querySelector('[data-field="enabled"]');
        const labelEl = row.querySelector('[data-field="label"]');
        const orderEl = row.querySelector('[data-field="order"]');
        const enabled = enabledEl ? enabledEl.checked : true;
        const label = labelEl ? labelEl.value.trim() : '';
        const order = orderEl ? parseInt(orderEl.value, 10) : 1;
        const defaultName = getDefaultModelName(key);
        out[key] = {
            enabled,
            label: label || defaultName,
            order: isNaN(order) ? 1 : order
        };
    });
    return out;
}

async function initAdminCollaborationModels() {
    if (!authService.hasRole(CONFIG.ROLES.ADMIN)) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    renderModelsList();
    bindModelsListChangeHandlers();
    const saveBtn = document.getElementById('save-models-btn');
    if (saveBtn) saveBtn.onclick = saveModels;
}

function renderModelsList() {
    const container = document.getElementById('models-list');
    if (!container) return;

    const overrides = getOverrides();
    const modelKeys = Object.keys(CONFIG.MODELS || {});

    if (modelKeys.length === 0) {
        container.innerHTML = '<p class="section-desc" style="margin:0">No collaboration models defined in config.</p>';
        updateMetaStrip([], {});
        return;
    }

    updateMetaStrip(modelKeys, overrides);
    setSaveStatus('Edits are local until you save', 'idle');

    container.innerHTML = modelKeys.map((key, index) => {
        const o = overrides[key] || {};
        const enabled = o.enabled !== false;
        const label = o.label !== undefined ? o.label : getDefaultModelName(key);
        const order = o.order !== undefined ? o.order : index + 1;
        const slug = CONFIG.MODELS[key] != null ? CONFIG.MODELS[key] : key;
        return ''
            + '<div class="cm-model-card" data-key="' + escapeHtml(key) + '" role="listitem">'
            + '<div class="cm-model-card-head">'
            + '<span class="cm-model-key-badge">' + escapeHtml(key) + '</span>'
            + '<label class="cm-toggle">'
            + '<input type="checkbox" data-field="enabled"' + (enabled ? ' checked' : '') + '>'
            + '<span>Enabled</span>'
            + '</label>'
            + '</div>'
            + '<div class="cm-model-id">' + escapeHtml(slug) + '</div>'
            + '<div class="cm-model-card-body">'
            + '<div class="cm-field">'
            + '<label for="cm-label-' + escapeHtml(key) + '">Display label</label>'
            + '<input type="text" id="cm-label-' + escapeHtml(key) + '" class="form-input" data-field="label" value="' + escapeHtml(label) + '" placeholder="' + escapeHtml(getDefaultModelName(key)) + '">'
            + '</div>'
            + '<div class="cm-field">'
            + '<label for="cm-order-' + escapeHtml(key) + '">Sort order</label>'
            + '<input type="number" id="cm-order-' + escapeHtml(key) + '" class="form-input" data-field="order" min="1" value="' + escapeHtml(String(order)) + '">'
            + '</div>'
            + '</div>'
            + '</div>';
    }).join('');
}

function saveModels() {
    const container = document.getElementById('models-list');
    if (!container) return;

    const overrides = readOverridesFromDom();

    saveOverrides(overrides);

    const admin = authService.getCurrentUser();
    if (admin && dataService.createAuditLog) {
        dataService.createAuditLog({
            userId: admin.id,
            action: 'collaboration_models_updated',
            entityType: 'system',
            entityId: 'settings',
            details: { keys: Object.keys(overrides) }
        });
    }

    const modelKeys = Object.keys(CONFIG.MODELS || {});
    updateMetaStrip(modelKeys, overrides);
    setSaveStatus('All changes saved', 'saved');
}
