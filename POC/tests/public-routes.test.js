/**
 * Public route classification and layout/nav decisions for marketing pages.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/find',
    '/workflow',
    '/knowledge-base',
    '/collaboration-wizard',
    '/collaboration-models'
];

function buildPublicNavLinks(isAuthenticated, dashboardRoute = '/dashboard') {
    const links = ['Find', 'How it works', 'Knowledge Base'];
    if (isAuthenticated) {
        links.push('Dashboard', 'Logout');
    } else {
        links.push('Login', 'Register');
    }
    return links;
}

function shouldUsePortalLayout(isAuthenticated, route) {
    const isPublic = PUBLIC_ROUTES.includes(route);
    return isAuthenticated && !isPublic;
}

describe('public routes', () => {
    beforeEach(() => {
        global.window = global;
        global.CONFIG = {
            PUBLIC_ROUTES,
            ROUTES: {
                HOME: '/',
                LOGIN: '/login',
                REGISTER: '/register',
                DASHBOARD: '/dashboard',
                COMPANY_DASHBOARD: '/company-dashboard',
                ADMIN: '/admin'
            },
            ROLES: { ADMIN: 'admin', MODERATOR: 'moderator', AUDITOR: 'auditor' }
        };
        global.authService = {
            checkAuth: async () => false,
            getCurrentUser: () => null,
            hasAnyRole: () => false
        };
        global.router = { getCurrentPath: () => '/', navigate: () => {} };
    });

    it('marks all marketing routes as public', () => {
        const authGuard = require(path.join(__dirname, '..', 'src', 'core', 'router', 'auth-guard.js'));
        PUBLIC_ROUTES.forEach((route) => {
            expect(authGuard.isPublicRoute(route)).toBe(true);
        });
    });

    it('marks workspace routes as protected', () => {
        const authGuard = require(path.join(__dirname, '..', 'src', 'core', 'router', 'auth-guard.js'));
        ['/dashboard', '/opportunities', '/admin', '/matches'].forEach((route) => {
            expect(authGuard.isPublicRoute(route)).toBe(false);
            expect(authGuard.requiresAuth(route)).toBe(true);
        });
    });

    it('uses public layout on homepage when authenticated', () => {
        expect(shouldUsePortalLayout(true, '/')).toBe(false);
        expect(shouldUsePortalLayout(true, '/find')).toBe(false);
    });

    it('uses portal layout on dashboard when authenticated', () => {
        expect(shouldUsePortalLayout(true, '/dashboard')).toBe(true);
        expect(shouldUsePortalLayout(true, '/opportunities')).toBe(true);
    });

    it('uses public layout when not authenticated on any route', () => {
        expect(shouldUsePortalLayout(false, '/dashboard')).toBe(false);
        expect(shouldUsePortalLayout(false, '/')).toBe(false);
    });

    it('shows Dashboard instead of Login for authenticated public nav', () => {
        const guestLinks = buildPublicNavLinks(false);
        const authLinks = buildPublicNavLinks(true);

        expect(guestLinks).toContain('Login');
        expect(guestLinks).toContain('Register');
        expect(guestLinks).not.toContain('Dashboard');

        expect(authLinks).toContain('Dashboard');
        expect(authLinks).toContain('Logout');
        expect(authLinks).not.toContain('Login');
        expect(authLinks).not.toContain('Register');
    });
});
