/**
 * Admin Audit — activity logs, CSV export, and user/company documents (checker view).
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatAuditAction(action) {
    if (!action) return 'Event';
    return String(action)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function showAuditMessage(text, variant) {
    const el = document.getElementById('audit-inline-message');
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
    el.classList.remove('is-success', 'is-warning');
    if (variant === 'success') el.classList.add('is-success');
    else if (variant === 'warning') el.classList.add('is-warning');
    if (text) {
        window.clearTimeout(showAuditMessage._t);
        showAuditMessage._t = window.setTimeout(() => {
            el.hidden = true;
            el.textContent = '';
            el.classList.remove('is-success', 'is-warning');
        }, 5000);
    }
}

/** Read entityType / entityId from hash query, e.g. #/admin/audit?entityType=deal&entityId=abc */
function readAuditQueryFromHash() {
    const h = window.location.hash.substring(1);
    const qIdx = h.indexOf('?');
    if (qIdx === -1) return { entityType: '', entityId: '' };
    try {
        const sp = new URLSearchParams(h.substring(qIdx + 1));
        return {
            entityType: (sp.get('entityType') || '').trim(),
            entityId: (sp.get('entityId') || '').trim()
        };
    } catch {
        return { entityType: '', entityId: '' };
    }
}

function applyAuditFiltersFromUrl() {
    const { entityType, entityId } = readAuditQueryFromHash();
    const et = document.getElementById('filter-entity-type');
    if (et && entityType) et.value = entityType;
    const eid = document.getElementById('filter-entity-id');
    if (eid && entityId) eid.value = entityId;
}

function mountAuditPageHeader() {
    const mount = document.getElementById('page-context-header-mount');
    if (!mount || !window.mountPageContextHeader) return;
    window.mountPageContextHeader(mount, 'adminAudit');
    const exportCta = document.getElementById('page-cta-audit-export');
    if (exportCta) {
        exportCta.addEventListener('click', e => {
            e.preventDefault();
            exportAuditCsv();
        });
    }
}

async function initAdminAudit() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    mountAuditPageHeader();
    await loadUsersForFilter();
    applyAuditFiltersFromUrl();
    setupFilters();
    setupViewSwitcher();
    setupHashQuerySync();
    await loadAuditLogs();
}

function setupHashQuerySync() {
    window.addEventListener('hashchange', () => {
        if (!window.location.hash.includes('/admin/audit')) return;
        applyAuditFiltersFromUrl();
        loadAuditLogs();
    });
}

function setupViewSwitcher() {
    const tabs = document.querySelectorAll('.audit-seg');
    const panelLogs = document.getElementById('audit-view-logs');
    const panelDocs = document.getElementById('audit-view-docs');
    if (!panelLogs || !panelDocs) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            tabs.forEach(t => {
                t.classList.remove('is-active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('is-active');
            tab.setAttribute('aria-selected', 'true');

            if (view === 'logs') {
                panelLogs.classList.add('audit-view-panel-active');
                panelLogs.hidden = false;
                panelDocs.classList.remove('audit-view-panel-active');
                panelDocs.hidden = true;
            } else {
                panelDocs.classList.add('audit-view-panel-active');
                panelDocs.hidden = false;
                panelLogs.classList.remove('audit-view-panel-active');
                panelLogs.hidden = true;
                loadDocumentsView();
            }
        });
    });

    const applyDocsBtn = document.getElementById('apply-docs-filters');
    if (applyDocsBtn) {
        applyDocsBtn.addEventListener('click', () => loadDocumentsView());
    }
    const searchDocs = document.getElementById('filter-docs-search');
    if (searchDocs) {
        searchDocs.addEventListener('keyup', e => {
            if (e.key === 'Enter') loadDocumentsView();
        });
    }
}

