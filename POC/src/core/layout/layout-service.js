/**
 * Layout Service
 * Manages application layout, navigation, and common UI elements.
 * When authenticated: portal layout (sidebar + main card). When not: public layout (top nav + full-width main).
 */

class LayoutService {
    constructor() {
        this.authService = window.authService || authService;
        this.router = window.router || router;
        this.mainContentId = 'main-content';
        this.publicLayoutId = 'app-public-layout';
        this.portalLayoutId = 'app-portal-layout';
        this.mainContentSlotId = 'main-content-slot';
    }

    /**
     * Initialize layout
     */
    async init() {
        await this.renderLayout();
        await this.renderFooter();
    }

    /**
     * Get current path for active nav (from router or location)
     */
    getCurrentPath() {
        if (this.router && typeof this.router.getCurrentPath === 'function') {
            return this.router.getCurrentPath();
        }
        const hash = window.location.hash.replace(/^#/, '') || '/';
        return hash.startsWith('/') ? hash : '/' + hash;
    }

    /**
     * Switch layout by auth: move #main-content and show/hide portal vs public
     */
    async applyLayoutMode(isAuthenticated) {
        const mainContent = document.getElementById(this.mainContentId);
        const publicLayout = document.getElementById(this.publicLayoutId);
        const portalLayout = document.getElementById(this.portalLayoutId);
        const slot = document.getElementById(this.mainContentSlotId);
        if (!mainContent || !publicLayout || !portalLayout) return;

        if (isAuthenticated) {
            publicLayout.classList.remove('public-visible');
            portalLayout.classList.add('portal-visible');
            if (slot && mainContent.parentElement !== slot) {
                slot.appendChild(mainContent);
            }
        } else {
            portalLayout.classList.remove('portal-visible');
            publicLayout.classList.add('public-visible');
            const publicNav = document.getElementById('main-nav');
            if (publicNav && publicNav.nextElementSibling !== mainContent) {
                if (mainContent.parentElement) {
                    mainContent.parentElement.removeChild(mainContent);
                }
                publicNav.parentElement.insertBefore(mainContent, publicNav.nextElementSibling);
            }
        }
    }

    /**
     * Whether current route is in admin portal area
     */
    isInAdminArea() {
        const path = this.getCurrentPath();
        return path === CONFIG.ROUTES.ADMIN || path.startsWith(CONFIG.ROUTES.ADMIN + '/');
    }

    /**
     * Render entire layout (sidebar when auth, top nav when public)
     * When in admin area and user can access admin, render admin sidebar instead of main portal sidebar
     */
    async renderLayout() {
        const isAuthenticated = await this.authService.checkAuth();
        const user = this.authService.getCurrentUser();

        await this.applyLayoutMode(isAuthenticated);

        if (isAuthenticated) {
            const inAdminArea = this.isInAdminArea();
            const canAccessAdmin = this.authService.canAccessAdmin();
            if (inAdminArea && canAccessAdmin) {
                await this.renderAdminSidebar(user);
            } else {
                await this.renderSidebar(user);
            }
            this.renderMaintenanceBanner();
            this.renderPendingApprovalBanner();
            this.attachSidebarHandlers();
        } else {
            await this.renderPublicNav(user);
            this.attachNavigationHandlers();
        }
    }

    /**
     * Render public (top) nav – used when not authenticated.
     * Collaboration Models is intentionally not shown in public view.
     */
    async renderPublicNav() {
        const navElement = document.getElementById('main-nav');
        if (!navElement) return;

        let navHTML = '<nav class="bg-white border-b border-gray-200 h-16 sticky top-0 z-50 shadow-sm"><div class="max-w-container mx-auto px-6 h-full flex items-center justify-between">';
        navHTML += `<div class="nav-brand"><a href="#" data-route="${CONFIG.ROUTES.HOME}" class="text-xl font-bold text-primary no-underline hover:text-primary-dark transition-colors">${CONFIG.APP_NAME}</a></div>`;
        navHTML += '<ul class="flex list-none gap-6 items-center m-0 p-0">';
        navHTML += `<li><a href="#" data-route="${CONFIG.ROUTES.FIND}" class="text-gray-900 no-underline font-medium hover:text-primary transition-colors">Find</a></li>`;
        navHTML += `<li><a href="#" data-route="${CONFIG.ROUTES.WORKFLOW}" class="text-gray-900 no-underline font-medium hover:text-primary transition-colors">How it works</a></li>`;
        navHTML += `<li><a href="#" data-route="${CONFIG.ROUTES.KNOWLEDGE_BASE}" class="text-gray-900 no-underline font-medium hover:text-primary transition-colors">Knowledge Base</a></li>`;
        navHTML += `<li><a href="#" data-route="${CONFIG.ROUTES.LOGIN}" class="text-gray-900 no-underline font-medium hover:text-primary transition-colors">Login</a></li>`;
        navHTML += `<li><a href="#" data-route="${CONFIG.ROUTES.REGISTER}" class="text-gray-900 no-underline font-medium hover:text-primary transition-colors">Register</a></li>`;
        navHTML += '</ul></div></nav>';
        navElement.innerHTML = navHTML;
    }

    /**
     * Render portal sidebar – used when authenticated
     */
    async renderSidebar(user) {
        const sidebarEl = document.getElementById('app-sidebar');
        if (!sidebarEl) return;

        const currentPath = this.getCurrentPath();
        const isActive = (route) => {
            if (route === '/' || route === CONFIG.ROUTES.HOME) return currentPath === '/' || currentPath === '';
            return currentPath === route || currentPath.startsWith(route + '/');
        };

        const displayName = user?.profile?.name || user?.email || 'User';
        const initial = (displayName.charAt(0) || 'U').toUpperCase();
        const roleLabel = (user?.role || 'user').toUpperCase().replace(/-/g, '_');
        const profileRoute = CONFIG.ROUTES.PROFILE;
        const settingsRoute = CONFIG.ROUTES.SETTINGS;

        let html = '<div class="portal-sidebar-inner">';
        html += `<div class="portal-sidebar-brand"><i class="ph-duotone ph-lightning"></i><span>${CONFIG.APP_NAME}</span></div>`;
        html += '<div class="portal-lang-selector"><button type="button" class="portal-lang-btn" data-lang="ar">AR</button><button type="button" class="portal-lang-btn portal-lang-btn-active" data-lang="en">EN</button></div>';

        html += '<div class="portal-user-dropdown">';
        html += '<div class="portal-sidebar-user-card portal-user-dropdown-trigger" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">';
        html += `<div class="portal-user-avatar" aria-hidden="true">${initial}</div>`;
        html += '<div class="portal-user-info">';
        html += `<span class="portal-user-name" title="${displayName.replace(/"/g, '&quot;')}">${displayName}</span>`;
        html += `<span class="portal-user-role-tag">${roleLabel}</span>`;
        if (user?.status === 'pending') {
            html += '<span class="portal-account-status"><span class="badge badge-warning">Pending</span></span>';
        } else if (user?.status === 'active') {
            html += '<span class="portal-account-status"><span class="badge badge-success">Active</span></span>';
        }
        html += '</div>';
        html += '<i class="ph-duotone ph-caret-down portal-user-chevron" aria-hidden="true"></i>';
        html += '</div>';
        html += '<div class="portal-user-dropdown-menu">';
        html += `<a href="#" data-route="${profileRoute}" class="portal-menu-item ${isActive(profileRoute) ? 'portal-menu-item-active' : ''}"><i class="ph-duotone ph-user"></i><span>Profile</span></a>`;
        html += '<hr class="portal-menu-separator" />';
        html += `<a href="#" data-route="${settingsRoute}" class="portal-menu-item ${isActive(settingsRoute) ? 'portal-menu-item-active' : ''}"><i class="ph-duotone ph-gear"></i><span>Settings</span></a>`;
        html += '</div>';
        html += '</div>';

        const workspaceLinks = [
            { route: CONFIG.ROUTES.DASHBOARD, label: 'Dashboard', icon: 'ph-duotone ph-house' },
            ...(this.authService.isCompanyUser && this.authService.isCompanyUser() ? [{ route: CONFIG.ROUTES.COMPANY_DASHBOARD, label: 'Company dashboard', icon: 'ph-duotone ph-buildings' }] : []),
            { route: '/pipeline', label: 'Pipeline', icon: 'ph-duotone ph-git-branch' },
            { route: '/people', label: 'People', icon: 'ph-duotone ph-users' },
        ];
        const opportunitiesLinks = [
            { route: CONFIG.ROUTES.OPPORTUNITIES, label: 'Opportunities', icon: 'ph-duotone ph-briefcase' },
            { route: CONFIG.ROUTES.MATCHES, label: 'Matches', icon: 'ph-duotone ph-heart' },
        ];
        const collaborationLinks = [
            { route: CONFIG.ROUTES.DEALS, label: 'Deals', icon: 'ph-duotone ph-handshake' },
            { route: CONFIG.ROUTES.CONTRACTS, label: 'Contracts', icon: 'ph-duotone ph-file-text' },
        ];
        const communicationLinks = [
            { route: CONFIG.ROUTES.MESSAGES, label: 'Messages', icon: 'ph-duotone ph-chat-circle' },
            { route: CONFIG.ROUTES.NOTIFICATIONS, label: 'Notifications', icon: 'ph-duotone ph-bell' },
        ];
        const renderGroup = (title, links) => {
            html += `<p class="portal-sidebar-section">${title}</p>`;
            html += '<nav class="portal-sidebar-nav">';
            links.forEach(({ route, label, icon }) => {
                const active = isActive(route);
                html += `<a href="#" data-route="${route}" class="portal-nav-link ${active ? 'portal-nav-active' : ''}" title="${label.replace(/"/g, '&quot;')}"><i class="${icon}"></i><span class="portal-nav-link-text">${label}</span></a>`;
            });
            html += '</nav>';
        };
        renderGroup('WORKSPACE', workspaceLinks);
        renderGroup('OPPORTUNITIES', opportunitiesLinks);
        renderGroup('COLLABORATION', collaborationLinks);
        renderGroup('COMMUNICATION', communicationLinks);
        if (this.authService.canAccessAdmin()) {
            html += '<p class="portal-sidebar-section">ADMIN</p>';
            html += '<nav class="portal-sidebar-nav">';
            html += `<a href="#" data-route="${CONFIG.ROUTES.ADMIN}" class="portal-nav-link ${isActive(CONFIG.ROUTES.ADMIN) ? 'portal-nav-active' : ''}" title="Admin"><i class="ph-duotone ph-shield-check"></i><span class="portal-nav-link-text">Admin</span></a>`;
            html += `<a href="#" data-route="${CONFIG.ROUTES.ADMIN_REPORTS}" class="portal-nav-link ${isActive(CONFIG.ROUTES.ADMIN_REPORTS) ? 'portal-nav-active' : ''}" title="Reports"><i class="ph-duotone ph-chart-bar"></i><span class="portal-nav-link-text">Reports</span></a>`;
            html += '</nav>';
        }
        html += `<div class="portal-sidebar-footer"><button type="button" class="portal-logout-btn" onclick="layoutService.handleLogout()"><i class="ph-duotone ph-sign-out"></i><span>Logout</span></button></div>`;
        html += '</div>';
        sidebarEl.innerHTML = html;
    }

    /**
     * Render admin portal sidebar – used when authenticated and path is /admin or /admin/*
     * Role-based: Auditor = Audit + Reports only; Moderator = all except Settings & Collaboration Models; Admin = all
     */
    async renderAdminSidebar(user) {
        const sidebarEl = document.getElementById('app-sidebar');
        if (!sidebarEl) return;

        const currentPath = this.getCurrentPath();
        const isActive = (route) => {
            if (route === CONFIG.ROUTES.ADMIN) return currentPath === CONFIG.ROUTES.ADMIN;
            return currentPath === route || currentPath.startsWith(route + '/');
        };

        const displayName = user?.profile?.name || user?.email || 'User';
        const initial = (displayName.charAt(0) || 'U').toUpperCase();
        const roleLabel = (user?.role || 'user').toUpperCase().replace(/-/g, '_');
        const isAuditor = user?.role === CONFIG.ROLES.AUDITOR;
        const isModerator = user?.role === CONFIG.ROLES.MODERATOR;
        const isFullAdmin = user?.role === CONFIG.ROLES.ADMIN;

        let html = '<div class="portal-sidebar-inner">';
        html += `<div class="portal-sidebar-brand"><i class="ph-duotone ph-shield-check"></i><span>${CONFIG.APP_NAME} Admin</span></div>`;
        html += '<div class="portal-user-dropdown">';
        html += '<div class="portal-sidebar-user-card portal-user-dropdown-trigger" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">';
        html += `<div class="portal-user-avatar" aria-hidden="true">${initial}</div>`;
        html += '<div class="portal-user-info">';
        html += `<span class="portal-user-name" title="${displayName.replace(/"/g, '&quot;')}">${displayName}</span>`;
        html += `<span class="portal-user-role-tag">${roleLabel}</span>`;
        if (user?.status === 'pending') {
            html += '<span class="portal-account-status"><span class="badge badge-warning">Pending</span></span>';
        } else if (user?.status === 'active') {
            html += '<span class="portal-account-status"><span class="badge badge-success">Active</span></span>';
        }
        html += '</div>';
        html += '<i class="ph-duotone ph-caret-down portal-user-chevron" aria-hidden="true"></i>';
        html += '</div>';
        html += '<div class="portal-user-dropdown-menu">';
        html += `<a href="#" data-route="${CONFIG.ROUTES.DASHBOARD}" class="portal-menu-item"><i class="ph-duotone ph-house"></i><span>Back to Portal</span></a>`;
        html += '</div>';
        html += '</div>';

        const renderAdminGroup = (sectionTitle, links) => {
            if (links.length === 0) return;
            html += `<p class="portal-sidebar-section">${sectionTitle}</p>`;
            html += '<nav class="portal-sidebar-nav">';
            links.forEach(({ route, label, icon }) => {
                const active = isActive(route);
                html += `<a href="#" data-route="${route}" class="portal-nav-link ${active ? 'portal-nav-active' : ''}" title="${label.replace(/"/g, '&quot;')}"><i class="${icon}"></i><span class="portal-nav-link-text">${label}</span></a>`;
            });
            html += '</nav>';
        };

        const overviewLinks = [];
        if (!isAuditor) overviewLinks.push({ route: CONFIG.ROUTES.ADMIN, label: 'Dashboard', icon: 'ph-duotone ph-house' });
        renderAdminGroup('OVERVIEW', overviewLinks);

        const usersLinks = [];
        if (!isAuditor) {
            usersLinks.push({ route: CONFIG.ROUTES.ADMIN_VETTING, label: 'User Vetting', icon: 'ph-duotone ph-user-check' });
            usersLinks.push({ route: CONFIG.ROUTES.ADMIN_PEOPLE, label: 'People', icon: 'ph-duotone ph-users' });
        }
        renderAdminGroup('USERS', usersLinks);

        const marketplaceLinks = [];
        if (!isAuditor) marketplaceLinks.push({ route: CONFIG.ROUTES.ADMIN_OPPORTUNITIES, label: 'Opportunities', icon: 'ph-duotone ph-briefcase' });
        marketplaceLinks.push({ route: CONFIG.ROUTES.ADMIN_MATCHING, label: 'Matching', icon: 'ph-duotone ph-graph' });
        marketplaceLinks.push({ route: CONFIG.ROUTES.ADMIN_CONSORTIUM, label: 'Consortium', icon: 'ph-duotone ph-users-three' });
        renderAdminGroup('MARKETPLACE', marketplaceLinks);

        const transactionsLinks = [
            { route: CONFIG.ROUTES.ADMIN_DEALS, label: 'Deals', icon: 'ph-duotone ph-handshake' },
            { route: CONFIG.ROUTES.ADMIN_CONTRACTS, label: 'Contracts', icon: 'ph-duotone ph-file-text' },
        ];
        renderAdminGroup('TRANSACTIONS', transactionsLinks);

        const monitoringLinks = [
            { route: CONFIG.ROUTES.ADMIN_AUDIT, label: 'Audit Trail', icon: 'ph-duotone ph-list-checks' },
            { route: CONFIG.ROUTES.ADMIN_REPORTS, label: 'Reports', icon: 'ph-duotone ph-chart-bar' },
            { route: CONFIG.ROUTES.ADMIN_HEALTH, label: 'System Health', icon: 'ph-duotone ph-heartbeat' },
        ];
        renderAdminGroup('MONITORING', monitoringLinks);

        const configLinks = [];
        if (isFullAdmin) {
            configLinks.push({ route: CONFIG.ROUTES.ADMIN_SKILLS, label: 'Skills & Categories', icon: 'ph-duotone ph-tag' });
            configLinks.push({ route: CONFIG.ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: 'ph-duotone ph-gear' });
            configLinks.push({ route: CONFIG.ROUTES.ADMIN_SUBSCRIPTIONS, label: 'Subscriptions', icon: 'ph-duotone ph-credit-card' });
            configLinks.push({ route: CONFIG.ROUTES.ADMIN_COLLABORATION_MODELS, label: 'Collaboration Models', icon: 'ph-duotone ph-stack' });
        }
        renderAdminGroup('CONFIGURATION', configLinks);
        html += `<div class="portal-sidebar-footer"><button type="button" class="portal-logout-btn" onclick="layoutService.handleLogout()"><i class="ph-duotone ph-sign-out"></i><span>Logout</span></button></div>`;
        html += '</div>';
        sidebarEl.innerHTML = html;
    }

    /**
     * Show or hide pending approval banner in portal layout (read-only demo mode)
     */
    renderPendingApprovalBanner() {
        const user = this.authService.getCurrentUser();
        const portalLayout = document.getElementById(this.portalLayoutId);
        const appMain = portalLayout?.querySelector('.portal-main, #app-main');
        if (!appMain) return;

        let banner = document.getElementById('pending-approval-banner');
        if (user?.status === 'pending') {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'pending-approval-banner';
                banner.setAttribute('role', 'alert');
                banner.style.cssText = 'background: #fef3c7; border-bottom: 1px solid #f59e0b; color: #92400e; padding: 0.5rem 1rem; font-size: 0.875rem;';
                appMain.insertBefore(banner, appMain.firstChild);
            }
            banner.textContent = 'Your account is pending admin approval. You can explore the platform but actions are temporarily disabled.';
            banner.style.display = '';
        } else if (banner) {
            banner.style.display = 'none';
        }
    }

