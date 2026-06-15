/**
 * Admin Negotiation Detail — read-only monitor with timeline and admin actions.
 */

function andEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function getStatusLabel(status) {
    if (window.negotiationLifecycle?.getNegotiationStatusLabel) {
        return window.negotiationLifecycle.getNegotiationStatusLabel(status);
    }
    return status || '—';
}

async function resolveName(userId) {
    if (!userId) return 'Unknown';
    const u = await dataService.getUserOrCompanyById(userId);
    return u?.profile?.name || u?.profile?.companyName || userId;
}

function renderTermsSheet(terms, exchangeMode) {
    const el = document.getElementById('and-terms-sheet');
    const nt = window.negotiationTerms;
    if (!el || !nt) return;
    const rows = typeof nt.getTermSheetRows === 'function'
        ? nt.getTermSheetRows(terms, exchangeMode)
        : [];
    el.innerHTML = rows.length
        ? rows.map(r => '<div class="and-terms-row"><dt>' + andEscape(r.label) + '</dt><dd>' + andEscape(r.value) + '</dd></div>').join('')
        : '<p class="text-gray-500">No terms recorded.</p>';
}

async function buildTimelineItems(negotiation, activeDispute) {
    const items = [];
    const nt = window.negotiationTerms;

    items.push({
        at: negotiation.createdAt,
        type: 'system',
        who: 'System',
        body: 'Negotiation opened.'
    });

    if (activeDispute) {
        items.push({
            at: activeDispute.raisedAt,
            type: 'dispute',
            who: await resolveName(activeDispute.raisedBy),
            body: 'Dispute raised: ' + (activeDispute.description || getDisputeLabel('category', activeDispute.category))
        });
        for (const msg of (activeDispute.thread || [])) {
            if (msg.at === activeDispute.raisedAt && msg.body === activeDispute.description) continue;
            items.push({
                at: msg.at,
                type: 'dispute',
                who: await resolveName(msg.by),
                body: '[Dispute] ' + (msg.body || '')
            });
        }
    }

    for (const msg of (negotiation.discussionThread || [])) {
        items.push({
            at: msg.at,
            type: 'message',
            who: await resolveName(msg.by),
            body: msg.body || ''
        });
    }

    let prevTerms = { ...(negotiation.initialTerms || {}) };
    for (let i = 0; i < (negotiation.rounds || []).length; i++) {
        const round = negotiation.rounds[i];
        const who = await resolveName(round.by);
        const nextTerms = round.proposal && Object.keys(round.proposal).length && nt?.mergeProposalTerms
            ? nt.mergeProposalTerms(prevTerms, round.proposal)
            : prevTerms;
        const deltas = nt?.computeTermDeltas
            ? nt.computeTermDeltas(prevTerms, nextTerms)
            : [];
        prevTerms = nextTerms;
        const deltaText = deltas.length
            ? deltas.map(d => d.label + ': ' + d.from + ' → ' + d.to).join('; ')
            : '';
        items.push({
            at: round.at,
            type: 'formal',
            who,
            body: (round.message || 'Formal counter-proposal.') + (deltaText ? ' [' + deltaText + ']' : ''),
            round: i + 1
        });
    }

    if ((negotiation.status || '').toLowerCase() === 'agreed') {
        items.push({
            at: negotiation.agreedAt || negotiation.updatedAt,
            type: 'system',
            who: 'System',
            body: 'All required parties agreed to terms.'
        });
    }

    for (const note of (negotiation.adminNotes || [])) {
        items.push({
            at: note.at,
            type: 'admin',
            who: await resolveName(note.by) + ' (admin)',
            body: note.note || ''
        });
    }

    items.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
    return items;
}

function renderTimeline(items) {
    const el = document.getElementById('and-timeline');
    if (!el) return;
    if (!items.length) {
        el.innerHTML = '<p class="text-gray-500">No activity yet.</p>';
        return;
    }
    el.innerHTML = items.map(item => {
        const cls = item.type === 'formal' ? 'and-tl-item--formal'
            : item.type === 'message' ? 'and-tl-item--message'
                : item.type === 'dispute' ? 'and-tl-item--dispute'
                : item.type === 'admin' ? 'and-tl-item--admin' : '';
        const when = item.at ? new Date(item.at).toLocaleString() : '';
        const label = item.type === 'formal' && item.round ? 'Round ' + item.round + ' · Formal' : item.type;
        return '<article class="and-tl-item ' + cls + '">'
            + '<div class="and-tl-head"><span class="and-tl-who">' + andEscape(item.who) + '</span><span>' + andEscape(label) + ' · ' + andEscape(when) + '</span></div>'
            + '<p>' + andEscape(item.body) + '</p>'
            + '</article>';
    }).join('');
}

