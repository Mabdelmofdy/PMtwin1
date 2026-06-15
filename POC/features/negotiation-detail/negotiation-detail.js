/**
 * Negotiation Detail — dedicated value negotiation workspace (Phase 1)
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function getDisputeApi() {
    return window.disputeLifecycle || {};
}

function getDisputeCategories() {
    const fromConfig = window.CONFIG?.MATCHING?.DISPUTE?.CATEGORIES;
    if (Array.isArray(fromConfig) && fromConfig.length) return fromConfig;
    const api = getDisputeApi();
    return api.DISPUTE_CATEGORIES
        ? Object.values(api.DISPUTE_CATEGORIES)
        : ['value_mismatch', 'scope_disagreement', 'payment_terms', 'bad_faith', 'other'];
}

function getDisputeLabel(type, value) {
    const api = getDisputeApi();
    if (type === 'status' && typeof api.getDisputeStatusLabel === 'function') {
        return api.getDisputeStatusLabel(value);
    }
    if (type === 'category' && typeof api.getDisputeCategoryLabel === 'function') {
        return api.getDisputeCategoryLabel(value);
    }
    return value || '—';
}

async function loadActiveDispute(negotiation) {
    if (!negotiation) return null;
    if (negotiation.disputeId && typeof dataService.getDisputeById === 'function') {
        const d = await dataService.getDisputeById(negotiation.disputeId);
        const api = getDisputeApi();
        if (d && typeof api.isActiveDispute === 'function' && api.isActiveDispute(d)) return d;
        if (d && !api.isActiveDispute) {
            const active = ['raised', 'under_review', 'mediation'];
            if (active.includes((d.status || '').toLowerCase())) return d;
        }
    }
    if (typeof dataService.getDisputesByNegotiationId === 'function') {
        const list = await dataService.getDisputesByNegotiationId(negotiation.id);
        const api = getDisputeApi();
        return (list || []).find(d =>
            typeof api.isActiveDispute === 'function' ? api.isActiveDispute(d)
                : ['raised', 'under_review', 'mediation'].includes((d.status || '').toLowerCase())
        ) || null;
    }
    return null;
}

function isFormalActionsFrozen(activeDispute) {
    if (!activeDispute) return false;
    const freeze = window.CONFIG?.MATCHING?.NEGOTIATION?.DISPUTE_FREEZE_FORMAL_OFFERS !== false;
    if (!freeze) return false;
    const api = getDisputeApi();
    if (typeof api.negotiationFormalActionsFrozen === 'function') {
        return api.negotiationFormalActionsFrozen(activeDispute);
    }
    return true;
}

async function renderDisputeSection(negotiation, currentUserId, activeDispute) {
    const section = document.getElementById('negotiation-dispute-section');
    const body = document.getElementById('negotiation-dispute-body');
    const lead = document.getElementById('negotiation-dispute-lead');
    const banner = document.getElementById('negotiation-dispute-banner');
    const pill = document.getElementById('negotiation-dispute-pill');
    const frozen = isFormalActionsFrozen(activeDispute);

    if (pill) {
        if (activeDispute) {
            pill.style.display = '';
            pill.textContent = getDisputeLabel('status', activeDispute.status);
        } else {
            pill.style.display = 'none';
        }
    }

    if (banner) {
        if (frozen) {
            banner.style.display = '';
            banner.innerHTML = '<strong>Formal actions paused.</strong> While this dispute is active, counter-proposals, agree, and cancel are frozen. You can still post discussion messages.';
        } else {
            banner.style.display = 'none';
            banner.textContent = '';
        }
    }

    const status = (negotiation.status || '').toLowerCase();
    const canRaise = ['open', 'counter_offered', 'agreed'].includes(status) && !activeDispute;

    if (!activeDispute && !canRaise) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = '';
    if (!body) return;

    if (activeDispute) {
        if (lead) lead.textContent = 'An active dispute is under review. Admin may mediate or resolve.';
        const threadHtml = await renderDisputeThread(activeDispute);
        const raisedByName = await resolvePartyDisplay(dataService, { userId: activeDispute.raisedBy }, currentUserId);
        body.innerHTML = ''
            + '<div class="negotiation-dispute-meta">'
            + '<span>Category: <strong>' + escapeHtml(getDisputeLabel('category', activeDispute.category)) + '</strong></span>'
            + '<span>Status: <strong>' + escapeHtml(getDisputeLabel('status', activeDispute.status)) + '</strong></span>'
            + '<span>Raised by: <strong>' + escapeHtml(raisedByName.name) + '</strong></span>'
            + (activeDispute.raisedAt ? '<span>' + escapeHtml(new Date(activeDispute.raisedAt).toLocaleString()) + '</span>' : '')
            + '</div>'
            + '<p>' + escapeHtml(activeDispute.description || '') + '</p>'
            + threadHtml
            + '<form id="negotiation-dispute-msg-form" class="negotiation-dispute-raise-form">'
            + '<label for="negotiation-dispute-msg-input">Add to dispute thread</label>'
            + '<textarea id="negotiation-dispute-msg-input" rows="2" class="form-input" placeholder="Explain your position…"></textarea>'
            + '<button type="submit" class="btn btn-outline btn-sm">Post message</button>'
            + '</form>'
            + (activeDispute.raisedBy === currentUserId
                ? '<div class="negotiation-dispute-actions"><button type="button" class="btn btn-outline text-gray-600" id="btn-withdraw-dispute">Withdraw dispute</button></div>'
                : '');

        bindDisputeThreadForm(activeDispute.id, negotiation.id, currentUserId);
        const withdrawBtn = document.getElementById('btn-withdraw-dispute');
        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = '1';
            withdrawBtn.addEventListener('click', async () => {
                if (!confirm('Withdraw this dispute? Formal negotiation actions will resume.')) return;
                try {
                    await dataService.withdrawNegotiationDispute(activeDispute.id, currentUserId);
                    setNegotiationFlash('Dispute withdrawn.', 'success');
                    await reloadNegotiationDetail(negotiation.id, currentUserId);
                } catch (err) {
                    setNegotiationFlash((err && err.message) || 'Could not withdraw dispute.', 'danger');
                }
            });
        }
        return;
    }

    if (lead) lead.textContent = 'If terms cannot be agreed informally, raise a dispute for admin review.';
    const cats = getDisputeCategories();
    const options = cats.map(c =>
        '<option value="' + escapeAttr(c) + '">' + escapeHtml(getDisputeLabel('category', c)) + '</option>'
    ).join('');
    body.innerHTML = ''
        + '<form id="negotiation-raise-dispute-form" class="negotiation-dispute-raise-form">'
        + '<div><label for="negotiation-dispute-category">Category</label>'
        + '<select id="negotiation-dispute-category" class="form-input" required>' + options + '</select></div>'
        + '<div><label for="negotiation-dispute-description">Description</label>'
        + '<textarea id="negotiation-dispute-description" rows="4" class="form-input" required minlength="10" placeholder="Describe the disagreement (min 10 characters)…"></textarea></div>'
        + '<button type="submit" class="btn btn-outline">Raise dispute</button>'
        + '</form>';

    const form = document.getElementById('negotiation-raise-dispute-form');
    if (form && !form.dataset.bound) {
        form.dataset.bound = '1';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const category = document.getElementById('negotiation-dispute-category')?.value;
            const description = document.getElementById('negotiation-dispute-description')?.value?.trim();
            if (typeof window.validateRaiseDispute === 'function') {
                const check = window.validateRaiseDispute({ category, description });
                if (!check.isValid) {
                    setNegotiationFlash(check.errors[0] || 'Invalid dispute.', 'danger');
                    return;
                }
            }
            try {
                await dataService.raiseNegotiationDispute(negotiation.id, currentUserId, { category, description });
                setNegotiationFlash('Dispute raised. Formal proposals are paused until resolved.', 'info');
                await reloadNegotiationDetail(negotiation.id, currentUserId);
            } catch (err) {
                setNegotiationFlash((err && err.message) || 'Could not raise dispute.', 'danger');
            }
        });
    }
}

async function renderDisputeThread(dispute) {
    const messages = (dispute.thread || []).filter(m => m.visibleToParties !== false);
    if (!messages.length) return '';
    const items = await Promise.all(messages.map(async (msg) => {
        const who = await resolvePartyDisplay(dataService, { userId: msg.by }, null);
        const when = msg.at ? new Date(msg.at).toLocaleString() : '';
        return '<article class="negotiation-dispute-msg">'
            + '<div class="negotiation-dispute-msg__head"><span>' + escapeHtml(who.name) + '</span><span>' + escapeHtml(when) + '</span></div>'
            + '<p>' + escapeHtml(msg.body || '') + '</p>'
            + '</article>';
    }));
    return '<div class="negotiation-dispute-thread">' + items.join('') + '</div>';
}

function bindDisputeThreadForm(disputeId, negotiationId, currentUserId) {
    const form = document.getElementById('negotiation-dispute-msg-form');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('negotiation-dispute-msg-input')?.value?.trim();
        if (!text) return;
        try {
            await dataService.addDisputeMessage(disputeId, currentUserId, text);
            setNegotiationFlash('Message posted to dispute thread.', 'success');
            await reloadNegotiationDetail(negotiationId, currentUserId);
        } catch (err) {
            setNegotiationFlash((err && err.message) || 'Could not post message.', 'danger');
        }
    });
}

function applyFreezeUi(frozen, isActive) {
    const agreeBtn = document.getElementById('btn-negotiation-agree');
    const cancelBtn = document.getElementById('btn-negotiation-cancel');
    const sendBtn = document.getElementById('btn-negotiation-send-proposal');
    const proposalLead = document.querySelector('#negotiation-proposal-section .negotiation-card__lead');

    [agreeBtn, cancelBtn].forEach(btn => {
        if (btn) {
            btn.disabled = !!frozen;
            btn.title = frozen ? 'Frozen while dispute is active' : '';
        }
    });
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.title = frozen ? 'Only discussion messages allowed while dispute is active' : '';
    }
    if (proposalLead && isActive) {
        proposalLead.textContent = frozen
            ? 'Formal counter-offers are paused. Use the message field for discussion only.'
            : 'Send a structured counter-offer. Leave fields blank to keep current values.';
    }
}

function getTermsApi() {
    return window.negotiationTerms || {};
}

function getNegotiationLabel(status) {
    if (window.negotiationLifecycle && typeof window.negotiationLifecycle.getNegotiationStatusLabel === 'function') {
        return window.negotiationLifecycle.getNegotiationStatusLabel(status);
    }
    return status || 'Negotiation';
}

function formatRole(role) {
    if (typeof formatParticipantRole === 'function') {
        return formatParticipantRole(role, role);
    }
    return (role || 'participant').replace(/_/g, ' ');
}

function setNegotiationFlash(message, tone) {
    const el = document.getElementById('negotiation-flash');
    if (!el) return;
    if (!message) {
        el.style.display = 'none';
        el.textContent = '';
        return;
    }
    el.style.display = '';
    el.className = 'negotiation-flash negotiation-flash--' + (tone || 'info');
    el.textContent = message;
}

async function resolvePartyDisplay(ds, party, currentUserId) {
    const userId = party.userId;
    let name = userId;
    if (userId && typeof ds.getUserOrCompanyById === 'function') {
        const u = await ds.getUserOrCompanyById(userId);
        name = u?.profile?.name || u?.profile?.companyName || userId;
    }
    return {
        userId,
        name,
        role: party.role || 'participant',
        roleLabel: formatRole(party.role),
        isYou: userId === currentUserId
    };
}

function renderTermsSheet(terms, exchangeMode) {
    const api = getTermsApi();
    const rows = typeof api.getTermSheetRows === 'function'
        ? api.getTermSheetRows(terms, exchangeMode)
        : [];
    const el = document.getElementById('negotiation-terms-sheet');
    if (!el) return;
    if (!rows.length) {
        el.innerHTML = '<p class="text-gray-500">No terms recorded yet. Submit the first proposal below.</p>';
        return;
    }
    el.innerHTML = rows.map((row) =>
        '<div class="negotiation-terms-row"><dt>' + escapeHtml(row.label) + '</dt><dd>' + escapeHtml(row.value) + '</dd></div>'
    ).join('');
}

function renderProposalForm(exchangeMode, terms) {
    const api = getTermsApi();
    const defs = typeof api.getProposalFieldDefs === 'function'
        ? api.getProposalFieldDefs(exchangeMode)
        : [];
    const form = document.getElementById('negotiation-proposal-form');
    if (!form) return;

    form.innerHTML = defs.map((def) => {
        const val = terms && terms[def.key] != null ? terms[def.key] : '';
        const id = 'neg-field-' + def.key;
        if (def.type === 'textarea') {
            return '<div class="negotiation-field"><label for="' + id + '">' + escapeHtml(def.label) + '</label>'
                + '<textarea id="' + id + '" name="' + escapeAttr(def.key) + '" rows="3" placeholder="' + escapeAttr(def.placeholder || '') + '">'
                + escapeHtml(def.key === 'message' ? '' : val)
                + '</textarea></div>';
        }
        const inputType = def.type === 'number' ? 'number' : 'text';
        const inputVal = def.key === 'message' ? '' : val;
        return '<div class="negotiation-field"><label for="' + id + '">' + escapeHtml(def.label) + '</label>'
            + '<input type="' + inputType + '" id="' + id + '" name="' + escapeAttr(def.key) + '"'
            + ' placeholder="' + escapeAttr(def.placeholder || '') + '" value="' + escapeAttr(inputVal) + '" /></div>';
    }).join('');
}

async function renderDiscussionList(ds, negotiation, currentUserId) {
    const el = document.getElementById('negotiation-discussion-list');
    if (!el) return;
    const thread = negotiation.discussionThread || [];
    if (!thread.length) {
        el.innerHTML = '<p class="text-gray-500">No discussion messages yet. Use the proposal message field without changing terms to chat.</p>';
        return;
    }
    const items = await Promise.all(thread.map(async (msg) => {
        const party = (negotiation.parties || []).find(p => p.userId === msg.by);
        const display = await resolvePartyDisplay(ds, party || { userId: msg.by }, currentUserId);
        const when = msg.at ? new Date(msg.at).toLocaleString() : '';
        return '<article class="negotiation-discussion-item">'
            + '<div class="negotiation-discussion-item__meta">' + escapeHtml(display.name)
            + (display.isYou ? ' (You)' : '') + ' · ' + escapeHtml(when) + '</div>'
            + '<p>' + escapeHtml(msg.body || '') + '</p></article>';
    }));
    el.innerHTML = items.join('');
}

const negotiationRoundsDetailCache = new Map();

function buildDetailDlRows(rows) {
    if (!rows.length) {
        return '<p class="negotiation-round-detail-empty">No data recorded.</p>';
    }
    return '<dl class="negotiation-round-detail-dl">'
        + rows.map(([label, value]) =>
            '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
        ).join('')
        + '</dl>';
}

function buildProposalDetailRows(proposal, exchangeMode) {
    const api = getTermsApi();
    if (!proposal || !Object.keys(proposal).length) return [];
    if (typeof api.getTermSheetRows === 'function') {
        return api.getTermSheetRows(proposal, exchangeMode).map((row) => [row.label, row.value]);
    }
    return Object.entries(proposal).map(([key, value]) => [key, value == null ? '—' : String(value)]);
}

async function buildApplicationDetailRows(ds, application) {
    if (!application) return [];
    const rows = [];
    const applicant = application.applicantId && typeof ds.getUserOrCompanyById === 'function'
        ? await ds.getUserOrCompanyById(application.applicantId)
        : null;
    const applicantName = applicant?.profile?.name || applicant?.profile?.companyName || application.applicantId;
    if (applicantName) rows.push(['Applicant', applicantName]);
    const av = application.application_value || {};
    const value = av.amount ?? av.requestedValue ?? av.offeredValue;
    const currency = av.currency || av.requestedCurrency || 'SAR';
    if (value != null) rows.push(['Requested value', Number(value).toLocaleString() + ' ' + currency]);
    if (application.proposal) rows.push(['Proposal summary', application.proposal]);
    if (application.coverLetter) rows.push(['Cover letter', application.coverLetter]);
    if (application.availabilityDate) rows.push(['Availability', application.availabilityDate]);
    if (application.estimatedDurationDays != null) {
        rows.push(['Estimated duration', application.estimatedDurationDays + ' days']);
    }
    if (application.status) rows.push(['Application status', application.status.replace(/_/g, ' ')]);
    return rows;
}

async function showNegotiationRoundDetailModal(context) {
    const {
        negotiation,
        roundIndex,
        round,
        display,
        deltas,
        effectiveTerms,
        exchangeMode
    } = context;
    const api = getTermsApi();
    const when = round.at ? new Date(round.at).toLocaleString() : '—';
    const proposalRows = buildProposalDetailRows(round.proposal, exchangeMode);
    const effectiveRows = typeof api.getTermSheetRows === 'function'
        ? api.getTermSheetRows(effectiveTerms, exchangeMode).map((row) => [row.label, row.value])
        : [];

    let applicationSection = '';
    if (negotiation.applicationId && typeof dataService.getApplicationById === 'function') {
        const application = await dataService.getApplicationById(negotiation.applicationId);
        const showAppContext = application && (
            roundIndex === 0 || round.by === application.applicantId
        );
        if (showAppContext) {
            const appRows = await buildApplicationDetailRows(dataService, application);
            if (appRows.length) {
                applicationSection = ''
                    + '<section class="negotiation-round-detail-section">'
                    + '<h4 class="negotiation-round-detail-section__title">Linked application</h4>'
                    + '<p class="negotiation-round-detail-section__lead">Original data from the applicant who submitted this application.</p>'
                    + buildDetailDlRows(appRows)
                    + '</section>';
            }
        }
    }

    const deltaSection = deltas.length
        ? '<section class="negotiation-round-detail-section">'
            + '<h4 class="negotiation-round-detail-section__title">Changes from previous round</h4>'
            + '<ul class="negotiation-round-detail-deltas">'
            + deltas.map((d) =>
                '<li><strong>' + escapeHtml(d.label) + ':</strong> ' + escapeHtml(d.from) + ' → ' + escapeHtml(d.to) + '</li>'
            ).join('')
            + '</ul></section>'
        : '';

    const messageSection = round.message
        ? '<section class="negotiation-round-detail-section">'
            + '<h4 class="negotiation-round-detail-section__title">Message</h4>'
            + '<p class="negotiation-round-detail-message">' + escapeHtml(round.message) + '</p>'
            + '</section>'
        : '';

    const bodyHtml = ''
        + '<div class="negotiation-round-detail-meta">'
        + '<p><strong>Sent by:</strong> ' + escapeHtml(display.name) + (display.isYou ? ' (You)' : '')
        + ' <span class="negotiation-round-detail-role">(' + escapeHtml(display.roleLabel) + ')</span></p>'
        + '<p><strong>Sent at:</strong> ' + escapeHtml(when) + '</p>'
        + '</div>'
        + applicationSection
        + '<section class="negotiation-round-detail-section">'
        + '<h4 class="negotiation-round-detail-section__title">Terms proposed in this round</h4>'
        + buildDetailDlRows(proposalRows)
        + '</section>'
        + messageSection
        + deltaSection
        + '<section class="negotiation-round-detail-section">'
        + '<h4 class="negotiation-round-detail-section__title">Effective terms after this round</h4>'
        + buildDetailDlRows(effectiveRows)
        + '</section>';

    const title = 'Round ' + (roundIndex + 1) + ' · ' + display.name;
    if (window.modalService && typeof window.modalService.showCustom === 'function') {
        await window.modalService.showCustom(bodyHtml, title, {
            confirmText: 'Close',
            modalClass: 'modal-dialog--negotiation-round'
        });
    } else {
        window.alert(display.name + ' — ' + (round.message || proposalRows.map((r) => r.join(': ')).join('\n')));
    }
}

function setupNegotiationRoundsListInteraction() {
    const el = document.getElementById('negotiation-rounds-list');
    if (!el || el.dataset.roundInteractionBound) return;
    el.dataset.roundInteractionBound = '1';

    const openRound = async (card) => {
        const negId = el.dataset.negotiationId;
        const idx = parseInt(card.getAttribute('data-round-index'), 10);
        if (!negId || Number.isNaN(idx)) return;
        const cache = negotiationRoundsDetailCache.get(negId);
        if (!cache || !cache.rounds[idx]) return;
        const roundCtx = cache.rounds[idx];
        await showNegotiationRoundDetailModal({
            negotiation: cache.negotiation,
            roundIndex: idx,
            round: roundCtx.round,
            display: roundCtx.display,
            deltas: roundCtx.deltas,
            effectiveTerms: roundCtx.effectiveTerms,
            exchangeMode: cache.exchangeMode,
            currentUserId: cache.currentUserId
        });
    };

    el.addEventListener('click', (e) => {
        const card = e.target.closest('[data-round-index]');
        if (!card) return;
        e.preventDefault();
        void openRound(card);
    });

    el.addEventListener('keydown', (e) => {
        const card = e.target.closest('[data-round-index]');
        if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        void openRound(card);
    });
}

async function renderRoundsList(ds, negotiation, postMatch, currentUserId, exchangeMode) {
    const el = document.getElementById('negotiation-rounds-list');
    if (!el) return;
    const rounds = negotiation.rounds || [];
    const api = getTermsApi();

    el.dataset.negotiationId = negotiation.id;

    if (!rounds.length) {
        el.innerHTML = '<p class="text-gray-500">No formal proposals yet.</p>';
        negotiationRoundsDetailCache.delete(negotiation.id);
        return;
    }

    let prevTerms = { ...(negotiation.initialTerms || {}) };
    const htmlParts = [];
    const roundCacheEntries = [];

    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        const party = (negotiation.parties || []).find(p => p.userId === round.by);
        const display = await resolvePartyDisplay(ds, party || { userId: round.by }, currentUserId);
        const nextTerms = round.proposal && Object.keys(round.proposal).length
            ? (typeof api.mergeProposalTerms === 'function'
                ? api.mergeProposalTerms(prevTerms, round.proposal)
                : { ...prevTerms, ...round.proposal })
            : prevTerms;
        const deltas = typeof api.computeTermDeltas === 'function'
            ? api.computeTermDeltas(prevTerms, nextTerms)
            : [];
        roundCacheEntries.push({
            round,
            display,
            deltas,
            effectiveTerms: { ...nextTerms }
        });
        prevTerms = nextTerms;

        const when = round.at ? new Date(round.at).toLocaleString() : '';
        const deltaPreview = deltas.length
            ? '<ul class="negotiation-round__deltas">' + deltas.slice(0, 2).map((d) =>
                '<li><strong>' + escapeHtml(d.label) + ':</strong> ' + escapeHtml(d.from) + ' → ' + escapeHtml(d.to) + '</li>'
            ).join('') + (deltas.length > 2 ? '<li class="negotiation-round__more">+' + (deltas.length - 2) + ' more…</li>' : '') + '</ul>'
            : '';
        const msgPreview = round.message
            ? '<p class="negotiation-round__message">' + escapeHtml(round.message.length > 120 ? round.message.slice(0, 120) + '…' : round.message) + '</p>'
            : '';

        htmlParts.push(
            '<article class="negotiation-round negotiation-round--clickable" data-round-index="' + i + '" role="button" tabindex="0" aria-label="View full details for round ' + (i + 1) + '">'
            + '<div class="negotiation-round__head">'
            + '<span class="negotiation-round__who">Round ' + (i + 1) + ' · ' + escapeHtml(display.name)
            + (display.isYou ? ' (You)' : '') + '</span>'
            + '<span class="negotiation-round__meta">' + escapeHtml(display.roleLabel) + (when ? ' · ' + escapeHtml(when) : '') + '</span>'
            + '</div>'
            + msgPreview
            + deltaPreview
            + '<p class="negotiation-round__open-hint"><i class="ph-duotone ph-arrows-out" aria-hidden="true"></i> Click to view full proposal</p>'
            + '</article>'
        );
    }

    negotiationRoundsDetailCache.set(negotiation.id, {
        negotiation,
        exchangeMode,
        currentUserId,
        rounds: roundCacheEntries
    });

    el.innerHTML = htmlParts.join('');
    setupNegotiationRoundsListInteraction();
}

async function renderContextAside(ds, negotiation, opportunity, postMatch) {
    const dl = document.getElementById('negotiation-context-dl');
    if (!dl) return;

    const rows = [];
    if (opportunity) {
        rows.push(['Opportunity', '<a href="#" data-route="/opportunities/' + escapeAttr(opportunity.id) + '">' + escapeHtml(opportunity.title || opportunity.id) + '</a>']);
    }
    if (negotiation.matchId) {
        rows.push(['Match', '<a href="#" data-route="/matches/' + escapeAttr(negotiation.matchId) + '">View match</a>']);
    }
    if (negotiation.applicationId) {
        rows.push(['Application', escapeHtml(negotiation.applicationId)]);
    }
    if (postMatch && postMatch.matchType) {
        rows.push(['Match type', escapeHtml(postMatch.matchType.replace(/_/g, ' '))]);
    }
    if (negotiation.createdAt) {
        rows.push(['Started', escapeHtml(new Date(negotiation.createdAt).toLocaleDateString())]);
    }

    dl.innerHTML = rows.map(([label, value]) =>
        '<div><dt>' + escapeHtml(label) + '</dt><dd>' + value + '</dd></div>'
    ).join('');
}

async function renderPartiesList(ds, negotiation, currentUserId) {
    const el = document.getElementById('negotiation-parties-list');
    if (!el) return;
    const parties = negotiation.parties || [];
    const agreements = negotiation.participantAgreements || [];
    const agreedIds = new Set(agreements.map(a => a.userId));

    const items = await Promise.all(parties.map(async (party) => {
        const d = await resolvePartyDisplay(ds, party, currentUserId);
        const agreed = agreedIds.has(party.userId);
        return '<li>'
            + '<span class="negotiation-party-name">' + escapeHtml(d.name) + (d.isYou ? ' (You)' : '') + '</span>'
            + '<span class="negotiation-party-role">' + escapeHtml(d.roleLabel) + '</span>'
            + (agreed ? '<span class="negotiation-party-agreed">Agreed</span>' : '')
            + '</li>';
    }));
    el.innerHTML = items.join('');
}

function collectProposalFromForm(exchangeMode) {
    const form = document.getElementById('negotiation-proposal-form');
    const api = getTermsApi();
    if (!form) return { proposal: {}, message: '' };

    const formData = {};
    new FormData(form).forEach((value, key) => {
        formData[key] = value;
    });

    if (typeof api.buildProposalFromForm === 'function') {
        return api.buildProposalFromForm(formData, exchangeMode);
    }
    return { proposal: {}, message: formData.message || '' };
}

function bindNegotiationActions(negotiationId, currentUserId) {
    const form = document.getElementById('negotiation-proposal-form');
    if (form && !form.dataset.bound) {
        form.dataset.bound = '1';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSendProposal(negotiationId, currentUserId);
        });
    }

    const bindClick = (id, handler) => {
        const btn = document.getElementById(id);
        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = '1';
            btn.addEventListener('click', handler);
        }
    };

    bindClick('btn-negotiation-agree', async () => {
        try {
            await dataService.agreeNegotiation(negotiationId, currentUserId);
            setNegotiationFlash('Your agreement was recorded.', 'success');
            await reloadNegotiationDetail(negotiationId, currentUserId);
        } catch (err) {
            setNegotiationFlash((err && err.message) || 'Could not agree to terms.', 'danger');
        }
    });

    bindClick('btn-negotiation-cancel', async () => {
        const ok = window.modalService
            ? await window.modalService.confirm(
                'Are you sure you want to cancel this negotiation?',
                'Cancel negotiation',
                { confirmText: 'Yes, cancel', cancelText: 'Keep negotiating', type: 'warning' }
            )
            : window.confirm('Cancel this negotiation?');
        if (!ok) return;
        try {
            await dataService.cancelNegotiation(negotiationId, currentUserId);
            setNegotiationFlash('Negotiation cancelled.', 'info');
            await reloadNegotiationDetail(negotiationId, currentUserId);
        } catch (err) {
            setNegotiationFlash((err && err.message) || 'Could not cancel negotiation.', 'danger');
        }
    });

    bindClick('btn-negotiation-create-deal', async () => {
        const btn = document.getElementById('btn-negotiation-create-deal');
        const existingDealId = btn?.dataset?.dealId;
        if (existingDealId && window.router?.navigate) {
            window.router.navigate('/deals/' + existingDealId);
            return;
        }
        try {
            const deal = await dataService.createDealFromNegotiation(negotiationId, currentUserId);
            if (deal && window.router?.navigate) {
                window.router.navigate('/deals/' + deal.id);
            }
        } catch (err) {
            setNegotiationFlash((err && err.message) || 'Could not create deal.', 'danger');
        }
    });
}

async function handleSendProposal(negotiationId, currentUserId) {
    const negotiation = await dataService.getNegotiationById(negotiationId);
    const api = getTermsApi();
    const terms = typeof api.getEffectiveTerms === 'function' ? api.getEffectiveTerms(negotiation) : {};
    const exchangeMode = typeof api.detectExchangeMode === 'function'
        ? api.detectExchangeMode(terms, null)
        : 'cash';
    const { proposal, message } = collectProposalFromForm(exchangeMode);

    const hasProposalFields = proposal && Object.keys(proposal).some(k => k !== 'exchangeMode' && proposal[k] != null && proposal[k] !== '');
    if (!hasProposalFields && !message) {
        setNegotiationFlash('Add at least one term or a message before sending.', 'danger');
        return;
    }

    if (hasProposalFields && typeof window.validateNegotiationProposal === 'function') {
        const check = window.validateNegotiationProposal(proposal);
        if (!check.isValid) {
            setNegotiationFlash(check.errors[0] || 'Invalid proposal.', 'danger');
            return;
        }
    }

    try {
        await dataService.addNegotiationProposal(negotiationId, currentUserId, { proposal, message });
        setNegotiationFlash('Proposal sent.', 'success');
        await reloadNegotiationDetail(negotiationId, currentUserId);
    } catch (err) {
        setNegotiationFlash((err && err.message) || 'Could not send proposal.', 'danger');
    }
}

async function reloadNegotiationDetail(negotiationId, currentUserId) {
    const negotiation = await dataService.getNegotiationById(negotiationId);
    if (!negotiation) return;
    await renderNegotiationDetail(negotiation, currentUserId);
}

async function renderNegotiationDetail(negotiation, currentUserId) {
    const api = getTermsApi();
    const opportunity = negotiation.opportunityId
        ? await dataService.getOpportunityById(negotiation.opportunityId)
        : null;
    const postMatch = negotiation.matchId
        ? await dataService.getPostMatchById(negotiation.matchId)
        : null;

    const terms = typeof api.getEffectiveTerms === 'function'
        ? api.getEffectiveTerms(negotiation)
        : (negotiation.currentTerms || negotiation.initialTerms || {});
    const exchangeMode = typeof api.detectExchangeMode === 'function'
        ? api.detectExchangeMode(terms, opportunity)
        : 'cash';

    const status = (negotiation.status || 'open').toLowerCase();
    const isActive = window.negotiationLifecycle
        ? window.negotiationLifecycle.isActiveNegotiation(negotiation)
        : ['open', 'counter_offered'].includes(status);
    const isAgreed = status === 'agreed';

    const titleEl = document.getElementById('negotiation-title');
    if (titleEl) titleEl.textContent = opportunity?.title ? 'Negotiation: ' + opportunity.title : 'Value negotiation';

    const subEl = document.getElementById('negotiation-subtitle');
    if (subEl) {
        subEl.textContent = opportunity?.title
            ? 'Structured terms discussion for this opportunity'
            : 'Negotiation workspace';
    }

    const badge = document.getElementById('negotiation-status-badge');
    if (badge) {
        badge.textContent = getNegotiationLabel(negotiation.status);
        badge.className = 'badge ' + (isAgreed ? 'badge--success' : isActive ? 'badge--info' : 'badge--neutral');
    }

    const exchangePill = document.getElementById('negotiation-exchange-pill');
    if (exchangePill) {
        exchangePill.textContent = typeof api.formatTermDisplay === 'function'
            ? api.formatTermDisplay('exchangeMode', exchangeMode)
            : exchangeMode;
    }

    const expiresPill = document.getElementById('negotiation-expires-pill');
    if (expiresPill) {
        if (negotiation.expiresAt && isActive) {
            const exp = new Date(negotiation.expiresAt);
            expiresPill.textContent = 'Expires ' + exp.toLocaleDateString();
        } else {
            expiresPill.textContent = '';
        }
    }

    const roundsPill = document.getElementById('negotiation-rounds-pill');
    if (roundsPill) {
        const max = (window.CONFIG && window.CONFIG.MATCHING && window.CONFIG.MATCHING.NEGOTIATION)
            ? window.CONFIG.MATCHING.NEGOTIATION.MAX_ROUNDS
            : 10;
        roundsPill.textContent = (negotiation.rounds || []).length + ' / ' + max + ' rounds';
    }

    const backLink = document.getElementById('negotiation-back-link');
    if (backLink) {
        const backRoute = negotiation.matchId
            ? '/matches/' + negotiation.matchId
            : (negotiation.opportunityId ? '/opportunities/' + negotiation.opportunityId : '/pipeline/matches');
        backLink.setAttribute('data-route', backRoute);
    }

    renderTermsSheet(terms, exchangeMode);
    const activeDispute = await loadActiveDispute(negotiation);
    const frozen = isFormalActionsFrozen(activeDispute);
    await renderDisputeSection(negotiation, currentUserId, activeDispute);
    await renderDiscussionList(dataService, negotiation, currentUserId);
    await renderRoundsList(dataService, negotiation, postMatch, currentUserId, exchangeMode);
    await renderContextAside(dataService, negotiation, opportunity, postMatch);
    await renderPartiesList(dataService, negotiation, currentUserId);

    const proposalSection = document.getElementById('negotiation-proposal-section');
    const postAgreeSection = document.getElementById('negotiation-post-agree-section');
    const agreedSummary = document.getElementById('negotiation-agreed-summary');

    if (isActive) {
        if (proposalSection) proposalSection.style.display = '';
        if (postAgreeSection) postAgreeSection.style.display = 'none';
        renderProposalForm(exchangeMode, terms);
        applyFreezeUi(frozen, true);
    } else {
        if (proposalSection) proposalSection.style.display = 'none';
        applyFreezeUi(false, false);
    }

    if (isAgreed) {
        if (postAgreeSection) postAgreeSection.style.display = '';
        if (agreedSummary) {
            const agreed = negotiation.agreedTerms || terms;
            const agreedRows = typeof api.getTermSheetRows === 'function'
                ? api.getTermSheetRows(agreed, exchangeMode)
                : [];
            agreedSummary.innerHTML = agreedRows.length
                ? agreedRows.map((row) =>
                    '<div class="negotiation-terms-row"><dt>' + escapeHtml(row.label) + '</dt><dd>' + escapeHtml(row.value) + '</dd></div>'
                ).join('')
                : '<p class="text-gray-500">Agreed terms recorded.</p>';
        }
        const deals = await dataService.getDeals();
        const existingDeal = (deals || []).find(d => d.negotiationId === negotiation.id);
        const createBtn = document.getElementById('btn-negotiation-create-deal');
        if (createBtn) {
            if (existingDeal) {
                createBtn.textContent = 'Open deal workspace';
                createBtn.dataset.dealId = existingDeal.id;
            } else {
                createBtn.textContent = 'Create deal workspace';
                delete createBtn.dataset.dealId;
            }
        }
    } else if (postAgreeSection) {
        postAgreeSection.style.display = 'none';
    }

    bindNegotiationActions(negotiation.id, currentUserId);
    bindParticipantTranscriptExport(negotiation, opportunity);
}

async function bindParticipantTranscriptExport(negotiation, opportunity) {
    const exp = window.negotiationTranscriptExport;
    if (!exp?.buildNegotiationTranscript) return;

    const runExport = async (format) => {
        const dispute = await loadActiveDispute(negotiation);
        const transcript = await exp.buildNegotiationTranscript({
            negotiation,
            dispute,
            opportunityTitle: opportunity?.title,
            includeAdminNotes: false,
            resolveName: async (userId) => {
                const d = await resolvePartyDisplay(dataService, { userId }, null);
                return d.name;
            }
        });
        const base = 'negotiation-' + negotiation.id + '-' + new Date().toISOString().slice(0, 10);
        if (format === 'json') {
            exp.downloadTextFile(base + '.json', exp.transcriptToJson(transcript), 'application/json');
        } else {
            exp.downloadTextFile(base + '-timeline.csv', exp.transcriptTimelineToCsv(transcript), 'text/csv');
        }
    };

    const bind = (id, format) => {
        const btn = document.getElementById(id);
        if (!btn || btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => { void runExport(format); });
    };
    bind('btn-negotiation-export-json', 'json');
    bind('btn-negotiation-export-csv', 'csv');
}

async function initNegotiationDetail(params) {
    const negotiationId = params.id;
    const loadingEl = document.getElementById('negotiation-loading');
    const contentEl = document.getElementById('negotiation-content');
    const errorEl = document.getElementById('negotiation-error');

    if (!negotiationId) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    try {
        const negotiation = await dataService.getNegotiationById(negotiationId);
        if (!negotiation) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            return;
        }

        const isParticipant = (negotiation.parties || []).some(p => p.userId === user.id);
        if (!isParticipant) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const msg = document.getElementById('negotiation-error-message');
                if (msg) msg.textContent = 'Only negotiation participants can access this workspace.';
            }
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        await renderNegotiationDetail(negotiation, user.id);
    } catch (e) {
        console.error('Negotiation detail load error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
    }
}

window.initNegotiationDetail = initNegotiationDetail;
