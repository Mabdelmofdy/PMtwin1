/**
 * Match Detail Component – user-facing post-match discovery detail view
 */

async function initMatchDetail(params) {
    const matchId = params.id;
    const loadingEl = document.getElementById('match-detail-loading');
    const contentEl = document.getElementById('match-detail-content');
    const notFoundEl = document.getElementById('match-detail-not-found');

    if (!matchId) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (notFoundEl) notFoundEl.style.display = 'block';
        return;
    }

    try {
        const postMatch = await dataService.getPostMatchById(matchId);
        if (!postMatch) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (notFoundEl) notFoundEl.style.display = 'block';
            return;
        }

        const user = authService.getCurrentUser();
        if (!user) {
            if (loadingEl) loadingEl.style.display = 'none';
            router.navigate(CONFIG.ROUTES.LOGIN);
            return;
        }
        const isParticipant = (postMatch.participants || []).some(p => p.userId === user.id);
        if (!isParticipant) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (notFoundEl) {
                notFoundEl.style.display = 'block';
                const hint = notFoundEl.querySelector('.match-detail-access-hint');
                if (hint) {
                    hint.textContent = 'Sign in as a match participant (e.g. seed-user-14@controlled.test / password123 for demo-pm-oneway-06).';
                }
            }
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        if (notFoundEl) notFoundEl.style.display = 'none';

        await renderMatchDetail(postMatch, user.id);
        setupMatchDetailActions(matchId, user.id);
        scrollMatchDetailToSection();
    } catch (e) {
        console.error('Match detail load error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (notFoundEl) notFoundEl.style.display = 'block';
    }
}

function getMatchTypeLabel(matchType) {
    if (window.unifiedMatchViewModel) return window.unifiedMatchViewModel.getMatchTypeLabel(matchType);
    return matchType;
}

function getUnifiedMatchTitle(matchType) {
    if (window.unifiedMatchViewModel) return window.unifiedMatchViewModel.getMatchTypeLabel(matchType) + ' Match';
    return 'Match';
}

var CRITERION_LABELS = {
    skills: 'Skill compatibility',
    skillMatch: 'Skill compatibility',
    attributeOverlap: 'Attribute overlap',
    exchangeCompatibility: 'Exchange compatibility',
    valueCompatibility: 'Value compatibility',
    budget: 'Budget fit',
    budgetFit: 'Budget fit',
    timeline: 'Timeline alignment',
    timelineFit: 'Timeline alignment',
    location: 'Location fit',
    locationFit: 'Location fit',
    reputation: 'Reputation'
};

var MATCH_VALUE_HEADINGS = {
    one_way: 'Exchange compatibility',
    two_way: 'Barter compatibility',
    consortium: 'Consortium role fit',
    circular: 'Circular exchange chain'
};

function getStatusBadgeClass(status) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(status, 'match') : 'badge--neutral';
}

function formatStatusLabel(status) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusLabel(status, 'match') : (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending');
}

function getOneWayViewerRole(postMatch, currentUserId) {
    const participants = postMatch.participants || [];
    const needOwner = participants.find(p => p.role === 'need_owner');
    const offerProvider = participants.find(p => p.role === 'offer_provider');
    if (needOwner?.userId === currentUserId) return { isNeedOwner: true };
    if (offerProvider?.userId === currentUserId) return { isNeedOwner: false };
    return { isNeedOwner: needOwner?.userId === currentUserId };
}

