/**
 * Unified Match View Model – user-facing Need/Offer matches (post_matches canonical).
 * Maps stored records to consistent UI labels and actions.
 */

(function (global) {
    const CONFIG = global.CONFIG || {};

    const OPPORTUNITY_TYPE_LABELS = {
        request: 'Need',
        offer: 'Offer',
        hybrid: 'Need & Offer'
    };

    const MATCH_TYPE_LABELS = {
        one_way: 'Need/Offer',
        two_way: 'Barter',
        consortium: 'Consortium role fit',
        circular: 'Circular exchange chain'
    };

    const MATCH_QUALITY_LABELS = {
        top: 'Top Match',
        high: 'High Match',
        medium: 'Medium Match',
        low: 'Low Match'
    };

    const MATCH_QUALITY_CLASSES = {
        top: 'badge-match-high',
        high: 'badge-match-high',
        medium: 'badge-match-medium',
        low: 'badge-match-low'
    };

    const STATUS_LABELS = {
        pending: 'Pending Response',
        accepted: 'Accepted',
        confirmed: 'Confirmed',
        declined: 'Declined',
        expired: 'Expired',
        converted_to_deal: 'Converted to Deal',
        clarification_requested: 'Waiting for Updates'
    };

    function safeStr(v, fallback = '') {
        if (v == null) return fallback;
        return String(v);
    }

    function detectSourceType(match) {
        if (!match || typeof match !== 'object') return 'unknown';
        if (match.matchType && Array.isArray(match.participants)) return 'post_match';
        if (match.opportunityId != null && (match.candidateId != null || match.userId != null)) return 'legacy_match';
        return 'post_match';
    }

    function normalizeInternalMatchType(match, sourceType) {
        if (sourceType === 'legacy_match') return 'one_way';
        const t = match.matchType || match.model || 'one_way';
        if (MATCH_TYPE_LABELS[t]) return t;
        return 'one_way';
    }

    function getOpportunityTypeLabel(intentOrType) {
        const key = safeStr(intentOrType, '').toLowerCase();
        return OPPORTUNITY_TYPE_LABELS[key] || OPPORTUNITY_TYPE_LABELS.request;
    }

    function getMatchTypeLabel(matchType) {
        return MATCH_TYPE_LABELS[matchType] || 'Match';
    }

    function isMatchExpired(match, ds) {
        if (!match) return false;
        const st = safeStr(match.status, '');
        if (st === 'expired' || st === CONFIG.POST_MATCH_STATUS?.EXPIRED) return true;
        if (ds && typeof ds.isExpired === 'function' && ds.isExpired(match)) return true;
        if (match.expiresAt) {
            const t = new Date(match.expiresAt).getTime();
            if (!Number.isNaN(t) && t < Date.now()) return true;
        }
        return false;
    }

    function allParticipantsAccepted(match) {
        const parts = match.participants || [];
        if (!parts.length) return false;
        return parts.every(p => (p.participantStatus || 'pending') === 'accepted');
    }

    function currentUserAccepted(match, currentUserId) {
        const me = (match.participants || []).find(p => p.userId === currentUserId);
        return (me?.participantStatus || '') === 'accepted';
    }

    function getStatusLabel(status, context = {}) {
        const raw = safeStr(status, 'pending').toLowerCase();
        const match = context.match;
        const currentUserId = context.currentUserId;
        const hasDeal = !!(context.dealId || match?.dealId);

        if (hasDeal || raw === 'converted_to_deal') return STATUS_LABELS.converted_to_deal;

        if (raw === 'accepted' && match && currentUserId) {
            if (!allParticipantsAccepted(match)) {
                if (currentUserAccepted(match, currentUserId)) {
                    return 'Waiting for Others';
                }
                return 'Pending Response';
            }
        }

        if (raw === 'confirmed' && match && currentUserId) {
            const me = (match.participants || []).find(p => p.userId === currentUserId);
            if (me && (me.participantStatus || '') === 'accepted' && !allParticipantsAccepted(match)) {
                return 'Waiting for Others';
            }
        }

        return STATUS_LABELS[raw] || (raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' '));
    }

    function getMatchQuality(score) {
        const s = Number(score);
        if (Number.isNaN(s)) {
            return { key: 'low', label: MATCH_QUALITY_LABELS.low, className: MATCH_QUALITY_CLASSES.low };
        }
        let key = 'low';
        if (s >= 0.85) key = 'top';
        else if (s >= 0.70) key = 'high';
        else if (s >= 0.50) key = 'medium';
        return {
            key,
            label: MATCH_QUALITY_LABELS[key],
            className: MATCH_QUALITY_CLASSES[key]
        };
    }

    function extractOpportunityIdsFromMatch(match, sourceType, internalMatchType) {
        const ids = new Set();
        const payload = match.payload || {};

        if (sourceType === 'legacy_match') {
            if (match.opportunityId) ids.add(match.opportunityId);
            return [...ids];
        }

        if (internalMatchType === 'one_way') {
            if (payload.needOpportunityId) ids.add(payload.needOpportunityId);
            if (payload.offerOpportunityId) ids.add(payload.offerOpportunityId);
        } else if (internalMatchType === 'two_way') {
            const sideA = payload.sideA || {};
            const sideB = payload.sideB || {};
            [sideA.needId, sideA.offerId, sideB.needId, sideB.offerId].forEach(id => { if (id) ids.add(id); });
        } else if (internalMatchType === 'consortium') {
            if (payload.leadNeedId) ids.add(payload.leadNeedId);
            (payload.roles || []).forEach(r => { if (r.opportunityId) ids.add(r.opportunityId); });
        } else if (internalMatchType === 'circular') {
            (payload.links || []).forEach(l => {
                if (l.needId) ids.add(l.needId);
                if (l.offerId) ids.add(l.offerId);
            });
        }

        (match.participants || []).forEach(p => {
            if (p.opportunityId) ids.add(p.opportunityId);
        });

        return [...ids];
    }

    function buildReasonsText(match, sourceType, payload, opportunitiesById) {
        const reasons = [];
        if (Array.isArray(match.reasons) && match.reasons.length) {
            return match.reasons.join(', ');
        }
        if (Array.isArray(match.matchReasons) && match.matchReasons.length) {
            return match.matchReasons.join(', ');
        }
        const criteria = match.criteria || {};
        if (criteria.details) reasons.push(criteria.details);
        if (payload.labels && typeof payload.labels === 'object') {
            const labels = Object.entries(payload.labels)
                .filter(([, v]) => v && v !== 'None')
                .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: ${v}`);
            if (labels.length) reasons.push('Matched on ' + labels.join(', '));
        }
        const breakdown = payload.breakdown || {};
        const breakdownKeys = Object.keys(breakdown).filter(k => typeof breakdown[k] === 'number' && breakdown[k] >= 0.7);
        if (breakdownKeys.length && !reasons.length) {
            reasons.push('Strong fit on ' + breakdownKeys.map(k => k.replace(/_/g, ' ')).join(', '));
        }
        if (!reasons.length && sourceType === 'legacy_match') {
            reasons.push('Need/Offer match based on published posts.');
        }
        if (!reasons.length) {
            const opps = Object.values(opportunitiesById || {}).filter(Boolean);
            const skills = new Set();
            opps.forEach(o => {
                (o.scope?.requiredSkills || o.normalized?.skills || []).slice(0, 3).forEach(s => skills.add(s));
            });
            if (skills.size) {
                reasons.push('Matched on ' + [...skills].slice(0, 4).join(', '));
            }
        }
        return reasons.length ? reasons.join(' ') : 'Compatible needs and offers based on your published opportunities.';
    }

    function userOwnsSourceOpportunity(match, currentUserId, sourceOpportunityId, opportunitiesById) {
        if (!currentUserId || !sourceOpportunityId) return false;
        const opp = opportunitiesById?.[sourceOpportunityId];
        if (opp && opp.creatorId === currentUserId) return true;
        const needOwner = (match.participants || []).find(p => p.role === 'need_owner' || p.role === 'consortium_lead');
        return needOwner?.userId === currentUserId;
    }

    /** Viewer-relative source (your post) vs matched (counterpart) opportunity ids. */
    function resolveViewerOpportunityIds(match, currentUserId, internalMatchType) {
        const payload = match?.payload || {};
        const result = { viewerId: null, counterpartId: null };
        if (!match || !currentUserId) return result;

        if (internalMatchType === 'one_way') {
            const needOwner = (match.participants || []).find(p => p.role === 'need_owner');
            const offerProvider = (match.participants || []).find(p => p.role === 'offer_provider');
            if (needOwner?.userId === currentUserId) {
                result.viewerId = payload.needOpportunityId || needOwner.opportunityId || null;
                result.counterpartId = payload.offerOpportunityId || offerProvider?.opportunityId || null;
            } else if (offerProvider?.userId === currentUserId) {
                result.viewerId = payload.offerOpportunityId || offerProvider.opportunityId || null;
                result.counterpartId = payload.needOpportunityId || needOwner?.opportunityId || null;
            }
            return result;
        }

        if (internalMatchType === 'two_way') {
            const sideA = payload.sideA || {};
            const sideB = payload.sideB || {};
            const isA = sideA.userId === currentUserId;
            const mySide = isA ? sideA : sideB;
            const theirSide = isA ? sideB : sideA;
            result.viewerId = mySide.needId || mySide.offerId || null;
            result.counterpartId = theirSide.needId || theirSide.offerId || null;
            return result;
        }

        if (internalMatchType === 'consortium') {
            const lead = (match.participants || []).find(p => p.role === 'consortium_lead');
            const member = (match.participants || []).find(p => p.userId === currentUserId && p.role !== 'consortium_lead');
            if (lead?.userId === currentUserId) {
                result.viewerId = payload.leadNeedId || lead.opportunityId || null;
            } else if (member) {
                const roleEntry = (payload.roles || []).find(r => r.userId === currentUserId);
                result.viewerId = member.opportunityId || roleEntry?.opportunityId || null;
                result.counterpartId = payload.leadNeedId || null;
            }
            return result;
        }

        if (internalMatchType === 'circular') {
            const links = payload.links || [];
            const outLink = links.find(l => (l.fromCreatorId || l.from) === currentUserId);
            const inLink = links.find(l => (l.toCreatorId || l.to) === currentUserId);
            result.viewerId = outLink?.offerId || inLink?.needId || null;
            result.counterpartId = inLink?.needId && inLink.needId !== result.viewerId
                ? inLink.needId
                : (outLink?.needId || null);
            return result;
        }

        const myPart = (match.participants || []).find(p => p.userId === currentUserId);
        if (myPart?.opportunityId) result.viewerId = myPart.opportunityId;
        return result;
    }

    function userCanInviteToApply(match, currentUserId, internalMatchType) {
        if (!currentUserId || !match) return false;
        if (internalMatchType === 'one_way') {
            const needOwner = (match.participants || []).find(p => p.role === 'need_owner');
            return needOwner?.userId === currentUserId;
        }
        if (internalMatchType === 'consortium') {
            const lead = (match.participants || []).find(p => p.role === 'consortium_lead');
            return lead?.userId === currentUserId;
        }
        return userOwnsSourceOpportunity(
            match,
            currentUserId,
            match.payload?.leadNeedId || match.payload?.needOpportunityId,
            null
        );
    }

    function applyViewerOpportunityContext(vm, match, currentUserId, opportunitiesById) {
        const { viewerId, counterpartId } = resolveViewerOpportunityIds(match, currentUserId, vm.internalMatchType);
        if (!viewerId && !counterpartId) return;

        if (viewerId) {
            vm.sourceOpportunityId = viewerId;
            vm.sourceOpportunity = opportunitiesById[viewerId] || vm.sourceOpportunity;
            if (vm.sourceOpportunity) {
                vm.sourceOpportunityType = vm.sourceOpportunity.intent || 'request';
                vm.sourceOpportunityTypeLabel = getOpportunityTypeLabel(vm.sourceOpportunity.intent);
            }
            vm.sourceOpportunityRoute = '/opportunities/' + viewerId;
        }

        const counterpartOpp = counterpartId ? opportunitiesById[counterpartId] : null;
        vm.counterpartOpportunityId = counterpartId;
        vm.counterpartOpportunity = counterpartOpp;
        vm.matchedOpportunities = counterpartOpp ? [counterpartOpp] : vm.matchedOpportunities;
        if (counterpartOpp) {
            vm.matchedSummary = getOpportunityTypeLabel(counterpartOpp.intent) + ': ' + (counterpartOpp.title || 'Matched post');
        }
    }

    /**
     * Resolve a 1:1 messages route for the first other participant on a match.
     * @param {Array<{userId?: string}>} participants
     * @param {string} [currentUserId]
     * @param {string|null|undefined} [preferredRoute]
     * @returns {string|null}
     */
    function resolveMatchMessageRoute(participants, currentUserId, preferredRoute) {
        const preferred = preferredRoute == null ? '' : String(preferredRoute);
        if (preferred.startsWith('/messages/')) {
            const partnerId = preferred.slice('/messages/'.length);
            if (partnerId) return '/messages/' + partnerId;
        }
        const other = (participants || []).find(p => p.userId && p.userId !== currentUserId);
        return other?.userId ? '/messages/' + other.userId : null;
    }

    function getAvailableActions(vm) {
        const actions = [];
        const push = (id, label, kind, route, enabled = true) => {
            actions.push({ id, label, kind, route: route || '', enabled: !!enabled });
        };

        push('view_details', 'View Details', 'primary', '/matches/' + vm.id, true);

        if (vm.messageRoute && !vm.isExpired) {
            push('message', 'Message', 'secondary', vm.messageRoute, true);
        }

        if (vm.dealId) {
            push('view_deal', 'View Deal', 'primary', '/deals/' + vm.dealId, true);
            return actions;
        }

        const expired = vm.isExpired;
        const status = vm.status;
        const canRespond = vm.canRespond;

        if (!expired && canRespond) {
            push('accept', 'Accept', 'primary', '/matches/' + vm.id, true);
            push('decline', 'Decline', 'secondary', '/matches/' + vm.id, true);
        }

        if (!expired && status !== 'declined' && status !== 'expired' && !vm.dealId && !vm.negotiationCancelled) {
            if (vm.hasActiveNegotiation) {
                push('negotiate', 'Continue Negotiation', 'secondary', '/matches/' + vm.id + '#negotiation', true);
            } else if (!vm.hasAgreedNegotiation) {
                push('negotiate', 'Start Negotiation', 'secondary', '/matches/' + vm.id + '#negotiation', true);
            }
        }

        if (vm.hasAgreedNegotiation && !vm.dealId && !expired) {
            push('create_deal_from_negotiation', 'Create Deal', 'primary', '/matches/' + vm.id + '#negotiation', true);
        }

        if (!expired && vm.canInviteToApply && !vm.hasActiveInvitation) {
            push('invite_apply', 'Invite to Apply', 'secondary', '/matches/' + vm.id, true);
        }

        if (status === 'confirmed' && !vm.dealId && !expired) {
            push('create_deal', 'Start Deal', 'primary', '/matches/' + vm.id, true);
        }

        if (vm.replacementEligible && !expired) {
            if (vm.pendingReplacementInvitation) {
                push('accept_replacement', 'Accept Replacement', 'primary', '/matches/' + vm.id + '#replacement', true);
            }
            if (vm.canSuggestReplacement) {
                push('suggest_replacement', 'Suggest Replacement', 'secondary', '/matches/' + vm.id + '#replacement', true);
            }
            if (vm.canManageReplacement) {
                push('manage_replacement', 'Manage Replacement', 'secondary', '/matches/' + vm.id + '#replacement', true);
            }
        }

        return actions;
    }

    function getNextBestAction(vm) {
        if (vm.isExpired) return 'This match has expired.';
        if (vm.dealId) return 'View your deal workspace to continue.';
        if (vm.pendingReplacementInvitation) return 'You have a replacement invitation — accept to join this match.';
        if (vm.activeReplacementRequest?.status === 'replacement_accepted' && vm.isMatchOwner) {
            return 'Replacement accepted — finalize to update participants.';
        }
        if (vm.replacementBadge === 'Replacement Suggested' && vm.isMatchOwner) {
            return 'Review replacement suggestions in the inbox below.';
        }
        if (vm.hasBlockedParticipant && vm.canManageReplacement) {
            return 'A participant dropped out — invite or approve a replacement.';
        }
        if (vm.hasBlockedParticipant && vm.canSuggestReplacement) {
            return 'Suggest a replacement provider for the owner to review.';
        }
        if (vm.hasAgreedNegotiation && !vm.dealId) return 'Terms agreed — create your deal workspace.';
        if (vm.hasActiveNegotiation) return 'Continue negotiation on terms.';
        if (vm.negotiationCancelled) return 'Negotiation was cancelled. You can start again when ready.';
        if (vm.canRespond) return 'Review this match and accept or decline.';
        if (vm.status === 'confirmed' && !vm.dealId) return 'All participants accepted — use Start Deal';
        if (vm.statusLabel === 'Waiting for Others') return 'Waiting for all participants to accept';
        if (vm.status === 'declined') return 'This match was declined';
        if (vm.status === 'pending') return 'Waiting for all participants to accept';
        return 'View match details';
    }

    function buildUnifiedMatchViewModel(match, context = {}) {
        const sourceType = detectSourceType(match);
        const internalMatchType = normalizeInternalMatchType(match, sourceType);
        const matchType = internalMatchType;
        const matchTypeLabel = getMatchTypeLabel(matchType);
        const score = match.matchScore != null ? Number(match.matchScore) : 0;
        const matchScorePercent = Math.min(100, Math.round(score * 100));
        const quality = getMatchQuality(score);
        const opportunityIds = extractOpportunityIdsFromMatch(match, sourceType, internalMatchType);
        const primaryOpportunityId = opportunityIds[0] || match.opportunityId || null;
        const sourceOpportunityId = sourceType === 'legacy_match'
            ? (match.opportunityId || primaryOpportunityId)
            : (internalMatchType === 'consortium'
                ? (match.payload?.leadNeedId || primaryOpportunityId)
                : (match.payload?.needOpportunityId || opportunityIds[0] || null));

        const status = safeStr(match.status, 'pending').toLowerCase();
        const participants = match.participants || [];
        const currentUserId = context.currentUserId || null;
        const ds = context.dataService || global.dataService;

        const vm = {
            id: match.id,
            sourceType,
            rawType: match.matchType || match.model || null,

            sourceOpportunityId,
            primaryOpportunityId,
            opportunityIds,

            sourceOpportunityType: null,
            sourceOpportunityTypeLabel: '',

            matchType,
            matchTypeLabel,
            internalMatchType,

            status,
            statusLabel: getStatusLabel(status, { match, currentUserId, dealId: match.dealId }),

            matchScore: score,
            matchScorePercent,
            matchQuality: quality.key,
            matchQualityLabel: quality.label,
            matchQualityClass: quality.className,

            participants,
            participantSummary: '',

            opportunities: [],
            sourceOpportunity: null,
            matchedOpportunities: [],

            reasons: [],
            scoreBreakdown: match.payload?.breakdown || match.criteria || {},

            invitationId: match.invitationId || null,
            negotiationId: match.negotiationId || null,
            replacementRequestId: match.replacementRequestId || null,
            applicationId: match.applicationId || null,
            dealId: match.dealId || null,
            contractId: match.contractId || null,

            hasInvitation: !!match.invitationId,
            hasActiveInvitation: false,
            invitationStatus: null,
            invitationStatusLabel: '',
            hasNegotiation: !!match.negotiationId,
            hasActiveNegotiation: false,
            hasAgreedNegotiation: false,
            negotiationCancelled: false,
            negotiationStatus: null,
            negotiationStatusLabel: '',
            replacementEligible: false,
            hasBlockedParticipant: false,
            replacementBadge: '',
            replacementRequests: [],
            activeReplacementRequest: null,
            pendingReplacementInvitation: null,
            isMatchOwner: false,
            canSuggestReplacement: false,
            canManageReplacement: false,
            hasApplication: !!match.applicationId,
            hasDeal: !!(match.dealId),
            dealSourceLabel: '',
            hasContract: !!match.contractId,

            availableActions: [],
            nextBestAction: '',

            createdAt: match.createdAt || null,
            updatedAt: match.updatedAt || null,
            expiresAt: match.expiresAt || null,

            isExpired: isMatchExpired(match, ds),
            canRespond: false,
            canInviteToApply: false,
            messageRoute: null,
            negotiationRoute: null,
            inviteRoute: null,
            sourceOpportunityRoute: sourceOpportunityId ? '/opportunities/' + sourceOpportunityId : null,

            cardTitle: matchTypeLabel + ' Match',
            cardBodyHtml: '',
            whySummary: '',
            matchedSummary: '',

            raw: match
        };

        vm.availableActions = getAvailableActions(vm);
        vm.nextBestAction = getNextBestAction(vm);
        return vm;
    }

    async function resolveDealId(match, ds) {
        if (match.dealId) return match.dealId;
        if (!ds || typeof ds.getDealByMatchId !== 'function') return null;
        try {
            const deal = await ds.getDealByMatchId(match.id);
            return deal?.id || null;
        } catch (e) {
            return null;
        }
    }

    async function enrichUnifiedMatchViewModel(vm, context = {}) {
        const ds = context.dataService || global.dataService;
        const currentUserId = context.currentUserId;
        const match = vm.raw;
        if (!ds || !match) return vm;

        const dealId = await resolveDealId(match, ds);
        if (dealId) {
            vm.dealId = dealId;
            vm.hasDeal = true;
            vm.statusLabel = getStatusLabel(vm.status, { match, currentUserId, dealId });
            if (typeof ds.getDealById === 'function') {
                const deal = await ds.getDealById(dealId);
                const dlc = global.dealLifecycle;
                if (deal && dlc && typeof dlc.getDealSourceLabel === 'function') {
                    vm.dealSourceLabel = dlc.getDealSourceLabel(deal);
                }
            }
        }

        const opportunitiesById = {};
        const opps = [];
        for (const oid of vm.opportunityIds) {
            const opp = await ds.getOpportunityById(oid);
            if (opp) {
                opportunitiesById[oid] = opp;
                opps.push(opp);
            }
        }
        vm.opportunities = opps;

        const payload = match.payload || {};
        const sourceOpp = vm.sourceOpportunityId ? opportunitiesById[vm.sourceOpportunityId] : opps[0];
        vm.sourceOpportunity = sourceOpp || null;
        if (sourceOpp) {
            vm.sourceOpportunityType = sourceOpp.intent || 'request';
            vm.sourceOpportunityTypeLabel = getOpportunityTypeLabel(sourceOpp.intent);
        }

        vm.matchedOpportunities = opps.filter(o => o.id !== vm.sourceOpportunityId);
        vm.reasons = [buildReasonsText(match, vm.sourceType, payload, opportunitiesById)];
        vm.whySummary = vm.reasons[0] || '';

        const myPart = (match.participants || []).find(p => p.userId === currentUserId);
        const myStatus = myPart?.participantStatus || 'pending';
        const isPending = vm.status === 'pending';
        vm.canRespond = !vm.isExpired && isPending && myStatus === 'pending' && !!currentUserId
            && (match.participants || []).some(p => p.userId === currentUserId);

        applyViewerOpportunityContext(vm, match, currentUserId, opportunitiesById);

        vm.canInviteToApply = !vm.isExpired && vm.status !== 'declined' && vm.status !== 'expired'
            && userCanInviteToApply(match, currentUserId, vm.internalMatchType);

        vm.messageRoute = resolveMatchMessageRoute(match.participants, currentUserId);
        if (vm.messageRoute) {
            vm.negotiationRoute = vm.messageRoute;
        }

        if (vm.sourceType === 'legacy_match') {
            await enrichLegacyCard(vm, match, currentUserId, ds, opportunitiesById);
        } else {
            await enrichPostMatchCard(vm, match, currentUserId, ds, opportunitiesById, payload);
        }

        vm.participantSummary = buildParticipantSummary(vm, match, currentUserId, ds);

        if (ds && typeof ds.getOpportunityInvitationById === 'function') {
            let invitation = null;
            if (vm.invitationId) {
                invitation = await ds.getOpportunityInvitationById(vm.invitationId);
            } else if (typeof ds.getInvitationsByMatchId === 'function') {
                const byMatch = await ds.getInvitationsByMatchId(vm.id);
                invitation = byMatch.length ? byMatch.sort((a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                )[0] : null;
            }
            if (invitation) {
                vm.invitationId = invitation.id;
                vm.invitationStatus = invitation.status;
                vm.hasInvitation = true;
                const invActive = ['sent', 'invitation_sent'].includes((invitation.status || '').toLowerCase());
                vm.hasActiveInvitation = invActive;
                if (invitation.applicationId) {
                    vm.applicationId = invitation.applicationId;
                    vm.hasApplication = true;
                }
                const tracking = global.opportunityInvitationTracking;
                if (tracking && typeof tracking.getInvitationLifecycleLabel === 'function') {
                    vm.invitationStatusLabel = tracking.getInvitationLifecycleLabel(invitation, {
                        applicationId: vm.applicationId,
                        dealId: vm.dealId
                    });
                } else {
                    vm.invitationStatusLabel = invActive ? 'Invitation Sent' : 'Application Submitted';
                }
                if (invActive && userOwnsSourceOpportunity(match, currentUserId, vm.sourceOpportunityId, opportunitiesById)) {
                    vm.canInviteToApply = false;
                }
                const isApplyInvite = (invitation.invitationKind || 'apply') !== 'replacement';
                const rlc = global.replacementLifecycle;
                let companyId = null;
                if (typeof ds.getUserById === 'function') {
                    const u = await ds.getUserById(currentUserId);
                    companyId = u?.companyId || null;
                }
                const isInvitee = rlc?.invitationAcceptsActor
                    ? rlc.invitationAcceptsActor(invitation, currentUserId, companyId)
                    : invitation.invitedUserId === currentUserId;
                const isOwnerInviter = userOwnsSourceOpportunity(match, currentUserId, vm.sourceOpportunityId, opportunitiesById)
                    || invitation.invitedByUserId === currentUserId;
                vm.canDeclineInvitation = invActive && isApplyInvite && isInvitee;
                vm.canCancelInvitation = invActive && isApplyInvite && isOwnerInviter;
            }
        }

        if (ds && typeof ds.getNegotiationById === 'function') {
            let negotiation = null;
            if (vm.negotiationId) {
                negotiation = await ds.getNegotiationById(vm.negotiationId);
            } else if (typeof ds.getNegotiationsByMatchId === 'function') {
                const byMatch = await ds.getNegotiationsByMatchId(vm.id);
                negotiation = byMatch.length
                    ? byMatch.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0]
                    : null;
            }
            if (negotiation) {
                vm.negotiationId = negotiation.id;
                vm.negotiationStatus = negotiation.status;
                vm.hasNegotiation = true;
                const nlc = global.negotiationLifecycle;
                const status = (negotiation.status || '').toLowerCase();
                vm.hasActiveNegotiation = nlc
                    ? nlc.isActiveNegotiation(negotiation)
                    : ['open', 'counter_offered'].includes(status);
                vm.hasAgreedNegotiation = status === 'agreed';
                vm.negotiationCancelled = status === 'cancelled';
                vm.negotiationStatusLabel = nlc
                    ? nlc.getNegotiationStatusLabel(status)
                    : (vm.hasAgreedNegotiation ? 'Terms Agreed' : 'Negotiation Open');
                if (vm.hasActiveNegotiation || vm.hasAgreedNegotiation) {
                    vm.negotiationRoute = '/matches/' + vm.id + '#negotiation';
                }
            }
        }

        const rlc = global.replacementLifecycle;
        const eligibleType = rlc
            ? rlc.isReplacementEligibleMatchType(vm.matchType)
            : (vm.matchType === 'consortium' || vm.matchType === 'circular');
        vm.replacementEligible = eligibleType;

        if (eligibleType && ds) {
            const blockedSlots = typeof ds.getBlockedSlotsForPostMatch === 'function'
                ? ds.getBlockedSlotsForPostMatch(match)
                : [];
            vm.hasBlockedParticipant = blockedSlots.length > 0;

            if (typeof ds.isUserOwnerOfPostMatch === 'function') {
                vm.isMatchOwner = await ds.isUserOwnerOfPostMatch(match, currentUserId);
            } else {
                vm.isMatchOwner = userOwnsSourceOpportunity(match, currentUserId, vm.sourceOpportunityId, opportunitiesById);
            }

            const isParticipant = (match.participants || []).some(p => p.userId === currentUserId);
            vm.canManageReplacement = vm.isMatchOwner && !vm.isExpired;
            vm.canSuggestReplacement = isParticipant && !vm.isMatchOwner && vm.hasBlockedParticipant && !vm.isExpired;

            if (typeof ds.getReplacementRequestsByMatchId === 'function') {
                const requests = await ds.getReplacementRequestsByMatchId(vm.id);
                vm.replacementRequests = requests;
                const terminal = new Set(['completed', 'superseded', 'rejected', 'cancelled']);
                const active = requests
                    .filter(r => !terminal.has((r.status || '').toLowerCase()))
                    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                vm.activeReplacementRequest = active[0] || null;
                if (vm.activeReplacementRequest && rlc) {
                    vm.replacementBadge = rlc.getReplacementRequestStatusLabel(vm.activeReplacementRequest.status);
                } else if (vm.hasBlockedParticipant) {
                    vm.replacementBadge = 'Blocked';
                }
            }

            if (typeof ds.getInvitationsByMatchId === 'function' && currentUserId) {
                const byMatch = await ds.getInvitationsByMatchId(vm.id);
                const replKind = (typeof CONFIG !== 'undefined' && CONFIG.INVITATION_KIND)
                    ? CONFIG.INVITATION_KIND.REPLACEMENT
                    : 'replacement';
                let companyId = null;
                if (typeof ds.getUserById === 'function') {
                    const u = await ds.getUserById(currentUserId);
                    companyId = u?.companyId || null;
                }
                vm.pendingReplacementInvitation = byMatch.find(inv => {
                    if ((inv.invitationKind || '') !== replKind) return false;
                    const st = (inv.status || '').toLowerCase();
                    if (!['sent', 'invitation_sent'].includes(st)) return false;
                    return rlc
                        ? rlc.invitationAcceptsActor(inv, currentUserId, companyId)
                        : inv.invitedUserId === currentUserId;
                }) || null;
            }
        }

        vm.availableActions = getAvailableActions(vm);
        vm.nextBestAction = getNextBestAction(vm);
        vm.statusLabel = getStatusLabel(vm.status, { match, currentUserId, dealId: vm.dealId });

        if (context.adminMode) {
            vm.isAdminView = true;
            vm.isPreviewOnly = !!match.previewOnly;
            const actions = [];
            if (!match.previewOnly && vm.id && !String(vm.id).startsWith('preview-')) {
                const matchRoute = (global.CONFIG && global.CONFIG.ROUTES && global.CONFIG.ROUTES.MATCH_DETAIL)
                    ? global.CONFIG.ROUTES.MATCH_DETAIL.replace(':id', vm.id)
                    : '/matches/' + vm.id;
                actions.push({ id: 'view_details', label: 'View match', route: matchRoute, kind: 'primary', enabled: true });
            }
            if (vm.sourceOpportunityId) {
                actions.push({
                    id: 'view_source_opp',
                    label: 'View opportunity',
                    route: '/opportunities/' + vm.sourceOpportunityId,
                    kind: 'secondary',
                    enabled: true
                });
            }
            vm.availableActions = actions;
            vm.nextBestAction = match.previewOnly
                ? 'Preview suggestion — save matches on the source opportunity to persist post_matches.'
                : (vm.nextBestAction || 'Open match detail for lifecycle context.');
            if (match.previewOnly) {
                vm.statusLabel = 'Suggested (preview)';
            }
        }

        return vm;
    }

    function buildParticipantSummary(vm, match, currentUserId) {
        const names = [];
        const parts = match.participants || [];
        const unique = [];
        const seen = new Set();
        parts.forEach(p => {
            if (p.userId && !seen.has(p.userId)) {
                seen.add(p.userId);
                unique.push(p);
            }
        });
        if (!unique.length) return vm.matchedSummary || '';
        return unique.length + ' participant' + (unique.length === 1 ? '' : 's');
    }

    function buildCardBlocks(rows) {
        return rows.map(([kicker, html]) =>
            '<div class="match-card-block"><p class="match-card-kicker">' + escapeHtml(kicker) + '</p><p class="match-card-line">' + html + '</p></div>'
        ).join('');
    }

    /**
     * Shared rich match card markup (user /matches and admin matching center).
     * @param {object} vm - enriched unified match view model
     * @param {{ extraClass?: string }} [options]
     */
    function renderUnifiedMatchCardHtml(vm, options) {
        if (!vm) return '';
        const opts = options || {};
        const extraClass = opts.extraClass ? ' ' + opts.extraClass : '';
        const filterKey = vm.filterKey || vm.internalMatchType || vm.matchType || '';
        const actionsHtml = (vm.availableActions || []).map(action => {
            const cls = action.kind === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
            const disabled = action.enabled === false || vm.isExpired;
            if (['accept', 'decline', 'invite_apply', 'negotiate', 'create_deal', 'create_deal_from_negotiation'].includes(action.id)) {
                return '<button type="button" class="' + cls + '" data-action="' + escapeHtml(action.id) + '" data-match-id="' + escapeHtml(vm.id) + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(action.label) + '</button>';
            }
            return '<a href="#" data-route="' + escapeHtml(action.route || '#') + '" class="' + cls + (disabled ? ' opacity-50 pointer-events-none' : '') + '">' + escapeHtml(action.label) + '</a>';
        }).join(' ');

        const typeLine = vm.sourceOpportunityTypeLabel
            ? '<p class="match-card-unified__type">' + escapeHtml(vm.sourceOpportunityTypeLabel) + '</p>'
            : '';
        const previewRibbon = vm.isPreviewOnly
            ? '<p class="match-card-unified__ribbon"><span class="badge badge--info">Preview suggestion</span></p>'
            : '';

        return '<article class="card match-card match-card-unified' + extraClass + '" data-match-id="' + escapeHtml(vm.id) + '" data-match-type="' + escapeHtml(filterKey) + '">'
            + '<header class="match-card-unified__header">'
            + '<div>'
            + '<h3 class="match-card-unified__title">' + escapeHtml(vm.cardTitle || vm.matchTypeLabel + ' Match') + '</h3>'
            + typeLine
            + '</div>'
            + '<span class="badge badge-match ' + escapeHtml(vm.matchQualityClass || 'badge--neutral') + '">'
            + escapeHtml(vm.matchQualityLabel || 'Match') + ' · ' + (vm.matchScorePercent != null ? vm.matchScorePercent : 0) + '%</span>'
            + '</header>'
            + '<div class="match-card-unified__body">'
            + (vm.cardBodyHtml || '')
            + '<div class="match-card-block match-card-block--why">'
            + '<p class="match-card-kicker">Why this match?</p>'
            + '<p class="match-card-line match-card-line--muted">' + escapeHtml(vm.whySummary || '') + '</p>'
            + '</div>'
            + (vm.replacementBadge ? '<p class="match-card-unified__ribbon"><span class="badge badge--warning">' + escapeHtml(vm.replacementBadge) + '</span></p>' : '')
            + previewRibbon
            + '<p class="match-card-unified__status"><span class="match-card-kicker">Status</span> <span class="badge badge--neutral">' + escapeHtml(vm.statusLabel || '') + '</span></p>'
            + '<p class="match-card-unified__next"><span class="match-card-kicker">Next</span> ' + escapeHtml(vm.nextBestAction || '') + '</p>'
            + '</div>'
            + '<footer class="match-card-unified__footer">' + actionsHtml + '</footer>'
            + '</article>';
    }

    async function userLabel(ds, userId) {
        const u = await ds.getUserOrCompanyById(userId);
        return u?.profile?.name || u?.profile?.companyName || userId || 'Participant';
    }

    async function enrichLegacyCard(vm, match, currentUserId, ds, opportunitiesById) {
        const opp = opportunitiesById[match.opportunityId] || vm.sourceOpportunity;
        const providerId = match.candidateId || match.userId;
        const isNeedOwner = opp && opp.creatorId === currentUserId;
        let providerName = '';
        if (providerId) {
            const provider = await ds.getUserOrCompanyById(providerId);
            providerName = provider?.profile?.name || provider?.profile?.companyName || providerId;
        }
        const needTitle = opp?.title || 'Opportunity';
        vm.cardTitle = 'Need/Offer Match';
        vm.matchedSummary = isNeedOwner
            ? ('Offer: ' + (providerName || 'Matched provider'))
            : ('Matched opportunity: ' + needTitle);
        vm.cardBodyHtml = buildCardBlocks([
            ['Source Opportunity', '<span class="match-card-intent">' + escapeHtml(vm.sourceOpportunityTypeLabel || 'Need') + ':</span> ' + escapeHtml(needTitle)],
            ['Matched Opportunity', escapeHtml(isNeedOwner ? (providerName || 'Provider') : 'Matched post')]
        ]);

        if (isNeedOwner && providerId) {
            vm.inviteRoute = '/opportunities/' + opp.id;
            vm.negotiationRoute = '/messages/' + providerId;
        } else if (opp) {
            vm.negotiationRoute = '/opportunities/' + opp.id;
        }
    }

    async function enrichPostMatchCard(vm, match, currentUserId, ds, opportunitiesById, payload) {
        const type = vm.internalMatchType;

        if (type === 'one_way') {
            const needOpp = opportunitiesById[payload.needOpportunityId];
            const offerOpp = opportunitiesById[payload.offerOpportunityId];
            const { viewerId, counterpartId } = resolveViewerOpportunityIds(match, currentUserId, type);
            const viewerOpp = viewerId ? opportunitiesById[viewerId] : (needOpp || offerOpp);
            const counterpartOpp = counterpartId
                ? opportunitiesById[counterpartId]
                : (viewerId === payload.needOpportunityId ? offerOpp : needOpp);
            const viewerLabel = getOpportunityTypeLabel(viewerOpp?.intent);
            const counterpartLabel = getOpportunityTypeLabel(counterpartOpp?.intent);
            vm.cardTitle = 'Need/Offer Match';
            vm.matchedSummary = counterpartLabel + ': ' + (counterpartOpp?.title || 'Matched post');
            vm.cardBodyHtml = buildCardBlocks([
                ['Source Opportunity', '<span class="match-card-intent">' + escapeHtml(viewerLabel) + ':</span> ' + escapeHtml(viewerOpp?.title || '—')],
                ['Matched Opportunity', '<span class="match-card-intent">' + escapeHtml(counterpartLabel) + ':</span> ' + escapeHtml(counterpartOpp?.title || '—')]
            ]);
            const needOwner = (match.participants || []).find(p => p.role === 'need_owner');
            if (needOwner?.userId === currentUserId && needOpp?.id) vm.inviteRoute = '/opportunities/' + needOpp.id;
            return;
        }

        if (type === 'two_way') {
            const sideA = payload.sideA || {};
            const sideB = payload.sideB || {};
            const isA = sideA.userId === currentUserId;
            const myNeed = opportunitiesById[isA ? sideA.needId : sideB.needId];
            const myOffer = opportunitiesById[isA ? sideA.offerId : sideB.offerId];
            const theirNeed = opportunitiesById[isA ? sideB.needId : sideA.needId];
            const theirOffer = opportunitiesById[isA ? sideB.offerId : sideA.offerId];
            vm.cardTitle = 'Barter Match';
            vm.matchedSummary = 'Exchange with matched party';
            vm.cardBodyHtml = buildCardBlocks([
                ['You need', escapeHtml(myNeed?.title || '—')],
                ['You offer', escapeHtml(myOffer?.title || '—')],
                ['Matched party needs', escapeHtml(theirNeed?.title || '—')],
                ['Matched party offers', escapeHtml(theirOffer?.title || '—')]
            ]);
            const otherId = isA ? sideB.userId : sideA.userId;
            if (otherId) vm.negotiationRoute = '/messages/' + otherId;
            return;
        }

        if (type === 'consortium') {
            const leadOpp = opportunitiesById[payload.leadNeedId];
            const roles = payload.roles || [];
            const contributorLines = await Promise.all(roles.map(async (r) => {
                const u = await ds.getUserOrCompanyById(r.userId);
                const name = u?.profile?.name || u?.profile?.companyName || r.userId;
                const roleLabel = typeof formatParticipantRole === 'function'
                    ? formatParticipantRole(r.role, 'Contributor')
                    : (r.role || 'Contributor');
                return escapeHtml(roleLabel) + ': ' + escapeHtml(name);
            }));
            vm.cardTitle = 'Consortium Match';
            vm.matchedSummary = contributorLines.slice(0, 3).join(' · ') || 'Suggested contributors';
            vm.cardBodyHtml = buildCardBlocks([
                ['Main Opportunity', '<span class="match-card-intent">Need:</span> ' + escapeHtml(leadOpp?.title || '—')],
                ['Suggested contributors', contributorLines.join('<br>') || '—']
            ]);
            if (leadOpp?.id) vm.inviteRoute = '/opportunities/' + leadOpp.id;
            return;
        }

        if (type === 'circular') {
            const cycle = payload.cycle || [];
            const links = payload.links || [];
            const chainParts = [];
            for (let i = 0; i < cycle.length; i++) {
                const from = cycle[i];
                const to = cycle[(i + 1) % cycle.length];
                const link = links.find(l => (l.fromCreatorId || l.from) === from && (l.toCreatorId || l.to) === to);
                const fromName = from === currentUserId ? 'You' : await userLabel(ds, from);
                const toName = to === currentUserId ? 'You' : await userLabel(ds, to);
                const needOpp = link?.needId ? opportunitiesById[link.needId] : null;
                chainParts.push(escapeHtml(fromName) + ' needs from ' + escapeHtml(toName)
                    + (needOpp?.title ? ' (' + escapeHtml(needOpp.title) + ')' : ''));
            }
            vm.cardTitle = 'Circular Exchange Match';
            vm.matchedSummary = 'Value exchange across ' + cycle.length + ' parties';
            vm.cardBodyHtml = buildCardBlocks([
                ['Value exchange', chainParts.join('<br>') || '—']
            ]);
        }
    }

    function isLegacyMatchingEnabled() {
        return !!(CONFIG && CONFIG.MATCHING && CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED === true);
    }

    async function buildUnifiedMatchViewModels(matches, context = {}) {
        if (!Array.isArray(matches)) return [];
        const source = isLegacyMatchingEnabled()
            ? matches
            : matches.filter(m => detectSourceType(m) !== 'legacy_match');
        const out = [];
        for (const m of source) {
            const vm = buildUnifiedMatchViewModel(m, context);
            out.push(await enrichUnifiedMatchViewModel(vm, context));
        }
        return out;
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const api = {
        getOpportunityTypeLabel,
        getMatchTypeLabel,
        getStatusLabel,
        getMatchQuality,
        getAvailableActions,
        resolveMatchMessageRoute,
        getNextBestAction,
        detectSourceType,
        resolveViewerOpportunityIds,
        userCanInviteToApply,
        applyViewerOpportunityContext,
        buildUnifiedMatchViewModel,
        enrichUnifiedMatchViewModel,
        buildUnifiedMatchViewModels,
        renderUnifiedMatchCardHtml,
        escapeHtml,
        buildCardBlocks
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.unifiedMatchViewModel = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
