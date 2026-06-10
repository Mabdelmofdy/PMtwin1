/**
 * Notifications Center – list, filter, mark read, link to related page
 */

async function initNotifications() {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.notifications);
    }

    setupNotificationsRefreshListener();
    await loadNotifications();
    setupFilters();
    const markBtn = document.getElementById('mark-all-read');
    if (markBtn) {
        markBtn.onclick = () => {
            void markAllRead();
        };
    }
}

/** Align filter dropdown values with notification types used in demo data and features. */
function notificationMatchesTypeFilter(n, typeFilter) {
    if (!typeFilter) return true;
    const t = n.type || '';
    if (typeFilter === 'match') {
        return (
            t === 'match' ||
            t === 'match_found' ||
            t === 'new_match_found' ||
            t === 'opportunity_match' ||
            t === 'candidate_match'
        );
    }
    if (typeFilter === 'application') {
        return (
            t === 'application' ||
            t === 'application_status_changed' ||
            t === 'application_update' ||
            t === 'application_received' ||
            t === 'application_updated' ||
            t === 'application_submitted'
        );
    }
    return t === typeFilter;
}

function escapeHtml(value) {
    if (value == null) return '';
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

/** Normalize type for icon / badge grouping */
function resolveNotificationKind(type) {
    const t = type || '';
    if (
        t === 'match' ||
        t === 'match_found' ||
        t === 'new_match_found' ||
        t === 'opportunity_match' ||
        t === 'candidate_match'
    ) {
        return 'match';
    }
    if (
        t === 'application' ||
        t === 'application_status_changed' ||
        t === 'application_update' ||
        t === 'application_received' ||
        t === 'application_updated' ||
        t === 'application_submitted'
    ) {
        return 'application';
    }
    if (t.startsWith('account_')) return 'account';
    return t;
}

function getNotificationPresentation(type) {
    const kind = resolveNotificationKind(type);
    const map = {
        match: { label: 'Need/Offer match', icon: 'ph-handshake', mod: 'match' },
        application: { label: 'Application', icon: 'ph-file-text', mod: 'application' },
        message: { label: 'Message', icon: 'ph-chat-circle-text', mod: 'message' },
        deal: { label: 'Deal', icon: 'ph-briefcase', mod: 'deal' },
        connection_request: { label: 'Connection', icon: 'ph-user-plus', mod: 'connection' },
        account: { label: 'Account', icon: 'ph-identification-badge', mod: 'account' }
    };
    return map[kind] || { label: 'Alert', icon: 'ph-bell', mod: 'default' };
}

function formatRelativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}

function setNotificationsSummary({ showing, total, unread, filtersOn }) {
    const el = document.getElementById('notifications-summary');
    if (!el) return;
    if (total === 0) {
        el.innerHTML = 'You have no notifications yet. Activity from matches, applications, and messages will show up here.';
        el.hidden = false;
        return;
    }
    el.hidden = false;
    if (filtersOn) {
        el.innerHTML = `<strong>${showing}</strong> shown with current filters · ${total} total · <strong>${unread}</strong> unread`;
    } else {
        el.innerHTML = `<strong>${total}</strong> notification${total === 1 ? '' : 's'} · <strong>${unread}</strong> unread`;
    }
}

function setupNotificationsRefreshListener() {
    if (window.__pmtwinNotificationsRefreshBound) return;
    window.__pmtwinNotificationsRefreshBound = true;
    const refresh = () => {
        if (!document.getElementById('notifications-list')) return;
        loadNotifications().catch(err => console.error('Notifications refresh failed:', err));
    };
    window.addEventListener('pmtwin:notifications-updated', refresh);
    window.addEventListener('pmtwin:data-changed', refresh);
}

async function openNotification(notifId, route) {
    if (notifId) {
        const notifs = await dataService.getNotifications(authService.getCurrentUser()?.id);
        const notif = (notifs || []).find(n => n.id === notifId);
        if (notif && !notif.read) {
            await dataService.markNotificationRead(notifId);
        }
    }
    if (route) router.navigate(route);
}

function setMarkAllReadEnabled(unreadCount) {
    const btn = document.getElementById('mark-all-read');
    if (!btn) return;
    btn.disabled = unreadCount === 0;
    btn.setAttribute('aria-disabled', unreadCount === 0 ? 'true' : 'false');
}