async function renderMatchDetail(postMatch, currentUserId) {
    const ds = dataService;
    const payload = postMatch.payload || {};
    const matchType = postMatch.matchType || 'one_way';
    const umv = window.unifiedMatchViewModel;
    let vm = null;
    if (umv) {
        vm = umv.buildUnifiedMatchViewModel(postMatch, { currentUserId, dataService: ds });
        vm = await umv.enrichUnifiedMatchViewModel(vm, { currentUserId, dataService: ds });
    }
    const scorePct = vm?.matchScorePercent ?? Math.min(100, Math.round((postMatch.matchScore || 0) * 100));
    const qualityLabel = vm?.matchQualityLabel || '';

    // —— Header ——
    const titleEl = document.getElementById('match-detail-title');
    titleEl.textContent = postMatch.isReplacement
        ? ('Replacement invitation – ' + (postMatch.replacementRole || 'consortium member'))
        : (vm?.cardTitle || getUnifiedMatchTitle(matchType));
    document.getElementById('match-detail-type').textContent = vm?.matchTypeLabel || getMatchTypeLabel(matchType);
    document.getElementById('match-detail-score').textContent = qualityLabel
        ? (qualityLabel + ' · ' + scorePct + '%')
        : (scorePct + '%');
    const statusEl = document.getElementById('match-detail-status');
    const sb = window.statusBadgeSystem;
    const st = postMatch.status || 'pending';
    statusEl.textContent = vm?.statusLabel || (sb ? sb.getStatusLabel(st, 'match') : formatStatusLabel(st));
    statusEl.className = 'badge ' + (sb ? sb.getStatusBadgeClass(st, 'match') : 'badge--neutral');

    const runIdWrap = document.getElementById('match-detail-runid-wrap');
    const runIdEl = document.getElementById('match-detail-runid');
    if (runIdWrap && runIdEl) {
        if (postMatch.runId) {
            runIdWrap.style.display = '';
            runIdEl.textContent = postMatch.runId;
        } else {
            runIdWrap.style.display = 'none';
        }
    }
    const expiresWrap = document.getElementById('match-detail-expires-wrap');
    const expiresEl = document.getElementById('match-detail-expires');
    if (expiresWrap && expiresEl) {
        if (postMatch.expiresAt) {
            expiresWrap.style.display = '';
            const exp = new Date(postMatch.expiresAt);
            expiresEl.textContent = Number.isNaN(exp.getTime())
                ? postMatch.expiresAt
                : exp.toLocaleString();
        } else {
            expiresWrap.style.display = 'none';
        }
    }

    // —— Exchange Flow ——
    const exchangeFlowEl = document.getElementById('match-detail-exchange-flow-body');
    if (exchangeFlowEl) {
        if (vm?.cardBodyHtml) {
            exchangeFlowEl.innerHTML = vm.cardBodyHtml;
        } else if (matchType === 'one_way') {
            const needOpp = await ds.getOpportunityById(payload.needOpportunityId);
            const offerOpp = await ds.getOpportunityById(payload.offerOpportunityId);
            const viewerRole = getOneWayViewerRole(postMatch, currentUserId);
            const sourceOpp = viewerRole.isNeedOwner ? needOpp : offerOpp;
            const matchedOpp = viewerRole.isNeedOwner ? offerOpp : needOpp;
            const sourceLabel = viewerRole.isNeedOwner ? 'Need' : 'Offer';
            const matchedLabel = viewerRole.isNeedOwner ? 'Offer' : 'Need';
            exchangeFlowEl.innerHTML = '<div class="space-y-2 min-w-0">'
                + '<div class="flex flex-wrap items-center gap-2 min-w-0"><span class="px-3 py-2 bg-primary/10 border border-primary/20 rounded shrink-0 font-medium">Your ' + sourceLabel + '</span><span class="text-gray-700 min-w-0 break-words">' + escapeHtml(sourceOpp?.title || '—') + '</span></div>'
                + '<div class="flex flex-wrap items-center gap-2 min-w-0"><span class="px-3 py-2 bg-gray-50 border border-gray-200 rounded shrink-0">Matched ' + matchedLabel + '</span><span class="text-gray-600 min-w-0 break-words">' + escapeHtml(matchedOpp?.title || '—') + '</span></div>'
                + '</div>';
        } else if (matchType === 'two_way') {
            const sideA = payload.sideA || {}, sideB = payload.sideB || {};
            const nameA = await ds.getUserOrCompanyById(sideA.userId).then(u => u?.profile?.name || sideA.userId);
            const nameB = await ds.getUserOrCompanyById(sideB.userId).then(u => u?.profile?.name || sideB.userId);
            const labelA = sideA.userId === currentUserId ? 'You (A)' : escapeHtml(nameA) + ' (A)';
            const labelB = sideB.userId === currentUserId ? 'You (B)' : escapeHtml(nameB) + ' (B)';
            exchangeFlowEl.innerHTML = '<div class="flex flex-wrap items-center gap-2 min-w-0"><span class="px-3 py-2 bg-teal-50 border border-teal-200 rounded min-w-0 break-words">' + labelA + '</span><span class="text-gray-500 shrink-0">↔</span><span class="px-3 py-2 bg-teal-50 border border-teal-200 rounded min-w-0 break-words">' + labelB + '</span></div>';
        } else if (matchType === 'consortium') {
            const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
            const roles = payload.roles || [];
            const offerLabels = await Promise.all(roles.map(r => ds.getOpportunityById(r.opportunityId).then(o => o?.title || r.role)));
            exchangeFlowEl.innerHTML = '<div class="space-y-2 min-w-0"><div class="flex flex-wrap items-center gap-2 min-w-0"><span class="px-3 py-2 bg-amber-50 border border-amber-200 rounded shrink-0">Need</span><span class="text-gray-400 min-w-0 break-words">' + escapeHtml(leadOpp?.title || '—') + '</span></div><div class="text-gray-500 text-sm">↓</div><div class="flex flex-wrap gap-2 min-w-0"><span class="text-sm font-medium text-gray-600 shrink-0">Multiple Offers:</span>' + offerLabels.map(t => '<span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm min-w-0 break-words">' + escapeHtml(t) + '</span>').join('') + '</div></div>';
        } else if (matchType === 'circular') {
            const cycle = payload.cycle || [];
            const names = await Promise.all(cycle.map(uid => ds.getUserOrCompanyById(uid).then(u => u?.profile?.name || uid)));
            const labels = cycle.map((uid, i) => (uid === currentUserId ? 'You' : (names[i] || uid)));
            exchangeFlowEl.innerHTML = '<div class="flex flex-wrap items-center gap-1 min-w-0">' + labels.map((l, i) => '<span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm min-w-0 break-words">' + escapeHtml(l) + '</span>' + (i < labels.length - 1 ? '<span class="text-gray-400 shrink-0">→</span>' : '')).join('') + '<span class="text-gray-400 shrink-0">→</span><span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm min-w-0 break-words">' + (labels[0] || '') + '</span></div>';
        } else {
            exchangeFlowEl.innerHTML = '<p class="text-gray-500">No flow available.</p>';
        }
    }

    const valueHeadingEl = document.getElementById('match-detail-value-heading');
    if (valueHeadingEl) {
        valueHeadingEl.textContent = MATCH_VALUE_HEADINGS[matchType] || 'Compatibility';
    }

    // —— Value Exchange ——
    const valueEl = document.getElementById('match-detail-value-body');
    if (valueEl) {
        let valueHtml = '';
        if (matchType === 'two_way' && (payload.scoreAtoB != null || payload.scoreBtoA != null)) {
            valueHtml += '<p class="text-sm text-gray-600">Directional fit: A→B '
                + Math.round((payload.scoreAtoB || 0) * 100) + '% · B→A '
                + Math.round((payload.scoreBtoA || 0) * 100) + '%</p>';
        }
        if (matchType === 'consortium' && Array.isArray(payload.roles) && payload.roles.some(r => r.score != null)) {
            valueHtml += '<ul class="text-sm text-gray-600 list-disc pl-5">' + payload.roles.map(r =>
                '<li>' + escapeHtml(typeof formatParticipantRole === 'function' ? formatParticipantRole(r.role, 'Role') : (r.role || 'Role')) + ': ' + Math.round((r.score || 0) * 100) + '%</li>'
            ).join('') + '</ul>';
        }
        if (payload.valueEquivalence) valueHtml += '<p>' + escapeHtml(payload.valueEquivalence) + '</p>';
        else if (payload.valueAnalysis && (payload.valueAnalysis.fit || payload.valueAnalysis.budgetInRange)) valueHtml = '<p>Fit: ' + escapeHtml(payload.valueAnalysis.fit || '—') + (payload.valueAnalysis.budgetInRange !== undefined ? ' · Budget in range: ' + (payload.valueAnalysis.budgetInRange ? 'Yes' : 'No') : '') + '</p>';
        else if (payload.valueBalance) valueHtml = '<p>Consortium balance score: ' + Math.round((payload.valueBalance.consortiumBalanceScore || 0) * 100) + '%' + (payload.valueBalance.viable !== undefined ? ' · Viable: ' + (payload.valueBalance.viable ? 'Yes' : 'No') : '') + '</p>';
        else if (payload.chainBalance) valueHtml = '<p>Chain balance score: ' + Math.round((payload.chainBalance.chainBalanceScore || 0) * 100) + '%' + (payload.chainBalance.viable !== undefined ? ' · Viable: ' + (payload.chainBalance.viable ? 'Yes' : 'No') : '') + '</p>';
        valueEl.innerHTML = valueHtml || '<p class="text-gray-500">No value estimate available.</p>';
    }

    // —— Match Score & Criteria ——
    const scoreBadgeEl = document.getElementById('match-detail-score-badge');
    if (scoreBadgeEl) {
        scoreBadgeEl.textContent = (qualityLabel ? qualityLabel + ' · ' : '') + scorePct + '% compatibility';
        if (vm?.matchQualityClass) scoreBadgeEl.className = 'badge badge-match ' + vm.matchQualityClass;
    }
    const whyEl = document.getElementById('match-detail-why-body');
    if (whyEl) {
        whyEl.innerHTML = '<p class="text-gray-700">' + escapeHtml(vm?.whySummary || '—') + '</p>';
    }
    const breakdownBody = document.getElementById('match-detail-breakdown-body');
    const breakdown = payload.breakdown || {};
    if (Object.keys(breakdown).length > 0) {
        breakdownBody.innerHTML = '<dl class="space-y-2">' + Object.entries(breakdown).map(([k, v]) => {
            const label = CRITERION_LABELS[k] || (typeof k === 'string' ? k.charAt(0).toUpperCase() + k.slice(1) : k);
            return '<div class="flex justify-between"><dt class="text-gray-600">' + escapeHtml(String(label)) + '</dt><dd>' + (typeof v === 'number' ? Math.round(v * 100) + '%' : escapeHtml(String(v))) + '</dd></div>';
        }).join('') + '</dl>';
    } else {
        breakdownBody.innerHTML = '<p class="text-gray-500 text-sm">No criteria breakdown available.</p>';
    }

    // —— Participants (Name, Offer, Need, Status) ——
    const participantsList = document.getElementById('match-detail-participants');
    const participants = postMatch.participants || [];
    const uniqueByUser = [];
    const seenUsers = new Set();
    participants.forEach(p => {
        if (p.userId && !seenUsers.has(p.userId)) {
            seenUsers.add(p.userId);
            uniqueByUser.push(p);
        }
    });
    const partHtml = await buildParticipantsList(ds, matchType, payload, participants, uniqueByUser, currentUserId);
    participantsList.innerHTML = partHtml.join('');

    // —— Actions ——
    const actionsEl = document.getElementById('match-detail-actions');
    const expired = vm?.isExpired ?? isPostMatchExpired(postMatch);
    const actionIds = new Set((vm?.availableActions || []).map(a => a.id));
    const acceptBtn = actionsEl.querySelector('#btn-accept-match');
    const declineBtn = actionsEl.querySelector('#btn-decline-match');
    const btnNegotiation = actionsEl.querySelector('#btn-start-negotiation');
    const linkMessage = actionsEl.querySelector('#link-message-participants');
    const linkDeal = actionsEl.querySelector('#link-view-deal');

    if (acceptBtn) {
        acceptBtn.style.display = actionIds.has('accept') && !expired ? '' : 'none';
        acceptBtn.disabled = expired;
        acceptBtn.textContent = 'Accept match';
    }
    if (declineBtn) {
        declineBtn.style.display = actionIds.has('decline') && !expired ? '' : 'none';
        declineBtn.disabled = expired;
    }
        if (btnNegotiation) {
        const showNeg = actionIds.has('negotiate') && !expired;
        btnNegotiation.style.display = showNeg ? '' : 'none';
        btnNegotiation.disabled = !showNeg;
        const negAction = (vm?.availableActions || []).find(a => a.id === 'negotiate');
        if (negAction?.label) btnNegotiation.textContent = negAction.label;
        delete btnNegotiation.dataset.negotiationRoute;
    }
    const btnCreateDeal = actionsEl.querySelector('#btn-create-deal-match');
    if (btnCreateDeal) {
        const dealAction = (vm?.availableActions || []).find(a => a.id === 'create_deal');
        const showDeal = actionIds.has('create_deal') && !expired;
        btnCreateDeal.style.display = showDeal ? '' : 'none';
        btnCreateDeal.disabled = !showDeal;
        btnCreateDeal.textContent = dealAction?.label || 'Start Deal';
    }
    const btnDealFromNeg = actionsEl.querySelector('#btn-create-deal-negotiation');
    if (btnDealFromNeg) {
        const show = actionIds.has('create_deal_from_negotiation') && !expired;
        btnDealFromNeg.style.display = show ? '' : 'none';
    }
    if (linkMessage) {
        const firstOther = uniqueByUser.find(p => p.userId !== currentUserId);
        if (firstOther?.userId && !expired) {
            linkMessage.style.display = '';
            linkMessage.setAttribute('data-route', '/messages/' + firstOther.userId);
        } else {
            linkMessage.style.display = 'none';
        }
    }
    if (linkDeal) {
        const showDeal = actionIds.has('view_deal') && vm?.dealId;
        linkDeal.style.display = showDeal ? '' : 'none';
        if (showDeal) linkDeal.setAttribute('data-route', '/deals/' + vm.dealId);
    }
    const inviteBtn = actionsEl.querySelector('#btn-invite-apply');
    if (inviteBtn) {
        const showInvite = actionIds.has('invite_apply') && !expired;
        inviteBtn.style.display = showInvite ? '' : 'none';
        inviteBtn.disabled = !showInvite;
    }

    renderMatchDetailLifecycleSections(vm, postMatch);
    await renderMatchNegotiationSection(vm, postMatch, currentUserId);
    await renderMatchReplacementSection(vm, postMatch, currentUserId);

    const btnSuggestRepl = actionsEl.querySelector('#btn-suggest-replacement');
    if (btnSuggestRepl) {
        const show = actionIds.has('suggest_replacement') && !expired;
        btnSuggestRepl.style.display = show ? '' : 'none';
    }
    const btnManageRepl = actionsEl.querySelector('#btn-manage-replacement');
    if (btnManageRepl) {
        const show = actionIds.has('manage_replacement') && !expired;
        btnManageRepl.style.display = show ? '' : 'none';
    }
    const btnAcceptRepl = actionsEl.querySelector('#btn-accept-replacement');
    if (btnAcceptRepl) {
        const show = actionIds.has('accept_replacement') && !expired;
        btnAcceptRepl.style.display = show ? '' : 'none';
    }

    const matchStatus = (postMatch.status || '').toLowerCase();
    if (expired) {
        setMatchActionFeedback('This match has expired. Accept and decline are no longer available.', 'danger');
    } else if (vm?.dealId) {
        setMatchActionFeedback('Deal already exists. Open your deal workspace to continue.', 'success');
    } else if (matchStatus === CONFIG.POST_MATCH_STATUS.DECLINED) {
        setMatchActionFeedback('This match was declined', 'danger');
    } else if (matchStatus === CONFIG.POST_MATCH_STATUS.PENDING) {
        setMatchActionFeedback('Waiting for all participants to accept', 'info');
    } else if (matchStatus === CONFIG.POST_MATCH_STATUS.CONFIRMED) {
        setMatchActionFeedback('All participants have accepted. Use Start Deal to open your deal workspace.', 'success');
    } else if (vm?.nextBestAction) {
        setMatchActionFeedback(vm.nextBestAction, 'info');
    }
}

