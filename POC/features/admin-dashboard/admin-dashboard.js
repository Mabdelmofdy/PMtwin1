/**
 * Admin Dashboard Component
 * Enhanced: KPIs, System Health, Quick Actions with badges, Collaboration Models Activity,
 * Pending Approvals Queue, Recent Activity Feed.
 */

const ACTIVE_OPPORTUNITY_STATUSES = ['published', 'in_negotiation', 'contracted', 'in_execution'];
const PENDING_OPPORTUNITY_STATUS = 'draft';

function getModelDisplayName(key) {
    const models = window.OPPORTUNITY_MODELS || {};
    if (models[key] && models[key].name) return models[key].name;
    return (key || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
    if (diffHours < 24) return `${diffHours} hour(s) ago`;
    if (diffDays < 7) return `${diffDays} day(s) ago`;
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
    return `${log.entityType || 'item'} ${log.entityId ? '#' + log.entityId : ''}`;
}

async function initAdminDashboard() {
    const auth = window.authService || (typeof authService !== 'undefined' ? authService : null);
    const r = window.router || (typeof router !== 'undefined' ? router : null);
    if (!auth || !auth.isAdmin()) {
        if (r && typeof r.navigate === 'function') r.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    await loadKpis();
    await loadHealth();
    await loadOffersByTopSites();
    await loadAnalyticsSummary();
    await loadCollaborationModelsActivity();
    loadPendingApprovalsQueue();
    await loadRecentActivity();
    updateQuickActionBadges();
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
            byModelEl.innerHTML = Object.entries(byModel)
                .map(([key, count]) => `<div class="analytics-row"><span>${escapeHtml(modelLabels[key] || key)}</span><strong>${count}</strong></div>`)
                .join('') || '<p class="text-muted">No data</p>';
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
                topOppsEl.innerHTML = opps.map(o => {
                    const count = appCountByOpp[o.id] || 0;
                    const title = (o.title || 'Untitled').substring(0, 45) + ((o.title || '').length > 45 ? '…' : '');
                    return `<div class="analytics-row"><a href="#" data-route="/opportunities/${o.id}" class="text-primary">${escapeHtml(title)}</a><strong>${count}</strong></div>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error('Error loading analytics summary:', e);
        if (byModelEl) byModelEl.innerHTML = '<p class="text-muted">Error loading</p>';
        if (topOppsEl) topOppsEl.innerHTML = '<p class="text-muted">Error loading</p>';
    }
}

async function loadOffersByTopSites() {
    const widget = document.getElementById('offers-by-site-widget');
    if (!widget) return;
    try {
        const applications = await dataService.getApplications();
        const opportunities = await dataService.getOpportunities();
        const oppById = {};
        opportunities.forEach(o => { oppById[o.id] = o; });
        const bySite = {};
        applications.forEach((app) => {
            const opp = oppById[app.opportunityId];
            const site = opp
                ? (opp.location || opp.locationRegion || opp.locationCity || 'Unknown').trim() || 'Unknown'
                : 'Unknown';
            bySite[site] = (bySite[site] || 0) + 1;
        });
        const topSites = Object.entries(bySite)
            .map(([site, count]) => ({ site, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        if (topSites.length === 0) {
            widget.innerHTML = '<p class="text-muted">No offers by location yet</p>';
        } else {
            widget.innerHTML = topSites.map(({ site, count }) =>
                `<div class="site-row"><span>${escapeHtml(site)}</span><strong>${count}</strong></div>`
            ).join('');
        }
    } catch (e) {
        console.error('Error loading offers by site:', e);
        widget.innerHTML = '<p class="text-muted">Error loading data</p>';
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadKpis() {
    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        const allPeople = [...users, ...companies];
        const opportunities = await dataService.getOpportunities();
        const applications = await dataService.getApplications();

        const totalUsers = allPeople.length;
        const pendingVetting = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
        const totalProjects = opportunities.length;
        const activeProjects = opportunities.filter(o => ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)).length;
        const totalProposals = applications.length;
        const collabOpportunities = opportunities.length;
        const pendingCollab = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;
        const activeCollab = opportunities.filter(o => ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)).length;

        setEl('stat-total-users', totalUsers);
        setEl('stat-pending-vetting', pendingVetting);
        setEl('stat-total-projects', totalProjects);
        setEl('stat-active-projects', activeProjects);
        setEl('stat-total-proposals', totalProposals);
        const totalOffers = applications.length;
        setEl('stat-total-offers', totalOffers);
        setEl('stat-collab-opportunities', collabOpportunities);
        setEl('stat-pending-collab', pendingCollab);
        setEl('stat-active-collab', activeCollab);
    } catch (error) {
        console.error('Error loading KPIs:', error);
    }
}

function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
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
        setEl('health-active-users', activeUsers);
        setEl('health-user-detail', `${activeUsers} active / ${totalUsers} total users`);
        const userBar = document.getElementById('health-user-bar');
        if (userBar) userBar.style.width = userPct + '%';

        const now = new Date();
        const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now).length;
        setEl('health-sessions', activeSessions);

        const totalProjects = opportunities.length;
        const activeProjects = opportunities.filter(o => ACTIVE_OPPORTUNITY_STATUSES.includes(o.status)).length;
        const projectPct = totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 1000) / 10 : 0;
        setEl('health-project-pct', projectPct + '%');
        setEl('health-project-detail', `${activeProjects} active / ${totalProjects} total projects`);
        const projectBar = document.getElementById('health-project-bar');
        if (projectBar) projectBar.style.width = projectPct + '%';

        setEl('health-collab-pct', projectPct + '%');
        setEl('health-collab-detail', `${activeProjects} active / ${totalProjects} total opportunities`);
        const collabBar = document.getElementById('health-collab-bar');
        if (collabBar) collabBar.style.width = projectPct + '%';

        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentCount = auditLogs.filter(l => new Date(l.timestamp) >= oneHourAgo).length;
        const notifications = (window.storageService || {}).get?.(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const unreadCount = notifications.filter(n => !n.read).length;

        setEl('health-activity-detail', `${recentCount} recent in last hour`);
        setEl('health-notifications-count', unreadCount);
        setEl('health-notifications-detail', `${unreadCount} unread notifications`);

        const activityCard = document.getElementById('health-activity-card');
        const statusEl = document.getElementById('health-activity-status');
        if (activityCard && statusEl) {
            const isHigh = unreadCount > 20 || recentCount > 10;
            statusEl.textContent = isHigh ? 'HIGH' : 'OK';
            activityCard.classList.toggle('health-high', isHigh);
        }
    } catch (error) {
        console.error('Error loading health:', error);
    }
}

function updateQuickActionBadges() {
    try {
        Promise.all([dataService.getUsers(), dataService.getCompanies(), dataService.getOpportunities()]).then(([users, companies, opportunities]) => {
            const allPeople = [...users, ...companies];
            const pendingVetting = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
            const pendingOpps = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;

            document.querySelectorAll('.js-badge-vetting, #badge-vetting, #badge-vetting-secondary').forEach(el => {
                el.textContent = pendingVetting;
                el.style.display = pendingVetting > 0 ? '' : 'none';
            });
            const modelsBadge = document.getElementById('badge-models');
            if (modelsBadge) {
                modelsBadge.textContent = pendingOpps;
                modelsBadge.style.display = pendingOpps > 0 ? '' : 'none';
            }
        });
    } catch (e) {
        console.error('Error updating badges:', e);
    }
}

async function loadCollaborationModelsActivity() {
    const summaryEl = document.getElementById('collab-models-summary');
    const cardsEl = document.getElementById('collab-models-cards');
    if (!cardsEl) return;

    try {
        const opportunities = await dataService.getOpportunities();
        const modelKeys = Object.keys(CONFIG.MODELS);
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

        let total = 0, active = 0, pending = 0;
        modelKeys.forEach(k => {
            total += byModel[k].total;
            active += byModel[k].active;
            pending += byModel[k].pending;
        });
        if (summaryEl) {
            summaryEl.innerHTML = `Total: ${total} <span class="active-count">Active: ${active}</span> <span class="pending-count">Pending: ${pending}</span>`;
        }

        const order = modelKeys.filter(k => byModel[k].total > 0).concat(modelKeys.filter(k => byModel[k].total === 0));
        cardsEl.innerHTML = order.map(key => {
            const m = byModel[key];
            const totalM = m.total || 1;
            const activePct = Math.round((m.active / totalM) * 100);
            const pendingPct = Math.round((m.pending / totalM) * 100);
            const name = getModelDisplayName(key);
            return `
            <div class="model-card">
                <h4>${name}</h4>
                <div class="model-total">${m.total} total</div>
                <div class="model-progress">
                    <div class="model-progress-active" style="width:${activePct}%"></div>
                    <div class="model-progress-pending" style="width:${pendingPct}%"></div>
                </div>
                <div class="model-counts">
                    <span>${m.active} active</span>
                    <span>${m.pending} pending</span>
                </div>
            </div>
            `;
        }).join('') || '<p class="text-muted">No collaboration model data yet.</p>';
    } catch (error) {
        console.error('Error loading collaboration models activity:', error);
        cardsEl.innerHTML = '<p class="text-muted">Error loading data.</p>';
    }
}

function loadPendingApprovalsQueue() {
    Promise.all([dataService.getUsers(), dataService.getCompanies(), dataService.getOpportunities()]).then(([users, companies, opportunities]) => {
        const allPeople = [...users, ...companies];
        const pendingUsers = allPeople.filter(u => u.status === 'pending' || u.status === 'clarification_requested').length;
        const pendingOpps = opportunities.filter(o => o.status === PENDING_OPPORTUNITY_STATUS).length;

        const usersCountEl = document.getElementById('pending-users-count');
        const oppsCountEl = document.getElementById('pending-opps-count');
        if (usersCountEl) usersCountEl.textContent = `${pendingUsers} user(s) awaiting vetting`;
        if (oppsCountEl) oppsCountEl.textContent = `${pendingOpps} opportunity/ies pending approval`;
    }).catch(e => console.error('Error loading pending queue:', e));
}

async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    try {
        const auditLogs = await dataService.getAuditLogs({});
        const recentLogs = auditLogs.slice(0, 10);

        if (recentLogs.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activity</p>';
            return;
        }

        const logsWithUsers = await Promise.all(
            recentLogs.map(async (log) => {
                const user = await dataService.getUserOrCompanyById(log.userId);
                return { ...log, user };
            })
        );

        container.innerHTML = logsWithUsers.map(log => {
            const actor = log.user?.profile?.name || log.user?.email || 'Unknown';
            const desc = formatActivityDescription(log);
            const time = formatRelativeTime(log.timestamp);
            const title = formatActionLabel(log.action);
            return `
            <div class="activity-feed-item">
                <div class="activity-feed-icon" aria-hidden="true"></div>
                <div class="activity-feed-body">
                    <div class="activity-feed-title">${title}</div>
                    <div class="activity-feed-desc">${desc}</div>
                    <div class="activity-feed-meta">
                        <span>${actor}</span>
                        <span>${time}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
        container.innerHTML = '<p class="text-muted">Error loading activity</p>';
    }
}

// Keep approve/reject/clarify for use from User Vetting page; no inline list on dashboard
async function approveUser(userId, isCompany = false) {
    if (!confirm(`Approve this ${isCompany ? 'company' : 'user'}?`)) return;
    try {
        if (isCompany) await dataService.updateCompany(userId, { status: 'active' });
        else await dataService.updateUser(userId, { status: 'active' });
        await dataService.createNotification({ userId, type: 'account_approved', title: 'Account Approved', message: 'Your account has been approved. You can now access all features.' });
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({ userId: admin.id, action: isCompany ? 'company_approved' : 'user_approved', entityType: isCompany ? 'company' : 'user', entityId: userId, details: {} });
        await loadKpis();
        await loadHealth();
        loadPendingApprovalsQueue();
        updateQuickActionBadges();
    } catch (error) {
        console.error('Error approving:', error);
        alert('Failed to approve. Please try again.');
    }
}

async function rejectUser(userId, isCompany = false) {
    if (!confirm(`Reject this ${isCompany ? 'company' : 'user'}? They will be notified.`)) return;
    const reason = prompt('Rejection reason (optional):');
    try {
        if (isCompany) await dataService.updateCompany(userId, { status: 'rejected' });
        else await dataService.updateUser(userId, { status: 'rejected' });
        await dataService.createNotification({ userId, type: 'account_rejected', title: 'Account Rejected', message: reason ? `Your account was rejected: ${reason}` : 'Your account registration was rejected.' });
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({ userId: admin.id, action: isCompany ? 'company_rejected' : 'user_rejected', entityType: isCompany ? 'company' : 'user', entityId: userId, details: { reason: reason || 'No reason provided' } });
        await loadKpis();
        await loadHealth();
        loadPendingApprovalsQueue();
        updateQuickActionBadges();
    } catch (error) {
        console.error('Error rejecting:', error);
        alert('Failed to reject. Please try again.');
    }
}

async function requestClarification(userId, isCompany = false) {
    const reason = prompt('Reason or missing items (optional):');
    if (reason === null) return;
    try {
        if (isCompany) await dataService.updateCompany(userId, { status: 'clarification_requested' });
        else await dataService.updateUser(userId, { status: 'clarification_requested' });
        await dataService.createNotification({ userId, type: 'account_clarification_requested', title: 'Registration needs clarification', message: reason ? `Your registration needs clarification: ${reason}. Please update your profile and submit for review again.` : 'Your registration needs clarification. Please update your profile and submit for review again from your profile page.' });
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({ userId: admin.id, action: isCompany ? 'company_clarification_requested' : 'user_clarification_requested', entityType: isCompany ? 'company' : 'user', entityId: userId, details: { reason: reason || '' } });
        await loadKpis();
        await loadHealth();
        loadPendingApprovalsQueue();
        updateQuickActionBadges();
    } catch (error) {
        console.error('Error requesting clarification:', error);
        alert('Failed to request clarification.');
    }
}

window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.requestClarification = requestClarification;
