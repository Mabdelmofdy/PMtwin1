/**
 * Admin Dashboard — action-focused overview: attention strip, approvals, KPIs,
 * system health (Healthy / Warning / Critical), marketplace analytics, activity feed.
 */

const ACTIVE_OPPORTUNITY_STATUSES = ['published', 'in_negotiation', 'contracted', 'in_execution'];
const PENDING_OPPORTUNITY_STATUS = 'draft';

let adminDashboardActivityLogs = [];
let adminDashboardActivityFilter = 'all';

function getModelDisplayName(key) {
    const models = window.OPPORTUNITY_MODELS || {};
    if (models[key] && models[key].name) return models[key].name;
    return (key || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatRelativeTime(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

function formatActionLabel(action) {
    if (!action) return 'Activity';
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatActivityDescription(log) {
    if (log.details && typeof log.details === 'object') {
        const keys = Object.keys(log.details);
        if (keys.length > 0) {
            const parts = keys.slice(0, 2).map(k => `${k}: ${log.details[k]}`);
            return parts.join(', ');
        }
    }
    return `${log.entityType || 'item'}${log.entityId ? ' #' + log.entityId : ''}`;
}

function countCreatedInDays(items, days, fields = ['createdAt']) {
    const cutoff = Date.now() - days * 86400000;
    return items.filter(item => {
        const t = fields.map(f => item[f]).find(Boolean);
        if (!t) return false;
        return new Date(t).getTime() >= cutoff;
    }).length;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setTrendEl(id, count, noun) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count === 0) {
        el.textContent = `No new ${noun} this week`;
        el.classList.remove('positive', 'negative');
        return;
    }
    el.textContent = `+${count} this week`;
    el.classList.add('positive');
    el.classList.remove('negative');
}

function getActivityCategory(action) {
    const a = (action || '').toLowerCase();
    if (/(error|fail|exception)/.test(a)) return 'error';
    if (/(login|logout|session|sign_in|signin)/.test(a)) return 'login';
    if (/(approv|reject|vet|clarification)/.test(a)) return 'approval';
    return 'system';
}

function logMatchesFilter(log, filter) {
    if (filter === 'all') return true;
    const cat = getActivityCategory(log.action);
    if (filter === 'logins') return cat === 'login';
    if (filter === 'approvals') return cat === 'approval';
    if (filter === 'errors') return cat === 'error';
    if (filter === 'system') return cat === 'system';
    return true;
}

function getTimeGroupLabel(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const t = d.getTime();
    if (t >= startOfToday.getTime()) return 'Today';
    if (t >= startOfYesterday.getTime()) return 'Yesterday';
    if (t >= startOfWeek.getTime()) return 'Earlier this week';
    return 'Older';
}

function renderBarList(rows, valueKey = 'count', labelKey = 'label', maxOverride) {
    const max = maxOverride != null ? maxOverride : Math.max(1, ...rows.map(r => r[valueKey] || 0));
    return rows
        .map(r => {
            const v = r[valueKey] || 0;
            const pct = Math.round((v / max) * 100);
            const label = escapeHtml(r[labelKey]);
            return `<div class="admin-bar-row">
                <span>${label}</span>
                <span class="admin-bar-meta">${v}</span>
                <div class="admin-bar-track"><div class="admin-bar-fill" style="width:${pct}%"></div></div>
            </div>`;
        })
        .join('');
}

function setAttentionStatusDot(elId, level) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = 'admin-attention-status';
    if (level === 'warn') el.classList.add('admin-attention-status--warn');
    else if (level === 'crit') el.classList.add('admin-attention-status--crit');
    else if (level === 'ok') el.classList.add('admin-attention-status--ok');
    else el.classList.add('admin-attention-status--neutral');
}

async function initAdminDashboard() {
    const auth = window.authService || (typeof authService !== 'undefined' ? authService : null);
    const r = window.router || (typeof router !== 'undefined' ? router : null);
    if (!auth || typeof auth.canAccessAdmin !== 'function' || !auth.canAccessAdmin()) {
        if (r && typeof r.navigate === 'function') r.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS && window.pageContextHeader.PRESETS.adminDashboard) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminDashboard);
    }

    document.querySelectorAll('.admin-activity-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            adminDashboardActivityFilter = btn.getAttribute('data-activity-filter') || 'all';
            document.querySelectorAll('.admin-activity-filter').forEach(b => b.classList.toggle('is-active', b === btn));
            renderActivityFeed();
        });
    });

    await refreshAdminDashboardData();
}

