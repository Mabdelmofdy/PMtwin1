/**
 * Deal Detail – post-matching collaboration workflow (stage-based view)
 */

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getDealStatusLabel(s) {
    const map = {
        negotiating: 'Negotiating',
        draft: 'Draft',
        review: 'In Review',
        signing: 'Signing',
        active: 'Active',
        execution: 'Execution',
        delivery: 'Delivery',
        completed: 'Completed',
        closed: 'Closed'
    };
    return map[s] || s;
}

function getDealStatusBadgeClass(s) {
    const map = {
        negotiating: 'warning',
        draft: 'secondary',
        review: 'info',
        signing: 'primary',
        active: 'primary',
        execution: 'primary',
        delivery: 'info',
        completed: 'success',
        closed: 'secondary'
    };
    return map[s] || 'secondary';
}

function getMilestoneStatusBadgeClass(status) {
    const map = { pending: 'secondary', in_progress: 'warning', submitted: 'info', approved: 'success', completed: 'success', rejected: 'danger' };
    return map[status] || 'secondary';
}

function getMilestoneStatusDisplayLabel(status) {
    const s = status || 'pending';
    if (s === 'approved') return 'completed';
    return s;
}

function getMatchTypeLabel(matchType) {
    const map = { one_way: 'One Way', two_way: 'Two Way (Barter)', consortium: 'Consortium', circular: 'Circular Exchange' };
    return map[matchType] || matchType;
}

async function initDealDetail(params) {
    const dealId = params?.id;
    const loadingEl = document.getElementById('deal-loading');
    const errorEl = document.getElementById('deal-error');
    const contentEl = document.getElementById('deal-content');

    if (!dealId) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        return;
    }

    try {
        const deal = await dataService.getDealById(dealId);
        if (!deal) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
            return;
        }

        const isParticipant = (deal.participants || []).some(p => p.userId === user.id);
        const isAdminView = authService.canAccessAdmin && authService.canAccessAdmin();
        if (!isParticipant && !isAdminView) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        const backLink = contentEl.querySelector('.back-link');
        if (backLink && isAdminView && typeof router !== 'undefined' && router.getCurrentPath && router.getCurrentPath().startsWith('/admin/deals')) {
            backLink.setAttribute('data-route', (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.ADMIN_DEALS) ? window.CONFIG.ROUTES.ADMIN_DEALS : '/admin/deals');
            backLink.textContent = '\u2190 Back to Deals';
        }

        document.getElementById('deal-title').textContent = deal.title || 'Deal';
        const statusBadge = document.getElementById('deal-status-badge');
        statusBadge.textContent = getDealStatusLabel(deal.status);
        statusBadge.className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
        document.getElementById('deal-type-label').textContent = 'Type: ' + getMatchTypeLabel(deal.matchType);
        const matchLink = document.getElementById('deal-match-link');
        if (deal.matchId) {
            matchLink.innerHTML = '<a href="#" data-route="/matches/' + escapeHtml(deal.matchId) + '" class="text-primary hover:underline">View match</a>';
        } else {
            matchLink.textContent = '';
        }

        const stageEl = document.getElementById('deal-stage-content');
        stageEl.innerHTML = await renderStageContent(deal, user.id);
        bindDealActions(dealId, deal.status, user.id);
    } catch (e) {
        console.error('Deal detail error:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
    }
}

function getParticipantRoleLabel(deal, participant) {
    if (deal.roleSlots && deal.roleSlots[participant.userId]) return deal.roleSlots[participant.userId];
    const roles = (deal.payload && deal.payload.roles) || [];
    const r = roles.find(x => x.userId === participant.userId);
    return (r && r.role) || (participant.role === 'consortium_lead' ? 'Lead' : 'Member');
}