async function loadDocumentsView() {
    const container = document.getElementById('audit-docs-list');
    if (!container) return;

    container.innerHTML = '<div class="spinner" aria-hidden="true"></div>';

    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const typeFilter = document.getElementById('filter-docs-type')?.value || '';
        const searchFilter = (document.getElementById('filter-docs-search')?.value || '').toLowerCase().trim();

        let entities = [
            ...users.map(u => ({ ...u, entityType: 'user' })),
            ...companies.map(c => ({ ...c, entityType: 'company' }))
        ];

        if (typeFilter === 'user') {
            entities = entities.filter(e => e.entityType === 'user');
        } else if (typeFilter === 'company') {
            entities = entities.filter(e => e.entityType === 'company');
        }

        if (searchFilter) {
            entities = entities.filter(e => {
                const name = (e.profile?.name || '').toLowerCase();
                const email = (e.email || '').toLowerCase();
                return name.includes(searchFilter) || email.includes(searchFilter);
            });
        }

        if (entities.length === 0) {
            container.innerHTML =
                '<div class="empty-state">No users or companies match the filters.</div>';
            return;
        }

        const usersPath =
            typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_USERS
                ? CONFIG.ROUTES.ADMIN_USERS
                : '/admin/users';

        container.innerHTML = entities
            .map(entity => {
                const isCompany = entity.entityType === 'company';
                const name = entity.profile?.name || entity.email || entity.id;
                const docs = Array.isArray(entity.profile?.documents) ? entity.profile.documents : [];
                const sb = window.statusBadgeSystem;
                const statusCtx = isCompany ? 'user' : 'user';
                const statusLabel =
                    sb && typeof sb.getStatusLabel === 'function'
                        ? sb.getStatusLabel(entity.status, statusCtx)
                        : entity.status || '—';
                const statusCls =
                    sb && typeof sb.getStatusBadgeClass === 'function'
                        ? sb.getStatusBadgeClass(entity.status, statusCtx)
                        : entity.status === 'active'
                          ? 'badge--success'
                          : entity.status === 'pending'
                            ? 'badge--warning'
                            : 'badge--neutral';
                const typeLabel = isCompany ? 'Company' : 'User';

                const docsRows =
                    docs.length === 0
                        ? '<tr><td colspan="3" class="audit-doc-muted">No documents</td></tr>'
                        : docs
                              .map(doc => {
                                  const label = escapeHtml(doc.label || doc.type || 'Document');
                                  const fileName = escapeHtml(doc.fileName || '—');
                                  const hasData = typeof doc.data === 'string' && doc.data.length > 0;
                                  const viewCell = hasData
                                      ? `<a href="${escapeHtml(doc.data)}" target="_blank" rel="noopener" class="audit-doc-view-link">View</a>`
                                      : '<span class="audit-doc-muted">File not available</span>';
                                  return `<tr><td>${label}</td><td>${fileName}</td><td>${viewCell}</td></tr>`;
                              })
                              .join('');

                const detailRoute = `${usersPath}/${encodeURIComponent(entity.id)}`;

                return `
                <div class="audit-doc-card" data-entity-id="${escapeHtml(entity.id)}">
                    <div class="audit-doc-card-header">
                        <h3 class="audit-doc-card-title">${escapeHtml(name)}</h3>
                        ${
                            sb && typeof sb.renderBadge === 'function'
                                ? sb.renderBadge(typeLabel, isCompany ? 'teal' : 'neutral')
                                : `<span class="badge badge--neutral">${escapeHtml(typeLabel)}</span>`
                        }
                        <span class="badge ${statusCls}">${escapeHtml(statusLabel)}</span>
                        <span class="audit-doc-card-meta">${escapeHtml(entity.email || '')}</span>
                        <a href="#" data-route="${escapeHtml(detailRoute)}" class="btn btn-secondary btn-sm">View account</a>
                    </div>
                    <div class="audit-doc-table-wrap">
                    <table class="audit-doc-table">
                        <thead><tr><th>Document type</th><th>File name</th><th>Action</th></tr></thead>
                        <tbody>${docsRows}</tbody>
                    </table>
                    </div>
                </div>
            `;
            })
            .join('');
    } catch (error) {
        console.error('Error loading documents view:', error);
        container.innerHTML =
            '<div class="empty-state">Could not load user and company documents. Try again.</div>';
    }
}

