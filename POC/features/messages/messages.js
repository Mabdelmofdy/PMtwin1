/**
 * Messages - Conversations and 1:1 messaging
 */

let currentPartnerId = null;

async function initMessages(params) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        router.navigate('/login');
        return;
    }

    const threadEmpty = document.getElementById('thread-empty');
    const threadView = document.getElementById('thread-view');
    const partnerId = params?.id;

    if (partnerId) {
        const connectionStatus = await dataService.getConnectionStatus(currentUser.id, partnerId);
        const connected = connectionStatus === 'accepted';
        currentPartnerId = partnerId;
        threadEmpty.style.display = 'none';
        threadView.style.display = 'flex';
        setupThreadBack();

        if (!connected) {
            const partner = await dataService.getUserOrCompanyById(partnerId);
            const partnerName = partner?.profile?.name || partner?.profile?.companyName || partner?.email || 'this person';
            const threadMessages = document.getElementById('thread-messages');
            const messageForm = document.getElementById('message-form');
            const threadHeaderName = document.getElementById('thread-partner-name');
            if (threadHeaderName) threadHeaderName.textContent = partnerName;
            if (threadMessages) {
                threadMessages.innerHTML = '<div class="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900"><p class="font-medium">Connect to message</p><p class="text-sm mt-1">You must be connected with ' + escapeHtml(partnerName) + ' to send messages.</p><a href="#" data-route="/people/' + (partnerId || '').replace(/"/g, '&quot;') + '" class="inline-block mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark no-underline">View profile &amp; send connection request</a></div>';
            }
            if (messageForm) messageForm.style.display = 'none';
            await renderConversationsList(partnerId);
            return;
        }

        const threadHeaderName = document.getElementById('thread-partner-name');
        if (threadHeaderName) {
            const partner = await dataService.getUserOrCompanyById(partnerId);
            threadHeaderName.textContent = partner?.profile?.name || partner?.profile?.companyName || partner?.email || 'Unknown';
        }
        await loadThread(partnerId);
        setupMessageForm(partnerId);
    } else {
        currentPartnerId = null;
        threadEmpty.style.display = 'flex';
        threadView.style.display = 'none';
    }

    await renderConversationsList(partnerId);
}

function setupThreadBack() {
    const back = document.getElementById('thread-back');
    if (back) {
        back.replaceWith(back.cloneNode(true));
        document.getElementById('thread-back').addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/messages');
        });
    }
}

async function renderConversationsList(activeId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const container = document.getElementById('conversations-list');
    if (!container) return;

    const conversations = await dataService.getConversationsForUser(currentUser.id);
    if (conversations.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 1rem;">No connections yet. <a href="#" data-route="/people" style="color: var(--primary-color);">Find people</a> to connect and message.</p>';
        return;
    }

    const partnerIds = conversations.map(c => c.partnerId);
    const people = await Promise.all(partnerIds.map(id => dataService.getPersonById(id)));

    container.innerHTML = conversations.map((conv, i) => {
        const person = people[i];
        const name = person?.profile?.name || person?.email || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const preview = conv.lastMessage 
            ? (conv.lastMessage.substring(0, 40) + (conv.lastMessage.length > 40 ? '…' : ''))
            : 'Start conversation...';
        const date = conv.lastAt && conv.lastMessage 
            ? new Date(conv.lastAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
            : '';
        const unread = conv.unread > 0 ? `<span class="conversation-unread">${conv.unread}</span>` : '';
        const active = conv.partnerId === activeId ? ' active' : '';
        const previewClass = conv.lastMessage ? '' : ' conversation-preview-empty';
        return `
            <a href="#" class="conversation-item${active}" data-route="/messages/${conv.partnerId}">
                <div class="conversation-avatar">${initials}</div>
                <div class="conversation-body">
                    <div class="conversation-name">${escapeHtml(name)}</div>
                    <div class="conversation-preview${previewClass}">${escapeHtml(preview)}</div>
                    ${date ? `<div class="conversation-meta">${date}</div>` : ''}
                </div>
                ${unread}
            </a>
        `;
    }).join('');

    container.querySelectorAll('.conversation-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.currentTarget.getAttribute('data-route');
            if (route) router.navigate(route);
        });
    });
}

async function loadThread(partnerId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const partner = await dataService.getPersonById(partnerId);
    const name = partner?.profile?.name || partner?.email || 'Unknown';
    const nameEl = document.getElementById('thread-partner-name');
    if (nameEl) nameEl.textContent = name;

    const messages = await dataService.getMessagesBetween(currentUser.id, partnerId);
    await dataService.markMessagesAsRead(partnerId, currentUser.id);

    const container = document.getElementById('thread-messages');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = '<p class="text-muted" style="align-self: center; margin: 1rem;">No messages yet. Say hello!</p>';
        return;
    }

    container.innerHTML = messages.map(m => {
        const isSent = m.senderId === currentUser.id;
        const time = new Date(m.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        return `<div class="thread-message ${isSent ? 'sent' : 'received'}">
                <div>${escapeHtml(m.text)}</div>
                <div class="thread-message-time">${time}</div>
            </div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function setupMessageForm(partnerId) {
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    if (!form || !input) {
        console.error('Message form or input not found');
        return;
    }

    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById('message-form');
    const newInput = document.getElementById('message-input');
    
    if (!newForm || !newInput) {
        console.error('Failed to clone message form');
        return;
    }

    // Ensure input is enabled
    newInput.disabled = false;
    newInput.placeholder = 'Type a message...';

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = (newInput.value || '').trim();
        if (!text) {
            newInput.focus();
            return;
        }

        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            router.navigate('/login');
            return;
        }

        // Disable form while sending
        newInput.disabled = true;
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            await dataService.createMessage(currentUser.id, partnerId, text);
            newInput.value = '';
            newInput.disabled = false;
            if (submitBtn) submitBtn.disabled = false;
            await loadThread(partnerId);
            await renderConversationsList(partnerId);
            newInput.focus();
        } catch (err) {
            console.error('Send message error:', err);
            newInput.disabled = false;
            if (submitBtn) submitBtn.disabled = false;
            if (typeof showNotification === 'function') {
                showNotification('Failed to send message. Please try again.', 'error');
            } else {
                alert('Failed to send message. Please try again.');
            }
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