async function refreshAdminDashboardData() {
    await loadKpisAndAttention();
    await loadHealth();
    await loadOffersByTopSites();
    await loadAnalyticsSummary();
    await loadCollaborationModelsActivity();
    loadPendingApprovalsQueue();
    await loadRecentActivity();
    updateQuickActionBadges();
}

async function loadKpisAndAttention() {
    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const opportunities = await dataService.getOpportunities();
        const applications = await dataService.getApplications();
        const allPeople = [...users, ...companies];

        const totalUsers = allPeople.length;
        const pendingVetting = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
        const activeProjects = opportunities.filter(o => ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)).length;
        const totalOffers = applications.length;
        const activeCollab = opportunities.filter(o => ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)).length;

        setText('stat-total-users', totalUsers);
        setText('stat-active-projects', activeProjects);
        setText('stat-total-offers', totalOffers);
        setText('stat-active-collab', activeCollab);

        const usersWeek = countCreatedInDays(users, 7);
        const companiesWeek = countCreatedInDays(companies, 7);
        setTrendEl('stat-total-users-trend', usersWeek + companiesWeek, 'accounts');

        const activeOppThisWeek = opportunities.filter(o => {
            if (!ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)) return false;
            const t = o.createdAt || o.updatedAt;
            if (!t) return false;
            return new Date(t).getTime() >= Date.now() - 7 * 86400000;
        }).length;
        setTrendEl('stat-active-projects-trend', activeOppThisWeek, 'active projects');

        const appsWeek = countCreatedInDays(applications, 7);
        setTrendEl('stat-total-offers-trend', appsWeek, 'offers');

        const collabWeek = opportunities.filter(o => {
            if (!ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)) return false;
            const t = o.updatedAt || o.createdAt;
            if (!t) return false;
            return new Date(t).getTime() >= Date.now() - 7 * 86400000;
        }).length;
        setTrendEl('stat-active-collab-trend', collabWeek, 'collaborations');

        const pendingOpps = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;

        let dealsSigning = 0;
        let dealsActive = 0;
        let contractsPending = 0;
        let contractsCompleted = 0;
        let dealsAttention = 0;
        try {
            const deals = await dataService.getDeals();
            const contracts = await dataService.getContracts();
            dealsSigning = deals.filter(d => (d.status || '') === 'signing').length;
            dealsActive = deals.filter(d => ['active', 'execution', 'delivery'].includes(d.status || '')).length;
            contractsPending = contracts.filter(c => (c.status || '') === 'pending').length;
            contractsCompleted = contracts.filter(c => (c.status || '') === 'completed').length;
            const signingNoContract = deals.filter(d => (d.status || '') === 'signing' && !d.contractId).length;
            dealsAttention = signingNoContract + contractsPending;
            setText('stat-deals-signing', String(dealsSigning));
            setText('stat-deals-active', String(dealsActive));
            setText('stat-contracts-pending', String(contractsPending));
            setText('stat-contracts-completed', String(contractsCompleted));
            setText('stat-deals-attention', String(dealsAttention));
        } catch (e) {
            void e;
        }

        setText('attention-count-users', String(pendingVetting));
        setText('attention-count-opps', String(pendingOpps));
        setAttentionStatusDot('attention-status-users', pendingVetting > 0 ? 'warn' : 'ok');
        setAttentionStatusDot('attention-status-opps', pendingOpps > 0 ? 'warn' : 'ok');
        setText('attention-count-signatures', String(contractsPending));
        setAttentionStatusDot('attention-status-signatures', contractsPending > 0 ? 'warn' : 'ok');
        setText('attention-hint-signatures', contractsPending ? 'Contracts waiting for signatures' : 'No pending signature queues');

        const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
        const settings = storage?.get?.(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
        const maintenance = !!settings.maintenanceMode;
        const auditLogs = await dataService.getAuditLogs({});
        const dayAgo = Date.now() - 86400000;
        const errorish = auditLogs.filter(l => {
            const ts = new Date(l.timestamp).getTime();
            if (ts < dayAgo) return false;
            const a = (l.action || '').toLowerCase();
            return /(fail|error|exception)/.test(a);
        }).length;
        let alertCount = (maintenance ? 1 : 0) + errorish;
        setText('attention-count-alerts', String(alertCount));
        setAttentionStatusDot('attention-status-alerts', maintenance ? 'crit' : errorish > 3 ? 'warn' : alertCount > 0 ? 'warn' : 'ok');
        const hintAlerts = maintenance
            ? 'Maintenance mode is on'
            : errorish > 0
              ? 'Review recent errors or rejections'
              : 'No blocking issues detected';
        setText('attention-hint-alerts', hintAlerts);

        const notifications = (window.storageService || {}).get?.(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const unreadCount = notifications.filter(n => !n.read).length;
        setText('attention-count-notifications', String(unreadCount));
        setAttentionStatusDot('attention-status-notifications', unreadCount > 20 ? 'warn' : unreadCount > 0 ? 'warn' : 'ok');
        setText('attention-hint-notifications', unreadCount ? 'Unread items in the store' : 'Inbox is clear');
    } catch (error) {
        console.error('Error loading KPIs / attention:', error);
    }
}

