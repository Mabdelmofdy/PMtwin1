/**
 * Reusable page header: label, title, description, primary/optional secondary CTA.
 * Layout and styles are shared; content is always page-specific (use PRESETS or pass an object).
 */
(function (global) {
    'use strict';

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * @typedef {Object} PageHeaderAction
     * @property {string} label
     * @property {string} [route] - SPA hash route for data-route link
     * @property {string} [href] - Plain URL (use external:true for target blank)
     * @property {boolean} [external]
     * @property {string} [id] - For buttons or linking from feature JS
     * @property {string} [class] - Extra classes (defaults to btn primary/secondary)
     * @property {'button'|'submit'} [type] - For button elements
     */

    /**
     * @typedef {Object} PageHeaderConfig
     * @property {string} label
     * @property {string} title
     * @property {string} [description] - Plain text (escaped)
     * @property {string} [descriptionHtml] - Rich description (not escaped; use only with trusted strings)
     * @property {string} [titleId] - id for h1 (default: page-context-title)
     * @property {PageHeaderAction} primaryAction
     * @property {PageHeaderAction} [secondaryAction]
     */

    function renderAction(action, isPrimary) {
        if (!action || !action.label) return '';
        const baseClass = isPrimary ? 'btn btn-primary' : 'btn btn-secondary';
        const cls = [baseClass, action.class || ''].filter(Boolean).join(' ').trim();

        if (action.route) {
            return (
                '<a href="#" data-route="' +
                escapeHtml(action.route) +
                '" class="' +
                escapeHtml(cls) +
                '"' +
                (action.id ? ' id="' + escapeHtml(action.id) + '"' : '') +
                '>' +
                escapeHtml(action.label) +
                '</a>'
            );
        }
        if (action.href) {
            const ext = action.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return (
                '<a href="' +
                escapeHtml(action.href) +
                '" class="' +
                escapeHtml(cls) +
                '"' +
                ext +
                (action.id ? ' id="' + escapeHtml(action.id) + '"' : '') +
                '>' +
                escapeHtml(action.label) +
                '</a>'
            );
        }

        const btnType = action.type === 'submit' ? 'submit' : 'button';
        return (
            '<button type="' +
            btnType +
            '"' +
            (action.id ? ' id="' + escapeHtml(action.id) + '"' : '') +
            ' class="' +
            escapeHtml(cls) +
            '">' +
            escapeHtml(action.label) +
            '</button>'
        );
    }

    function renderDescription(config) {
        if (config.descriptionHtml != null && config.descriptionHtml !== '') {
            return '<p class="page-context-header__desc">' + config.descriptionHtml + '</p>';
        }
        if (config.description != null && config.description !== '') {
            return '<p class="page-context-header__desc">' + escapeHtml(config.description) + '</p>';
        }
        return '';
    }

    function render(config) {
        if (!config || !config.title) return '';

        const titleId = config.titleId || 'page-context-title';
        const labelledBy = ' aria-labelledby="' + escapeHtml(titleId) + '"';

        let secondary = '';
        if (config.secondaryAction) {
            secondary = renderAction(config.secondaryAction, false);
        }

        return (
            '<header class="page-context-header"' +
            labelledBy +
            '>' +
            '<div class="page-context-header__inner">' +
            '<div class="page-context-header__main">' +
            '<p class="page-context-header__label">' +
            escapeHtml(config.label || '') +
            '</p>' +
            '<h1 class="page-context-header__title" id="' +
            escapeHtml(titleId) +
            '">' +
            escapeHtml(config.title) +
            '</h1>' +
            renderDescription(config) +
            '</div>' +
            '<div class="page-context-header__actions">' +
            renderAction(config.primaryAction, true) +
            secondary +
            '</div>' +
            '</div>' +
            '</header>'
        );
    }

    function resolvePreset(keyOrConfig) {
        if (keyOrConfig && typeof keyOrConfig === 'object' && !Array.isArray(keyOrConfig)) {
            return keyOrConfig;
        }
        const key = String(keyOrConfig || '');
        return PRESETS[key] || null;
    }

    function mount(container, keyOrConfig) {
        if (!container) return;
        const config = resolvePreset(keyOrConfig);
        if (!config) return;
        container.innerHTML = render(config);
    }

    const R = (typeof global.CONFIG !== 'undefined' && global.CONFIG && global.CONFIG.ROUTES) ? global.CONFIG.ROUTES : {};

    const PRESETS = {
        opportunities: {
            label: 'Opportunities',
            title: 'Manage Opportunities',
            description:
                'Create, edit, publish, and track your project opportunities in one place.',
            primaryAction: { label: 'Create Opportunity', route: R.OPPORTUNITY_CREATE || '/opportunities/create' },
            secondaryAction: { label: 'View Drafts', id: 'page-cta-opportunities-drafts', type: 'button' }
        },
        matches: {
            label: 'Matching Engine',
            title: 'Your Matches',
            description:
                'Discover recommended providers, collaboration opportunities, and high-value matches for your projects.',
            primaryAction: { label: 'View Top Matches', id: 'page-cta-matches-top', type: 'button' },
            secondaryAction: { label: 'Adjust Filters', id: 'page-cta-matches-filters', type: 'button' }
        },
        people: {
            label: 'Talent Network',
            title: 'Browse Talent',
            description:
                'Search for qualified professionals, providers, and companies that match your project needs.',
            primaryAction: { label: 'Invite Provider', id: 'page-cta-people-invite', type: 'button' },
            secondaryAction: { label: 'Filter Talent', id: 'page-cta-people-filter', type: 'button' }
        },
        messages: {
            label: 'Communication',
            title: 'Messages',
            description: 'Manage conversations with providers, applicants, and collaboration partners.',
            primaryAction: { label: 'New Message', route: R.PEOPLE || '/people' },
            secondaryAction: { label: 'View Unread', id: 'page-cta-messages-unread', type: 'button' }
        },
        notifications: {
            label: 'Updates',
            title: 'Notifications',
            description: 'Stay updated on applications, matches, messages, and project activity.',
            primaryAction: { label: 'Mark All as Read', id: 'mark-all-read', type: 'button' },
            secondaryAction: { label: 'Notification Settings', route: R.SETTINGS || '/settings' }
        },
        deals: {
            label: 'Collaboration',
            title: 'Deals',
            description: 'Track active collaboration deals, proposals, and agreement progress.',
            primaryAction: {
                label: 'Create Deal',
                route: global.CONFIG?.ROUTES?.COLLABORATION_WIZARD || '/collaboration-wizard'
            },
            secondaryAction: { label: 'View Active Deals', id: 'page-cta-deals-active', type: 'button' }
        },
        contracts: {
            label: 'Legal & Agreements',
            title: 'Contracts',
            description: 'Manage project contracts, agreements, and collaboration documents.',
            primaryAction: { label: 'Upload Contract', id: 'page-cta-contracts-upload', type: 'button' },
            secondaryAction: { label: 'View Templates', route: R.KNOWLEDGE_BASE || '/knowledge-base' }
        },
        pipelineOpportunities: {
            label: 'Opportunities',
            title: 'Manage Opportunities',
            description:
                'Create, edit, publish, and track your project opportunities in one place.',
            primaryAction: { label: 'Create Opportunity', route: R.OPPORTUNITY_CREATE || '/opportunities/create' },
            secondaryAction: { label: 'View Drafts', id: 'pipeline-cta-view-drafts', type: 'button' }
        },
        pipelineApplications: {
            label: 'Applications',
            title: 'Applications Received',
            description:
                'Review provider applications, track statuses, and manage applicant decisions.',
            primaryAction: { label: 'Review Applications', id: 'pipeline-cta-review-apps', type: 'button' },
            secondaryAction: { label: 'Export List', id: 'pipeline-cta-export-apps', type: 'button' }
        }
    };

    const api = {
        render,
        mount,
        escapeHtml,
        PRESETS
    };

    global.pageContextHeader = api;
    global.mountPageContextHeader = mount;
})(typeof window !== 'undefined' ? window : globalThis);