function renderAdminNotes(negotiation) {
    const el = document.getElementById('and-admin-notes');
    if (!el) return;
    const notes = negotiation.adminNotes || [];
    if (!notes.length) {
        el.innerHTML = '<p class="text-gray-500 text-sm">No internal notes yet.</p>';
        return;
    }
    el.innerHTML = notes.map(n =>
        '<div class="and-admin-note"><strong>' + andEscape(new Date(n.at).toLocaleString()) + '</strong> — ' + andEscape(n.note) + '</div>'
    ).join('');
}

function getDisputeLabel(type, value) {
    const dl = window.disputeLifecycle;
    if (!dl) return value || '—';
    if (type === 'status' && dl.getDisputeStatusLabel) return dl.getDisputeStatusLabel(value);
    if (type === 'category' && dl.getDisputeCategoryLabel) return dl.getDisputeCategoryLabel(value);
    if (type === 'outcome' && dl.getResolutionOutcomeLabel) return dl.getResolutionOutcomeLabel(value);
    return value || '—';
}

async function loadActiveDisputeForNegotiation(negotiation) {
    if (!negotiation?.disputeId) {
        const list = await dataService.getDisputesByNegotiationId(negotiation.id);
        const dl = window.disputeLifecycle;
        return (list || []).find(d => dl?.isActiveDispute ? dl.isActiveDispute(d)
            : ['raised', 'under_review', 'mediation'].includes((d.status || '').toLowerCase())) || null;
    }
    const d = await dataService.getDisputeById(negotiation.disputeId);
    const dl = window.disputeLifecycle;
    if (!d) return null;
    return dl?.isActiveDispute ? (dl.isActiveDispute(d) ? d : null) : d;
}

async function renderDisputePanel(negotiation, isReadOnly) {
    const section = document.getElementById('and-dispute-section');
    const body = document.getElementById('and-dispute-body');
    const dispute = await loadActiveDisputeForNegotiation(negotiation);
    if (!section || !body) return dispute;

    if (!dispute) {
        section.style.display = 'none';
        body.innerHTML = '';
        return null;
    }

    section.style.display = '';
    const raisedBy = await resolveName(dispute.raisedBy);
    const threadItems = await Promise.all((dispute.thread || []).map(async (msg) => {
        const who = await resolveName(msg.by);
        const when = msg.at ? new Date(msg.at).toLocaleString() : '';
        const adminOnly = msg.visibleToParties === false;
        return '<article class="and-dispute-msg' + (adminOnly ? ' and-dispute-msg--admin-only' : '') + '">'
            + '<div class="and-tl-head"><span class="and-tl-who">' + andEscape(who) + (adminOnly ? ' (admin only)' : '') + '</span><span>' + andEscape(when) + '</span></div>'
            + '<p>' + andEscape(msg.body) + '</p></article>';
    }));

    const outcomes = ['dismiss', 'amend_terms', 'extend_deadline', 'force_close', 'escalate_external'];
    const outcomeOptions = outcomes.map(o =>
        '<option value="' + o + '">' + andEscape(getDisputeLabel('outcome', o)) + '</option>'
    ).join('');

    body.innerHTML = ''
        + '<div class="and-dispute-meta">'
        + '<span>ID: <strong>' + andEscape(dispute.id) + '</strong></span>'
        + '<span>Category: <strong>' + andEscape(getDisputeLabel('category', dispute.category)) + '</strong></span>'
        + '<span>Status: <strong>' + andEscape(getDisputeLabel('status', dispute.status)) + '</strong></span>'
        + '<span>Raised by: <strong>' + andEscape(raisedBy) + '</strong></span>'
        + '</div>'
        + '<p>' + andEscape(dispute.description || '') + '</p>'
        + '<div class="and-dispute-thread">' + threadItems.join('') + '</div>'
        + (!isReadOnly
            ? '<div class="and-dispute-actions">'
            + '<button type="button" class="btn btn-outline btn-sm" id="and-assign-review">Mark under review</button>'
            + '<button type="button" class="btn btn-outline btn-sm" id="and-assign-mediation">Move to mediation</button>'
            + '</div>'
            + '<form id="and-dispute-msg-form" class="and-note-form"><textarea id="and-dispute-msg-input" rows="2" placeholder="Post to dispute thread (parties see this)…" class="form-input"></textarea>'
            + '<button type="submit" class="btn btn-outline btn-sm">Post party-visible message</button></form>'
            + '<form id="and-dispute-resolve-form" class="and-dispute-resolve">'
            + '<h3 class="text-sm font-bold">Resolve dispute</h3>'
            + '<div><label for="and-resolve-outcome">Outcome</label><select id="and-resolve-outcome" class="form-input" required>' + outcomeOptions + '</select></div>'
            + '<div><label for="and-resolve-notes">Resolution notes</label><textarea id="and-resolve-notes" rows="2" class="form-input" placeholder="Explain the decision…"></textarea></div>'
            + '<div id="and-resolve-extra-fields"></div>'
            + '<button type="submit" class="btn btn-primary btn-sm">Apply resolution</button>'
            + '</form>'
            : '<p class="text-gray-500 text-sm">Read-only — dispute actions disabled.</p>');

    if (!isReadOnly) {
        bindDisputeAdminActions(dispute, negotiation);
    }
    return dispute;
}

