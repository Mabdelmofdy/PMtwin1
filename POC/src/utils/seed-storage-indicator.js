/**
 * Seed vs localStorage trace — compares browser storage counts to bundled JSON canonical seed.
 * Used on list pages and a global bar so POC testers can spot stale localStorage merges.
 */
(function (global) {
    'use strict';

    var SEED_VERSION_KEY = 'pmtwin_seed_version';
    var CACHE_MS = 60000;
    var canonicalCache = null;
    var canonicalCacheAt = 0;
    var refreshTimer = null;
    var traceEventsBound = false;

    function isSeedTraceEnabled() {
        var cfg = global.CONFIG && global.CONFIG.SEED_TRACE;
        return !!(cfg && cfg.enabled === true);
    }

    function removeTraceUi() {
        var bar = document.getElementById('seed-storage-global-bar');
        if (bar) bar.remove();
        document.querySelectorAll('[id^="seed-storage-hint-wrap-"]').forEach(function (el) {
            el.remove();
        });
        document.querySelectorAll('#seed-canonical-compare-mount').forEach(function (el) {
            el.innerHTML = '';
        });
    }

    /**
     * Domain registry mirrors data-service initializeFromJSON + mergeDemoData sources.
     * @type {Record<string, { label: string, storageKey: string, files: string[], getStorage?: function(): Promise<number> }>}
     */
    var DOMAINS = {
        opportunities: {
            label: 'Opportunities',
            storageKey: 'pmtwin_opportunities',
            files: ['opportunities.json', 'demo-40-opportunities.json']
        },
        users: {
            label: 'Users',
            storageKey: 'pmtwin_users',
            files: ['users.json', 'demo-users.json', 'seed-controlled-users.json', 'demo-pending-users.json']
        },
        companies: {
            label: 'Companies',
            storageKey: 'pmtwin_companies',
            files: ['companies.json', 'demo-companies.json']
        },
        applications: {
            label: 'Applications',
            storageKey: 'pmtwin_applications',
            files: ['applications.json', 'demo-applications.json']
        },
        contracts: {
            label: 'Contracts',
            storageKey: 'pmtwin_contracts',
            files: ['contracts.json', 'demo-contracts.json']
        },
        deals: {
            label: 'Deals',
            storageKey: 'pmtwin_deals',
            files: ['demo-deals.json']
        },
        notifications: {
            label: 'Notifications',
            storageKey: 'pmtwin_notifications',
            files: ['notifications.json', 'demo-notifications.json']
        },
        connections: {
            label: 'Connections',
            storageKey: 'pmtwin_connections',
            files: ['connections.json', 'demo-connections.json']
        },
        post_matches: {
            label: 'Post matches',
            storageKey: 'pmtwin_post_matches',
            files: ['demo-post-matches.json']
        },
        negotiations: {
            label: 'Negotiations',
            storageKey: 'pmtwin_negotiations',
            files: ['demo-negotiations.json']
        }
    };

    function escapeHtml(text) {
        if (text == null) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function dataBasePath() {
        var cfg = global.CONFIG || {};
        return cfg.BASE_PATH ? String(cfg.BASE_PATH) : '';
    }

    function mergeByIdCount(recordLists) {
        var byId = new Map();
        (recordLists || []).forEach(function (list) {
            (list || []).forEach(function (row) {
                if (row && row.id != null && row.id !== '') {
                    byId.set(String(row.id), row);
                }
            });
        });
        return byId.size;
    }

    async function fetchJsonRecords(filename) {
        try {
            var res = await fetch(dataBasePath() + 'data/' + filename);
            if (!res.ok) return [];
            var json = await res.json();
            return Array.isArray(json.data) ? json.data : [];
        } catch (e) {
            return [];
        }
    }

    async function loadCanonicalCounts(force) {
        var now = Date.now();
        if (!force && canonicalCache && now - canonicalCacheAt < CACHE_MS) {
            return canonicalCache;
        }
        var counts = {};
        var keys = Object.keys(DOMAINS);
        await Promise.all(
            keys.map(async function (key) {
                var domain = DOMAINS[key];
                var lists = await Promise.all(domain.files.map(fetchJsonRecords));
                counts[key] = mergeByIdCount(lists);
            })
        );
        canonicalCache = counts;
        canonicalCacheAt = now;
        return counts;
    }

    function readStorageArrayLength(storageKey) {
        var storage = global.storageService || global.window && global.window.storageService;
        if (storage && typeof storage.get === 'function') {
            var val = storage.get(storageKey);
            return Array.isArray(val) ? val.length : 0;
        }
        try {
            var raw = global.localStorage && global.localStorage.getItem(storageKey);
            if (!raw) return 0;
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
            return 0;
        }
    }

    async function getStorageCount(domainKey) {
        var domain = DOMAINS[domainKey];
        if (!domain) return 0;
        if (typeof domain.getStorage === 'function') {
            return domain.getStorage();
        }
        var ds = global.dataService;
        if (domainKey === 'opportunities' && ds && typeof ds.getOpportunities === 'function') {
            return (await ds.getOpportunities()).length;
        }
        if (domainKey === 'users' && ds && typeof ds.getUsers === 'function') {
            return (await ds.getUsers()).length;
        }
        if (domainKey === 'companies' && ds && typeof ds.getCompanies === 'function') {
            return (await ds.getCompanies()).length;
        }
        if (domainKey === 'applications' && ds && typeof ds.getApplications === 'function') {
            return (await ds.getApplications()).length;
        }
        if (domainKey === 'contracts' && ds && typeof ds.getContracts === 'function') {
            return (await ds.getContracts()).length;
        }
        if (domainKey === 'deals' && ds && typeof ds.getDeals === 'function') {
            return (await ds.getDeals()).length;
        }
        if (domainKey === 'notifications' && ds && typeof ds.getNotifications === 'function') {
            return (await ds.getNotifications()).length;
        }
        if (domainKey === 'connections' && ds && typeof ds.getConnections === 'function') {
            return (await ds.getConnections()).length;
        }
        if (domainKey === 'post_matches' && ds && typeof ds.getPostMatches === 'function') {
            return (await ds.getPostMatches()).length;
        }
        if (domainKey === 'negotiations' && ds && typeof ds.getNegotiations === 'function') {
            return (await ds.getNegotiations()).length;
        }
        return readStorageArrayLength(domain.storageKey);
    }

    function getStoredSeedVersion() {
        var storage = global.storageService || global.window && global.window.storageService;
        if (storage && typeof storage.get === 'function') {
            return storage.get(SEED_VERSION_KEY) || '—';
        }
        try {
            return (global.localStorage && global.localStorage.getItem(SEED_VERSION_KEY)) || '—';
        } catch (e) {
            return '—';
        }
    }

    function getExpectedSeedVersion() {
        var ds = global.dataService;
        if (ds && ds.CURRENT_SEED_VERSION) return ds.CURRENT_SEED_VERSION;
        return '2.0.0';
    }

    function describeDelta(storage, canonical) {
        var delta = storage - canonical;
        if (delta === 0) {
            return { delta: 0, text: 'in sync', className: 'is-sync' };
        }
        if (delta > 0) {
            return {
                delta: delta,
                text: '+' + delta + ' extra in browser',
                className: 'is-extra'
            };
        }
        return {
            delta: delta,
            text: Math.abs(delta) + ' missing vs seed',
            className: 'is-missing'
        };
    }

    /**
     * @returns {Promise<Array<{ key: string, label: string, storage: number, canonical: number, delta: number, deltaText: string, className: string }>>}
     */
    async function getSnapshot(forceCanonical) {
        var canonical = await loadCanonicalCounts(forceCanonical);
        var keys = Object.keys(DOMAINS);
        var rows = await Promise.all(
            keys.map(async function (key) {
                var storage = await getStorageCount(key);
                var canonicalCount = canonical[key] || 0;
                var meta = describeDelta(storage, canonicalCount);
                return {
                    key: key,
                    label: DOMAINS[key].label,
                    storage: storage,
                    canonical: canonicalCount,
                    delta: meta.delta,
                    deltaText: meta.text,
                    className: meta.className
                };
            })
        );
        return rows;
    }

    function renderInlineRow(row) {
        return (
            '<p class="seed-storage-hint ' +
            escapeHtml(row.className) +
            '" role="status">' +
            '<span class="seed-storage-hint__icon" aria-hidden="true"><i class="ph-duotone ph-database"></i></span>' +
            '<span class="seed-storage-hint__text">' +
            '<span class="seed-storage-hint__label">Seed trace · ' +
            escapeHtml(row.label) +
            ':</span> ' +
            'Storage <strong>' +
            row.storage +
            '</strong> · Canonical <strong>' +
            row.canonical +
            '</strong>' +
            (row.delta !== 0
                ? ' · <span class="seed-storage-hint__delta">' + escapeHtml(row.deltaText) + '</span>'
                : ' · <span class="seed-storage-hint__delta">in sync</span>') +
            '</span></p>'
        );
    }

    function ensureStyles() {
        if (document.getElementById('seed-storage-indicator-styles')) return;
        var style = document.createElement('style');
        style.id = 'seed-storage-indicator-styles';
        style.textContent =
            '.seed-storage-hint-wrap{margin:.35rem 0 0;}' +
            '.seed-storage-hint{display:flex;align-items:flex-start;gap:.45rem;margin:0;padding:.45rem .65rem;border-radius:8px;font-size:.78rem;line-height:1.45;color:var(--text-muted,#64748b);background:var(--surface-muted,#f8fafc);border:1px solid var(--border-subtle,#e2e8f0);}' +
            '.seed-storage-hint__icon{margin-top:.1rem;color:var(--text-muted,#94a3b8);}' +
            '.seed-storage-hint__label{font-weight:600;color:var(--text-secondary,#475569);}' +
            '.seed-storage-hint.is-sync{border-left:3px solid var(--success,#059669);}' +
            '.seed-storage-hint.is-extra{border-left:3px solid var(--warning,#d97706);}' +
            '.seed-storage-hint.is-missing{border-left:3px solid var(--danger,#dc2626);}' +
            '.seed-storage-hint--loading{opacity:.75;font-style:italic;}' +
            '.seed-storage-hint__delta{font-weight:500;}' +
            '.seed-storage-global-bar{position:fixed;bottom:0;left:0;right:0;z-index:10040;font-size:.75rem;pointer-events:none;}' +
            '.seed-storage-global-bar__inner{pointer-events:auto;margin:0 auto;max-width:1200px;padding:0 .75rem .55rem;}' +
            '.seed-storage-global-bar__toggle{display:flex;align-items:center;gap:.35rem;margin-left:auto;padding:.3rem .65rem;border-radius:999px 999px 0 0;border:1px solid var(--border-subtle,#cbd5e1);border-bottom:none;background:var(--surface-card,#fff);color:var(--text-secondary,#475569);font-size:.72rem;font-weight:600;cursor:pointer;box-shadow:0 -4px 16px rgba(15,23,42,.08);}' +
            '.seed-storage-global-bar__toggle:hover{background:var(--surface-muted,#f8fafc);}' +
            '.seed-storage-global-bar__toggle-badge{display:inline-flex;align-items:center;justify-content:center;min-width:1.1rem;height:1.1rem;padding:0 .25rem;border-radius:999px;background:var(--warning,#d97706);color:#fff;font-size:.62rem;font-weight:700;}' +
            '.seed-storage-global-bar.is-open .seed-storage-global-bar__toggle{border-radius:999px 999px 0 0;}' +
            '.seed-storage-global-bar__panel{margin-left:auto;max-width:720px;background:var(--surface-card,#fff);border:1px solid var(--border-subtle,#cbd5e1);border-radius:12px 12px 0 0;box-shadow:0 -8px 24px rgba(15,23,42,.12);padding:.65rem .85rem .75rem;}' +
            '.seed-storage-global-bar__head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.45rem;}' +
            '.seed-storage-global-bar__title{margin:0;font-size:.78rem;font-weight:700;color:var(--text-primary,#0f172a);}' +
            '.seed-storage-global-bar__meta{font-size:.68rem;color:var(--text-muted,#64748b);}' +
            '.seed-storage-global-bar__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr));gap:.35rem;}' +
            '.seed-storage-global-bar__chip{display:flex;flex-direction:column;gap:.05rem;padding:.35rem .45rem;border-radius:8px;background:var(--surface-muted,#f8fafc);border:1px solid var(--border-subtle,#e2e8f0);}' +
            '.seed-storage-global-bar__chip.is-extra{background:#fffbeb;border-color:#fde68a;}' +
            '.seed-storage-global-bar__chip.is-missing{background:#fef2f2;border-color:#fecaca;}' +
            '.seed-storage-global-bar__chip-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted,#64748b);}' +
            '.seed-storage-global-bar__chip-value{font-size:.72rem;font-weight:600;color:var(--text-primary,#0f172a);}' +
            '.seed-storage-global-bar__actions{display:flex;gap:.35rem;margin-top:.5rem;justify-content:flex-end;}' +
            '.seed-storage-global-bar__actions .btn{font-size:.68rem;padding:.2rem .5rem;}' +
            '.seed-canonical-compare{margin:.5rem 0 0;padding:.55rem .65rem;border-radius:8px;background:var(--surface-muted,#f8fafc);border:1px dashed var(--border-subtle,#cbd5e1);font-size:.75rem;color:var(--text-muted,#64748b);}' +
            '.seed-canonical-compare strong{color:var(--text-primary,#0f172a);}';
        document.head.appendChild(style);
    }

    function mountGlobalBar() {
        if (!isSeedTraceEnabled()) return;
        ensureStyles();
        if (document.getElementById('seed-storage-global-bar')) return;
        var root = document.createElement('div');
        root.id = 'seed-storage-global-bar';
        root.className = 'seed-storage-global-bar';
        root.innerHTML =
            '<div class="seed-storage-global-bar__inner">' +
            '<button type="button" class="seed-storage-global-bar__toggle" aria-expanded="false" aria-controls="seed-storage-global-panel">' +
            '<i class="ph-duotone ph-database" aria-hidden="true"></i>' +
            '<span class="seed-storage-global-bar__toggle-label">Seed trace</span>' +
            '<span class="seed-storage-global-bar__toggle-badge" hidden></span>' +
            '</button>' +
            '<div id="seed-storage-global-panel" class="seed-storage-global-bar__panel" hidden role="region" aria-label="Seed vs storage counts">' +
            '<div class="seed-storage-global-bar__head">' +
            '<p class="seed-storage-global-bar__title">localStorage vs canonical JSON seed</p>' +
            '<span class="seed-storage-global-bar__meta" id="seed-storage-global-meta"></span>' +
            '</div>' +
            '<div class="seed-storage-global-bar__grid" id="seed-storage-global-grid"></div>' +
            '<div class="seed-storage-global-bar__actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="seed-storage-refresh-btn">Refresh</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="seed-storage-reset-btn">Reset to seed</button>' +
            '</div>' +
            '</div></div>';
        document.body.appendChild(root);

        var toggle = root.querySelector('.seed-storage-global-bar__toggle');
        var panel = document.getElementById('seed-storage-global-panel');
        toggle.addEventListener('click', function () {
            var open = root.classList.toggle('is-open');
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) refreshGlobalBar(true);
        });
        document.getElementById('seed-storage-refresh-btn').addEventListener('click', function () {
            refreshGlobalBar(true);
        });
        document.getElementById('seed-storage-reset-btn').addEventListener('click', function () {
            if (typeof global.resetAppData === 'function') {
                global.resetAppData();
            } else if (global.confirm && global.confirm('Reset all data to bundled seed?')) {
                global.location.reload();
            }
        });
    }

    async function refreshGlobalBar(force) {
        if (!isSeedTraceEnabled()) {
            removeTraceUi();
            return;
        }
        mountGlobalBar();
        var root = document.getElementById('seed-storage-global-bar');
        if (!root) return;
        var grid = document.getElementById('seed-storage-global-grid');
        var meta = document.getElementById('seed-storage-global-meta');
        var badge = root.querySelector('.seed-storage-global-bar__toggle-badge');
        if (!grid) return;

        var rows = await getSnapshot(force);
        var extras = rows.filter(function (r) {
            return r.delta !== 0;
        }).length;

        if (badge) {
            if (extras > 0) {
                badge.hidden = false;
                badge.textContent = String(extras);
            } else {
                badge.hidden = true;
                badge.textContent = '';
            }
        }

        if (meta) {
            meta.textContent =
                'Seed v' +
                getStoredSeedVersion() +
                ' (bundled ' +
                getExpectedSeedVersion() +
                ') · ' +
                (extras ? extras + ' domain(s) out of sync' : 'All domains in sync');
        }

        grid.innerHTML = rows
            .map(function (row) {
                return (
                    '<div class="seed-storage-global-bar__chip ' +
                    escapeHtml(row.className) +
                    '">' +
                    '<span class="seed-storage-global-bar__chip-label">' +
                    escapeHtml(row.label) +
                    '</span>' +
                    '<span class="seed-storage-global-bar__chip-value">' +
                    row.storage +
                    ' / ' +
                    row.canonical +
                    '</span>' +
                    '</div>'
                );
            })
            .join('');
    }

    /**
     * Insert or update a page-level hint after an anchor element.
     * @param {string|Element} anchorSelector
     * @param {string} domainKey
     */
    async function syncPageHint(anchorSelector, domainKey) {
        if (!isSeedTraceEnabled()) {
            if (domainKey) {
                var stale = document.getElementById('seed-storage-hint-wrap-' + domainKey);
                if (stale) stale.remove();
            }
            return;
        }
        if (!domainKey || !DOMAINS[domainKey]) return;
        var anchor =
            typeof anchorSelector === 'string'
                ? document.querySelector(anchorSelector)
                : anchorSelector;
        if (!anchor) return;

        ensureStyles();
        var wrapId = 'seed-storage-hint-wrap-' + domainKey;
        var wrap = document.getElementById(wrapId);
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = wrapId;
            wrap.className = 'seed-storage-hint-wrap';
            anchor.insertAdjacentElement('afterend', wrap);
        }

        wrap.innerHTML = '<p class="seed-storage-hint seed-storage-hint--loading" role="status">Loading seed trace…</p>';

        var canonical = await loadCanonicalCounts(false);
        var storage = await getStorageCount(domainKey);
        var row = {
            key: domainKey,
            label: DOMAINS[domainKey].label,
            storage: storage,
            canonical: canonical[domainKey] || 0,
            className: describeDelta(storage, canonical[domainKey] || 0).className,
            delta: storage - (canonical[domainKey] || 0),
            deltaText: describeDelta(storage, canonical[domainKey] || 0).text
        };
        wrap.innerHTML = renderInlineRow(row);
    }

    /**
     * Render admin settings / health compare strip into a mount element.
     * @param {string|Element} mountSelector
     */
    async function renderCompareStrip(mountSelector) {
        var mount =
            typeof mountSelector === 'string'
                ? document.querySelector(mountSelector)
                : mountSelector;
        if (!mount) return;
        if (!isSeedTraceEnabled()) {
            mount.innerHTML = '';
            return;
        }

        ensureStyles();
        mount.innerHTML = '<p class="seed-canonical-compare">Loading canonical comparison…</p>';
        var rows = await getSnapshot(false);
        var outOfSync = rows.filter(function (r) {
            return r.delta !== 0;
        });
        var parts = rows.map(function (r) {
            return (
                escapeHtml(r.label) +
                ' <strong>' +
                r.storage +
                '</strong>/<strong>' +
                r.canonical +
                '</strong>'
            );
        });
        mount.innerHTML =
            '<p class="seed-canonical-compare" role="status">' +
            '<strong>Storage vs canonical seed:</strong> ' +
            parts.join(' · ') +
            (outOfSync.length
                ? ' · <span class="seed-storage-hint__delta">' +
                  outOfSync.length +
                  ' domain(s) differ — run Reset to seed or clear site data.</span>'
                : ' · All tracked domains in sync.') +
            '</p>';
    }

    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
            refreshGlobalBar(false);
        }, 160);
    }

    function init() {
        if (!isSeedTraceEnabled()) {
            removeTraceUi();
            return;
        }
        mountGlobalBar();
        refreshGlobalBar(false);
        if (traceEventsBound) return;
        traceEventsBound = true;
        [
            'pmtwin:data-changed',
            'pmtwin:opportunities-updated',
            'pmtwin:deals-updated',
            'pmtwin:contracts-updated',
            'pmtwin:notifications-updated',
            'pmtwin:post-matches-updated'
        ].forEach(function (eventName) {
            global.addEventListener(eventName, scheduleRefresh);
        });
    }

    global.seedStorageIndicator = {
        DOMAINS: DOMAINS,
        isEnabled: isSeedTraceEnabled,
        init: init,
        getSnapshot: getSnapshot,
        syncPageHint: syncPageHint,
        refreshGlobalBar: refreshGlobalBar,
        renderCompareStrip: renderCompareStrip,
        removeTraceUi: removeTraceUi,
        invalidateCanonicalCache: function () {
            canonicalCache = null;
            canonicalCacheAt = 0;
        }
    };

    global.refreshSeedHint = function (anchorSelector, domainKey) {
        return global.seedStorageIndicator.syncPageHint(anchorSelector, domainKey);
    };
})(typeof window !== 'undefined' ? window : this);