async function renderConsortiumParticipantsBlock(deal, currentUserId) {
    const participants = deal.participants || [];
    const replacementMatches = dataService.getPostMatchesByReplacementDealId(deal.id) || [];
    const pendingInvites = replacementMatches.filter(m => (m.status || '') === 'pending');
    let rows = participants.map(p => {
        const roleLabel = getParticipantRoleLabel(deal, p);
        const isDropped = (p.status || 'active') === 'dropped';
        const replacedBy = p.replacedByUserId ? ' (replaced by ' + escapeHtml(p.replacedByUserId) + ')' : '';
        const badge = isDropped ? '<span class="badge badge-danger">Dropped' + replacedBy + '</span>' : (p.signedAt ? '<span class="badge badge-success">Signed</span>' : (p.approvalStatus === 'approved' ? '<span class="badge badge-info">Approved</span>' : '<span class="badge badge-secondary">Pending</span>'));
        return '<li class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"><span>' + escapeHtml(p.userId) + ' <span class="text-gray-500 text-sm">(' + escapeHtml(roleLabel) + ')</span></span>' + badge + '</li>';
    }).join('');
    let replacementHtml = '';
    if (pendingInvites.length > 0) {
        const invited = pendingInvites[0].participants && pendingInvites[0].participants[0] ? pendingInvites[0].participants[0].userId : '—';
        replacementHtml = '<p class="text-sm text-gray-600 mt-2">Replacement invitation sent to <strong>' + escapeHtml(invited) + '</strong>.</p>';
    }
    const isLead = participants.some(p => p.userId === currentUserId && (p.role || '') === 'consortium_lead');
    const isDroppedMember = participants.some(p => p.userId === currentUserId && (p.status || 'active') === 'dropped');
    const canDropOut = participants.some(p => p.userId === currentUserId && (p.role || '') === 'consortium_member' && (p.status || 'active') !== 'dropped');
    const hasDropped = participants.some(p => (p.status || 'active') === 'dropped');
    const viable = dataService.isConsortiumDealViable(deal);
    const dropOutBtn = canDropOut && viable ? '<button type="button" class="btn btn-outline btn-sm text-gray-600 mt-2" id="deal-btn-drop-out">Drop out</button>' : '';
    return '<div class="deal-section mb-4"><h2>Role slots</h2><p class="text-gray-600 text-sm mb-2">Consortium participants and replacement state.</p><ul class="space-y-1">' + rows + '</ul>' + replacementHtml + dropOutBtn + '</div>';
}