function bindDisputeAdminActions(dispute, negotiation) {
    const assign = async (status) => {
        const user = authService.getCurrentUser();
        if (!user) return;
        try {
            await dataService.adminAssignDisputeReview(dispute.id, user.id, status);
            await reloadDetail(negotiation.id);
        } catch (err) {
            alert((err && err.message) || 'Could not update dispute status.');
        }
    };

    document.getElementById('and-assign-review')?.addEventListener('click', () => assign('under_review'));
    document.getElementById('and-assign-mediation')?.addEventListener('click', () => assign('mediation'));

    const msgForm = document.getElementById('and-dispute-msg-form');
    if (msgForm && !msgForm.dataset.bound) {
        msgForm.dataset.bound = '1';
        msgForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = authService.getCurrentUser();
            const text = document.getElementById('and-dispute-msg-input')?.value?.trim();
            if (!user || !text) return;
            try {
                await dataService.addDisputeMessage(dispute.id, user.id, text);
                await reloadDetail(negotiation.id);
            } catch (err) {
                alert((err && err.message) || 'Could not post message.');
            }
        });
    }

    const outcomeEl = document.getElementById('and-resolve-outcome');
    const extraEl = document.getElementById('and-resolve-extra-fields');
    const syncExtra = () => {
        if (!extraEl || !outcomeEl) return;
        const o = outcomeEl.value;
        if (o === 'extend_deadline') {
            extraEl.innerHTML = '<div><label for="and-resolve-days">Extra days</label><input type="number" id="and-resolve-days" class="form-input" min="1" max="90" value="7"></div>';
        } else if (o === 'amend_terms') {
            extraEl.innerHTML = '<div><label for="and-resolve-value">Amended value (optional)</label><input type="number" id="and-resolve-value" class="form-input" placeholder="e.g. 100000"></div>'
                + '<div><label for="and-resolve-scope">Amended scope (optional)</label><textarea id="and-resolve-scope" rows="2" class="form-input"></textarea></div>';
        } else {
            extraEl.innerHTML = '';
        }
    };
    if (outcomeEl && !outcomeEl.dataset.bound) {
        outcomeEl.dataset.bound = '1';
        outcomeEl.addEventListener('change', syncExtra);
        syncExtra();
    }

    const resolveForm = document.getElementById('and-dispute-resolve-form');
    if (resolveForm && !resolveForm.dataset.bound) {
        resolveForm.dataset.bound = '1';
        resolveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = authService.getCurrentUser();
            if (!user) return;
            const outcome = document.getElementById('and-resolve-outcome')?.value;
            const notes = document.getElementById('and-resolve-notes')?.value?.trim();
            if (typeof window.validateResolveDispute === 'function') {
                const check = window.validateResolveDispute({ outcome, notes });
                if (!check.isValid) {
                    alert(check.errors[0] || 'Invalid resolution.');
                    return;
                }
            }
            const payload = { outcome, notes };
            if (outcome === 'extend_deadline') {
                payload.extraDays = Number(document.getElementById('and-resolve-days')?.value) || 7;
            }
            if (outcome === 'amend_terms') {
                const amendedTerms = {};
                const val = document.getElementById('and-resolve-value')?.value;
                const scope = document.getElementById('and-resolve-scope')?.value?.trim();
                if (val) amendedTerms.value = Number(val);
                if (scope) amendedTerms.scope = scope;
                if (!Object.keys(amendedTerms).length) {
                    alert('Amend terms requires at least one amended field.');
                    return;
                }
                payload.amendedTerms = amendedTerms;
            }
            if (!confirm('Apply this dispute resolution?')) return;
            try {
                await dataService.adminResolveDispute(dispute.id, user.id, payload);
                await reloadDetail(negotiation.id);
            } catch (err) {
                alert((err && err.message) || 'Could not resolve dispute.');
            }
        });
    }
}