async function loadHealth() {
    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const allPeople = [...users, ...companies];
        const opportunities = await dataService.getOpportunities();
        const sessions = await dataService.getSessions();
        const auditLogs = await dataService.getAuditLogs({});

        const totalUsers = allPeople.length;
        const activeUsers = allPeople.filter(u => u.status === 'active').length;
        const userPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0;
        setText('health-active-users', activeUsers);
        setText('health-user-detail', `${activeUsers} active / ${totalUsers} total users`);
        const userBar = document.getElementById('health-user-bar');
        if (userBar) userBar.style.width = userPct + '%';

        const now = new Date();
        const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now).length;
        setText('health-sessions', activeSessions);

        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentCount = auditLogs.filter(l => new Date(l.timestamp) >= oneHourAgo).length;
        const notifications = (window.storageService || {}).get?.(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const unreadCount = notifications.filter(n => !n.read).length;
        const storage = window.storageService || (typeof storageService !== 'undefined' ? storageService : null);
        const settings = storage?.get?.(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
        const maintenance = !!settings.maintenanceMode;

        const pendingPeople = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
        const pendingOpps = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;

        setText('health-notifications-count', unreadCount);
        setText('health-notifications-detail', `${unreadCount} unread in notification store`);

        const activityCard = document.getElementById('health-activity-card');
        const statusEl = document.getElementById('health-activity-status');
        const detailEl = document.getElementById('health-activity-detail');

        let statusLabel = 'Healthy';
        let detail =
            `${recentCount} audit event${recentCount === 1 ? '' : 's'} in the last hour. Unread notifications: ${unreadCount}.`;
        if (activityCard) {
            activityCard.classList.remove('is-warning', 'is-critical');
        }

        if (maintenance) {
            statusLabel = 'Critical';
            detail = 'Maintenance mode is enabled. Users may have limited access until it is turned off in Settings.';
            if (activityCard) activityCard.classList.add('is-critical');
        } else if (unreadCount > 40 || recentCount > 40) {
            statusLabel = 'Critical';
            detail = 'Very high activity or unread volume in the last hour. Review notifications and audit trail.';
            if (activityCard) activityCard.classList.add('is-critical');
        } else if (unreadCount > 15 || recentCount > 18 || pendingPeople + pendingOpps > 10) {
            statusLabel = 'Warning';
            detail = `Elevated signals: ${recentCount} events/hour, ${unreadCount} unread. ${pendingPeople + pendingOpps} item(s) in approval queues.`;
            if (activityCard) activityCard.classList.add('is-warning');
        } else if (unreadCount > 5 || recentCount > 10 || pendingPeople + pendingOpps > 0) {
            statusLabel = 'Warning';
            detail = `There are pending approvals or moderate traffic (${recentCount} events in the last hour).`;
            if (activityCard) activityCard.classList.add('is-warning');
        }

        if (statusEl) statusEl.textContent = statusLabel;
        if (detailEl) detailEl.textContent = detail;
    } catch (error) {
        console.error('Error loading health:', error);
    }
}

