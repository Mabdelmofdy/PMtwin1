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
            router.navigate(CONFIG.ROUTES.LOGIN);
            return;
        }
        const isParticipant = (postMatch.participants || []).some(p => p.userId === user.id);
        if (!isParticipant) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (notFoundEl) notFoundEl.style.display = 'block';
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        if (notFoundEl) notFoundEl.style.display = 'none';

        await renderMatchDetail(postMatch, user.id);
        setupMatchDetailActions(matchId, user.id);
    } catch (e) {
        console.error('Match detail load error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (notFoundEl) notFoundEl.style.display = 'block';
    }
}

function getMatchTypeLabel(matchType) {
    const labels = { one_way: 'One Way Matching', two_way: 'Two Way Matching (Barter)', consortium: 'Group Formation (Consortium)', circular: 'Circular Exchange' };
    return labels[matchType] || matchType;
}

function getUnifiedMatchTitle(matchType) {
    const titles = { one_way: 'Project Collaboration Match', two_way: 'Barter Match', consortium: 'Consortium Match', circular: 'Circular Exchange Match' };
    return titles[matchType] || 'Match';
}

var CRITERION_LABELS = { skills: 'Skill compatibility', budget: 'Budget compatibility', timeline: 'Timeline alignment', location: 'Location compatibility' };

function getStatusBadgeClass(status) {
    const map = { pending: 'warning', accepted: 'primary', declined: 'danger', confirmed: 'success', expired: 'secondary' };
    return map[status] || 'secondary';
}

