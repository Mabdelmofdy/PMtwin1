/**
 * Admin Skills & Categories – view and edit skills and categories (stored in lookups override).
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

function renderSkillsList(container, skills, onRemove) {
    if (!container) return;
    container.innerHTML = skills.map(s => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-sm">
            ${escapeHtml(s)}
            <button type="button" class="admin-skill-remove text-red-600 hover:text-red-800 ml-1" data-skill="${escapeHtml(s)}" title="Remove">&times;</button>
        </span>
    `).join('');
    container.querySelectorAll('.admin-skill-remove').forEach(btn => {
        btn.addEventListener('click', () => onRemove(btn.getAttribute('data-skill')));
    });
}

function renderCategoriesList(container, categories, onRemove) {
    if (!container) return;
    container.innerHTML = categories.map(c => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-sm">
            ${escapeHtml(c)}
            <button type="button" class="admin-category-remove text-red-600 hover:text-red-800 ml-1" data-category="${escapeHtml(c)}" title="Remove">&times;</button>
        </span>
    `).join('');
    container.querySelectorAll('.admin-category-remove').forEach(btn => {
        btn.addEventListener('click', () => onRemove(btn.getAttribute('data-category')));
    });
}

async function initAdminSkills() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.skills.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    const user = authService.getCurrentUser();

    const loadingEl = document.getElementById('admin-skills-loading');
    const contentEl = document.getElementById('admin-skills-content');
    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';

    let lookups = await loadLookups();
    let skills = Array.isArray(lookups.skills) ? [...lookups.skills] : [];
    let categories = Array.isArray(lookups.skillCategories) ? [...lookups.skillCategories] : [];

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    const skillsListEl = document.getElementById('admin-skills-list');
    const categoriesListEl = document.getElementById('admin-categories-list');

    function removeSkill(skill) {
        skills = skills.filter(s => s !== skill);
        renderSkillsList(skillsListEl, skills, removeSkill);
    }

    function removeCategory(cat) {
        categories = categories.filter(c => c !== cat);
        renderCategoriesList(categoriesListEl, categories, removeCategory);
    }

    renderSkillsList(skillsListEl, skills, removeSkill);
    renderCategoriesList(categoriesListEl, categories, removeCategory);

    document.getElementById('admin-skill-add')?.addEventListener('click', () => {
        const input = document.getElementById('admin-skill-new');
        const val = input?.value?.trim();
        if (!val) return;
        if (skills.includes(val)) return;
        skills.push(val);
        skills.sort();
        renderSkillsList(skillsListEl, skills, removeSkill);
        if (input) input.value = '';
    });

    document.getElementById('admin-category-add')?.addEventListener('click', () => {
        const input = document.getElementById('admin-category-new');
        const val = input?.value?.trim();
        if (!val) return;
        if (categories.includes(val)) return;
        categories.push(val);
        categories.sort();
        renderCategoriesList(categoriesListEl, categories, removeCategory);
        if (input) input.value = '';
    });

    document.getElementById('admin-skills-save')?.addEventListener('click', () => {
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
        alert('Skills and categories saved. The platform will use this list until you reset.');
    });

    document.getElementById('admin-skills-reset')?.addEventListener('click', () => {
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
        initAdminSkills();
    });
}