async function loadUsersForFilter() {
    const userSelect = document.getElementById('filter-user');
    if (!userSelect) return;

    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const opts = [
            '<option value="">Everyone</option>',
            ...users.map(u => {
                const label = escapeHtml(u.email || u.id);
                return `<option value="${escapeHtml(u.id)}">${label}</option>`;
            }),
            ...companies.map(c => {
                const label = escapeHtml((c.email || c.id) + ' (Company)');
                return `<option value="${escapeHtml(c.id)}">${label}</option>`;
            })
        ];
        userSelect.innerHTML = opts.join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function setAuditLogsCount(n, loading) {
    const el = document.getElementById('audit-logs-count');
    if (!el) return;
    if (loading) {
        el.textContent = '…';
        return;
    }
    el.textContent = n === 0 ? 'No matches' : `${n} event${n === 1 ? '' : 's'}`;
}

async function loadAuditLogs() {
    const container = document.getElementById('audit-logs');
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
    setAuditLogsCount(0, true);

    try {
        const filters = {
            userId: document.getElementById('filter-user')?.value || undefined,
            entityType: document.getElementById('filter-entity-type')?.value || undefined,
            entityId: document.getElementById('filter-entity-id')?.value || undefined,
            startDate: document.getElementById('filter-start-date')?.value || undefined,
            endDate: document.getElementById('filter-end-date')?.value || undefined
        };

        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') delete filters[key];
        });

        let logs = await dataService.getAuditLogs(filters);

        const actionFilter = document.getElementById('filter-action')?.value;
        if (actionFilter) {
            logs = logs.filter(log => log.action === actionFilter);
        }

        const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase()?.trim();
        if (searchFilter) {
            logs = logs.filter(log => {
                const actionMatch = (log.action || '').toLowerCase().includes(searchFilter);
                const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
                const entityTypeMatch = (log.entityType || '').toLowerCase().includes(searchFilter);
                const entityIdMatch = (log.entityId || '').toLowerCase().includes(searchFilter);
                const userNameMatch = (log.userName || '').toLowerCase().includes(searchFilter);
                const ipMatch = (log.ipAddress || '').toLowerCase().includes(searchFilter);
                return (
                    actionMatch ||
                    detailsStr.includes(searchFilter) ||
                    entityTypeMatch ||
                    entityIdMatch ||
                    userNameMatch ||
                    ipMatch
                );
            });
        }

        const [users, companies] = await Promise.all([dataService.getUsers(), dataService.getCompanies()]);
        const entityById = new Map();
        users.forEach(u => entityById.set(u.id, u));
        companies.forEach(c => entityById.set(c.id, c));

        const logsWithUsers = logs.map(log => ({
            ...log,
            user: entityById.get(log.userId) || null
        }));

        delete container.dataset.exportLogs;

        if (logsWithUsers.length === 0) {
            container.innerHTML = '<div class="empty-state">No audit logs match these filters.</div>';
            setAuditLogsCount(0, false);
            container.setAttribute('aria-busy', 'false');
            return;
        }

        const template = await templateLoader.load('audit-log-item');

        const html = logsWithUsers
            .map(log => {
                const ts = log.timestamp ? new Date(log.timestamp) : null;
                const tsValid = ts && !Number.isNaN(ts.getTime());
                const details = log.details && typeof log.details === 'object' ? log.details : null;
                const hasDetails = details && Object.keys(details).length > 0;
                let detailsFormatted = '';
                try {
                    detailsFormatted = hasDetails ? JSON.stringify(details, null, 2) : '';
                } catch {
                    detailsFormatted = String(log.details);
                }

                const actor = log.user;
                const userDisplayName =
                    (log.userName && String(log.userName).trim()) ||
                    (actor?.profile?.name && String(actor.profile.name).trim()) ||
                    actor?.email ||
                    (log.userId ? `User ${log.userId}` : 'System');

                const accountLabel = actor
                    ? `${actor.email || '—'}${actor.role ? ` · ${actor.role}` : ''}`
                    : log.userId
                      ? `Unknown id ${log.userId}`
                      : '—';

                const ipDisplay = (log.ipAddress && String(log.ipAddress).trim()) || '—';

                const entitySummary =
                    log.entityType || log.entityId
                        ? [log.entityType, log.entityId].filter(Boolean).join(' · ')
                        : '—';

                const data = {
                    ...log,
                    actionFormatted: formatAuditAction(log.action),
                    timestampFormatted: tsValid ? ts.toLocaleString() : '—',
                    timestampIso: tsValid ? ts.toISOString() : '',
                    userDisplayName,
                    accountLabel,
                    ipDisplay,
                    entitySummary,
                    hasDetails,
                    detailsFormatted
                };
                return templateRenderer.render(template, data);
            })
            .join('');

        container.innerHTML = html;

        container.dataset.exportLogs = JSON.stringify(
            logsWithUsers.map(l => ({
                timestamp: l.timestamp,
                action: l.action,
                entityType: l.entityType || '',
                entityId: l.entityId || '',
                userId: l.userId,
                userName: l.userName || l.user?.profile?.name || '',
                userEmail: l.user?.email || '',
                ipAddress: l.ipAddress || '',
                details: l.details ? JSON.stringify(l.details) : ''
            }))
        );

        setAuditLogsCount(logsWithUsers.length, false);
    } catch (error) {
        console.error('Error loading audit logs:', error);
        container.innerHTML =
            '<div class="empty-state">Could not load audit logs. Check the console or try again.</div>';
        setAuditLogsCount(0, false);
    } finally {
        container.setAttribute('aria-busy', 'false');
    }
}

