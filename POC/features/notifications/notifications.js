/**
 * Notifications Center – list, filter, mark read, link to related page
 */

async function initNotifications() {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    await loadNotifications();
    setupFilters();
    document.getElementById('mark-all-read')?.addEventListener('click', markAllRead);
}

async function loadNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const typeFilter = document.getElementById('filter-type')?.value;
    const readFilter = document.getElementById('filter-read')?.value;
    const user = authService.getCurrentUser();
    if (!user) return;

    container.innerHTML = '<div class="spinner"></div>';

    try {
        let list = await dataService.getNotifications(user.id);

        if (typeFilter) {
            list = list.filter(n => n.type === typeFilter);
        }
        if (readFilter === 'unread') {
            list = list.filter(n => !n.read);
        } else if (readFilter === 'read') {
            list = list.filter(n => n.read);
        }

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (list.length === 0) {
            container.innerHTML = '<div class="empty-notifications">No notifications match your filters.</div>';
            return;
        }

        // Resolve connectionId for connection_request notifications (e.g. created before link/connectionId were added)
        const allConnections = await dataService.getConnections();
        const pendingReceived = allConnections.filter(c => c.toUserId === user.id && c.status === 'pending');
        for (const n of list) {
            if (n.type !== 'connection_request' || n.connectionId) continue;
            if (n.link) {
                const match = n.link.match(/^\/people\/([^/]+)$/);
                if (match) {
                    const conn = await dataService.getConnectionBetweenUsers(user.id, match[1]);
                    if (conn && conn.status === 'pending') n.connectionId = conn.id;
                }
            }
            // Fallback: if no link and exactly one pending request to this user, use it so Accept/Reject show
            if (!n.connectionId && pendingReceived.length === 1) n.connectionId = pendingReceived[0].id;
            // So clicking the card does something: link to People if no sender link
            if (!n.link) n.link = '/people';
        }

        container.innerHTML = list.map(n => {
            const linkAttrs = n.link ? `href="#" data-route="${n.link}"` : '';
            const linkWrap = n.link ? `<a ${linkAttrs} class="notification-link">${n.title}</a>` : n.title;
            const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
            const readClass = n.read ? '' : ' unread';
            const markReadBtn = !n.read ? `<button type="button" class="btn btn-sm btn-secondary mark-read" data-id="${n.id}">Mark read</button>` : '';
            const isConnectionRequest = n.type === 'connection_request' && n.connectionId;
            const connectionActions = isConnectionRequest
                ? `<button type="button" class="btn btn-sm btn-primary accept-connection" data-id="${n.id}" data-connection-id="${n.connectionId}">Accept</button><button type="button" class="btn btn-sm btn-secondary reject-connection" data-id="${n.id}" data-connection-id="${n.connectionId}">Reject</button>`
                : '';
            const actionsHtml = [connectionActions, markReadBtn].filter(Boolean).join('');
            const cardRouteAttr = n.link ? ` data-route="${n.link}"` : '';
            return `
                <div class="notification-item${readClass}" data-id="${n.id}"${cardRouteAttr}>
                    <div class="notification-title">${linkWrap}</div>
                    <div class="notification-message">${n.message || ''}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${timeStr}</span>
                        <div class="notification-actions">${actionsHtml}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Click on card (excluding buttons and title link) navigates to link when present
        container.querySelectorAll('.notification-item[data-route]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a.notification-link')) return;
                const route = item.getAttribute('data-route');
                if (route) router.navigate(route);
            });
            item.style.cursor = 'pointer';
        });

        container.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await dataService.markNotificationRead(e.target.dataset.id);
                await loadNotifications();
            });
        });

        container.querySelectorAll('.accept-connection').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const connectionId = e.target.dataset.connectionId;
                const notifId = e.target.dataset.id;
                if (!connectionId) return;
                e.target.disabled = true;
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
                    e.target.disabled = false;
                }
            });
        });

        container.querySelectorAll('.reject-connection').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const connectionId = e.target.dataset.connectionId;
                const notifId = e.target.dataset.id;
                if (!connectionId) return;
                e.target.disabled = true;
                try {
                    await dataService.rejectConnection(connectionId);
                    if (notifId) await dataService.markNotificationRead(notifId);
                    await loadNotifications();
                    if (typeof showNotification === 'function') {
                        showNotification('Connection rejected.', 'info');
                    }
                } catch (err) {
                    console.error('Reject connection error:', err);
                    e.target.disabled = false;
                }
            });
        });

        container.querySelectorAll('.notification-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (route) {
                    const notif = list.find(n => n.link === route);
                    if (notif && !notif.read) {
                        dataService.markNotificationRead(notif.id);
                    }
                    router.navigate(route);
                }
            });
        });
    } catch (err) {
        console.error('Error loading notifications:', err);
        container.innerHTML = '<div class="empty-notifications">Error loading notifications.</div>';
    }
}

function setupFilters() {
    document.getElementById('apply-filters')?.addEventListener('click', () => loadNotifications());
}

async function markAllRead() {
    const user = authService.getCurrentUser();
    if (!user) return;
    const list = await dataService.getNotifications(user.id);
    const unread = list.filter(n => !n.read);
    for (const n of unread) {
        await dataService.markNotificationRead(n.id);
    }
    await loadNotifications();
}