function getNegotiationLabel(status) {
    if (window.negotiationLifecycle && typeof window.negotiationLifecycle.getNegotiationStatusLabel === 'function') {
        return window.negotiationLifecycle.getNegotiationStatusLabel(status);
    }
    const s = (status || '').toLowerCase();
    if (s === 'agreed') return 'Terms Agreed';
    if (s === 'cancelled') return 'Negotiation Cancelled';
    if (s === 'open' || s === 'counter_offered') return 'Negotiation Open';
    return 'Negotiation';
}

async function resolveNegotiationRoundDisplay(ds, round, negotiation, postMatch, currentUserId) {
    const userId = round.by || round.byUserId || '';
    let proposerName = round.byName || '';
    if (!proposerName && userId && typeof ds.getUserOrCompanyById === 'function') {
        const u = await ds.getUserOrCompanyById(userId);
        proposerName = u?.profile?.name || u?.profile?.companyName || userId;
    } else if (!proposerName) {
        proposerName = userId || 'Unknown';
    }

    const party = (negotiation.parties || []).find(p => p.userId === userId);
    const participant = (postMatch?.participants || []).find(p => p.userId === userId);
    const roleRaw = party?.role || participant?.role || '';
    const roleLabel = roleRaw
        ? (typeof formatParticipantRole === 'function' ? formatParticipantRole(roleRaw, roleRaw) : roleRaw)
        : '';

    let scopeTitle = (round.proposal && round.proposal.title) || round.title || '';
    if (!scopeTitle) {
        const oppId = participant?.opportunityId || party?.opportunityId || null;
        if (oppId && typeof ds.getOpportunityById === 'function') {
            const opp = await ds.getOpportunityById(oppId);
            scopeTitle = opp?.title || '';
        }
    }
    if (!scopeTitle && negotiation.opportunityId && typeof ds.getOpportunityById === 'function') {
        const opp = await ds.getOpportunityById(negotiation.opportunityId);
        if (opp && ((opp.creatorId && opp.creatorId === userId) || (negotiation.parties || []).length <= 2)) {
            scopeTitle = opp.title || '';
        }
    }

    return {
        proposerName,
        roleLabel,
        scopeTitle,
        isYou: userId === currentUserId
    };
}

async function buildNegotiationRoundsHtml(ds, rounds, negotiation, postMatch, currentUserId) {
    if (!rounds.length) {
        return '<p class="text-gray-500 mt-1">No proposals yet.</p>';
    }

    const displays = await Promise.all(
        rounds.map(r => resolveNegotiationRoundDisplay(ds, r, negotiation, postMatch, currentUserId))
    );

    return '<ul class="space-y-2 mt-2">' + rounds.map((r, i) => {
        const d = displays[i];
        const val = r.proposal && r.proposal.value != null ? String(r.proposal.value) : '';
        const cur = (r.proposal && r.proposal.currency)
            || (negotiation.initialTerms && negotiation.initialTerms.currency)
            || '';
        const valLine = val
            ? '<p class="text-sm text-gray-600 mt-1">Value: ' + escapeHtml(val + (cur ? ' ' + cur : '')) + '</p>'
            : '';
        const titleLine = d.scopeTitle
            ? '<p class="font-medium text-gray-900">' + escapeHtml(d.scopeTitle) + '</p>'
            : '<p class="font-medium text-gray-900">' + escapeHtml(d.proposerName) + (d.isYou ? ' <span class="text-gray-500 font-normal">(You)</span>' : '') + '</p>';
        const whoLine = d.scopeTitle
            ? '<p class="text-sm text-gray-600">' + escapeHtml(d.proposerName)
                + (d.isYou ? ' <span class="text-gray-500">(You)</span>' : '')
                + (d.roleLabel ? ' · ' + escapeHtml(d.roleLabel) : '')
                + '</p>'
            : (d.roleLabel
                ? '<p class="text-sm text-gray-600">' + escapeHtml(d.roleLabel) + '</p>'
                : '');
        const messageLine = r.message
            ? '<p class="text-gray-600 mt-1">' + escapeHtml(r.message) + '</p>'
            : '';
        return '<li class="p-2 border border-gray-100 rounded">'
            + titleLine
            + whoLine
            + valLine
            + messageLine
            + '</li>';
    }).join('') + '</ul>';
}