function exportAuditCsv() {
    const container = document.getElementById('audit-logs');
    const dataJson = container?.dataset?.exportLogs;
    if (!dataJson) {
        showAuditMessage('Apply filters first so the log list loads, then export.', 'warning');
        return;
    }
    let rows;
    try {
        rows = JSON.parse(dataJson);
    } catch {
        showAuditMessage('Nothing to export right now.', 'warning');
        return;
    }
    if (!rows.length) {
        showAuditMessage('No rows to export for the current filters.', 'warning');
        return;
    }
    const headers = [
        'timestamp',
        'action',
        'entityType',
        'entityId',
        'userId',
        'userName',
        'userEmail',
        'ipAddress',
        'details'
    ];
    const csvContent = [
        headers.join(','),
        ...rows.map(r =>
            headers
                .map(h => {
                    const v = (r[h] ?? '').toString();
                    return v.includes(',') || v.includes('"') || v.includes('\n')
                        ? '"' + v.replace(/"/g, '""') + '"'
                        : v;
                })
                .join(',')
        )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showAuditMessage(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'} to CSV.`, 'success');
}

function resetAuditFilters() {
    const ids = [
        'filter-user',
        'filter-entity-type',
        'filter-entity-id',
        'filter-action',
        'filter-search',
        'filter-start-date',
        'filter-end-date'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    loadAuditLogs();
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const exportBtn = document.getElementById('export-csv');
    const resetBtn = document.getElementById('reset-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => loadAuditLogs());
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportAuditCsv());
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetAuditFilters());
    }
    const searchEl = document.getElementById('filter-search');
    if (searchEl) {
        searchEl.addEventListener('keyup', e => {
            if (e.key === 'Enter') loadAuditLogs();
        });
    }
}