async function renderStageContent(deal, currentUserId) {
    const status = deal.status || 'negotiating';
    const participants = deal.participants || [];
    const firstOther = participants.find(p => p.userId !== currentUserId && (p.status || 'active') !== 'dropped');
    const messageRoute = firstOther ? '/messages/' + firstOther.userId : '#';
    const consortiumBlock = (deal.matchType || '') === 'consortium' ? await renderConsortiumParticipantsBlock(deal, currentUserId) : '';

    if (status === 'negotiating') {
        const negotiation = deal.negotiationId ? await dataService.getNegotiationById(deal.negotiationId) : null;
        return consortiumBlock + '<div class="deal-section"><h2>Negotiation</h2><p class="text-gray-600 mb-4">Discuss scope, timeline, value, and deliverables with participants. When terms are agreed, create the deal draft.</p><div class="flex flex-wrap gap-2"><a href="#" data-route="' + messageRoute + '" class="btn btn-primary btn-sm">Send Message</a><button type="button" class="btn btn-outline btn-sm" id="deal-btn-propose-terms">Propose Terms</button><button type="button" class="btn btn-outline btn-sm" id="deal-btn-accept-proposal">Accept Proposal & Create Draft</button><button type="button" class="btn btn-outline btn-sm text-gray-600" id="deal-btn-cancel-negotiation">Cancel Negotiation</button></div></div>';
    }

    if (status === 'draft') {
        const scope = escapeHtml(deal.scope || '—');
        const timeline = deal.timeline && (deal.timeline.start || deal.timeline.end) ? (deal.timeline.start || '') + ' – ' + (deal.timeline.end || '') : '—';
        const valueTerms = deal.valueTerms && (deal.valueTerms.agreedValue || deal.valueTerms.paymentSchedule) ? (deal.valueTerms.agreedValue ? JSON.stringify(deal.valueTerms.agreedValue) : '') + (deal.valueTerms.paymentSchedule ? ' · ' + deal.valueTerms.paymentSchedule : '') : '—';
        return consortiumBlock + '<div class="deal-section"><h2>Deal Draft</h2><dl class="space-y-2 text-sm"><dt class="font-medium text-gray-700">Scope</dt><dd class="text-gray-900">' + scope + '</dd><dt class="font-medium text-gray-700">Timeline</dt><dd>' + escapeHtml(timeline) + '</dd><dt class="font-medium text-gray-700">Exchange</dt><dd>' + escapeHtml(deal.exchangeMode || '—') + '</dd><dt class="font-medium text-gray-700">Value</dt><dd>' + escapeHtml(valueTerms) + '</dd></dl><div class="flex flex-wrap gap-2 mt-4"><button type="button" class="btn btn-outline btn-sm" id="deal-btn-edit-draft">Edit Draft</button><button type="button" class="btn btn-primary btn-sm" id="deal-btn-approve-draft">Approve Draft</button><button type="button" class="btn btn-outline btn-sm text-gray-600" id="deal-btn-cancel-deal">Cancel Deal</button></div></div>';
    }

    if (status === 'review') {
        const partList = participants.filter(p => (p.status || 'active') !== 'dropped').map(p => '<li class="flex justify-between items-center py-2"><span>' + escapeHtml(p.userId) + '</span><span class="badge badge-' + (p.approvalStatus === 'approved' ? 'success' : 'secondary') + '">' + (p.approvalStatus || 'pending') + '</span></li>').join('');
        return consortiumBlock + '<div class="deal-section"><h2>Deal Review</h2><p class="text-gray-600 mb-3">All participants must approve the deal to proceed to signing.</p><ul class="space-y-1">' + partList + '</ul><div class="flex flex-wrap gap-2 mt-4"><button type="button" class="btn btn-primary btn-sm" id="deal-btn-approve-review">Approve Deal</button><button type="button" class="btn btn-outline btn-sm" id="deal-btn-request-changes">Request Changes</button><button type="button" class="btn btn-outline btn-sm text-gray-600" id="deal-btn-reject-deal">Reject Deal</button></div></div>';
    }

    if (status === 'signing') {
        const partList = participants.filter(p => (p.status || 'active') !== 'dropped').map(p => '<li class="flex justify-between items-center py-2"><span>' + escapeHtml(p.userId) + '</span><span class="badge ' + (p.signedAt ? 'badge-success' : 'badge-warning') + '">' + (p.signedAt ? 'Signed' : 'Pending') + '</span></li>').join('');
        const viewContractBtn = deal.contractId ? '<a href="#" data-route="/contracts/' + escapeHtml(deal.contractId) + '" class="btn btn-outline btn-sm">View Contract</a>' : '';
        return consortiumBlock + '<div class="deal-section"><h2>Agreement Signing</h2><ul class="space-y-1 mb-4">' + partList + '</ul><div class="flex flex-wrap gap-2"><button type="button" class="btn btn-primary btn-sm" id="deal-btn-sign">Sign Agreement</button>' + viewContractBtn + '<button type="button" class="btn btn-outline btn-sm text-gray-600" id="deal-btn-cancel-deal">Cancel Deal</button></div></div>';
    }

    if (status === 'active') {
        return consortiumBlock + '<div class="deal-section"><h2>Active Deal</h2><p class="text-gray-600 mb-4">The agreement is signed. Start execution to begin collaboration and track milestones.</p><div class="flex flex-wrap gap-2"><a href="#" data-route="' + messageRoute + '" class="btn btn-outline btn-sm">Message participants</a><button type="button" class="btn btn-primary btn-sm" id="deal-btn-start-execution">Start execution</button></div></div>';
    }

    if (status === 'execution') {
        const milestones = deal.milestones || [];
        const msStatus = (m) => m.status || 'pending';
        const completedCount = milestones.filter(m => (msStatus(m) === 'approved' || msStatus(m) === 'completed')).length;
        const progressText = milestones.length ? 'Completion: ' + completedCount + '/' + milestones.length : '';
        const msList = milestones.length ? milestones.map(m => {
            const raw = msStatus(m);
            const badge = getMilestoneStatusBadgeClass(raw);
            const label = getMilestoneStatusDisplayLabel(raw).replace('_', ' ');
            let actions = '';
            if (raw === 'pending') actions = '<button type="button" class="btn btn-outline btn-xs deal-milestone-start" data-milestone-id="' + escapeHtml(m.id) + '">Start</button>';
            else if (raw === 'in_progress') actions = '<button type="button" class="btn btn-outline btn-xs deal-milestone-submit" data-milestone-id="' + escapeHtml(m.id) + '">Submit deliverable</button>';
            else if (raw === 'submitted') actions = '<button type="button" class="btn btn-primary btn-xs deal-milestone-approve" data-milestone-id="' + escapeHtml(m.id) + '">Approve</button><button type="button" class="btn btn-outline btn-xs deal-milestone-reject" data-milestone-id="' + escapeHtml(m.id) + '">Request revision</button>';
            return '<li class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"><span><strong>' + escapeHtml(m.title || m.name || 'Milestone') + '</strong>' + (m.dueDate ? ' <span class="text-muted">(' + escapeHtml(m.dueDate) + ')</span>' : '') + '</span><span class="flex items-center gap-2"><span class="badge badge-' + badge + '">' + label + '</span>' + actions + '</span></li>';
        }).join('') : '<li class="text-gray-500">No milestones yet.</li>';
        const allApproved = milestones.length > 0 && milestones.every(m => (msStatus(m) === 'approved' || msStatus(m) === 'completed'));
        const readyBtn = allApproved || milestones.length === 0 ? '<button type="button" class="btn btn-primary btn-sm" id="deal-btn-ready-for-delivery">Ready for delivery</button>' : '';
        return consortiumBlock + '<div class="deal-section"><h2>Execution Workspace</h2><p class="text-gray-600 mb-3"><a href="#" data-route="' + messageRoute + '" class="text-primary hover:underline">Message participants</a></p><h3 class="text-sm font-semibold text-gray-700 mt-4 mb-2">Milestones</h3>' + (progressText ? '<p class="text-sm text-gray-600 mb-2">' + progressText + '</p>' : '') + '<ul class="space-y-0">' + msList + '</ul><div class="flex flex-wrap gap-2 mt-4"><button type="button" class="btn btn-outline btn-sm" id="deal-btn-add-milestone">Add Milestone</button>' + readyBtn + '</div></div>';
    }

    if (status === 'delivery') {
        return consortiumBlock + '<div class="deal-section"><h2>Delivery Review</h2><p class="text-gray-600 mb-4">Review final deliverables. Approve completion to close the deal.</p><div class="flex flex-wrap gap-2"><button type="button" class="btn btn-primary btn-sm" id="deal-btn-approve-completion">Approve completion</button><button type="button" class="btn btn-outline btn-sm" id="deal-btn-request-revisions">Request revisions</button></div></div>';
    }

    if (status === 'completed' || status === 'closed') {
        return consortiumBlock + '<div class="deal-section"><h2>' + (status === 'completed' ? 'Deal completed' : 'Deal closed') + '</h2><p class="text-gray-600">Scope: ' + escapeHtml(deal.scope || '—') + '</p><div class="flex flex-wrap gap-2 mt-4">' + (status === 'completed' ? '<a href="#" data-route="/deals/' + deal.id + '/rate" class="btn btn-primary btn-sm" id="deal-link-rate">Rate & Review</a><button type="button" class="btn btn-outline btn-sm" id="deal-btn-close-deal">Close Deal</button>' : '') + '</div></div>';
    }

    return consortiumBlock + '<div class="deal-section"><p class="text-gray-500">Unknown stage.</p></div>';
}