async function renderMatchNegotiationSection(vm, postMatch, currentUserId) {
    const panel = document.getElementById('match-detail-negotiation-panel');
    const body = document.getElementById('match-detail-negotiation-panel-body');
    if (!panel || !body) return;

    let negotiation = null;
    if (vm?.negotiationId) {
        negotiation = await dataService.getNegotiationById(vm.negotiationId);
    } else if (typeof dataService.getActiveNegotiationForMatch === 'function') {
        negotiation = await dataService.getActiveNegotiationForMatch(postMatch.id);
    }

    const showPanel = !!(negotiation || vm?.hasActiveNegotiation || vm?.hasAgreedNegotiation);
    panel.style.display = showPanel ? '' : 'none';
    const linkOpenDetails = document.getElementById('link-open-negotiation-details');
    if (linkOpenDetails) {
        if (negotiation?.id) {
            linkOpenDetails.style.display = '';
            linkOpenDetails.setAttribute('data-route', '/matches/' + postMatch.id + '?section=negotiation');
        } else {
            linkOpenDetails.style.display = 'none';
            linkOpenDetails.removeAttribute('data-route');
        }
    }
    if (!negotiation) {
        body.innerHTML = '<p class="text-gray-500">No negotiation yet. Use <strong>Start Negotiation</strong> in Next Actions.</p>';
        return;
    }

    const status = negotiation.status || 'open';
    const label = getNegotiationLabel(status);
    const rounds = negotiation.rounds || [];
    const roundsHtml = await buildNegotiationRoundsHtml(dataService, rounds, negotiation, postMatch, currentUserId);

    const isActive = window.negotiationLifecycle
        ? window.negotiationLifecycle.isActiveNegotiation(negotiation)
        : ['open', 'counter_offered'].includes((status || '').toLowerCase());
    const isAgreed = (status || '').toLowerCase() === 'agreed';
    const isCancelled = (status || '').toLowerCase() === 'cancelled';

    let actionsHtml = '';
    if (isActive) {
        actionsHtml = ''
            + '<div class="mt-3 space-y-2">'
            + '<label class="block text-xs font-medium text-gray-700">Proposal message</label>'
            + '<textarea id="negotiation-proposal-message" class="w-full border border-gray-200 rounded p-2 text-sm" rows="2" placeholder="Describe your terms…"></textarea>'
            + '<label class="block text-xs font-medium text-gray-700">Value (optional)</label>'
            + '<input type="number" id="negotiation-proposal-value" class="w-full border border-gray-200 rounded p-2 text-sm" placeholder="Amount" />'
            + '<div class="flex flex-wrap gap-2">'
            + '<button type="button" class="btn btn-outline btn-sm" id="btn-negotiation-propose">Send proposal</button>'
            + '<button type="button" class="btn btn-primary btn-sm" id="btn-negotiation-agree">Agree to terms</button>'
            + '<button type="button" class="btn btn-outline btn-sm text-gray-600" id="btn-negotiation-cancel">Cancel negotiation</button>'
            + '</div></div>';
    } else if (isAgreed && !vm?.dealId) {
        actionsHtml = '<div class="mt-3"><button type="button" class="btn btn-primary btn-sm" id="btn-negotiation-create-deal">Create Deal</button></div>';
    } else if (isCancelled) {
        actionsHtml = '<p class="text-gray-600 mt-2">This negotiation was cancelled. Start a new negotiation from Next Actions when you are ready.</p>';
    }

    body.innerHTML = ''
        + '<p><span class="badge badge--info">' + escapeHtml(label) + '</span></p>'
        + (negotiation.agreedTerms && isAgreed
            ? '<p class="mt-2 text-gray-700">Agreed value: ' + escapeHtml(String(negotiation.agreedTerms.value != null ? negotiation.agreedTerms.value : '—')) + '</p>'
            : '')
        + '<div class="mt-2"><p class="font-medium text-gray-900 text-sm">Proposals</p>' + roundsHtml + '</div>'
        + actionsHtml;

    body.dataset.negotiationId = negotiation.id;

    const bind = (id, fn) => {
        const el = body.querySelector(id);
        if (el) el.addEventListener('click', fn);
    };

    bind('#btn-negotiation-propose', async () => {
        const msg = body.querySelector('#negotiation-proposal-message')?.value?.trim() || '';
        const valRaw = body.querySelector('#negotiation-proposal-value')?.value;
        const proposal = {};
        if (valRaw !== '' && valRaw != null) proposal.value = Number(valRaw);
        if (typeof window.validateNegotiationProposal === 'function') {
            const check = window.validateNegotiationProposal(proposal);
            if (!check.isValid) {
                setMatchActionFeedback(check.errors[0] || 'Invalid proposal value.', 'danger');
                return;
            }
        }
        try {
            await dataService.addNegotiationProposal(negotiation.id, currentUserId, { proposal, message: msg });
            const match = await dataService.getPostMatchById(postMatch.id);
            if (match) await renderMatchDetail(match, currentUserId);
            setMatchActionFeedback('Proposal sent.', 'success');
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not send proposal.', 'danger');
        }
    });

    bind('#btn-negotiation-agree', async () => {
        try {
            await dataService.agreeNegotiation(negotiation.id, currentUserId);
            const match = await dataService.getPostMatchById(postMatch.id);
            if (match) await renderMatchDetail(match, currentUserId);
            setMatchActionFeedback('Terms agreed.', 'success');
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not agree terms.', 'danger');
        }
    });

    bind('#btn-negotiation-cancel', async () => {
        const ok = window.modalService
            ? await window.modalService.confirm(
                'Are you sure you want to cancel this negotiation?',
                'Cancel negotiation',
                { confirmText: 'Yes, cancel', cancelText: 'Keep negotiating', type: 'warning' }
            )
            : window.confirm('Cancel this negotiation?');
        if (!ok) return;
        try {
            await dataService.cancelNegotiation(negotiation.id, currentUserId);
            const match = await dataService.getPostMatchById(postMatch.id);
            if (match) await renderMatchDetail(match, currentUserId);
            setMatchActionFeedback('Negotiation cancelled.', 'info');
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not cancel negotiation.', 'danger');
        }
    });

    bind('#btn-negotiation-create-deal', async () => {
        try {
            const deal = await dataService.createDealFromNegotiation(negotiation.id, currentUserId);
            if (deal && window.router?.navigate) window.router.navigate('/deals/' + deal.id);
            else {
                const match = await dataService.getPostMatchById(postMatch.id);
                if (match) await renderMatchDetail(match, currentUserId);
            }
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not create deal.', 'danger');
        }
    });

    if (getMatchDetailSection() === 'negotiation') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function getReplacementStatusLabel(status) {
    if (window.replacementLifecycle && typeof window.replacementLifecycle.getReplacementRequestStatusLabel === 'function') {
        return window.replacementLifecycle.getReplacementRequestStatusLabel(status);
    }
    return status || 'Replacement';
}

async function renderMatchReplacementSection(vm, postMatch, currentUserId) {
    const panel = document.getElementById('match-detail-replacement-panel');
    const body = document.getElementById('match-detail-replacement-panel-body');
    if (!panel || !body) return;

    const showPanel = !!(vm?.replacementEligible && (
        vm.hasBlockedParticipant
        || vm.pendingReplacementInvitation
        || (vm.replacementRequests && vm.replacementRequests.length)
        || vm.canManageReplacement
        || vm.canSuggestReplacement
    ));
    panel.style.display = showPanel ? '' : 'none';
    if (!showPanel) return;

    const blockedSlots = typeof dataService.getBlockedSlotsForPostMatch === 'function'
        ? dataService.getBlockedSlotsForPostMatch(postMatch)
        : [];
    const participantIds = new Set((postMatch.participants || []).map(p => p.userId).filter(Boolean));
    let candidateUsers = [];
    if (typeof dataService.getUsers === 'function') {
        const users = await dataService.getUsers();
        candidateUsers = (users || []).filter(u => u.id && !participantIds.has(u.id) && u.id !== currentUserId);
    }

    const slotOptions = blockedSlots.map(s => {
        const roleLabel = typeof formatParticipantRole === 'function' ? formatParticipantRole(s.role, 'Role') : (s.role || 'role');
        const label = (s.userId === 'vacant' ? 'Vacant role' : s.userId) + ' · ' + roleLabel;
        return '<option value="' + escapeHtml(s.userId) + '" data-role="' + escapeHtml(s.role || '') + '" data-opp="' + escapeHtml(s.opportunityId || '') + '">' + escapeHtml(label) + '</option>';
    }).join('');

    const userOptions = candidateUsers.map(u => {
        const name = u.profile?.name || u.email || u.id;
        return '<option value="' + escapeHtml(u.id) + '">' + escapeHtml(name) + '</option>';
    }).join('');

    let html = '';
    if (vm.replacementBadge) {
        html += '<p><span class="badge badge--warning">' + escapeHtml(vm.replacementBadge) + '</span></p>';
    }

    if (vm.pendingReplacementInvitation) {
        html += '<p class="mt-2 text-gray-700">You are invited to join this match as a replacement provider.</p>';
        html += '<button type="button" class="btn btn-primary btn-sm mt-2" id="btn-replacement-accept-invite" data-invitation-id="' + escapeHtml(vm.pendingReplacementInvitation.id) + '">Accept invitation</button>';
    }

    const pendingStatus = CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_OWNER_REVIEW;
    const acceptedStatus = CONFIG.REPLACEMENT_REQUEST_STATUS.REPLACEMENT_ACCEPTED;

    const suggestSlots = blockedSlots.filter(s => s.userId && s.userId !== 'vacant');
    const suggestSlotOptions = suggestSlots.map(s => {
        const roleLabel = typeof formatParticipantRole === 'function' ? formatParticipantRole(s.role, 'Role') : (s.role || 'role');
        const label = s.userId + ' · ' + roleLabel;
        return '<option value="' + escapeHtml(s.userId) + '" data-role="' + escapeHtml(s.role || '') + '" data-opp="' + escapeHtml(s.opportunityId || '') + '">' + escapeHtml(label) + '</option>';
    }).join('');

    if (vm.canSuggestReplacement && suggestSlots.length && userOptions) {
        html += '<div class="mt-4 border-t border-gray-100 pt-3"><p class="font-medium text-gray-900 mb-2">Suggest replacement</p>'
            + '<label class="block text-xs text-gray-600 mb-1">Participant to replace</label>'
            + '<select id="replacement-suggest-slot" class="w-full border border-gray-200 rounded p-2 text-sm mb-2">' + suggestSlotOptions + '</select>'
            + '<label class="block text-xs text-gray-600 mb-1">Suggested provider</label>'
            + '<select id="replacement-suggest-user" class="w-full border border-gray-200 rounded p-2 text-sm mb-2">' + userOptions + '</select>'
            + '<textarea id="replacement-suggest-message" class="w-full border border-gray-200 rounded p-2 text-sm mb-2" rows="2" placeholder="Optional note for the owner"></textarea>'
            + '<button type="button" class="btn btn-outline btn-sm" id="btn-replacement-submit-suggest">Submit suggestion</button></div>';
    }

    if (vm.canManageReplacement) {
        const inbox = (vm.replacementRequests || []).filter(r => (r.status || '') === pendingStatus);
        if (inbox.length) {
            html += '<div class="mt-4 border-t border-gray-100 pt-3"><p class="font-medium text-gray-900 mb-2">Owner inbox</p><ul class="space-y-2">';
            for (const req of inbox) {
                const sugName = req.suggestedUserId
                    ? (candidateUsers.find(u => u.id === req.suggestedUserId)?.profile?.name || req.suggestedUserId)
                    : '—';
                html += '<li class="border border-gray-200 rounded p-2"><p class="text-gray-800">Replace <strong>' + escapeHtml(req.blockedParticipantId || 'participant') + '</strong> with <strong>' + escapeHtml(sugName) + '</strong></p>'
                    + '<p class="text-xs text-gray-500 mt-1">' + escapeHtml(getReplacementStatusLabel(req.status)) + '</p>'
                    + '<div class="flex gap-2 mt-2"><button type="button" class="btn btn-primary btn-sm btn-replacement-approve" data-request-id="' + escapeHtml(req.id) + '">Approve & invite</button>'
                    + '<button type="button" class="btn btn-outline btn-sm btn-replacement-reject" data-request-id="' + escapeHtml(req.id) + '">Reject</button></div></li>';
            }
            html += '</ul></div>';
        }

        if (blockedSlots.length && userOptions) {
            html += '<div class="mt-4 border-t border-gray-100 pt-3"><p class="font-medium text-gray-900 mb-2">Invite alternative provider</p>'
                + '<select id="replacement-invite-slot" class="w-full border border-gray-200 rounded p-2 text-sm mb-2">' + slotOptions + '</select>'
                + '<select id="replacement-invite-user" class="w-full border border-gray-200 rounded p-2 text-sm mb-2">' + userOptions + '</select>'
                + '<textarea id="replacement-invite-message" class="w-full border border-gray-200 rounded p-2 text-sm mb-2" rows="2" placeholder="Invitation message"></textarea>'
                + '<button type="button" class="btn btn-primary btn-sm" id="btn-replacement-direct-invite">Send invitation</button></div>';
        }

        const ready = (vm.replacementRequests || []).filter(r => (r.status || '') === acceptedStatus);
        if (ready.length) {
            html += '<div class="mt-4 border-t border-gray-100 pt-3"><p class="font-medium text-gray-900 mb-2">Ready to finalize</p><ul class="space-y-2">';
            for (const req of ready) {
                const name = req.invitedUserId || req.suggestedUserId || 'replacement';
                html += '<li class="border border-emerald-200 bg-emerald-50 rounded p-2 flex items-center justify-between gap-2">'
                    + '<span>' + escapeHtml(getReplacementStatusLabel(req.status)) + ' — ' + escapeHtml(name) + '</span>'
                    + '<button type="button" class="btn btn-primary btn-sm btn-replacement-finalize" data-request-id="' + escapeHtml(req.id) + '">Finalize replacement</button></li>';
            }
            html += '</ul></div>';
        }
    }

    if (!html) {
        html = '<p class="text-gray-500">No replacement activity yet.</p>';
    }

    body.innerHTML = html;
    body.dataset.matchId = postMatch.id;

    const refresh = async () => {
        const match = await dataService.getPostMatchById(postMatch.id);
        if (match) await renderMatchDetail(match, currentUserId);
    };

    const bind = (sel, fn) => {
        const el = body.querySelector(sel);
        if (el) el.addEventListener('click', fn);
    };

    bind('#btn-replacement-accept-invite', async () => {
        const invId = body.querySelector('#btn-replacement-accept-invite')?.dataset?.invitationId;
        if (!invId) return;
        try {
            await dataService.acceptReplacementInvitation(invId, currentUserId);
            setMatchActionFeedback('Replacement invitation accepted. The owner can finalize when ready.', 'success');
            await refresh();
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not accept invitation.', 'danger');
        }
    });

    bind('#btn-replacement-submit-suggest', async () => {
        const slot = body.querySelector('#replacement-suggest-slot');
        const userSel = body.querySelector('#replacement-suggest-user');
        const msg = body.querySelector('#replacement-suggest-message')?.value?.trim() || '';
        const opt = slot?.selectedOptions?.[0];
        if (!slot?.value || !userSel?.value) {
            setMatchActionFeedback('Select who to replace and who to suggest.', 'danger');
            return;
        }
        try {
            await dataService.suggestReplacementForMatch(postMatch.id, currentUserId, {
                blockedParticipantId: slot.value,
                roleToFill: opt?.dataset?.role || 'General',
                blockedOpportunityId: opt?.dataset?.opp || null,
                suggestedUserId: userSel.value,
                message: msg
            });
            setMatchActionFeedback('Suggestion sent to the opportunity owner.', 'success');
            await refresh();
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not submit suggestion.', 'danger');
        }
    });

    bind('#btn-replacement-direct-invite', async () => {
        const slot = body.querySelector('#replacement-invite-slot');
        const userSel = body.querySelector('#replacement-invite-user');
        const msg = body.querySelector('#replacement-invite-message')?.value?.trim() || '';
        const opt = slot?.selectedOptions?.[0];
        if (!userSel?.value) {
            setMatchActionFeedback('Select a provider to invite.', 'danger');
            return;
        }
        try {
            await dataService.ownerInviteReplacementDirect(postMatch.id, currentUserId, {
                blockedParticipantId: slot?.value === 'vacant' ? null : slot.value,
                roleToFill: opt?.dataset?.role || 'General',
                blockedOpportunityId: opt?.dataset?.opp || null,
                invitedUserId: userSel.value,
                message: msg
            });
            setMatchActionFeedback('Replacement invitation sent.', 'success');
            await refresh();
        } catch (err) {
            setMatchActionFeedback((err && err.message) ? err.message : 'Could not send invitation.', 'danger');
        }
    });

    body.querySelectorAll('.btn-replacement-approve').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await dataService.approveReplacementSuggestion(btn.dataset.requestId, currentUserId);
                setMatchActionFeedback('Suggestion approved and invitation sent.', 'success');
                await refresh();
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not approve.', 'danger');
            }
        });
    });

    body.querySelectorAll('.btn-replacement-reject').forEach(btn => {
        btn.addEventListener('click', async () => {
            const reason = window.prompt('Optional reason for rejection:') || '';
            try {
                await dataService.rejectReplacementSuggestion(btn.dataset.requestId, currentUserId, reason);
                setMatchActionFeedback('Suggestion rejected.', 'info');
                await refresh();
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not reject.', 'danger');
            }
        });
    });

    body.querySelectorAll('.btn-replacement-finalize').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Finalize replacement and update match participants?')) return;
            try {
                await dataService.finalizeParticipantReplacement(btn.dataset.requestId, currentUserId);
                setMatchActionFeedback('Participant replaced successfully.', 'success');
                await refresh();
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not finalize replacement.', 'danger');
            }
        });
    });

    if (getMatchDetailSection() === 'replacement') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderMatchDetailLifecycleSections(vm, postMatch) {
    const lifecycleRoot = document.getElementById('match-detail-lifecycle');
    const showLifecycle = !!(vm?.hasInvitation || vm?.hasApplication || vm?.hasNegotiation || vm?.hasBlockedParticipant || vm?.replacementBadge || vm?.dealId);
    if (lifecycleRoot) lifecycleRoot.style.display = showLifecycle ? '' : 'none';

    const setBlock = (wrapId, bodyId, visible, html) => {
        const wrap = document.getElementById(wrapId);
        const body = document.getElementById(bodyId);
        if (wrap) wrap.style.display = visible ? '' : 'none';
        if (body && visible && html != null) body.innerHTML = html;
    };

    const invLabel = vm?.invitationStatusLabel || (vm?.hasActiveInvitation ? 'Invitation Sent' : '');
    let invHtml = '';
    if (vm?.hasInvitation) {
        invHtml = '<p><span class="badge badge--info">' + escapeHtml(invLabel || 'Invitation Sent') + '</span></p>';
        if (vm?.hasActiveInvitation && vm?.sourceOpportunityId) {
            invHtml += '<p class="text-gray-600 mt-1">Waiting for the invited party to apply.</p>';
        }
        if (vm?.canDeclineInvitation && vm?.invitationId) {
            invHtml += '<button type="button" class="btn btn-secondary btn-sm mt-2" id="btn-decline-invitation" data-invitation-id="'
                + escapeHtml(vm.invitationId) + '">Decline invitation</button>';
        }
        if (vm?.canCancelInvitation && vm?.invitationId) {
            invHtml += '<button type="button" class="btn btn-secondary btn-sm mt-2 ml-1" id="btn-cancel-invitation" data-invitation-id="'
                + escapeHtml(vm.invitationId) + '">Cancel invitation</button>';
        }
    }

    let appHtml = '';
    if (vm?.hasApplication && vm?.applicationId) {
        appHtml = '<p><span class="badge badge--success">Application Submitted</span></p>';
        if (vm.sourceOpportunityId) {
            appHtml += '<p class="mt-1"><a href="#" data-route="/opportunities/' + escapeHtml(vm.sourceOpportunityId) + '" class="text-primary font-medium">View opportunity applications</a></p>';
        }
    }

    let dealHtml = '';
    if (vm?.dealId) {
        dealHtml = '<p><span class="badge badge--success">Deal created</span>'
            + (vm.dealSourceLabel ? ' <span class="text-gray-500 text-xs">(' + escapeHtml(vm.dealSourceLabel) + ')</span>' : '')
            + '</p>';
        dealHtml += '<p class="mt-1"><a href="#" data-route="/deals/' + escapeHtml(vm.dealId) + '" class="text-primary font-medium">View Deal Workspace</a></p>';
    }

    let negHtml = '';
    if (vm?.hasNegotiation) {
        negHtml = '<p><span class="badge badge--info">' + escapeHtml(vm.negotiationStatusLabel || getNegotiationLabel(vm.negotiationStatus)) + '</span></p>';
        if (vm.hasActiveNegotiation) {
            const negRoute = '/matches/' + escapeHtml(vm.id) + '?section=negotiation';
            negHtml += '<p class="text-gray-600 mt-1"><a href="#" data-route="' + negRoute + '" class="btn btn-outline btn-sm">Open negotiation</a></p>';
        } else if (vm.hasAgreedNegotiation && !vm.dealId) {
            negHtml += '<p class="text-gray-600 mt-1">Terms agreed — create your deal workspace.</p>';
            if (vm.negotiationId) {
                negHtml += '<button type="button" class="btn btn-primary btn-sm mt-1" id="btn-progress-create-deal-negotiation" data-negotiation-id="'
                    + escapeHtml(vm.negotiationId) + '">Create Deal</button>';
            }
        }
    }

    const nestNegotiationUnderApplication = !!(vm?.hasApplication && vm?.hasNegotiation);
    if (nestNegotiationUnderApplication && appHtml) {
        appHtml += '<div class="mt-2 pl-2 border-l-2 border-gray-200 application-negotiation-nested">' + negHtml + '</div>';
    }

    let replHtml = '';
    if (vm?.replacementEligible && (vm.replacementBadge || vm.activeReplacementRequest)) {
        replHtml = '<p><span class="badge badge--warning">' + escapeHtml(vm.replacementBadge || getReplacementStatusLabel(vm.activeReplacementRequest?.status)) + '</span></p>';
        replHtml += '<p class="text-gray-600 mt-1"><a href="#" data-route="/matches/' + escapeHtml(vm.id) + '?section=replacement" class="text-primary font-medium">Open replacement inbox</a></p>';
    }

    setBlock('match-detail-invitation-wrap', 'match-detail-invitation-body', !!(vm?.hasInvitation), invHtml);
    setBlock('match-detail-application-wrap', 'match-detail-application-body', !!(vm?.hasApplication), appHtml);
    setBlock('match-detail-negotiation-wrap', 'match-detail-negotiation-body', !!(vm?.hasNegotiation && !nestNegotiationUnderApplication), negHtml);
    setBlock('match-detail-replacement-wrap', 'match-detail-replacement-body', !!(vm?.replacementEligible && replHtml), replHtml);
    setBlock('match-detail-deal-wrap', 'match-detail-deal-body', !!(vm?.dealId), dealHtml);

    void postMatch;
}

