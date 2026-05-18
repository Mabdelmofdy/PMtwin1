/**
 * UI helpers for matching readiness on publish (create/edit opportunity).
 */
(function (global) {
    function escapeHtml(text) {
        if (text == null) return '';
        const el = document.createElement('div');
        el.textContent = String(text);
        return el.innerHTML;
    }

    function buildListItems(report) {
        const items = [];
        (report.missingFields || []).forEach((f) => {
            items.push({ text: f, critical: true });
        });
        (report.warnings || []).forEach((f) => {
            if (!(report.missingFields || []).includes(f)) {
                items.push({ text: f, critical: false });
            }
        });
        return items;
    }

    function injectReadinessStyles() {
        if (document.getElementById('matching-readiness-styles')) return;
        const style = document.createElement('style');
        style.id = 'matching-readiness-styles';
        style.textContent = `
.matching-readiness-modal-root:not([hidden]) { display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:10050; }
.matching-readiness-backdrop { position:absolute; inset:0; background:rgba(15,23,42,.45); }
.matching-readiness-dialog { position:relative; z-index:1; max-width:28rem; width:calc(100% - 2rem); background:var(--surface-card,#fff); border-radius:12px; box-shadow:0 20px 40px rgba(0,0,0,.15); padding:1.25rem 1.5rem; }
.matching-readiness-dialog__title { font-size:1.15rem; margin:0 0 .5rem; }
.matching-readiness-dialog__message { margin:0 0 .75rem; color:var(--text-muted,#64748b); font-size:.9rem; }
.matching-readiness-dialog__list { margin:0 0 .75rem 1.1rem; padding:0; font-size:.9rem; }
.matching-readiness-dialog__list li.critical { color:var(--danger,#b91c1c); font-weight:500; }
.matching-readiness-dialog__hint { font-size:.8rem; color:var(--text-muted,#64748b); margin:0 0 1rem; }
.matching-readiness-dialog__actions { display:flex; gap:.5rem; justify-content:flex-end; flex-wrap:wrap; }
.readiness-inline { display:flex; align-items:center; gap:.5rem; font-size:.875rem; margin:.75rem 0; padding:.5rem .75rem; border-radius:8px; background:var(--surface-muted,#f1f5f9); }
.readiness-inline.readiness--ready { border-left:3px solid var(--success,#059669); }
.readiness-inline.readiness--warning { border-left:3px solid var(--warning,#d97706); }
.readiness-inline.readiness--incomplete { border-left:3px solid var(--danger,#dc2626); }
`;
        document.head.appendChild(style);
    }

    function getModal() {
        let root = document.getElementById('matching-readiness-modal-root');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'matching-readiness-modal-root';
        root.className = 'matching-readiness-modal-root';
        root.setAttribute('hidden', 'hidden');
        root.innerHTML = [
            '<div class="matching-readiness-backdrop" data-readiness-dismiss></div>',
            '<div class="matching-readiness-dialog" role="dialog" aria-modal="true" aria-labelledby="matching-readiness-title">',
            '  <div class="matching-readiness-dialog__inner">',
            '    <h2 id="matching-readiness-title" class="matching-readiness-dialog__title"></h2>',
            '    <p class="matching-readiness-dialog__message"></p>',
            '    <ul class="matching-readiness-dialog__list"></ul>',
            '    <p class="matching-readiness-dialog__hint"></p>',
            '    <div class="matching-readiness-dialog__actions">',
            '      <button type="button" class="btn btn-outline" data-readiness-fix>Fix now</button>',
            '      <button type="button" class="btn btn-primary" data-readiness-publish>Publish anyway</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(root);
        injectReadinessStyles();
        return root;
    }

    /**
     * @param {object} report
     * @returns {Promise<'publish'|'fix'|'blocked'>}
     */
    function confirmPublishWithReadiness(report) {
        return new Promise((resolve) => {
            if (!report) {
                resolve('publish');
                return;
            }
            if (!report.canPublish) {
                showRequiredModal(report, resolve);
                return;
            }
            if (report.status === 'ready') {
                resolve('publish');
                return;
            }
            showImproveModal(report, resolve);
        });
    }

    function showRequiredModal(report, resolve) {
        const root = getModal();
        root.querySelector('.matching-readiness-dialog__title').textContent = 'Required before publish';
        root.querySelector('.matching-readiness-dialog__message').textContent =
            'Please complete the required fields below before publishing.';
        fillList(root, report);
        root.querySelector('.matching-readiness-dialog__hint').textContent =
            'These fields are needed for a valid opportunity.';
        root.querySelector('[data-readiness-publish]').hidden = true;
        root.querySelector('[data-readiness-fix]').textContent = 'Fix now';
        bindModal(root, () => resolve('blocked'), () => resolve('fix'));
        root.removeAttribute('hidden');
    }

    function showImproveModal(report, resolve) {
        const root = getModal();
        root.querySelector('.matching-readiness-dialog__title').textContent = 'Improve your matching results';
        root.querySelector('.matching-readiness-dialog__message').textContent =
            'Your opportunity can be published, but adding the missing details below will improve match quality.';
        fillList(root, report);
        root.querySelector('.matching-readiness-dialog__hint').textContent =
            'Readiness score: ' + (report.score != null ? report.score + '%' : '—') + ' · Matching works best when Need/Offer posts include full scope, exchange, and timeline details.';
        root.querySelector('[data-readiness-publish]').hidden = false;
        root.querySelector('[data-readiness-publish]').textContent = 'Publish anyway';
        root.querySelector('[data-readiness-fix]').textContent = 'Fix now';
        bindModal(root, () => resolve('publish'), () => resolve('fix'));
        root.removeAttribute('hidden');
    }

    function fillList(root, report) {
        const ul = root.querySelector('.matching-readiness-dialog__list');
        const items = buildListItems(report);
        ul.innerHTML = items.map((it) =>
            '<li' + (it.critical ? ' class="critical"' : '') + '>' + escapeHtml(it.text) + '</li>'
        ).join('');
    }

    function bindModal(root, onPublish, onFix) {
        const cleanup = () => {
            root.setAttribute('hidden', 'hidden');
        };
        root.querySelector('[data-readiness-publish]').onclick = () => { cleanup(); onPublish(); };
        root.querySelector('[data-readiness-fix]').onclick = () => { cleanup(); onFix(); };
        root.querySelector('[data-readiness-dismiss]').onclick = () => { cleanup(); onFix(); };
    }

    function renderInlineIndicator(mountEl, report) {
        if (!mountEl || !report) return;
        mountEl.innerHTML = ''
            + '<div class="readiness-inline ' + escapeHtml(report.indicatorClass) + '" role="status">'
            + '<strong>' + escapeHtml(report.indicatorLabel) + '</strong>'
            + '<span> · ' + escapeHtml(String(report.score)) + '% match-ready</span>'
            + '</div>';
        mountEl.hidden = false;
    }

    function updateReviewStepIndicator(report) {
        const mount = document.getElementById('matching-readiness-indicator');
        if (mount) renderInlineIndicator(mount, report);
    }

    global.MatchingReadinessUI = {
        confirmPublishWithReadiness,
        renderInlineIndicator,
        updateReviewStepIndicator
    };
})(typeof window !== 'undefined' ? window : globalThis);