function bindDealActions(dealId, status, userId) {
    const stageEl = document.getElementById('deal-stage-content');
    if (!stageEl) return;

    stageEl.addEventListener('click', async (e) => {
        const target = e.target.closest('[id^="deal-btn-"], [id^="deal-link-"], .deal-milestone-start, .deal-milestone-submit, .deal-milestone-approve, .deal-milestone-reject');
        if (!target) return;

        const id = target.id || '';
        const milestoneId = target.dataset?.milestoneId;
        if (id === 'deal-btn-drop-out') {
            e.preventDefault();
            if (!confirm('Drop out of this consortium deal? A replacement may be invited.')) return;
            try {
                const { deal: updatedDeal, missingRole, viable } = await dataService.markDealParticipantDropped(dealId, userId);
                await dataService.logParticipantDropped(dealId, userId);
                if (viable && updatedDeal && missingRole) {
                    const matchingService = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
                    if (matchingService && typeof matchingService.findReplacementCandidatesForRole === 'function') {
                        const leadNeedId = updatedDeal.opportunityId || (updatedDeal.opportunityIds && updatedDeal.opportunityIds[0]);
                        if (leadNeedId) {
                            const excludeUserIds = (updatedDeal.participants || []).map(p => p.userId);
                            const { candidates } = await matchingService.findReplacementCandidatesForRole(leadNeedId, missingRole, { excludeUserIds, topN: 1 });
                            if (candidates && candidates[0]) {
                                const postMatch = await dataService.createReplacementPostMatch(dealId, candidates[0], missingRole, userId);
                                const notif = window.dataService || dataService;
                                if (postMatch && notif && notif.createNotification) {
                                    await notif.createNotification({ userId: candidates[0].userId, type: 'match', title: 'Consortium replacement invitation', message: 'You have been invited to replace a participant in a consortium deal.', link: '/matches/' + postMatch.id, read: false });
                                }
                            }
                        }
                    }
                }
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-accept-proposal') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DRAFT });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-cancel-negotiation' || id === 'deal-btn-cancel-deal') {
            e.preventDefault();
            if (!confirm('Cancel this deal? This cannot be undone.')) return;
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.CLOSED, closedAt: new Date().toISOString() });
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_terminated', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                if (window.router) window.router.navigate('/deals');
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-approve-draft') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.REVIEW });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-approve-review') {
            e.preventDefault();
            try {
                const deal = await dataService.getDealById(dealId);
                const participants = (deal.participants || []).map(p => p.userId === userId ? { ...p, approvalStatus: 'approved' } : p);
                await dataService.updateDeal(dealId, { participants });
                const updated = await dataService.getDealById(dealId);
                const allApproved = (updated.participants || []).every(p => p.approvalStatus === 'approved');
                if (allApproved) await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.SIGNING });
                const final = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(final.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(final.status);
                stageEl.innerHTML = await renderStageContent(final, userId);
                bindDealActions(dealId, final.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-request-changes') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DRAFT });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-reject-deal') {
            e.preventDefault();
            if (!confirm('Reject this deal? It will be closed.')) return;
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.CLOSED, closedAt: new Date().toISOString() });
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_terminated', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                if (window.router) window.router.navigate('/deals');
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-sign') {
            e.preventDefault();
            try {
                const deal = await dataService.getDealById(dealId);
                const participants = (deal.participants || []).map(p => p.userId === userId ? { ...p, signedAt: new Date().toISOString() } : p);
                const activeParticipants = participants.filter(p => (p.status || 'active') !== 'dropped');
                const allSigned = activeParticipants.length > 0 && activeParticipants.every(p => p.signedAt);
                let contractId = deal.contractId;
                if (contractId) {
                    const contract = await dataService.getContractById(contractId);
                    if (contract && contract.parties) {
                        const parties = contract.parties.map(p => p.userId === userId ? { ...p, signedAt: new Date().toISOString() } : p);
                        await dataService.updateContract(contractId, { parties });
                    }
                }
                if (!contractId && allSigned) {
                    const parties = participants.map(p => ({ userId: p.userId, role: p.role || 'participant', signedAt: p.signedAt || new Date().toISOString() }));
                    const contract = await dataService.createContract({
                        dealId: deal.id,
                        opportunityId: (deal.opportunityId || (deal.opportunityIds && deal.opportunityIds[0])) || null,
                        applicationId: deal.applicationId || null,
                        parties,
                        scope: deal.scope || '',
                        paymentMode: deal.exchangeMode || 'cash',
                        agreedValue: deal.valueTerms?.agreedValue || null,
                        duration: deal.timeline && (deal.timeline.start || deal.timeline.end) ? (deal.timeline.start || '') + ' to ' + (deal.timeline.end || '') : '',
                        status: CONFIG.CONTRACT_STATUS.ACTIVE,
                        signedAt: new Date().toISOString()
                    });
                    contractId = contract.id;
                    if (dataService.createAuditLog && userId) {
                        dataService.createAuditLog({
                            userId,
                            action: 'contract_signed',
                            entityType: 'contract',
                            entityId: contractId,
                            details: { dealId }
                        }).catch(() => {});
                    }
                }
                await dataService.updateDeal(dealId, { participants, contractId, status: allSigned ? CONFIG.DEAL_STATUS.ACTIVE : deal.status });
                const updated = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(updated.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(updated.status);
                stageEl.innerHTML = await renderStageContent(updated, userId);
                bindDealActions(dealId, updated.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-start-execution') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.EXECUTION });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-ready-for-delivery') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.DELIVERY });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-approve-completion') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.COMPLETED, completedAt: new Date().toISOString() });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-request-revisions') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.EXECUTION });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-close-deal') {
            e.preventDefault();
            try {
                await dataService.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.CLOSED, closedAt: new Date().toISOString() });
                if (dataService.createAuditLog && userId) {
                    dataService.createAuditLog({ userId, action: 'deal_terminated', entityType: 'deal', entityId: dealId, details: {} }).catch(() => {});
                }
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (id === 'deal-btn-add-milestone') {
            e.preventDefault();
            const title = prompt('Milestone title:');
            if (!title || !title.trim()) return;
            try {
                await dataService.addDealMilestone(dealId, { title: title.trim(), description: '', deliverables: '', status: 'pending' });
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
        if (milestoneId && target.classList && (target.classList.contains('deal-milestone-start') || target.classList.contains('deal-milestone-submit') || target.classList.contains('deal-milestone-approve') || target.classList.contains('deal-milestone-reject'))) {
            e.preventDefault();
            try {
                let updates = {};
                if (target.classList.contains('deal-milestone-start')) updates = { status: 'in_progress' };
                else if (target.classList.contains('deal-milestone-submit')) updates = { status: 'submitted', submittedAt: new Date().toISOString() };
                else if (target.classList.contains('deal-milestone-approve')) updates = { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: userId };
                else if (target.classList.contains('deal-milestone-reject')) updates = { status: 'rejected' };
                await dataService.updateDealMilestone(dealId, milestoneId, updates);
                const deal = await dataService.getDealById(dealId);
                document.getElementById('deal-status-badge').textContent = getDealStatusLabel(deal.status);
                document.getElementById('deal-status-badge').className = 'badge badge-' + getDealStatusBadgeClass(deal.status);
                stageEl.innerHTML = await renderStageContent(deal, userId);
                bindDealActions(dealId, deal.status, userId);
            } catch (err) { console.error(err); }
            return;
        }
    });
}
