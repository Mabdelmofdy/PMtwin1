/**
 * Router Service
 * Handles client-side routing for MPA
 */

class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.params = {};
        /**
         * Hash routing works on Live Server (no SPA fallback). History API is enabled when
         * index.html includes <meta name="pmtwin-spa-server"> (injected by `npm run start`).
         */
        this.useHash = typeof document === 'undefined'
            || !document.querySelector('meta[name="pmtwin-spa-server"]');
    }

    getBasePathPrefix() {
        const raw = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH != null) ? String(CONFIG.BASE_PATH) : '/';
        if (raw === '/' || raw === '') return '';
        return raw.replace(/\/$/, '');
    }

    /**
     * Full pathname for the browser (includes CONFIG.BASE_PATH), plus optional query (must start with ? if non-empty).
     */
    buildHistoryUrl(normalizedPath, query) {
        const prefix = this.getBasePathPrefix();
        const p = normalizedPath === '/' ? '/' : (normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
        const pathPart = prefix ? (p === '/' ? prefix + '/' : prefix + p) : p;
        const q = query && query.startsWith('?') ? query : (query ? '?' + query : '');
        return pathPart + q;
    }
    
    /**
     * Normalize path - extract from hash or pathname
     */
    normalizePath(path) {
        // If path contains a hash, extract it
        if (path.includes('#')) {
            path = path.split('#')[1] || '';
        }
        // Remove leading hash if present
        if (path.startsWith('#')) {
            path = path.substring(1);
        }
        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        // Remove trailing slash except for root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        // Strip query string for route matching
        if (path.includes('?')) {
            path = path.split('?')[0];
        }
        // Live Server / explicit index: /index.html or /POC/index.html → logical /
        if (/^\/index\.html$/i.test(path)) {
            path = '/';
        }
        return path || '/';
    }

    /**
     * Split a hash fragment into path (for matching) and query string (including leading `?`).
     * @param {string} path — raw hash after `#` or any path string
     * @returns {{ normalizedPath: string, query: string }}
     */
    parseHashPathAndQuery(path) {
        let p = path || '';
        if (p.startsWith('#')) {
            p = p.substring(1);
        }

        // App route anchor: /matches/abc#negotiation → /matches/abc?section=negotiation
        let anchorSection = '';
        if (p.includes('#')) {
            const hashIdx = p.indexOf('#');
            const beforeHash = p.substring(0, hashIdx);
            const afterHash = p.substring(hashIdx + 1);
            const looksLikeRouteAnchor = beforeHash.startsWith('/')
                && afterHash
                && !afterHash.startsWith('/')
                && !afterHash.includes('?');
            if (looksLikeRouteAnchor) {
                p = beforeHash;
                anchorSection = afterHash;
            } else {
                p = afterHash || beforeHash;
            }
        }

        let query = '';
        if (p.includes('?')) {
            const qIdx = p.indexOf('?');
            query = p.substring(qIdx);
            p = p.substring(0, qIdx);
        }

        if (anchorSection) {
            query = this._appendQueryParam(query, 'section', anchorSection);
        }

        if (!p.startsWith('/')) {
            p = '/' + p;
        }
        if (p.length > 1 && p.endsWith('/')) {
            p = p.substring(0, p.length - 1);
        }
        const normalizedPath = p || '/';
        return { normalizedPath, query };
    }

    _appendQueryParam(query, key, value) {
        const params = new URLSearchParams(query.startsWith('?') ? query.substring(1) : (query || ''));
        params.set(key, value);
        const serialized = params.toString();
        return serialized ? '?' + serialized : '';
    }

    /** Named section from hash query (`?section=negotiation`), or empty string. */
    getHashSection() {
        const q = this.getHashQueryString();
        if (!q) return '';
        const params = new URLSearchParams(q.startsWith('?') ? q.substring(1) : q);
        return params.get('section') || '';
    }

    /** Query portion of current URL (`?a=1`), or empty string. */
    getHashQueryString() {
        if (this.useHash) {
            const h = window.location.hash.substring(1);
            const i = h.indexOf('?');
            return i >= 0 ? h.substring(i) : '';
        }
        return window.location.search || '';
    }
    
    /**
     * Register a route
     */
    register(path, handler) {
        this.routes.push({ path, handler });
    }
    
    /**
     * Navigate to a route
     */
    async navigate(path) {
        const { normalizedPath, query } = this.parseHashPathAndQuery(path);
        
        // Update URL using hash
        if (this.useHash) {
            const newHash = normalizedPath === '/' && !query ? '' : normalizedPath + query;
            const currentHash = window.location.hash.substring(1); // Remove leading #
            
            // Only update hash if it's different
            if (currentHash !== newHash) {
                // Setting hash will trigger hashchange event, which will call handleRoute
                window.location.hash = newHash;
                // handleRoute will be called by hashchange event
                return true;
            } else {
                // Hash is already set to this path, just handle the route
                return this.handleRoute(normalizedPath);
            }
        } else {
            const target = this.buildHistoryUrl(normalizedPath, query);
            const current = window.location.pathname + (window.location.search || '');
            if (current !== target) {
                window.history.pushState({ path: normalizedPath }, '', target);
            }
            return this.handleRoute(normalizedPath);
        }
    }
    
    /**
     * Find matching route
     */
    findRoute(path) {
        for (const route of this.routes) {
            const params = this.matchRoute(route.path, path);
            if (params !== null) {
                return { ...route, params };
            }
        }
        return null;
    }
    
    /**
     * Match route pattern with path
     */
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/').filter(p => p);
        const pathParts = path.split('/').filter(p => p);
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                // Parameter
                const paramName = patternPart.slice(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                // Static part doesn't match
                return null;
            }
        }
        
        this.params = params;
        return params;
    }
    
    /**
     * Get current path
     */
    getCurrentPath() {
        if (this.useHash) {
            const hash = window.location.hash;
            return this.normalizePath(hash || '/');
        }
        let pathname = window.location.pathname;
        const prefix = this.getBasePathPrefix();
        if (prefix && pathname.startsWith(prefix + '/')) {
            pathname = pathname.slice(prefix.length);
        } else if (prefix && pathname === prefix) {
            pathname = '/';
        }
        return this.normalizePath(pathname || '/');
    }
    
    /**
     * Initialize router
     */
    init() {
        if (this.useHash) {
            // Handle hash changes (browser back/forward and direct navigation)
            window.addEventListener('hashchange', () => {
                const path = this.getCurrentPath();
                this.handleRoute(path);
            });
            
            // Handle initial load
            const initialPath = this.getCurrentPath();
            // If no hash is set, set it to empty (which represents '/')
            if (!window.location.hash || window.location.hash === '#') {
                window.location.hash = '';
            }
            // Handle the route (this will work even if hash is empty)
            this.handleRoute(initialPath);
        } else {
            const h = window.location.hash;
            if (h && h.length > 1 && h !== '#') {
                const inner = h.replace(/^#/, '');
                const { normalizedPath, query } = this.parseHashPathAndQuery(inner);
                const newUrl = this.buildHistoryUrl(normalizedPath, query);
                window.history.replaceState({ path: normalizedPath }, '', newUrl);
            }
            window.addEventListener('popstate', (e) => {
                const path = e.state && e.state.path != null ? e.state.path : this.getCurrentPath();
                this.handleRoute(path);
            });
            const initialPath = this.getCurrentPath();
            this.handleRoute(initialPath);
        }
    }
    
    /**
     * Handle route without changing URL (for hash-based routing)
     */
    async handleRoute(path) {
        const normalizedPath = this.normalizePath(path);
        
        // Find matching route
        const route = this.findRoute(normalizedPath);
        if (!route) {
            console.error(`Route not found: ${normalizedPath}`);
            // Fallback to home route
            if (normalizedPath !== '/') {
                return this.navigate('/');
            }
            return false;
        }
        
        this.currentRoute = route;

        // Execute route handler (skip if already handling this path to avoid duplicate load storms)
        const routeKey = normalizedPath + this.getHashQueryString() + JSON.stringify(route.params || {});
        if (this._handlingRouteKey === routeKey) {
            return true;
        }
        this._handlingRouteKey = routeKey;
        try {
            if (route.handler) {
                await route.handler(route.params);
            }
            const currentUser = window.authService && typeof window.authService.getCurrentUser === 'function'
                ? window.authService.getCurrentUser()
                : null;
            if (currentUser && window.dataService && typeof window.dataService.markNotificationsReadForRoute === 'function') {
                await window.dataService.markNotificationsReadForRoute(currentUser.id, normalizedPath);
            }
            if (window.layoutService && typeof window.layoutService.updateNavigation === 'function') {
                await window.layoutService.updateNavigation();
            }
            return true;
        } finally {
            this._handlingRouteKey = null;
        }
    }
}

// Create singleton instance
const router = new Router();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = router;
} else {
    window.router = router;
}