async function loadAnalyticsSummary() {
    const byModelEl = document.getElementById('analytics-by-model');
    const topOppsEl = document.getElementById('analytics-top-opps');
    if (!byModelEl && !topOppsEl) return;
    try {
        const opportunities = await dataService.getOpportunities();
        const applications = await dataService.getApplications();
        const byModel = {};
        opportunities.forEach(o => {
            const key = o.modelType || 'other';
            byModel[key] = (byModel[key] || 0) + 1;
        });
        const modelLabels = {
            project_based: 'Project-Based',
            strategic_partnership: 'Strategic Partnership',
            resource_pooling: 'Resource Pooling',
            hiring: 'Hiring',
            competition: 'Competition',
            other: 'Other'
        };
        if (byModelEl) {
            const rows = Object.entries(byModel).map(([key, count]) => ({
                label: modelLabels[key] || getModelDisplayName(key),
                count
            }));
            byModelEl.innerHTML =
                rows.length > 0 ? renderBarList(rows) : '<p class="text-muted">No opportunities yet</p>';
        }
        const appCountByOpp = {};
        applications.forEach(a => {
            appCountByOpp[a.opportunityId] = (appCountByOpp[a.opportunityId] || 0) + 1;
        });
        const topOppIds = Object.entries(appCountByOpp)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
        if (topOppsEl) {
            if (topOppIds.length === 0) {
                topOppsEl.innerHTML = '<p class="text-muted">No applications yet</p>';
            } else {
                const opps = topOppIds.map(id => opportunities.find(o => o.id === id)).filter(Boolean);
                const rows = opps.map(o => {
                    const count = appCountByOpp[o.id] || 0;
                    const title = (o.title || 'Untitled').substring(0, 52) + ((o.title || '').length > 52 ? '…' : '');
                    return {
                        label: title,
                        count,
                        href: `/opportunities/${o.id}`
                    };
                });
                const max = Math.max(1, ...rows.map(x => x.count));
                topOppsEl.innerHTML = rows
                    .map(r => {
                        const pct = Math.round((r.count / max) * 100);
                        const label = escapeHtml(r.label);
                        return `<div class="admin-bar-row">
                            <span><a href="#" data-route="${escapeHtml(r.href)}" class="text-primary">${label}</a></span>
                            <span class="admin-bar-meta">${r.count}</span>
                            <div class="admin-bar-track"><div class="admin-bar-fill" style="width:${pct}%"></div></div>
                        </div>`;
                    })
                    .join('');
            }
        }
    } catch (e) {
        console.error('Error loading analytics summary:', e);
        if (byModelEl) byModelEl.innerHTML = '<p class="text-muted">Could not load analytics</p>';
        if (topOppsEl) topOppsEl.innerHTML = '<p class="text-muted">Could not load analytics</p>';
    }
}