function renderAdminActions(negotiation, isReadOnly) {
    const el = document.getElementById('and-admin-actions');
    if (!el) return;
    const isActive = window.negotiationLifecycle?.isActiveNegotiation
        ? window.negotiationLifecycle.isActiveNegotiation(negotiation)
        : ['open', 'counter_offered'].includes((negotiation.status || '').toLowerCase());

    let html = '<a href="#" data-route="/negotiations/' + andEscape(negotiation.id) + '" class="btn btn-outline btn-sm">Open workspace</a>';
    html += '<button type="button" class="btn btn-outline btn-sm" id="and-export-json">Export JSON</button>';
    html += '<button type="button" class="btn btn-outline btn-sm" id="and-export-csv">Export CSV</button>';
    if (isActive && !isReadOnly) {
        html += '<button type="button" class="btn btn-primary btn-sm" id="and-extend-expiry">Extend 7 days</button>';
    }
    el.innerHTML = html;

    el.querySelectorAll('a[data-route]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            router.navigate(a.getAttribute('data-route'));
        });
    });

    const extendBtn = document.getElementById('and-extend-expiry');
    if (extendBtn) {
        extendBtn.addEventListener('click', async () => {
            const user = authService.getCurrentUser();
            if (!user) return;
            extendBtn.disabled = true;
            try {
                await dataService.adminExtendNegotiationExpiry(negotiation.id, user.id, 7);
                await reloadDetail(negotiation.id);
            } catch (err) {
                alert((err && err.message) || 'Could not extend expiry.');
            }
            extendBtn.disabled = false;
        });
    }

    bindTranscriptExport(negotiation);
}

async function bindTranscriptExport(negotiation) {
    const exp = window.negotiationTranscriptExport;
    if (!exp?.buildNegotiationTranscript) return;

    const runExport = async (format) => {
        const opportunity = negotiation.opportunityId
            ? await dataService.getOpportunityById(negotiation.opportunityId)
            : null;
        const dispute = negotiation.disputeId
            ? await dataService.getDisputeById(negotiation.disputeId)
            : await loadActiveDisputeForNegotiation(negotiation);
        const transcript = await exp.buildNegotiationTranscript({
            negotiation,
            dispute,
            opportunityTitle: opportunity?.title,
            includeAdminNotes: true,
            resolveName
        });
        const base = 'negotiation-' + negotiation.id + '-' + new Date().toISOString().slice(0, 10);
        if (format === 'json') {
            exp.downloadTextFile(base + '.json', exp.transcriptToJson(transcript), 'application/json');
        } else {
            exp.downloadTextFile(base + '-timeline.csv', exp.transcriptTimelineToCsv(transcript), 'text/csv');
        }
    };

    const jsonBtn = document.getElementById('and-export-json');
    const csvBtn = document.getElementById('and-export-csv');
    if (jsonBtn && !jsonBtn.dataset.bound) {
        jsonBtn.dataset.bound = '1';
        jsonBtn.addEventListener('click', () => { void runExport('json'); });
    }
    if (csvBtn && !csvBtn.dataset.bound) {
        csvBtn.dataset.bound = '1';
        csvBtn.addEventListener('click', () => { void runExport('csv'); });
    }
}

