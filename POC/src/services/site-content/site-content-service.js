/**
 * Site content CMS – seed JSON + localStorage override for public/landing pages.
 */
const siteContentService = {
    _seedCache: null,
    _mergedCache: null,

    _basePath() {
        return (window.CONFIG && window.CONFIG.BASE_PATH) || '';
    },

    _overrideKey() {
        return CONFIG.STORAGE_KEYS.SITE_CONTENT_OVERRIDE;
    },

    async loadSeed() {
        if (this._seedCache) return this._seedCache;
        const res = await fetch(this._basePath() + 'data/site-content.json');
        if (!res.ok) throw new Error('Failed to load site-content.json');
        this._seedCache = await res.json();
        return this._seedCache;
    },

    getOverride() {
        const storage = window.storageService;
        if (!storage) return null;
        const raw = storage.get(this._overrideKey());
        return raw && typeof raw === 'object' ? raw : null;
    },

    setOverride(override) {
        const storage = window.storageService;
        if (!storage) return;
        if (override == null) {
            storage.remove(this._overrideKey());
        } else {
            storage.set(this._overrideKey(), override);
        }
        this._mergedCache = null;
    },

    async loadBundle(forceRefresh) {
        if (this._mergedCache && !forceRefresh) return this._mergedCache;
        const seed = await this.loadSeed();
        const override = this.getOverride() || {};
        const merged = JSON.parse(JSON.stringify(seed));
        Object.keys(override).forEach(pageId => {
            if (!merged[pageId]) merged[pageId] = override[pageId];
            else if (override[pageId].sections) {
                merged[pageId].sections = merged[pageId].sections || {};
                Object.assign(merged[pageId].sections, override[pageId].sections);
            }
        });
        this._mergedCache = merged;
        return merged;
    },

    async getPage(pageId) {
        const bundle = await this.loadBundle();
        return bundle[pageId] || null;
    },

    async getSection(pageId, sectionId) {
        const page = await this.getPage(pageId);
        if (!page || !page.sections) return null;
        return page.sections[sectionId] || null;
    },

    async getSectionHtml(pageId, sectionId) {
        const sec = await this.getSection(pageId, sectionId);
        return sec && sec.html ? sec.html : '';
    },

    _resolveGlobalPlaceholders(html) {
        if (!html) return '';
        const year = new Date().getFullYear();
        const appName = (window.CONFIG && window.CONFIG.APP_NAME) || 'PMTwin';
        return String(html)
            .replace(/\{\{year\}\}/g, String(year))
            .replace(/\{\{appName\}\}/g, appName);
    },

    async applyPage(pageId, root) {
        const page = await this.getPage(pageId);
        if (!page || !page.sections) return;
        const container = root || document.getElementById('main-content');
        if (!container) return;
        Object.keys(page.sections).forEach(sectionId => {
            const mount = container.querySelector(`[data-site-section="${sectionId}"]`);
            if (!mount) return;
            let html = page.sections[sectionId].html || '';
            if (pageId === 'global') html = this._resolveGlobalPlaceholders(html);
            mount.innerHTML = html;
        });
    },

    async applyGlobalNav(navMenuEl) {
        const html = await this.getSectionHtml('global', 'public-nav');
        if (!html || !navMenuEl) return false;
        const ul = navMenuEl.querySelector('.public-nav-list') || navMenuEl;
        ul.innerHTML = html;
        return true;
    },

    async applyGlobalFooter(footerRootEl) {
        const html = await this.getSectionHtml('global', 'footer');
        if (!html || !footerRootEl) return false;
        const mount = footerRootEl.querySelector('[data-site-section="footer"]')
            || footerRootEl.querySelector('.max-w-container')
            || footerRootEl;
        mount.innerHTML = this._resolveGlobalPlaceholders(html);
        return true;
    },

    async savePageSections(pageId, sections, meta) {
        const override = this.getOverride() || {};
        if (!override[pageId]) override[pageId] = { sections: {} };
        if (!override[pageId].sections) override[pageId].sections = {};
        Object.keys(sections).forEach(id => {
            override[pageId].sections[id] = {
                ...(override[pageId].sections[id] || {}),
                html: sections[id].html,
                label: sections[id].label
            };
        });
        override[pageId].lastSaved = meta?.lastSaved || new Date().toISOString();
        this.setOverride(override);
        this._mergedCache = null;
        if (window.dataService && typeof dataService.createAuditLog === 'function') {
            await dataService.createAuditLog({
                action: 'site_content.update',
                entityType: 'site_content',
                entityId: pageId,
                details: { sections: Object.keys(sections) }
            });
        }
        return override[pageId];
    },

    async resetPage(pageId) {
        const override = this.getOverride() || {};
        delete override[pageId];
        if (Object.keys(override).length === 0) {
            this.setOverride(null);
        } else {
            this.setOverride(override);
        }
        this._mergedCache = null;
    },

    async resetAll() {
        this.setOverride(null);
        this._mergedCache = null;
    },

    getPageLastSaved(pageId) {
        const override = this.getOverride();
        return override?.[pageId]?.lastSaved || null;
    },

    listPageIds() {
        return [
            'home', 'find', 'workflow', 'knowledge-base', 'collaboration-models',
            'collaboration-wizard', 'login', 'register', 'forgot-password', 'reset-password', 'global'
        ];
    }
};

window.siteContentService = siteContentService;