function formatStatusLabel(status) {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getOneWayViewerRole(postMatch, currentUserId) {
    const participants = postMatch.participants || [];
    const needOwner = participants.find(p => p.role === 'need_owner');
    const needOwnerId = needOwner?.userId || null;
    return { isNeedOwner: needOwnerId === currentUserId };
}

async function renderMatchDetail(postMatch, currentUserId) {
    const ds = dataService;
    const scorePct = Math.round((postMatch.matchScore || 0) * 100);
    const payload = postMatch.payload || {};
    const matchType = postMatch.matchType || 'one_way';

    // —— Header ——
    const titleEl = document.getElementById('match-detail-title');
    titleEl.textContent = postMatch.isReplacement
        ? ('Replacement invitation – ' + (postMatch.replacementRole || 'consortium member'))
        : getUnifiedMatchTitle(matchType);
    document.getElementById('match-detail-type').textContent = getMatchTypeLabel(matchType);
    document.getElementById('match-detail-score').textContent = scorePct + '%';
    const statusEl = document.getElementById('match-detail-status');
    statusEl.textContent = formatStatusLabel(postMatch.status || 'pending');
    statusEl.className = 'badge badge-' + getStatusBadgeClass(postMatch.status);

    // —— Exchange Flow ——
    const exchangeFlowEl = document.getElementById('match-detail-exchange-flow-body');
    if (exchangeFlowEl) {
        if (matchType === 'one_way') {
            const needOpp = await ds.getOpportunityById(payload.needOpportunityId);
            const offerOpp = await ds.getOpportunityById(payload.offerOpportunityId);
            exchangeFlowEl.innerHTML = '<div class="flex flex-wrap items-center gap-2"><span class="px-3 py-2 bg-amber-50 border border-amber-200 rounded">Need</span><span class="text-gray-400">' + escapeHtml(needOpp?.title || '—') + '</span><span class="text-gray-500">→</span><span class="px-3 py-2 bg-teal-50 border border-teal-200 rounded">Offer</span><span class="text-gray-400">' + escapeHtml(offerOpp?.title || '—') + '</span></div>';
        } else if (matchType === 'two_way') {
            const sideA = payload.sideA || {}, sideB = payload.sideB || {};
            const nameA = await ds.getUserOrCompanyById(sideA.userId).then(u => u?.profile?.name || sideA.userId);
            const nameB = await ds.getUserOrCompanyById(sideB.userId).then(u => u?.profile?.name || sideB.userId);
            const labelA = sideA.userId === currentUserId ? 'You (A)' : escapeHtml(nameA) + ' (A)';
            const labelB = sideB.userId === currentUserId ? 'You (B)' : escapeHtml(nameB) + ' (B)';
            exchangeFlowEl.innerHTML = '<div class="flex flex-wrap items-center gap-2"><span class="px-3 py-2 bg-teal-50 border border-teal-200 rounded">' + labelA + '</span><span class="text-gray-500">↔</span><span class="px-3 py-2 bg-teal-50 border border-teal-200 rounded">' + labelB + '</span></div>';
        } else if (matchType === 'consortium') {
            const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
            const roles = payload.roles || [];
            const offerLabels = await Promise.all(roles.map(r => ds.getOpportunityById(r.opportunityId).then(o => o?.title || r.role)));
            exchangeFlowEl.innerHTML = '<div class="space-y-2"><div class="flex flex-wrap items-center gap-2"><span class="px-3 py-2 bg-amber-50 border border-amber-200 rounded">Need</span><span class="text-gray-400">' + escapeHtml(leadOpp?.title || '—') + '</span></div><div class="text-gray-500 text-sm">↓</div><div class="flex flex-wrap gap-2"><span class="text-sm font-medium text-gray-600">Multiple Offers:</span>' + offerLabels.map(t => '<span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm">' + escapeHtml(t) + '</span>').join('') + '</div></div>';
        } else if (matchType === 'circular') {
            const cycle = payload.cycle || [];
            const names = await Promise.all(cycle.map(uid => ds.getUserOrCompanyById(uid).then(u => u?.profile?.name || uid)));
            const labels = cycle.map((uid, i) => (uid === currentUserId ? 'You' : (names[i] || uid)));
            exchangeFlowEl.innerHTML = '<div class="flex flex-wrap items-center gap-1">' + labels.map((l, i) => '<span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm">' + escapeHtml(l) + '</span>' + (i < labels.length - 1 ? '<span class="text-gray-400">→</span>' : '')).join('') + '<span class="text-gray-400">→</span><span class="px-2 py-1 bg-teal-50 border border-teal-200 rounded text-sm">' + (labels[0] || '') + '</span></div>';
        } else {
            exchangeFlowEl.innerHTML = '<p class="text-gray-500">No flow available.</p>';
        }
    }

    // —— Value Exchange ——
    const valueEl = document.getElementById('match-detail-value-body');
    if (valueEl) {
        let valueHtml = '';
        if (payload.valueEquivalence) valueHtml = '<p>' + escapeHtml(payload.valueEquivalence) + '</p>';
        else if (payload.valueAnalysis && (payload.valueAnalysis.fit || payload.valueAnalysis.budgetInRange)) valueHtml = '<p>Fit: ' + escapeHtml(payload.valueAnalysis.fit || '—') + (payload.valueAnalysis.budgetInRange !== undefined ? ' · Budget in range: ' + (payload.valueAnalysis.budgetInRange ? 'Yes' : 'No') : '') + '</p>';
        else if (payload.valueBalance) valueHtml = '<p>Consortium balance score: ' + Math.round((payload.valueBalance.consortiumBalanceScore || 0) * 100) + '%' + (payload.valueBalance.viable !== undefined ? ' · Viable: ' + (payload.valueBalance.viable ? 'Yes' : 'No') : '') + '</p>';
        else if (payload.chainBalance) valueHtml = '<p>Chain balance score: ' + Math.round((payload.chainBalance.chainBalanceScore || 0) * 100) + '%' + (payload.chainBalance.viable !== undefined ? ' · Viable: ' + (payload.chainBalance.viable ? 'Yes' : 'No') : '') + '</p>';
        valueEl.innerHTML = valueHtml || '<p class="text-gray-500">No value estimate available.</p>';
    }

    // —— Match Score & Criteria ——
    const scoreBadgeEl = document.getElementById('match-detail-score-badge');
    if (scoreBadgeEl) scoreBadgeEl.textContent = scorePct + '% Match';
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
    const isPending = (postMatch.status || '') === 'pending';
    const myPart = participants.find(p => p.userId === currentUserId);
    const myStatus = myPart?.participantStatus || 'pending';
    const canAct = isPending && myStatus === 'pending';
    actionsEl.querySelector('#btn-accept-match').style.display = canAct ? '' : 'none';
    actionsEl.querySelector('#btn-decline-match').style.display = canAct ? '' : 'none';
    const firstOther = uniqueByUser.find(p => p.userId !== currentUserId);
    const linkNegotiation = actionsEl.querySelector('#link-start-negotiation');
    const linkMessage = actionsEl.querySelector('#link-message-participants');
    if (firstOther && firstOther.userId) {
        linkNegotiation.setAttribute('href', '#');
        linkNegotiation.setAttribute('data-route', '/messages/' + firstOther.userId);
        linkNegotiation.style.display = '';
        linkMessage.setAttribute('href', '#');
        linkMessage.setAttribute('data-route', '/messages/' + firstOther.userId);
        linkMessage.style.display = '';
    } else {
        linkNegotiation.style.display = 'none';
        linkMessage.style.display = 'none';
    }
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
            const links = payload.links || [];
            const outLink = links.find(l => (l.fromCreatorId || l.from) === p.userId);
            const inLink = links.find(l => (l.toCreatorId || l.to) === p.userId);
            const offerOpp = outLink?.offerId ? await ds.getOpportunityById(outLink.offerId) : null;
            const needOpp = inLink?.needId ? await ds.getOpportunityById(inLink.needId) : null;
            offer = offerOpp?.title || '—';
            need = needOpp?.title || '—';
        }
        partHtml.push('<li class="p-4 border border-gray-200 rounded-lg ' + (isYou ? 'bg-primary/5 border-primary/30' : '') + '"><div class="font-medium text-gray-900">' + escapeHtml(name) + (isYou ? ' <span class="text-gray-500">(You)</span>' : '') + '</div><div class="text-sm mt-1"><span class="text-gray-600">Offer:</span> ' + escapeHtml(offer) + '</div><div class="text-sm"><span class="text-gray-600">Need:</span> ' + escapeHtml(need) + '</div><div class="mt-2"><span class="badge badge-' + getStatusBadgeClass(status) + '">' + escapeHtml(formatStatusLabel(status)) + '</span></div></li>');
    }
    return partHtml;
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function setupMatchDetailActions(matchId, userId) {
    const actionsEl = document.getElementById('match-detail-actions');
    if (!actionsEl) return;
    // Use a single delegated listener so we don't add duplicates after re-render
    const handler = async (e) => {
        const acceptBtn = e.target.closest('#btn-accept-match');
        const declineBtn = e.target.closest('#btn-decline-match');
        if (acceptBtn) {
            e.preventDefault();
            acceptBtn.disabled = true;
            try {
                const match = await dataService.getPostMatchById(matchId);
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
                    await notifyOtherParticipants(updated, userId, 'accepted');
                    if (updated.status === CONFIG.POST_MATCH_STATUS.CONFIRMED) {
                        await notifyAllParticipantsConfirmed(updated);
                    }
                    let deal = await dataService.getDealByMatchId(matchId);
                    if (!deal) {
                        const parties = (updated.participants || []).map(p => ({ userId: p.userId, role: p.role || 'participant' }));
                        const negotiation = await dataService.createNegotiation({
                            matchId,
                            applicationId: null,
                            opportunityId: (updated.payload && (updated.payload.needOpportunityId || updated.payload.leadNeedId)) || null,
                            parties,
                            status: 'open',
                            initialTerms: null,
                            rounds: [],
                            agreedTerms: null
                        });
                        const dealParticipants = (updated.participants || []).map(p => ({
                            userId: p.userId,
                            role: p.role || 'participant',
                            approvalStatus: 'pending',
                            signedAt: null
                        }));
                        const oppIds = [];
                        if (updated.payload) {
                            if (updated.payload.needOpportunityId) oppIds.push(updated.payload.needOpportunityId);
                            if (updated.payload.offerOpportunityId) oppIds.push(updated.payload.offerOpportunityId);
                            if (updated.payload.leadNeedId) oppIds.push(updated.payload.leadNeedId);
                            (updated.payload.roles || []).forEach(r => { if (r.opportunityId) oppIds.push(r.opportunityId); });
                        }
                        const payload = updated.payload || {};
                        const roleSlots = (payload.roles || []).reduce((acc, r) => { if (r.userId) acc[r.userId] = r.role || 'consortium_member'; return acc; }, {});
                        deal = await dataService.createDeal({
                            matchId,
                            matchType: updated.matchType || 'one_way',
                            status: CONFIG.DEAL_STATUS.NEGOTIATING,
                            title: 'Deal – ' + (updated.id || matchId),
                            participants: dealParticipants,
                            opportunityIds: [...new Set(oppIds)],
                            opportunityId: payload.leadNeedId || oppIds[0] || null,
                            payload: updated.matchType === 'consortium' ? payload : null,
                            roleSlots: updated.matchType === 'consortium' && Object.keys(roleSlots).length ? roleSlots : null,
                            negotiationId: negotiation.id,
                            scope: '',
                            timeline: { start: null, end: null },
                            exchangeMode: 'cash',
                            valueTerms: { agreedValue: null, paymentSchedule: '' },
                            deliverables: '',
                            milestones: []
                        });
                    }
                    await renderMatchDetail(updated, userId);
                    if (deal && window.router && typeof window.router.navigate === 'function') {
                        window.router.navigate('/deals/' + deal.id);
                    }
                }
            } catch (err) {
                console.error('Accept match error:', err);
            }
            acceptBtn.disabled = false;
        } else if (declineBtn) {
            e.preventDefault();
            const match = await dataService.getPostMatchById(matchId);
            const isReplacement = match && match.isReplacement;
            if (!confirm(isReplacement ? 'Decline this replacement invitation? The next candidate may be invited.' : 'Decline this match? Other participants will be notified.')) return;
            declineBtn.disabled = true;
            try {
                const updated = await dataService.declinePostMatch(matchId, userId);
                if (updated && !isReplacement) await notifyOtherParticipants(updated, userId, 'declined');
                if (isReplacement) {
                    const nextMatch = await dataService.inviteNextReplacementCandidate(matchId, userId);
                    if (nextMatch) {
                        if (window.router && window.router.navigate) window.router.navigate('/matches/' + nextMatch.id);
                        else window.location.hash = '#/matches/' + nextMatch.id;
                    } else {
                        if (router && router.navigate) router.navigate('/pipeline/matches');
                        else window.location.hash = '#/pipeline/matches';
                    }
                } else {
                    if (router && router.navigate) router.navigate('/pipeline/matches');
                    else window.location.hash = '#/pipeline/matches';
                }
            } catch (err) {
                console.error('Decline match error:', err);
            }
            declineBtn.disabled = false;
        }
    };
    actionsEl.removeEventListener('click', actionsEl._matchDetailClickHandler);
    actionsEl._matchDetailClickHandler = handler;
    actionsEl.addEventListener('click', handler);
}

async function notifyAllParticipantsConfirmed(postMatch) {
    const ds = dataService;
    const participants = postMatch.participants || [];
    const seen = new Set();
    for (const p of participants) {
        if (!p.userId || seen.has(p.userId)) continue;
        seen.add(p.userId);
        await ds.createNotification({
            userId: p.userId,
            type: 'match',
            title: 'Match confirmed',
            message: 'All participants have accepted. You can proceed to negotiate terms.',
            link: '/matches/' + postMatch.id,
            read: false
        });
    }
}

async function notifyOtherParticipants(postMatch, actingUserId, action) {
    const ds = dataService;
    const others = (postMatch.participants || []).filter(p => p.userId && p.userId !== actingUserId);
    const seen = new Set();
    for (const p of others) {
        if (seen.has(p.userId)) continue;
        seen.add(p.userId);
        await ds.createNotification({
            userId: p.userId,
            type: 'match',
            title: action === 'accepted' ? 'Match accepted' : 'Match declined',
            message: action === 'accepted' ? 'A participant accepted the match.' : 'A participant declined the match.',
            link: '/matches/' + postMatch.id,
            read: false
        });
    }
}