async function renderDetail(negotiation) {
    const nt = window.negotiationTerms;
    const cc = window.AdminNegotiationCommandCenter;
    const opportunity = negotiation.opportunityId
        ? await dataService.getOpportunityById(negotiation.opportunityId)
        : null;
    const deals = await dataService.getDeals();
    const linkedDeal = (deals || []).find(d => d.negotiationId === negotiation.id);

    const terms = nt?.getEffectiveTerms ? nt.getEffectiveTerms(negotiation) : {};
    const exchangeMode = nt?.detectExchangeMode ? nt.detectExchangeMode(terms, opportunity) : 'cash';

    const titleEl = document.getElementById('and-title');
    if (titleEl) titleEl.textContent = opportunity?.title || ('Negotiation ' + negotiation.id);

    const subEl = document.getElementById('and-subtitle');
    if (subEl) subEl.textContent = 'ID ' + negotiation.id + (negotiation.expiresAt ? ' · Expires ' + new Date(negotiation.expiresAt).toLocaleDateString() : '');

    const badge = document.getElementById('and-status-badge');
    if (badge) badge.textContent = getStatusLabel(negotiation.status);

    const isReadOnly = authService.isReadOnlyAdmin && authService.isReadOnlyAdmin();
    const activeDisputePreview = await loadActiveDisputeForNegotiation(negotiation);

    const flagsEl = document.getElementById('and-flags');
    if (flagsEl && cc) {
        const enriched = cc.enrichNegotiationRow(negotiation, {
            opportunityTitle: opportunity?.title,
            agreedNoDeal: cc.isAgreedNoDeal(negotiation, deals),
            hasActiveDispute: !!activeDisputePreview
        });
        flagsEl.innerHTML = [
            enriched.flags?.hasDispute ? '<span class="an-flag an-flag--danger">Dispute</span>' : '',
            enriched.flags?.stalled ? '<span class="an-flag an-flag--warning">Stalled</span>' : '',
            enriched.flags?.expiringSoon ? '<span class="an-flag an-flag--danger">Expiring soon</span>' : '',
            enriched.flags?.agreedNoDeal ? '<span class="an-flag an-flag--success">Agreed, no deal</span>' : ''
        ].filter(Boolean).join('');
    }

    const activeDispute = await renderDisputePanel(negotiation, isReadOnly);
    if (activeDispute) {
        const timeline = await buildTimelineItems(negotiation, activeDispute);
        renderTimeline(timeline);
    } else {
        const timeline = await buildTimelineItems(negotiation);
        renderTimeline(timeline);
    }

    renderTermsSheet(terms, exchangeMode);
    renderAdminNotes(negotiation);

    renderAdminActions(negotiation, isReadOnly);

    const noteForm = document.getElementById('and-note-form');
    const noteInput = document.getElementById('and-note-input');
    if (noteForm && !noteForm.dataset.bound) {
        noteForm.dataset.bound = '1';
        if (isReadOnly) {
            noteForm.style.display = 'none';
        } else {
            noteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = authService.getCurrentUser();
                const text = noteInput?.value?.trim();
                if (!user || !text) return;
                try {
                    await dataService.adminAddNegotiationNote(negotiation.id, user.id, text);
                    if (noteInput) noteInput.value = '';
                    await reloadDetail(negotiation.id);
                } catch (err) {
                    alert((err && err.message) || 'Could not save note.');
                }
            });
        }
    }

    const dl = document.getElementById('and-context-dl');
    if (dl) {
        const rows = [];
        if (opportunity) rows.push(['Opportunity', '<a href="#" data-route="/opportunities/' + andEscape(opportunity.id) + '">' + andEscape(opportunity.title) + '</a>']);
        if (negotiation.matchId) rows.push(['Match', '<a href="#" data-route="/matches/' + andEscape(negotiation.matchId) + '">' + andEscape(negotiation.matchId) + '</a>']);
        if (linkedDeal) rows.push(['Deal', '<a href="#" data-route="/deals/' + andEscape(linkedDeal.id) + '">' + andEscape(linkedDeal.title || linkedDeal.id) + '</a>']);
        rows.push(['Rounds', String((negotiation.rounds || []).length)]);
        rows.push(['Messages', String((negotiation.discussionThread || []).length)]);
        dl.innerHTML = rows.map(([k, v]) => '<div><dt>' + andEscape(k) + '</dt><dd>' + v + '</dd></div>').join('');
        dl.querySelectorAll('a[data-route]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                router.navigate(a.getAttribute('data-route'));
            });
        });
    }

    const partiesEl = document.getElementById('and-parties');
    if (partiesEl) {
        const agreements = new Set((negotiation.participantAgreements || []).map(a => a.userId));
        const items = await Promise.all((negotiation.parties || []).map(async p => {
            const name = await resolveName(p.userId);
            const agreed = agreements.has(p.userId) ? ' ✓ Agreed' : '';
            return '<li><strong>' + andEscape(name) + '</strong> · ' + andEscape(p.role || 'participant') + agreed + '</li>';
        }));
        partiesEl.innerHTML = items.join('');
    }
}

async function reloadDetail(negotiationId) {
    const negotiation = await dataService.getNegotiationById(negotiationId);
    if (negotiation) await renderDetail(negotiation);
}

async function initAdminNegotiationDetail(params) {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.matching.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader?.PRESETS?.adminNegotiationDetail) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminNegotiationDetail);
    }

    const id = params.id;
    const loading = document.getElementById('and-loading');
    const content = document.getElementById('and-content');
    const error = document.getElementById('and-error');

    if (!id) {
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'block';
        return;
    }

    try {
        const negotiation = await dataService.getNegotiationById(id);
        if (!negotiation) {
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
            return;
        }
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';
        if (content) content.style.display = 'block';
        await renderDetail(negotiation);
        if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
    } catch (e) {
        console.error('Admin negotiation detail error:', e);
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'block';
    }
}

window.initAdminNegotiationDetail = initAdminNegotiationDetail;