async function loadOffersByTopSites() {
    const widget = document.getElementById('offers-by-site-widget');
    if (!widget) return;
    try {
        const applications = await dataService.getApplications();
        const opportunities = await dataService.getOpportunities();
        const oppById = {};
        opportunities.forEach(o => {
            oppById[o.id] = o;
        });
        const bySite = {};
        applications.forEach(app => {
            const opp = oppById[app.opportunityId];
            const site = opp
                ? (opp.location || opp.locationRegion || opp.locationCity || 'Unknown').trim() || 'Unknown'
                : 'Unknown';
            bySite[site] = (bySite[site] || 0) + 1;
        });
        const topSites = Object.entries(bySite)
            .map(([site, count]) => ({ label: site, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        if (topSites.length === 0) {
            widget.innerHTML = '<p class="text-muted">No offer volume by site yet</p>';
        } else {
            widget.innerHTML = renderBarList(topSites);
        }
    } catch (e) {
        console.error('Error loading offers by site:', e);
        widget.innerHTML = '<p class="text-muted">Could not load sites</p>';
    }
}

function updateQuickActionBadges() {
    try {
        Promise.all([dataService.getUsers(), dataService.getCompanies(), dataService.getOpportunities()]).then(([users, companies, opportunities]) => {
            const allPeople = [...users, ...companies];
            const pendingVetting = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;

            document.querySelectorAll('.js-badge-vetting').forEach(el => {
                el.textContent = pendingVetting;
                el.style.display = pendingVetting > 0 ? '' : 'none';
            });
        });
    } catch (e) {
        console.error('Error updating badges:', e);
    }
}

async function loadCollaborationModelsActivity() {
    const summaryEl = document.getElementById('collab-models-summary');
    const cardsEl = document.getElementById('collab-models-cards');
    const emptyEl = document.getElementById('collab-models-empty');
    if (!cardsEl) return;

    try {
        const opportunities = await dataService.getOpportunities();
        const modelKeys = Object.keys(CONFIG.MODELS || {});
        const byModel = {};

        modelKeys.forEach(key => {
            byModel[key] = { total: 0, active: 0, pending: 0 };
        });
        byModel.Unknown = { total: 0, active: 0, pending: 0 };

        opportunities.forEach(o => {
            const key = o.modelType && modelKeys.includes(o.modelType) ? o.modelType : 'Unknown';
            byModel[key].total += 1;
            if (ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)) byModel[key].active += 1;
            if (o.status === PENDING_OPPORTUNITY_STATUS) byModel[key].pending += 1;
        });

        let total = 0;
        let active = 0;
        let pending = 0;
        modelKeys.forEach(k => {
            total += byModel[k].total;
            active += byModel[k].active;
            pending += byModel[k].pending;
        });

        const pulse = active + pending;
        const showEmpty = opportunities.length === 0 || pulse === 0;

        if (summaryEl) {
            summaryEl.hidden = showEmpty;
            summaryEl.textContent = `Across all models: ${total} opportunities — ${active} active, ${pending} pending approval.`;
        }
        if (emptyEl) {
            emptyEl.hidden = !showEmpty;
        }
        if (showEmpty) {
            cardsEl.innerHTML = '';
            return;
        }

        const keysWithData = modelKeys.filter(k => byModel[k].total > 0);
        const order = keysWithData.length ? keysWithData : ['Unknown'];

        cardsEl.innerHTML = order
            .map(key => {
                const m = byModel[key] || { total: 0, active: 0, pending: 0 };
                const totalM = Math.max(m.total, 1);
                const activePct = Math.round((m.active / totalM) * 100);
                const pendingPct = Math.round((m.pending / totalM) * 100);
                const name = escapeHtml(getModelDisplayName(key));
                return `
                <div class="admin-model-card">
                    <h4>${name}</h4>
                    <div class="admin-model-total">${m.total} linked opportunity${m.total === 1 ? '' : 'ies'}</div>
                    <div class="admin-model-bar">
                        <div class="admin-model-bar-active" style="width:${activePct}%"></div>
                        <div class="admin-model-bar-pending" style="width:${pendingPct}%"></div>
                    </div>
                    <div class="admin-model-counts">
                        <span>${m.active} active</span>
                        <span>${m.pending} pending</span>
                    </div>
                </div>`;
            })
            .join('');
    } catch (error) {
        console.error('Error loading collaboration models activity:', error);
        cardsEl.innerHTML = '<p class="text-muted">Could not load model activity.</p>';
    }
}

function loadPendingApprovalsQueue() {
    Promise.all([dataService.getUsers(), dataService.getCompanies(), dataService.getOpportunities()])
        .then(([users, companies, opportunities]) => {
            const allPeople = [...users, ...companies];
            const pendingUsers = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
            const pendingOpps = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;

            setText('pending-users-num', String(pendingUsers));
            setText('pending-opps-num', String(pendingOpps));
            setText(
                'pending-users-count',
                pendingUsers === 0
                    ? 'Everyone is cleared for access, or no new registrations are waiting.'
                    : `${pendingUsers} account${pendingUsers === 1 ? '' : 's'} need review before they can fully participate.`
            );
            setText(
                'pending-opps-count',
                pendingOpps === 0
                    ? 'No draft opportunities are waiting for publication approval.'
                    : `${pendingOpps} draft opportunit${pendingOpps === 1 ? 'y is' : 'ies are'} waiting for moderator approval.`
            );
        })
        .catch(e => console.error('Error loading pending queue:', e));
}

async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    try {
        const auditLogs = await dataService.getAuditLogs({});
        adminDashboardActivityLogs = auditLogs;
        renderActivityFeed();
    } catch (error) {
        console.error('Error loading recent activity:', error);
        container.innerHTML = '<p class="text-muted">Could not load activity</p>';
    }
}

async function renderActivityFeed() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    const filtered = adminDashboardActivityLogs.filter(l => logMatchesFilter(l, adminDashboardActivityFilter));
    const recentLogs = filtered.slice(0, 5);

    if (recentLogs.length === 0) {
        container.innerHTML =
            '<p class="text-muted" style="padding:1rem 1.25rem;margin:0;">No activity matches this filter yet.</p>';
        return;
    }

    const logsWithUsers = await Promise.all(
        recentLogs.map(async log => {
            const user = await dataService.getUserOrCompanyById(log.userId);
            return { ...log, user };
        })
    );

    const groups = [];
    let lastGroup = null;
    logsWithUsers.forEach(log => {
        const g = getTimeGroupLabel(log.timestamp);
        if (g !== lastGroup) {
            groups.push({ label: g, items: [] });
            lastGroup = g;
        }
        groups[groups.length - 1].items.push(log);
    });

    const html = groups
        .map(
            g => `
        <div class="admin-activity-group" role="list">
            <div class="admin-activity-group-label">${escapeHtml(g.label)}</div>
            ${g.items
                .map(log => {
                    const actor = log.user?.profile?.name || log.user?.email || 'System';
                    const desc = escapeHtml(formatActivityDescription(log));
                    const time = escapeHtml(formatRelativeTime(log.timestamp));
                    const title = escapeHtml(formatActionLabel(log.action));
                    const cat = getActivityCategory(log.action);
                    let dotClass = 'is-system';
                    if (cat === 'login') dotClass = 'is-login';
                    else if (cat === 'approval') dotClass = 'is-approval';
                    else if (cat === 'error') dotClass = 'is-error';
                    return `
                <div class="admin-activity-item" role="listitem">
                    <span class="admin-activity-dot ${dotClass}" aria-hidden="true"></span>
                    <div class="admin-activity-body">
                        <div class="admin-activity-title">${title}</div>
                        <div class="admin-activity-desc">${desc}</div>
                        <div class="admin-activity-meta">
                            <span>${escapeHtml(actor)}</span>
                            <span>${time}</span>
                        </div>
                    </div>
                </div>`;
                })
                .join('')}
        </div>`
        )
        .join('');

    container.innerHTML = html;
}

