/**
 * Admin Audit Component
 * Activity logs + User & company documents for Checker
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

async function initAdminAudit() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    await loadUsersForFilter();
    applyAuditFiltersFromUrl();
    await loadAuditLogs();
    setupFilters();
    setupViewSwitcher();
}

function setupViewSwitcher() {
    const tabs = document.querySelectorAll('.audit-view-tab');
    const panelLogs = document.getElementById('audit-view-logs');
    const panelDocs = document.getElementById('audit-view-docs');
    if (!panelLogs || !panelDocs) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            tabs.forEach(t => {
                t.classList.remove('audit-view-tab-active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('audit-view-tab-active');
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
        searchDocs.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadDocumentsView(); });
    }
}

async function loadDocumentsView() {
    const container = document.getElementById('audit-docs-list');
    if (!container) return;

    container.innerHTML = '<div class="spinner"></div>';

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
            container.innerHTML = '<div class="empty-state">No users or companies match the filters</div>';
            return;
        }

        container.innerHTML = entities.map(entity => {
            const isCompany = entity.entityType === 'company';
            const name = entity.profile?.name || entity.email || entity.id;
            const docs = Array.isArray(entity.profile?.documents) ? entity.profile.documents : [];
            const sb = window.statusBadgeSystem;
            const statusLabel =
                sb && typeof sb.getStatusLabel === 'function'
                    ? sb.getStatusLabel(entity.status, 'user')
                    : entity.status || '—';
            const statusCls =
                sb && typeof sb.getStatusBadgeClass === 'function'
                    ? sb.getStatusBadgeClass(entity.status, 'user')
                    : entity.status === 'active'
                      ? 'badge--success'
                      : entity.status === 'pending'
                        ? 'badge--warning'
                        : 'badge--neutral';
            const typeLabel = isCompany ? 'Company' : 'User';

            const docsRows = docs.length === 0
                ? '<tr><td colspan="3" class="audit-doc-muted">No documents</td></tr>'
                : docs.map(doc => {
                    const label = escapeHtml(doc.label || doc.type || 'Document');
                    const fileName = escapeHtml(doc.fileName || '—');
                    const hasData = typeof doc.data === 'string' && doc.data.length > 0;
                    const viewCell = hasData
                        ? `<a href="${escapeHtml(doc.data)}" target="_blank" rel="noopener" class="audit-doc-view-link">View</a>`
                        : '<span class="audit-doc-muted">File not available</span>';
                    return `<tr><td>${label}</td><td>${fileName}</td><td>${viewCell}</td></tr>`;
                }).join('');

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
                        <span class="audit-doc-card-meta">${escapeHtml(entity.email)}</span>
                        <a href="#" data-route="/admin/users/${escapeHtml(entity.id)}" class="btn btn-secondary btn-sm">View detail</a>
                    </div>
                    <table class="audit-doc-table">
                        <thead><tr><th>Document type</th><th>File name</th><th>Action</th></tr></thead>
                        <tbody>${docsRows}</tbody>
                    </table>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading documents view:', error);
        container.innerHTML = '<div class="empty-state">Error loading user and company documents</div>';
    }
}

async function loadUsersForFilter() {
    const userSelect = document.getElementById('filter-user');
    if (!userSelect) return;
    
    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const allPeople = [...users, ...companies];
        userSelect.innerHTML = '<option value="">All Users & Companies</option>' +
            allPeople.map(u => {
                const typeLabel = u.profile?.type === 'company' ? ' (Company)' : '';
                return `<option value="${u.id}">${u.email}${typeLabel}</option>`;
            }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadAuditLogs() {
    const container = document.getElementById('audit-logs');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
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

        const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase();
        if (searchFilter) {
            logs = logs.filter(log => {
                const actionMatch = (log.action || '').toLowerCase().includes(searchFilter);
                const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
                const entityMatch = (log.entityType || '').toLowerCase().includes(searchFilter);
                return actionMatch || detailsStr.includes(searchFilter) || entityMatch;
            });
        }

        // Load user/company info for each log
        const logsWithUsers = await Promise.all(
            logs.map(async (log) => {
                const user = await dataService.getUserOrCompanyById(log.userId);
                return { ...log, user };
            })
        );
        
        if (logsWithUsers.length === 0) {
            delete container.dataset.exportLogs;
            container.innerHTML = '<div class="empty-state">No audit logs found</div>';
            return;
        }

        // Load template
        const template = await templateLoader.load('audit-log-item');
        
        // Render audit logs
        const html = logsWithUsers.map(log => {
            const data = {
                ...log,
                actionFormatted: log.action.replace(/_/g, ' ').toUpperCase(),
                timestampFormatted: new Date(log.timestamp).toLocaleString(),
                user: {
                    email: log.user?.email || 'Unknown',
                    role: log.user?.role || 'N/A'
                },
                hasDetails: log.details && Object.keys(log.details).length > 0,
                detailsJson: log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : ''
            };
            return templateRenderer.render(template, data);
        }).join('');
        
        container.innerHTML = html;

        // Store current logs for CSV export (same list we just rendered)
        container.dataset.exportLogs = JSON.stringify(logsWithUsers.map(l => ({
            timestamp: l.timestamp,
            action: l.action,
            entityType: l.entityType || '',
            entityId: l.entityId || '',
            userId: l.userId,
            userEmail: l.user?.email || '',
            details: l.details ? JSON.stringify(l.details) : ''
        })));

    } catch (error) {
        console.error('Error loading audit logs:', error);
        container.innerHTML = '<div class="empty-state">Error loading audit logs</div>';
    }
}

function exportAuditCsv() {
    const container = document.getElementById('audit-logs');
    const dataJson = container?.dataset?.exportLogs;
    if (!dataJson) {
        alert('Load audit logs first, then export.');
        return;
    }
    let rows;
    try {
        rows = JSON.parse(dataJson);
    } catch (e) {
        alert('No data to export.');
        return;
    }
    if (rows.length === 0) {
        alert('No audit logs to export.');
        return;
    }
    const headers = ['timestamp', 'action', 'entityType', 'entityId', 'userId', 'userEmail', 'details'];
    const csvContent = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
            const v = (r[h] ?? '').toString();
            return v.includes(',') || v.includes('"') || v.includes('\n') ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const exportBtn = document.getElementById('export-csv');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => loadAuditLogs());
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportAuditCsv());
    }
    const searchEl = document.getElementById('filter-search');
    if (searchEl) {
        searchEl.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadAuditLogs(); });
    }
}
