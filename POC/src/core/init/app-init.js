/**
 * Application Initialization
 * Bootstraps the application
 */

/**
 * Detect base path from document location
 * This is the single source of truth for base path
 * Works whether app is served from root or subdirectory
 */
function detectBasePath() {
    // Method 1: Use document.baseURI (most reliable)
    try {
        const baseURI = new URL(document.baseURI);
        let basePath = baseURI.pathname;
        
        // Remove index.html if present
        if (basePath.endsWith('index.html')) {
            basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        }
        // Ensure ends with /
        if (!basePath.endsWith('/')) {
            basePath += '/';
        }
        return basePath;
    } catch (e) {
        console.warn('Could not parse document.baseURI', e);
    }
    
    // Method 2: Fallback to window.location.pathname
    let pathname = window.location.pathname;
    
    // Remove hash and query
    pathname = pathname.split('?')[0].split('#')[0];
    
    // Remove index.html if present
    if (pathname.endsWith('index.html')) {
        pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    }
    
    // Ensure ends with /
    if (!pathname.endsWith('/')) {
        pathname += '/';
    }
    
    return pathname;
}

// Detect base path immediately
const APP_BASE_PATH = detectBasePath();
console.log('PMTwin App base path:', APP_BASE_PATH);

/**
 * Load script dynamically with base path.
 * Uses cache-busting query param (?v=APP_VERSION) so updated scripts are fetched after deploys.
 */
function loadScript(relativeSrc) {
    const fullSrc = APP_BASE_PATH + relativeSrc;
    const bustSrc = fullSrc + '?v=' + (window.CONFIG?.APP_VERSION || Date.now());

    return new Promise((resolve, reject) => {
        // Check if this script (by base path) is already loaded to avoid duplicates
        const existing = document.querySelectorAll('script[src]');
        const alreadyLoaded = Array.from(existing).some(s => {
            const src = s.getAttribute('src') || '';
            return src === fullSrc || src === relativeSrc || src.startsWith(fullSrc + '?') || src.startsWith(relativeSrc + '?');
        });
        if (alreadyLoaded) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = bustSrc;
        script.onload = resolve;
        script.onerror = () => {
            document.head.removeChild(script);
            reject(new Error(`Failed to load script: ${fullSrc}`));
        };
        document.head.appendChild(script);
    });
}

// Load configuration first
loadScript('src/core/config/config.js').then(async () => {
    // Ensure CONFIG has the correct BASE_PATH
    if (window.CONFIG) {
        window.CONFIG.BASE_PATH = APP_BASE_PATH;
    }
    
    // Load core services
    await loadScript('src/core/storage/storage-service.js');
    await loadScript('src/core/data/data-service.js');
    await loadScript('src/core/auth/auth-service.js');
    await loadScript('src/core/router/router.js');
    await loadScript('src/core/router/auth-guard.js');
    await loadScript('src/core/layout/layout-service.js');
    await loadScript('src/core/api/api-service.js');
    
    // Load utilities
    await loadScript('src/utils/icon-helper.js');
    await loadScript('src/utils/template-loader.js');
    await loadScript('src/utils/template-renderer.js');
    await loadScript('src/utils/modal.js');
    await loadScript('src/utils/badge-helpers.js');
    await loadScript('src/utils/decimal-helper.js');
    await loadScript('src/utils/profile-completion.js');
    
    // Load business logic
    await loadScript('src/business-logic/models/opportunity-models.js');
    await loadScript('src/business-logic/exchange/exchange-rules.js');
    await loadScript('src/business-logic/exchange/equivalence-calculator.js');
    
    // Load skill service (shared by profiles, opportunities, and matching)
    await loadScript('src/services/skill-service.js');

    // Load value-exchange (normalizer first so preprocessor and estimator can use it)
    await loadScript('src/services/value-exchange/value-normalizer.js');
    // Load services (matching pipeline: preprocessor, semantic profile, then matching)
    await loadScript('src/services/matching/post-preprocessor.js');
    await loadScript('src/services/matching/semantic-profile.js');
    await loadScript('src/services/matching/candidate-generator.js');
    await loadScript('src/services/matching/post-to-post-scoring.js');
    await loadScript('src/services/matching/matching-models.js');
    await loadScript('src/services/matching/matching-service.js');
    await loadScript('src/services/opportunities/opportunity-service.js');
    await loadScript('src/services/value-exchange/value-estimator.js');
    await loadScript('src/services/value-exchange/value-compatibility.js');
    await loadScript('src/services/map/map-service.js');
    
    // Initialize application
    await initializeApp();
}).catch(error => {
    console.error('Failed to load configuration:', error);
});

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        // Initialize storage with seed data
        await initializeStorage();
        // Normalize existing opportunities for post-to-post matching (non-blocking)
        if (window.opportunityService && typeof window.opportunityService.normalizeAllOpportunities === 'function') {
            window.opportunityService.normalizeAllOpportunities().catch(e => console.warn('Normalize opportunities:', e));
        }

        // Initialize layout
        await layoutService.init();
        
        // Check authentication
        await authService.checkAuth();
        
        // Initialize router
        initializeRoutes();
        router.init();
        
        // Add global click handler for navigation links
        setupGlobalNavigation();
        
        console.log('PMTwin application initialized');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

