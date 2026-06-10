/**
 * Admin Skills & Categories – view and edit skills and categories (stored in lookups override).
 * Layout aligned with Admin Matching / Health Center (hero, control panel, panels, workflow cards).
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadLookups() {
    const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
    const overrideKey = CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE;
    if (storage && overrideKey) {
        const override = storage.get(overrideKey);
        if (override && typeof override === 'object') return override;
    }
    const basePath = (window.CONFIG && window.CONFIG.BASE_PATH) || '';
    const res = await fetch(basePath + 'data/lookups.json');
    return res.ok ? await res.json() : { skills: [], skillCategories: [] };
}

function hasLookupsOverrideInStorage() {
    const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
    const overrideKey = CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE;
    if (!storage || !overrideKey) return false;
    const override = storage.get(overrideKey);
    return !!(override && typeof override === 'object');
}

function updateSkillsMeta(skills, categories, storedOverrideActive) {
    const catalogStatus = document.getElementById('skills-catalog-status');
    const metaStored = document.getElementById('skills-meta-stored');
    const metaSkills = document.getElementById('skills-meta-skill-count');
    const metaCats = document.getElementById('skills-meta-cat-count');
    const n = skills.length;
    const m = categories.length;
    if (catalogStatus) catalogStatus.textContent = n + ' skills · ' + m + ' categories';
    if (metaStored) metaStored.textContent = storedOverrideActive ? 'Custom override' : 'Default bundle';
    if (metaSkills) metaSkills.textContent = String(n);
    if (metaCats) metaCats.textContent = String(m);
}

function renderSkillsList(container, skills, onRemove) {
    if (!container) return;
    container.innerHTML = skills.map(s => ''
        + '<span class="skills-chip">'
        + escapeHtml(s)
        + '<button type="button" class="skills-chip-remove admin-skill-remove" data-skill="' + escapeHtml(s) + '" title="Remove" aria-label="Remove ' + escapeHtml(s) + '">&times;</button>'
        + '</span>'
    ).join('');
    container.querySelectorAll('.admin-skill-remove').forEach(btn => {
        btn.addEventListener('click', () => onRemove(btn.getAttribute('data-skill')));
    });
}

function renderCategoriesList(container, categories, onRemove) {
    if (!container) return;
    container.innerHTML = categories.map(c => ''
        + '<span class="skills-chip">'
        + escapeHtml(c)
        + '<button type="button" class="skills-chip-remove admin-category-remove" data-category="' + escapeHtml(c) + '" title="Remove" aria-label="Remove ' + escapeHtml(c) + '">&times;</button>'
        + '</span>'
    ).join('');
    container.querySelectorAll('.admin-category-remove').forEach(btn => {
        btn.addEventListener('click', () => onRemove(btn.getAttribute('data-category')));
    });
}

async function initAdminSkills() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.skills.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminSkills
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminSkills);
    }

    const loadingEl = document.getElementById('admin-skills-loading');
    const contentEl = document.getElementById('admin-skills-content');
    if (loadingEl) loadingEl.hidden = false;
    if (contentEl) contentEl.hidden = true;

    const hadSavedOverride = hasLookupsOverrideInStorage();
    let storedOverrideActive = hadSavedOverride;

    let lookups = await loadLookups();
    let skills = Array.isArray(lookups.skills) ? [...lookups.skills] : [];
    let categories = Array.isArray(lookups.skillCategories) ? [...lookups.skillCategories] : [];

    if (loadingEl) loadingEl.hidden = true;
    if (contentEl) contentEl.hidden = false;

    const skillsListEl = document.getElementById('admin-skills-list');
    const categoriesListEl = document.getElementById('admin-categories-list');

    function syncMeta() {
        updateSkillsMeta(skills, categories, storedOverrideActive);
    }

    function removeSkill(skill) {
        skills = skills.filter(s => s !== skill);
        renderSkillsList(skillsListEl, skills, removeSkill);
        syncMeta();
    }

    function removeCategory(cat) {
        categories = categories.filter(c => c !== cat);
        renderCategoriesList(categoriesListEl, categories, removeCategory);
        syncMeta();
    }

    renderSkillsList(skillsListEl, skills, removeSkill);
    renderCategoriesList(categoriesListEl, categories, removeCategory);
    syncMeta();

    function doSave() {
        try { authService.assertAdminCapability('admin.skills.write'); } catch (err) { alert(err && err.message ? err.message : 'You do not have permission.'); return; }
        const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
        if (!storage || !CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE) {
            alert('Storage not available.');
            return;
        }
        const override = { ...lookups, skills, skillCategories: categories };
        storage.set(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE, override);
        if (window.skillService && typeof window.skillService._data === 'object') {
            window.skillService._data = null;
            window.skillService._loading = null;
        }
        if (window.profileLookups !== undefined) window.profileLookups = null;
        storedOverrideActive = true;
        syncMeta();
        alert('Skills and categories saved. The platform will use this list until you reset.');
    }

    const skillAddBtn = document.getElementById('admin-skill-add');
    if (skillAddBtn) {
        skillAddBtn.onclick = () => {
            const input = document.getElementById('admin-skill-new');
            const val = input?.value?.trim();
            if (!val) return;
            if (skills.includes(val)) return;
            skills.push(val);
            skills.sort();
            renderSkillsList(skillsListEl, skills, removeSkill);
            if (input) input.value = '';
            syncMeta();
        };
    }

    const catAddBtn = document.getElementById('admin-category-add');
    if (catAddBtn) {
        catAddBtn.onclick = () => {
            const input = document.getElementById('admin-category-new');
            const val = input?.value?.trim();
            if (!val) return;
            if (categories.includes(val)) return;
            categories.push(val);
            categories.sort();
            renderCategoriesList(categoriesListEl, categories, removeCategory);
            if (input) input.value = '';
            syncMeta();
        };
    }

    const saveTop = document.getElementById('admin-skills-save');
    const saveFooter = document.getElementById('admin-skills-save-footer');
    if (saveTop) saveTop.onclick = () => doSave();
    if (saveFooter) saveFooter.onclick = () => doSave();

    const resetBtn = document.getElementById('admin-skills-reset');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (!confirm('Clear the override and use the default lookups from the server again?')) return;
            const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
            if (storage && CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE) {
                storage.remove(CONFIG.STORAGE_KEYS.LOOKUPS_OVERRIDE);
            }
            if (window.skillService && typeof window.skillService._data === 'object') {
                window.skillService._data = null;
                window.skillService._loading = null;
            }
            if (window.profileLookups !== undefined) window.profileLookups = null;
            void initAdminSkills();
        };
    }

    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}