    /**
     * Show or hide maintenance mode banner in portal layout
     */
    renderMaintenanceBanner() {
        const portalLayout = document.getElementById(this.portalLayoutId);
        const appMain = portalLayout?.querySelector('.portal-main, #app-main');
        if (!appMain) return;

        const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
        const settings = storage?.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
        const maintenanceMode = !!settings.maintenanceMode;

        let banner = document.getElementById('maintenance-banner');
        if (maintenanceMode) {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'maintenance-banner';
                banner.setAttribute('role', 'alert');
                banner.style.cssText = 'background: #fef3c7; border-bottom: 1px solid #f59e0b; color: #92400e; padding: 0.5rem 1rem; font-size: 0.875rem;';
                appMain.insertBefore(banner, appMain.firstChild);
            }
            banner.innerHTML = '<span><strong>Maintenance mode is on.</strong> Some features may be limited. Admins can turn this off in Admin &rarr; Settings.</span>';
            banner.style.display = '';
        } else if (banner) {
            banner.style.display = 'none';
        }
    }

    /**
     * Attach sidebar nav link handlers
     */
    attachSidebarHandlers() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (route) this.router.navigate(route);
            }
        });
        const langBtns = sidebar.querySelectorAll('.portal-lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                langBtns.forEach(b => b.classList.remove('portal-lang-btn-active'));
                btn.classList.add('portal-lang-btn-active');
                const lang = btn.getAttribute('data-lang');
                if (lang === 'ar') {
                    document.documentElement.setAttribute('dir', 'rtl');
                    document.documentElement.setAttribute('lang', 'ar');
                } else {
                    document.documentElement.setAttribute('dir', 'ltr');
                    document.documentElement.setAttribute('lang', 'en');
                }
            });
        });
        const trigger = sidebar.querySelector('.portal-user-dropdown-trigger');
        const dropdown = sidebar.querySelector('.portal-user-dropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('portal-user-dropdown-open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }
        if (!window._portalUserDropdownDocListener) {
            window._portalUserDropdownDocListener = true;
            document.addEventListener('click', (e) => {
                if (e.target.closest('.portal-user-dropdown')) return;
                const openDropdown = document.querySelector('.portal-user-dropdown.portal-user-dropdown-open');
                if (openDropdown) {
                    openDropdown.classList.remove('portal-user-dropdown-open');
                    const t = openDropdown.querySelector('.portal-user-dropdown-trigger');
                    if (t) t.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    /**
     * Attach click handlers for public nav links
     */
    attachNavigationHandlers() {
        const navElement = document.getElementById('main-nav');
        if (!navElement) return;
        navElement.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (route) this.router.navigate(route);
            }
        });
    }

    /**
     * Render footer
     */
    async renderFooter() {
        const footerElement = document.getElementById('main-footer');
        if (!footerElement) return;
        footerElement.innerHTML = `
            <footer class="bg-white border-t border-gray-200 py-6 mt-auto">
                <div class="max-w-container mx-auto text-center text-gray-600 text-sm">
                    <p class="mb-1">&copy; ${new Date().getFullYear()} ${CONFIG.APP_NAME}. All rights reserved.</p>
                    <p>Construction Collaboration Platform for Saudi Arabia & GCC</p>
                </div>
            </footer>
        `;
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        await this.authService.logout();
        await this.renderLayout();
        this.router.navigate(CONFIG.ROUTES.HOME);
    }

    /**
     * Update navigation (call after auth state or route changes)
     */
    async updateNavigation() {
        await this.renderLayout();
    }

    /**
     * Update sidebar active state after route change (call from router if needed)
     */
    setActiveNav() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        const currentPath = this.getCurrentPath();
        sidebar.querySelectorAll('.portal-nav-link').forEach(link => {
            const route = link.getAttribute('data-route');
            const active = (route === '/' || route === CONFIG.ROUTES.HOME) ? (currentPath === '/' || currentPath === '') : (currentPath === route || currentPath.startsWith(route + '/'));
            link.classList.toggle('portal-nav-active', active);
        });
    }
}

const layoutService = new LayoutService();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = layoutService;
} else {
    window.layoutService = layoutService;
}
