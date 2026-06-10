/**
 * Admin Site Content – edit public page CMS sections (localStorage overrides).
 */

let siteContentEditorPageId = null;

async function initAdminSiteContent() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.settings.write')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminSiteContent
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminSiteContent);
    }

    if (!window.siteContentService) {
        const mount = document.getElementById('site-content-sections');
        if (mount) mount.innerHTML = '<p class="text-danger">Site content service is not loaded.</p>';
        return;
    }

    const select = document.getElementById('site-content-page-select');
    const pageIds = siteContentService.listPageIds().filter(id => id !== 'global');
    if (select) {
        select.innerHTML = pageIds.map(id => `<option value="${escapeSiteContentHtml(id)}">${escapeSiteContentHtml(id)}</option>`).join('');
        select.addEventListener('change', () => {
            siteContentEditorPageId = select.value;
            void renderSiteContentEditor(siteContentEditorPageId);
        });
    }

    document.getElementById('site-content-save')?.addEventListener('click', () => void saveSiteContentPage());
    document.getElementById('site-content-reset-page')?.addEventListener('click', () => void resetSiteContentPage());
    document.getElementById('site-content-reset-all')?.addEventListener('click', () => void resetAllSiteContent());

    siteContentEditorPageId = pageIds[0] || null;
    if (siteContentEditorPageId) await renderSiteContentEditor(siteContentEditorPageId);
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}

async function renderSiteContentEditor(pageId) {
    const container = document.getElementById('site-content-sections');
    const lastSavedEl = document.getElementById('site-content-last-saved');
    if (!container || !pageId) return;

    const page = await siteContentService.getPage(pageId);
    if (!page || !page.sections) {
        container.innerHTML = '<p class="text-muted">No sections for this page.</p>';
        return;
    }

    const sectionIds = Object.keys(page.sections);
    container.innerHTML = sectionIds.map(sectionId => {
        const sec = page.sections[sectionId];
        const label = sec.label || sectionId;
        const html = sec.html || '';
        return `<div class="admin-site-content-section" data-section-id="${escapeSiteContentHtml(sectionId)}">
            <label for="site-content-${escapeSiteContentHtml(sectionId)}">${escapeSiteContentHtml(label)} <span class="text-muted">(${escapeSiteContentHtml(sectionId)})</span></label>
            <textarea id="site-content-${escapeSiteContentHtml(sectionId)}" class="form-input" rows="10">${escapeSiteContentHtml(html)}</textarea>
        </div>`;
    }).join('');

    const lastSaved = siteContentService.getPageLastSaved(pageId);
    if (lastSavedEl) {
        lastSavedEl.textContent = lastSaved
            ? `Last saved (override): ${new Date(lastSaved).toLocaleString()}`
            : 'Using seed content (no override for this page)';
    }
}

async function saveSiteContentPage() {
    if (!siteContentEditorPageId) return;
    const container = document.getElementById('site-content-sections');
    if (!container) return;

    const sections = {};
    container.querySelectorAll('.admin-site-content-section').forEach(block => {
        const sectionId = block.getAttribute('data-section-id');
        const ta = block.querySelector('textarea');
        if (!sectionId || !ta) return;
        sections[sectionId] = {
            html: ta.value,
            label: block.querySelector('label')?.textContent?.split('(')[0]?.trim() || sectionId
        };
    });

    try {
        await siteContentService.savePageSections(siteContentEditorPageId, sections, {
            lastSaved: new Date().toISOString()
        });
        if (window.modalService?.success) {
            await modalService.success('Site content saved for this device.', 'Saved');
        }
        await renderSiteContentEditor(siteContentEditorPageId);
    } catch (e) {
        console.error('Save site content:', e);
        if (window.modalService?.error) await modalService.error((e && e.message) || 'Save failed.', 'Error');
    }
}

async function resetSiteContentPage() {
    if (!siteContentEditorPageId) return;
    if (!confirm('Reset overrides for this page and reload seed content?')) return;
    await siteContentService.resetPage(siteContentEditorPageId);
    await renderSiteContentEditor(siteContentEditorPageId);
}

async function resetAllSiteContent() {
    if (!confirm('Reset all site content overrides on this device?')) return;
    await siteContentService.resetAll();
    await renderSiteContentEditor(siteContentEditorPageId);
}

function escapeSiteContentHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