async function approveUser(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const ok = await (window.modalService?.confirm?.(
        `Approve this ${isCompany ? 'company' : 'user'}? They will be notified and gain full access.`,
        'Approve account',
        { confirmText: 'Approve', cancelText: 'Cancel', type: 'success' }
    ) ?? Promise.resolve(true));
    if (!ok) return;
    try {
        await window.vettingActions.approveAccount(userId, isCompany, { details: { from: 'admin-dashboard' } });
        await refreshAdminDashboardData();
    } catch (error) {
        console.error('Error approving:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to approve. Please try again.') ?? Promise.resolve());
    }
}

async function rejectUser(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const reason = await (window.modalService?.prompt?.(
        `Reject this ${isCompany ? 'company' : 'user'}? Add an optional reason — they will be notified.`,
        {
            title: 'Reject account',
            confirmText: 'Reject account',
            cancelText: 'Cancel',
            placeholder: 'Reason for rejection (optional)…',
            type: 'error'
        }
    ) ?? Promise.resolve(null));
    if (reason === null) return;
    try {
        await window.vettingActions.rejectAccount(userId, isCompany, (reason || '').trim(), { details: { from: 'admin-dashboard' } });
        await refreshAdminDashboardData();
    } catch (error) {
        console.error('Error rejecting:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to reject. Please try again.') ?? Promise.resolve());
    }
}

async function requestClarification(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const data = await window.vettingActions.openRequestUpdatesModal({ bulkCount: 0 });
    if (!data) return;
    try {
        await window.vettingActions.requestAccountUpdates(userId, isCompany, data.reasonIds, data.note, { details: { from: 'admin-dashboard' } });
        await refreshAdminDashboardData();
    } catch (error) {
        console.error('Error requesting updates:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to request updates.') ?? Promise.resolve());
    }
}

window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.requestClarification = requestClarification;