/**
 * Initialize storage with default data
 */
async function initializeStorage() {
    const defaultData = {
        [CONFIG.STORAGE_KEYS.USERS]: [],
        [CONFIG.STORAGE_KEYS.COMPANIES]: [],
        [CONFIG.STORAGE_KEYS.SESSIONS]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [],
        [CONFIG.STORAGE_KEYS.APPLICATIONS]: [],
        [CONFIG.STORAGE_KEYS.MATCHES]: [],
        [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
        [CONFIG.STORAGE_KEYS.AUDIT]: [],
        [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
        [CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS]: {}
    };
    
    storageService.initialize(defaultData);
    
    // Initialize data from JSON seed files
    await dataService.initializeFromJSON();
    
    // Create default admin user if no admin exists
    const users = await dataService.getUsers();
    const hasAdmin = users.some(u => u.role === CONFIG.ROLES.ADMIN && u.status === 'active');
    if (!hasAdmin) {
        await createDefaultAdmin();
    }
}

/**
 * Reset all data and re-seed from JSON files
 * Can be called from browser console: window.resetAppData()
 */
async function resetAppData() {
    if (confirm('This will reset all data to default. Continue?')) {
        await dataService.reseedFromJSON();
        // Clear session
        sessionStorage.clear();
        // Reload page
        window.location.reload();
    }
}

// Expose reset function globally for debugging
window.resetAppData = resetAppData;

/**
 * Debug utility - shows app configuration
 * Can be called from browser console: window.appDebug()
 */
function appDebug() {
    console.log('=== PMTwin Debug Info ===');
    console.log('Base Path:', CONFIG.BASE_PATH);
    console.log('App Version:', CONFIG.APP_VERSION);
    console.log('Current Route:', router.getCurrentPath());
    console.log('Authenticated:', !!authService.currentUser);
    console.log('User:', authService.currentUser?.email || 'Not logged in');
    console.log('Storage Keys:', Object.keys(CONFIG.STORAGE_KEYS));
    console.log('========================');
    return {
        basePath: CONFIG.BASE_PATH,
        route: router.getCurrentPath(),
        user: authService.currentUser?.email
    };
}
window.appDebug = appDebug;

/**
 * Create default admin user
 */
async function createDefaultAdmin() {
    const adminUser = await authService.register({
        email: 'admin@pmtwin.com',
        password: 'admin123',
        role: CONFIG.ROLES.ADMIN,
        profile: {
            name: 'Platform Administrator',
            type: 'admin'
        }
    });
    
    // Auto-approve admin
    await dataService.updateUser(adminUser.id, { status: 'active' });
    
    console.log('Default admin user created: admin@pmtwin.com / admin123');
}

/**
 * Initialize routes
 */
function initializeRoutes() {
    // Home route
    router.register(CONFIG.ROUTES.HOME, async () => {
        await loadPage('home');
    });
    
    // Auth routes
    router.register(CONFIG.ROUTES.LOGIN, async () => {
        await loadPage('login');
    });
    
    router.register(CONFIG.ROUTES.REGISTER, async () => {
        await loadPage('register');
    });

    router.register(CONFIG.ROUTES.FORGOT_PASSWORD, async () => {
        await loadPage('forgot-password');
    });

    router.register(CONFIG.ROUTES.RESET_PASSWORD, async () => {
        const hash = window.location.hash || '';
        const qs = hash.indexOf('?') >= 0 ? hash.substring(hash.indexOf('?')) : '';
        const token = new URLSearchParams(qs).get('token');
        await loadPage('reset-password', { token });
    });
    
    // Public: Collaboration Wizard, Knowledge Base, Collaboration Models (no auth)
    router.register(CONFIG.ROUTES.COLLABORATION_WIZARD, async () => {
        await loadPage('collaboration-wizard');
    });
    
    router.register(CONFIG.ROUTES.KNOWLEDGE_BASE, async () => {
        await loadPage('knowledge-base');
    });
    
    router.register(CONFIG.ROUTES.COLLABORATION_MODELS, async () => {
        await loadPage('collaboration-models');
    });
    
    // Public: Find page (search for people, companies, opportunities)
    router.register(CONFIG.ROUTES.FIND, async () => {
        await loadPage('find');
    });

    // Public: Platform workflow (how it works)
    router.register(CONFIG.ROUTES.WORKFLOW, async () => {
        await loadPage('workflow');
    });
    
    // Dashboard route (protected)
    router.register(CONFIG.ROUTES.DASHBOARD, authGuard.protect(async () => {
        await loadPage('dashboard');
    }));

    // Company dashboard route (protected; company users get a dedicated URL)
    router.register(CONFIG.ROUTES.COMPANY_DASHBOARD, authGuard.protect(async () => {
        await loadPage('dashboard', { view: 'company' });
    }));
    
    // Opportunities routes (protected)
    router.register(CONFIG.ROUTES.OPPORTUNITIES, authGuard.protect(async () => {
        await loadPage('opportunities');
    }));
    
    router.register(CONFIG.ROUTES.OPPORTUNITY_CREATE, authGuard.protect(async () => {
        await loadPage('opportunity-create');
    }));

    router.register('/opportunities/map', authGuard.protect(async () => {
        await loadPage('opportunity-map');
    }));
    
    router.register('/opportunities/:id', authGuard.protect(async (params) => {
        await loadPage('opportunity-detail', params);
    }));
    
    // Edit route
    router.register('/opportunities/:id/edit', authGuard.protect(async (params) => {
        await loadPage('opportunity-edit', params);
    }));
    
    // Profile route (protected)
    router.register(CONFIG.ROUTES.PROFILE, authGuard.protect(async () => {
        await loadPage('profile');
    }));
    
    // Settings route (protected)
    router.register(CONFIG.ROUTES.SETTINGS, authGuard.protect(async () => {
        await loadPage('settings');
    }));
    
    router.register(CONFIG.ROUTES.NOTIFICATIONS, authGuard.protect(async () => {
        await loadPage('notifications');
    }));
    
    // Pipeline routes (protected) – more specific /pipeline/:tab first
    router.register('/pipeline/:tab', authGuard.protect(async (params) => {
        await loadPage('pipeline', params);
    }));
    router.register('/pipeline', authGuard.protect(async () => {
        await loadPage('pipeline');
    }));
    
    // Contracts route (protected)
    router.register(CONFIG.ROUTES.CONTRACTS, authGuard.protect(async () => {
        await loadPage('contracts');
    }));

    router.register('/contracts/:id', authGuard.protect(async (params) => {
        await loadPage('contract-detail', params);
    }));

    // Deals routes (post-match collaboration workflow)
    router.register(CONFIG.ROUTES.DEALS, authGuard.protect(async () => {
        await loadPage('deals');
    }));
    router.register('/deals/:id/rate', authGuard.protect(async (params) => {
        await loadPage('deal-rate', params);
    }));
    router.register(CONFIG.ROUTES.DEAL_DETAIL, authGuard.protect(async (params) => {
        await loadPage('deal-detail', params);
    }));
    
    // People routes (accessible to all users)
    router.register('/people', authGuard.protect(async () => {
        await loadPage('people');
    }));
    
    router.register('/people/:id', authGuard.protect(async (params) => {
        await loadPage('person-profile', params);
    }));
    
    router.register(CONFIG.ROUTES.MESSAGES, authGuard.protect(async () => {
        await loadPage('messages', {});
    }));
    
    router.register('/messages/:id', authGuard.protect(async (params) => {
        await loadPage('messages', params);
    }));

    // Match detail route (protected) – user-facing post-match discovery
    router.register(CONFIG.ROUTES.MATCH_DETAIL, authGuard.protect(async (params) => {
        await loadPage('match-detail', params);
    }));
    
    // Admin routes (protected: admin/moderator get dashboard, auditor gets audit)
    router.register(CONFIG.ROUTES.ADMIN, authGuard.protect(async () => {
        if (!authService.canAccessAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        if (authService.hasRole(CONFIG.ROLES.AUDITOR)) {
            router.navigate(CONFIG.ROUTES.ADMIN_AUDIT);
            return;
        }
        await loadPage('admin-dashboard');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.AUDITOR]));
    
    router.register(CONFIG.ROUTES.ADMIN_USERS, authGuard.protect(async () => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-users');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));

    router.register(CONFIG.ROUTES.ADMIN_PEOPLE, authGuard.protect(async () => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-users');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));

    router.register(CONFIG.ROUTES.ADMIN_VETTING, authGuard.protect(async () => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-vetting');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));
    
    router.register(CONFIG.ROUTES.ADMIN_OPPORTUNITIES, authGuard.protect(async () => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-opportunities');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));
    
    router.register(CONFIG.ROUTES.ADMIN_AUDIT, authGuard.protect(async () => {
        if (!authService.canAccessAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-audit');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.AUDITOR]));
    
    router.register(CONFIG.ROUTES.ADMIN_SETTINGS, authGuard.protect(async () => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-settings');
    }, [CONFIG.ROLES.ADMIN]));

    router.register(CONFIG.ROUTES.ADMIN_SKILLS, authGuard.protect(async () => {
        if (!authService.hasRole(CONFIG.ROLES.ADMIN)) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-skills');
    }, [CONFIG.ROLES.ADMIN]));

    router.register(CONFIG.ROUTES.ADMIN_COLLABORATION_MODELS, authGuard.protect(async () => {
        if (!authService.hasRole(CONFIG.ROLES.ADMIN)) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-collaboration-models');
    }, [CONFIG.ROLES.ADMIN]));

    router.register(CONFIG.ROUTES.ADMIN_SUBSCRIPTIONS, authGuard.protect(async () => {
        if (!authService.hasRole(CONFIG.ROLES.ADMIN)) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-subscriptions');
    }, [CONFIG.ROLES.ADMIN]));
    
    router.register(CONFIG.ROUTES.ADMIN_REPORTS, authGuard.protect(async () => {
        if (!authService.canAccessAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-reports');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.AUDITOR]));

    router.register(CONFIG.ROUTES.ADMIN_MATCHING, authGuard.protect(async () => {
        if (!authService.canAccessAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-matching');
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.AUDITOR]));
    
    router.register('/admin/users/:id', authGuard.protect(async (params) => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-user-detail', params);
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));

    router.register('/admin/people/:id', authGuard.protect(async (params) => {
        if (!authService.isAdmin()) {
            router.navigate(CONFIG.ROUTES.DASHBOARD);
            return;
        }
        await loadPage('admin-user-detail', params);
    }, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]));
}

/**
 * Setup global navigation handler
 */
function setupGlobalNavigation() {
    // Use event delegation on document body to catch all links
    document.body.addEventListener('click', (e) => {
        const scrollLink = e.target.closest('a[data-scroll]');
        if (scrollLink) {
            e.preventDefault();
            const id = scrollLink.getAttribute('data-scroll');
            if (id) {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        const link = e.target.closest('a[data-route]');
        if (link) {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            const r = window.router || (typeof router !== 'undefined' ? router : null);
            if (route && r && typeof r.navigate === 'function') {
                r.navigate(route);
            }
        }
    });
}

/** Guard to prevent concurrent/repeated load of the same or any page (avoids ERR_INSUFFICIENT_RESOURCES from storm of fetches) */
let loadPageInProgress = false;

/**
 * Resolve URL for a page path relative to the current document (same origin).
 * Avoids ERR_CONNECTION_REFUSED when opened via file:// or wrong base.
 */
function resolvePageUrl(relativePath) {
    return new URL(relativePath, window.location.href).href;
}

/**
 * Load page content
 * Fetches using a URL relative to the document so it works for any base path and origin.
 */
async function loadPage(pageName, params = {}) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    if (loadPageInProgress) {
        return;
    }
    loadPageInProgress = true;
    
    // Path relative to index.html (e.g. pages/notifications/index.html)
    const pagePath = resolvePageUrl(`pages/${pageName}/index.html`);
    
    try {
        const response = await fetch(pagePath);
        if (!response.ok) {
            throw new Error(`Page not found: ${pageName}`);
        }
        const html = await response.text();
        
        mainContent.innerHTML = html;
        
        const scriptPath = `features/${pageName}/${pageName}.js`;
        try {
            await loadScript(scriptPath);
            const functionName = pageName.split('-').map((word, index) => 
                index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
            ).join('');
            const initFunctionName = `init${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`;
            
            if (window[initFunctionName]) {
                window[initFunctionName](params);
            }
        } catch (error) {
            console.log(`No script found for ${pageName}`);
        }
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        const isNetworkError = error?.message === 'Failed to fetch' || error?.name === 'TypeError';
        const hint = isNetworkError && window.location.protocol === 'file:'
            ? ' Open the app via a local server (e.g. Live Server) instead of file://.'
            : isNetworkError ? ' Check that the server is running and the path is correct.' : '';
        mainContent.innerHTML = `<div class="error">Page not found: ${pageName}.${hint}</div>`;
    } finally {
        loadPageInProgress = false;
    }
}
