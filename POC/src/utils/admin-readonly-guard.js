/**
 * Disable write controls for auditor (read-only admin) accounts on admin pages.
 */
(function (global) {
    'use strict';

    function applyAuditorReadOnlyAdmin(root) {
        if (typeof global.authService === 'undefined'
            || !global.authService.isReadOnlyAdmin
            || !global.authService.isReadOnlyAdmin()) {
            return false;
        }
        const scope = root || document.querySelector('.page-container') || document.body;
        scope.querySelectorAll('[data-requires-write], [data-requires-persist]').forEach(el => {
            el.disabled = true;
            el.title = 'This action is read-only for auditor accounts.';
        });
        scope.querySelectorAll('button.btn-primary, button.btn-danger, input[type="submit"]').forEach(el => {
            if (el.closest('[data-auditor-allowed]')) return;
            if (el.hasAttribute('data-requires-write') || el.hasAttribute('data-requires-persist')) return;
            const form = el.closest('form');
            if (form && !form.hasAttribute('data-auditor-allowed')) {
                el.disabled = true;
                el.title = 'This action is read-only for auditor accounts.';
            }
        });
        return true;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { applyAuditorReadOnlyAdmin };
    }
    global.applyAuditorReadOnlyAdmin = applyAuditorReadOnlyAdmin;
})(typeof window !== 'undefined' ? window : global);