async function buildParticipantsList(ds, matchType, payload, participants, uniqueByUser, currentUserId) {
    const partHtml = [];
    for (const p of uniqueByUser) {
        const u = await ds.getUserOrCompanyById(p.userId);
        const name = u?.profile?.name || u?.profile?.companyName || p.userId;
        const status = p.participantStatus || 'pending';
        const isYou = p.userId === currentUserId;
        let offer = '—';
        let need = '—';
        if (matchType === 'one_way') {
            if (p.role === 'need_owner') {
                const opp = await ds.getOpportunityById(payload.needOpportunityId);
                need = opp?.title || '—';
                offer = '—';
            } else {
                const opp = await ds.getOpportunityById(payload.offerOpportunityId);
                offer = opp?.title || '—';
                need = '—';
            }
        } else if (matchType === 'two_way') {
            const sideA = payload.sideA || {}, sideB = payload.sideB || {};
            const isA = sideA.userId === p.userId;
            const side = isA ? sideA : sideB;
            const needOpp = side.needId ? await ds.getOpportunityById(side.needId) : null;
            const offerOpp = side.offerId ? await ds.getOpportunityById(side.offerId) : null;
            need = needOpp?.title || '—';
            offer = offerOpp?.title || '—';
        } else if (matchType === 'consortium') {
            if (p.role === 'consortium_lead') {
                const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
                need = leadOpp?.title || '—';
                offer = '—';
            } else {
                const roleEntry = (payload.roles || []).find(r => r.userId === p.userId);
                const offerOpp = roleEntry?.opportunityId ? await ds.getOpportunityById(roleEntry.opportunityId) : null;
                offer = offerOpp?.title || roleEntry?.role || '—';
                need = '—';
            }
        } else if (matchType === 'circular') {
            const links = payload.links || payload.linkScores || [];
            const outLink = links.find(l => (l.fromCreatorId || l.from) === p.userId);
            const inLink = links.find(l => (l.toCreatorId || l.to) === p.userId);
            const offerOpp = outLink?.offerId ? await ds.getOpportunityById(outLink.offerId) : null;
            const needOpp = inLink?.needId ? await ds.getOpportunityById(inLink.needId) : null;
            offer = offerOpp?.title || '—';
            need = needOpp?.title || '—';
        }
        partHtml.push('<li class="match-detail-participant-content p-4 border border-gray-200 rounded-lg ' + (isYou ? 'bg-primary/5 border-primary/30' : '') + '"><div class="font-medium text-gray-900">' + escapeHtml(name) + (isYou ? ' <span class="text-gray-500">(You)</span>' : '') + '</div><div class="text-sm mt-1 break-words"><span class="text-gray-600">Offer:</span> ' + escapeHtml(offer) + '</div><div class="text-sm break-words"><span class="text-gray-600">Need:</span> ' + escapeHtml(need) + '</div><div class="mt-2"><span class="badge ' + (window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(status, 'match') : 'badge--neutral') + '">' + escapeHtml(window.statusBadgeSystem ? window.statusBadgeSystem.getStatusLabel(status, 'match') : formatStatusLabel(status)) + '</span></div></li>');
    }
    return partHtml;
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getMatchDetailSection() {
    if (window.router && typeof window.router.getHashSection === 'function') {
        return window.router.getHashSection();
    }
    const q = window.location.search || '';
    if (!q) return '';
    return new URLSearchParams(q.startsWith('?') ? q.substring(1) : q).get('section') || '';
}

function scrollMatchDetailToSection() {
    const section = getMatchDetailSection();
    if (!section) return;
    requestAnimationFrame(() => {
        if (section === 'negotiation') {
            const panel = document.getElementById('match-detail-negotiation-panel');
            if (panel && panel.style.display !== 'none') {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            document.getElementById('btn-start-negotiation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (section === 'replacement') {
            document.getElementById('match-detail-replacement-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function isPostMatchExpired(postMatch) {
    if (!postMatch) return false;
    if ((postMatch.status || '') === CONFIG.POST_MATCH_STATUS.EXPIRED) return true;
    if (postMatch.expiresAt) {
        const t = new Date(postMatch.expiresAt).getTime();
        return !Number.isNaN(t) && t < Date.now();
    }
    return false;
}

function setMatchActionFeedback(message, tone = 'info') {
    const actionsEl = document.getElementById('match-detail-actions');
    if (!actionsEl) return;
    let feedback = actionsEl.querySelector('#match-action-feedback');
    if (!feedback) {
        feedback = document.createElement('p');
        feedback.id = 'match-action-feedback';
        actionsEl.appendChild(feedback);
    }
    const toneClass = tone === 'danger'
        ? 'text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-0'
        : tone === 'success'
            ? 'text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 mb-0'
            : 'text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 mb-0';
    feedback.className = toneClass;
    feedback.textContent = message;
}

function setupMatchDetailActions(matchId, userId) {
    const actionsEl = document.getElementById('match-detail-actions');
    const rootEl = document.getElementById('match-detail-content') || actionsEl;
    if (!rootEl) return;
    // Use a single delegated listener so we don't add duplicates after re-render
    const handler = async (e) => {
        const declineInvBtn = e.target.closest('#btn-decline-invitation');
        const cancelInvBtn = e.target.closest('#btn-cancel-invitation');
        if (declineInvBtn) {
            e.preventDefault();
            const invId = declineInvBtn.dataset.invitationId;
            if (!invId || !confirm('Decline this invitation?')) return;
            declineInvBtn.disabled = true;
            try {
                if (typeof dataService.declineOpportunityInvitation === 'function') {
                    await dataService.declineOpportunityInvitation(invId, userId);
                }
                const match = await dataService.getPostMatchById(matchId);
                if (match) await renderMatchDetail(match, userId);
                setMatchActionFeedback('Invitation declined.', 'success');
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not decline invitation.', 'danger');
            }
            declineInvBtn.disabled = false;
            return;
        }
        if (cancelInvBtn) {
            e.preventDefault();
            const invId = cancelInvBtn.dataset.invitationId;
            if (!invId || !confirm('Cancel this invitation?')) return;
            cancelInvBtn.disabled = true;
            try {
                if (typeof dataService.cancelOpportunityInvitation === 'function') {
                    await dataService.cancelOpportunityInvitation(invId, userId);
                }
                const match = await dataService.getPostMatchById(matchId);
                if (match) await renderMatchDetail(match, userId);
                setMatchActionFeedback('Invitation cancelled.', 'success');
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not cancel invitation.', 'danger');
            }
            cancelInvBtn.disabled = false;
            return;
        }
        const acceptBtn = e.target.closest('#btn-accept-match');
        const declineBtn = e.target.closest('#btn-decline-match');
        const startNegBtn = e.target.closest('#btn-start-negotiation');
        const createDealMatchBtn = e.target.closest('#btn-create-deal-match');
        const createDealNegBtn = e.target.closest('#btn-create-deal-negotiation');
        const progressCreateDealBtn = e.target.closest('#btn-progress-create-deal-negotiation');
        if (progressCreateDealBtn) {
            e.preventDefault();
            progressCreateDealBtn.disabled = true;
            try {
                const negId = progressCreateDealBtn.getAttribute('data-negotiation-id');
                if (!negId) throw new Error('No agreed negotiation found.');
                const deal = await dataService.createDealFromNegotiation(negId, userId);
                if (deal && window.router?.navigate) window.router.navigate('/deals/' + deal.id);
                else {
                    const match = await dataService.getPostMatchById(matchId);
                    if (match) await renderMatchDetail(match, userId);
                }
            } catch (err) {
                console.error('[match-detail] Create deal from negotiation (progress) failed:', { matchId, userId, err });
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not create deal.', 'danger');
            }
            progressCreateDealBtn.disabled = false;
            return;
        }
        if (createDealMatchBtn) {
            e.preventDefault();
            createDealMatchBtn.disabled = true;
            try {
                const match = await dataService.getPostMatchById(matchId);
                if (!match || (match.status || '') !== CONFIG.POST_MATCH_STATUS.CONFIRMED) {
                    throw new Error('The match must be confirmed before creating a deal.');
                }
                let deal = await dataService.getDealByMatchId(matchId);
                if (!deal) deal = await dataService.createDealFromMatch(match, userId);
                if (deal && window.router?.navigate) {
                    try {
                        sessionStorage.setItem('pmtwin_deal_flash', JSON.stringify({
                            message: 'Your Deal Workspace is ready.',
                            tone: 'success'
                        }));
                    } catch (err) {
                        void err;
                    }
                    window.router.navigate('/deals/' + deal.id);
                }
            } catch (err) {
                console.error('[match-detail] Create deal from match failed:', { matchId, userId, err });
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not create deal.', 'danger');
            }
            createDealMatchBtn.disabled = false;
            return;
        }
        const suggestReplBtn = e.target.closest('#btn-suggest-replacement');
        const manageReplBtn = e.target.closest('#btn-manage-replacement');
        const acceptReplBtn = e.target.closest('#btn-accept-replacement');
        if (suggestReplBtn || manageReplBtn) {
            e.preventDefault();
            const panel = document.getElementById('match-detail-replacement-panel');
            if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (window.router?.navigate && typeof window.router.getCurrentPath === 'function') {
                const currentPath = window.router.getCurrentPath();
                window.router.navigate(currentPath + '?section=replacement');
            }
            return;
        }
        if (acceptReplBtn) {
            e.preventDefault();
            acceptReplBtn.disabled = true;
            try {
                const match = await dataService.getPostMatchById(matchId);
                let inv = null;
                if (typeof dataService.getInvitationsByMatchId === 'function') {
                    const list = await dataService.getInvitationsByMatchId(matchId);
                    const replKind = CONFIG.INVITATION_KIND.REPLACEMENT;
                    const user = await dataService.getUserById(userId);
                    inv = list.find(i => (i.invitationKind || '') === replKind
                        && ['sent', 'invitation_sent'].includes((i.status || '').toLowerCase())
                        && window.replacementLifecycle?.invitationAcceptsActor(i, userId, user?.companyId));
                }
                if (!inv) throw new Error('No active replacement invitation found.');
                await dataService.acceptReplacementInvitation(inv.id, userId);
                if (match) await renderMatchDetail(match, userId);
                setMatchActionFeedback('Replacement invitation accepted.', 'success');
            } catch (err) {
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not accept invitation.', 'danger');
            }
            acceptReplBtn.disabled = false;
            return;
        }
        if (startNegBtn) {
            e.preventDefault();
            startNegBtn.disabled = true;
            try {
                const matchForNeg = await dataService.getPostMatchById(matchId);
                let negId = matchForNeg?.negotiationId || null;
                if (!negId && typeof dataService.getActiveNegotiationForMatch === 'function') {
                    const active = await dataService.getActiveNegotiationForMatch(matchId);
                    negId = active?.id || null;
                }
                if (!negId) {
                    const opportunityId = matchForNeg && typeof dataService._resolveNegotiationOpportunityId === 'function'
                        ? dataService._resolveNegotiationOpportunityId(matchForNeg, userId)
                        : null;
                    await dataService.startNegotiationFromMatch(matchId, userId, opportunityId ? { opportunityId } : {});
                }
                if (window.router?.navigate) {
                    window.router.navigate('/matches/' + matchId + '?section=negotiation');
                } else {
                    const match = await dataService.getPostMatchById(matchId);
                    if (match) await renderMatchDetail(match, userId);
                    setMatchActionFeedback('Negotiation started. Continue in the Value Negotiation section.', 'success');
                    const panel = document.getElementById('match-detail-negotiation-panel');
                    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (err) {
                console.error('[match-detail] Start negotiation failed:', { matchId, userId, err });
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not start negotiation.', 'danger');
            }
            startNegBtn.disabled = false;
            return;
        }
        if (createDealNegBtn) {
            e.preventDefault();
            createDealNegBtn.disabled = true;
            try {
                const match = await dataService.getPostMatchById(matchId);
                let negId = match?.negotiationId;
                if (!negId && typeof dataService.getActiveNegotiationForMatch === 'function') {
                    const neg = await dataService.getActiveNegotiationForMatch(matchId);
                    negId = neg?.id;
                }
                if (!negId) {
                    const list = await dataService.getNegotiationsByMatchId(matchId);
                    const agreed = (list || []).find(n => (n.status || '') === 'agreed');
                    negId = agreed?.id;
                }
                if (!negId) throw new Error('No agreed negotiation found.');
                const deal = await dataService.createDealFromNegotiation(negId, userId);
                if (deal && window.router?.navigate) window.router.navigate('/deals/' + deal.id);
            } catch (err) {
                console.error('[match-detail] Create deal from negotiation failed:', { matchId, userId, err });
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not create deal.', 'danger');
            }
            createDealNegBtn.disabled = false;
            return;
        }
        const inviteBtn = e.target.closest('#btn-invite-apply');
        if (inviteBtn) {
            e.preventDefault();
            inviteBtn.disabled = true;
            try {
                const invitation = await dataService.createOpportunityInvitationFromMatch(matchId, userId);
                const match = await dataService.getPostMatchById(matchId);
                if (match) await renderMatchDetail(match, userId);
                setMatchActionFeedback(
                    invitation ? 'Invitation sent. The invited party can apply from their notification or opportunity page.' : 'Invitation could not be sent.',
                    invitation ? 'success' : 'danger'
                );
            } catch (err) {
                console.error('Invite to apply error:', err);
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not send invitation.', 'danger');
            }
            inviteBtn.disabled = false;
            return;
        }
        if (acceptBtn) {
            e.preventDefault();
            acceptBtn.disabled = true;
            try {
                const match = await dataService.getPostMatchById(matchId);
                if (isPostMatchExpired(match)) {
                    if (match) await renderMatchDetail(match, userId);
                    setMatchActionFeedback('This match has expired.', 'danger');
                    acceptBtn.disabled = false;
                    return;
                }
                if (match && match.isReplacement && match.replacementDealId) {
                    const deal = await dataService.acceptReplacementPostMatch(matchId, userId);
                    if (deal && window.router && typeof window.router.navigate === 'function') {
                        window.router.navigate('/deals/' + deal.id);
                    } else {
                        await dataService.updatePostMatchStatus(matchId, userId, CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED);
                    }
                    acceptBtn.disabled = false;
                    return;
                }
                const updated = await dataService.updatePostMatchStatus(matchId, userId, CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED);
                if (updated) {
                    await renderMatchDetail(updated, userId);
                    if (isPostMatchExpired(updated)) {
                        setMatchActionFeedback('This match has expired.', 'danger');
                    } else if ((updated.status || '') === CONFIG.POST_MATCH_STATUS.DECLINED) {
                        setMatchActionFeedback('This match was declined', 'danger');
                    } else if ((updated.status || '') === CONFIG.POST_MATCH_STATUS.CONFIRMED) {
                        setMatchActionFeedback('All participants have accepted. Use Start Deal to open your deal workspace.', 'success');
                    } else {
                        setMatchActionFeedback('Waiting for all participants to accept', 'info');
                    }
                }
            } catch (err) {
                console.error('Accept match error:', err);
                setMatchActionFeedback((err && err.message) ? err.message : 'Could not accept this match. Please try again.', 'danger');
            }
            acceptBtn.disabled = false;
        } else if (declineBtn) {
            e.preventDefault();
            const match = await dataService.getPostMatchById(matchId);
            const isReplacement = match && match.isReplacement;
            if (!confirm(isReplacement ? 'Decline this replacement invitation? The next replacement for this role may be invited.' : 'Decline this match? Other participants will be notified.')) return;
            declineBtn.disabled = true;
            try {
                const updated = await dataService.declinePostMatch(matchId, userId);
                if (isReplacement) {
                    const nextMatch = await dataService.inviteNextReplacementCandidate(matchId, userId);
                    if (nextMatch) {
                        if (window.router && window.router.navigate) window.router.navigate('/matches/' + nextMatch.id);
                        else {
                            const bp = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/*$/, '') : '';
                            window.location.assign(`${window.location.origin}${bp}/matches/${nextMatch.id}`);
                        }
                    } else {
                        if (router && router.navigate) router.navigate(CONFIG.ROUTES.MATCHES);
                        else {
                            const bp = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/*$/, '') : '';
                            window.location.assign(`${window.location.origin}${bp}/matches`);
                        }
                    }
                } else {
                    if (router && router.navigate) router.navigate(CONFIG.ROUTES.MATCHES);
                    else {
                        const bp = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/*$/, '') : '';
                        window.location.assign(`${window.location.origin}${bp}/matches`);
                    }
                }
            } catch (err) {
                console.error('Decline match error:', err);
            }
            declineBtn.disabled = false;
        }
    };
    rootEl.removeEventListener('click', rootEl._matchDetailClickHandler);
    rootEl._matchDetailClickHandler = handler;
    rootEl.addEventListener('click', handler);
}