async function loadNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const typeFilter = document.getElementById('filter-type')?.value;
    const readFilter = document.getElementById('filter-read')?.value;
    const user = authService.getCurrentUser();
    if (!user) return;

    const filtersOn = !!(typeFilter || readFilter);
    container.innerHTML =
        '<div class="notifications-loading" role="status"><div class="spinner"></div><span>Loading…</span></div>';

    try {
        const fullList = await dataService.getNotifications(user.id);
        const total = fullList.length;
        const unreadTotal = fullList.filter(n => !n.read).length;
        setMarkAllReadEnabled(unreadTotal);

        let list = [...fullList];
        if (typeFilter) {
            list = list.filter(n => notificationMatchesTypeFilter(n, typeFilter));
        }
        if (readFilter === 'unread') {
            list = list.filter(n => !n.read);
        } else if (readFilter === 'read') {
            list = list.filter(n => n.read);
        }

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (list.length === 0) {
            if (!filtersOn && total === 0) {
                container.innerHTML = `
                    <div class="empty-notifications" role="status">
                        <span class="empty-notifications-icon" aria-hidden="true"><i class="ph-duotone ph-bell-slash"></i></span>
                        <p class="empty-notifications-title">No notifications yet</p>
                        <p>When you receive matches, application updates, or messages, they will appear here.</p>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="empty-notifications" role="status">
                        <span class="empty-notifications-icon" aria-hidden="true"><i class="ph-duotone ph-magnifying-glass"></i></span>
                        <p class="empty-notifications-title">Nothing matches these filters</p>
                        <p>Try choosing <strong>All types</strong> and <strong>All</strong>, or tap <strong>Reset</strong> above.</p>
                    </div>`;
            }
            setNotificationsSummary({ showing: 0, total, unread: unreadTotal, filtersOn });
            return;
        }

        setNotificationsSummary({
            showing: list.length,
            total,
            unread: unreadTotal,
            filtersOn
        });

        // Resolve connectionId for connection_request notifications (e.g. created before link/connectionId were added)
        const allConnections = await dataService.getConnections();
        const connectionsById = new Map(allConnections.map(c => [c.id, c]));
        const pendingStatus = CONFIG.CONNECTION_STATUS.PENDING;
        const pendingReceived = allConnections.filter(c => c.toUserId === user.id && c.status === pendingStatus);
        for (const n of list) {
            if (n.type !== 'connection_request') continue;
            if (n.link) {
                const m = n.link.match(/^\/people\/([^/]+)$/);
                if (m) {
                    const conn = await dataService.getConnectionBetweenUsers(user.id, m[1]);
                    if (conn) n.connectionId = conn.id;
                }
            }
            if (!n.connectionId && pendingReceived.length === 1) {
                n.connectionId = pendingReceived[0].id;
            }
            if (!n.link) n.link = '/people';
        }

        container.innerHTML = list
            .map(n => {
                const pres = getNotificationPresentation(n.type);
                const linkAttrs = n.link ? `href="#" data-route="${escapeHtml(n.link)}"` : '';
                const titleEsc = escapeHtml(n.title || '');
                const linkWrap = n.link
                    ? `<a ${linkAttrs} class="notification-link">${titleEsc}</a>`
                    : titleEsc;
                const absTime = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
                const relTime = formatRelativeTime(n.createdAt);
                const timeHtml = relTime
                    ? `<time class="notification-time" datetime="${escapeHtml(n.createdAt || '')}" title="${escapeHtml(absTime)}">${escapeHtml(relTime)}</time>`
                    : '';
                const readClass = n.read ? '' : ' unread';
                const markReadBtn = !n.read
                    ? `<button type="button" class="btn btn-sm btn-secondary mark-read" data-id="${escapeHtml(n.id)}">Mark read</button>`
                    : '';
                const conn = n.connectionId ? connectionsById.get(n.connectionId) : null;
                const isActionableRequest =
                    n.type === 'connection_request' &&
                    conn &&
                    conn.status === pendingStatus;
                const connectionActions = isActionableRequest
                    ? `<button type="button" class="btn btn-sm btn-primary accept-connection" data-id="${escapeHtml(n.id)}" data-connection-id="${escapeHtml(n.connectionId)}">Accept</button><button type="button" class="btn btn-sm btn-secondary reject-connection" data-id="${escapeHtml(n.id)}" data-connection-id="${escapeHtml(n.connectionId)}">Reject</button>`
                    : '';
                const actionsHtml = [connectionActions, markReadBtn].filter(Boolean).join('');
                const cardRouteAttr = n.link ? ` data-route="${escapeHtml(n.link)}"` : '';
                const msg = escapeHtml(n.message || '');
                const iconMod = escapeHtml(pres.mod);
                const notifVariant =
                    ({ match: 'purple', application: 'info', message: 'info', deal: 'warning', connection: 'teal', account: 'neutral', default: 'neutral' }[
                        pres.mod
                    ] || 'neutral');
                const typeBadgeHtml =
                    typeof window.renderBadge === 'function'
                        ? window.renderBadge(pres.label, notifVariant)
                        : `<span class="notification-type-badge">${escapeHtml(pres.label)}</span>`;
                return `
                <article class="notification-item${readClass}" data-id="${escapeHtml(n.id)}"${cardRouteAttr} role="listitem">
                    <div class="notification-item-inner">
                        <div class="notification-icon notification-icon--${iconMod}" aria-hidden="true"><i class="ph-duotone ${pres.icon}"></i></div>
                        <div class="notification-body">
                            <div class="notification-top">
                                ${typeBadgeHtml}
                                ${timeHtml}
                            </div>
                            <div class="notification-title">${linkWrap}</div>
                            <p class="notification-message">${msg}</p>
                            <div class="notification-meta">
                                <div class="notification-actions">${actionsHtml}</div>
                            </div>
                        </div>
                    </div>
                </article>
            `;
            })
            .join('');

        // Click on card (excluding buttons and title link) navigates and marks read
        container.querySelectorAll('.notification-item[data-route]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a.notification-link')) return;
                const route = item.getAttribute('data-route');
                const notifId = item.getAttribute('data-id');
                if (route) void openNotification(notifId, route);
            });
            item.style.cursor = 'pointer';
        });

        container.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                if (!id) return;
                await dataService.markNotificationRead(id);
                await loadNotifications();
            });
        });

        container.querySelectorAll('.accept-connection').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const connectionId = e.currentTarget.dataset.connectionId;
                const notifId = e.currentTarget.dataset.id;
                if (!connectionId) return;
                e.currentTarget.disabled = true;
                try {
                    await dataService.acceptConnection(connectionId);
                    if (notifId) await dataService.markNotificationRead(notifId);
                    await loadNotifications();
                    if (typeof window.modalService !== 'undefined' && window.modalService.success) {
                        await window.modalService.success('Connection accepted!', 'Success');
                    } else if (typeof showNotification === 'function') {
                        showNotification('Connection accepted!', 'success');
                    } else {
                        alert('Connection accepted!');
                    }
                } catch (err) {
                    console.error('Accept connection error:', err);
                    e.currentTarget.disabled = false;
                }
            });
        });

        container.querySelectorAll('.reject-connection').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const connectionId = e.currentTarget.dataset.connectionId;
                const notifId = e.currentTarget.dataset.id;
                if (!connectionId) return;
                e.currentTarget.disabled = true;
                try {
                    await dataService.rejectConnection(connectionId);
                    if (notifId) await dataService.markNotificationRead(notifId);
                    await loadNotifications();
                    if (typeof showNotification === 'function') {
                        showNotification('Connection rejected.', 'info');
                    }
                } catch (err) {
                    console.error('Reject connection error:', err);
                    e.currentTarget.disabled = false;
                }
            });
        });

        container.querySelectorAll('.notification-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                const notifId = link.closest('.notification-item')?.getAttribute('data-id');
                if (route) void openNotification(notifId, route);
            });
        });

        if (typeof layoutService !== 'undefined' && typeof layoutService.updateNavigation === 'function') {
            void layoutService.updateNavigation();
        }

        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('#notifications-summary', 'notifications');
        }
    } catch (err) {
        console.error('Error loading notifications:', err);
        container.innerHTML = `
            <div class="empty-notifications" role="alert">
                <span class="empty-notifications-icon" aria-hidden="true"><i class="ph-duotone ph-warning-circle"></i></span>
                <p class="empty-notifications-title">Could not load notifications</p>
                <p>Refresh the page or try again in a moment.</p>
            </div>`;
        const sum = document.getElementById('notifications-summary');
        if (sum) {
            sum.textContent = '';
            sum.hidden = true;
        }
        if (typeof layoutService !== 'undefined' && typeof layoutService.updateNavigation === 'function') {
            void layoutService.updateNavigation();
        }
    }
}

function setupFilters() {
    const apply = () => loadNotifications();
    const typeEl = document.getElementById('filter-type');
    const readEl = document.getElementById('filter-read');
    const resetEl = document.getElementById('reset-filters');
    if (typeEl) typeEl.onchange = apply;
    if (readEl) readEl.onchange = apply;
    if (resetEl) {
        resetEl.onclick = () => {
            if (typeEl) typeEl.value = '';
            if (readEl) readEl.value = '';
            loadNotifications();
        };
    }
}

async function markAllRead() {
    const markBtn = document.getElementById('mark-all-read');
    if (markBtn?.disabled) return;
    const user = authService.getCurrentUser();
    if (!user) return;
    const list = await dataService.getNotifications(user.id);
    const unread = list.filter(n => !n.read);
    for (const n of unread) {
        await dataService.markNotificationRead(n.id);
    }
    await loadNotifications();
}
