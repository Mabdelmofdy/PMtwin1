/**
 * Disable write controls for auditor (read-only admin) accounts on admin pages.
 */
(function (global) {
    'use strict';

    const READONLY_TITLE = 'This action is read-only for auditor accounts.';

    function disableWriteControl(el) {
        if (!el || el.closest('[data-auditor-allowed]')) return;
        if (el.tagName === 'A') {
            el.classList.add('is-disabled');
            el.setAttribute('aria-disabled', 'true');
            el.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
            }, { capture: true });
        } else {
            el.disabled = true;
        }
        el.title = READONLY_TITLE;
    }

    function applyAuditorReadOnlyAdmin(root) {
        if (typeof global.authService === 'undefined'
            || !global.authService.isReadOnlyAdmin
            || !global.authService.isReadOnlyAdmin()) {
            return false;
        }
        const scope = root || document.querySelector('.page-container') || document.body;
        const selectors = [
            '[data-requires-write]',
            '[data-requires-persist]',
            '[data-admin-write]',
            '#save-models-btn',
            '#matching-bulk-persist-btn',
            '.vetting-card-actions .btn-warning',
            '.vetting-card-actions .btn-success',
            '.vetting-card-actions .btn-danger',
            '.vetting-card-actions .umgmt-more-item',
            '.vetting-bulk-bar button',
            '#vetting-bulk-approve',
            '#vetting-bulk-reject',
            '.admin-skills-write',
            '.admin-subscriptions-write'
        ];
        scope.querySelectorAll(selectors.join(', ')).forEach(disableWriteControl);
        scope.querySelectorAll('button.btn-primary, button.btn-danger, input[type="submit"]').forEach(el => {
            if (el.closest('[data-auditor-allowed]')) return;
            if (el.hasAttribute('data-requires-write') || el.hasAttribute('data-requires-persist')) return;
            const form = el.closest('form');
            if (form && !form.hasAttribute('data-auditor-allowed')) {
                disableWriteControl(el);
            }
        });
        return true;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { applyAuditorReadOnlyAdmin };
    }
    global.applyAuditorReadOnlyAdmin = applyAuditorReadOnlyAdmin;
})(typeof window !== 'undefined' ? window : global);
