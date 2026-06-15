/**
 * Admin Negotiation Command Center — analytics, queues, enriched list rows.
 */
(function (global) {
    const ACTIVE = ['open', 'counter_offered'];
    const MS_DAY = 86400000;

    function getLastActivityAt(negotiation) {
        if (!negotiation) return null;
        const rounds = negotiation.rounds || [];
        const lastRound = rounds[rounds.length - 1];
        const thread = negotiation.discussionThread || [];
        const lastMsg = thread[thread.length - 1];
        const candidates = [
            negotiation.updatedAt,
            lastRound && lastRound.at,
            lastMsg && lastMsg.at
        ].filter(Boolean);
        if (!candidates.length) return negotiation.createdAt || null;
        return candidates.sort().pop();
    }

    function daysSince(iso) {
        if (!iso) return null;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return null;
        return (Date.now() - t) / MS_DAY;
    }

    function hoursUntil(iso) {
        if (!iso) return null;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return null;
        return (t - Date.now()) / (1000 * 60 * 60);
    }

    function isActiveStatus(status) {
        return ACTIVE.includes((status || '').toLowerCase());
    }

    function isStalled(negotiation, stallDays) {
        if (!isActiveStatus(negotiation.status)) return false;
        const days = daysSince(getLastActivityAt(negotiation));
        return days != null && days >= stallDays;
    }

    function isExpiringSoon(negotiation, withinHours) {
        if (!isActiveStatus(negotiation.status) || !negotiation.expiresAt) return false;
        const h = hoursUntil(negotiation.expiresAt);
        return h != null && h >= 0 && h <= withinHours;
    }

    function isAgreedNoDeal(negotiation, deals) {
        if ((negotiation.status || '').toLowerCase() !== 'agreed') return false;
        return !(deals || []).some(d => d.negotiationId === negotiation.id);
    }

    function getEffectiveValue(negotiation) {
        const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
        const nt = g.negotiationTerms;
        const terms = nt && typeof nt.getEffectiveTerms === 'function'
            ? nt.getEffectiveTerms(negotiation)
            : (negotiation.currentTerms || negotiation.agreedTerms || negotiation.initialTerms || {});
        if (terms.value != null) return terms.value;
        if (terms.equityPercentage != null) return terms.equityPercentage + '% equity';
        if (terms.profitSplit) return terms.profitSplit + ' split';
        return null;
    }

    /**
     * @param {object[]} negotiations
     * @param {object[]} deals
     * @param {object} [options]
     */
    function buildAdminNegotiationAnalytics(negotiations, deals, options) {
        const opts = options || {};
        const stallDays = opts.stallDays != null ? opts.stallDays : 5;
        const expiringHours = opts.expiringHours != null ? opts.expiringHours : 48;
        const list = negotiations || [];
        const dealList = deals || [];

        const active = list.filter(n => isActiveStatus(n.status));
        const agreed = list.filter(n => (n.status || '').toLowerCase() === 'agreed');
        const stalled = list.filter(n => isStalled(n, stallDays));
        const expiring = list.filter(n => isExpiringSoon(n, expiringHours));
        const agreedNoDeal = list.filter(n => isAgreedNoDeal(n, dealList));
        const expired = list.filter(n => (n.status || '').toLowerCase() === 'expired');
        const cancelled = list.filter(n => (n.status || '').toLowerCase() === 'cancelled');

        const agreedWithDates = agreed.filter(n => n.agreedAt || n.updatedAt);
        let avgDaysToAgree = null;
        if (agreedWithDates.length) {
            const sum = agreedWithDates.reduce((acc, n) => {
                const start = new Date(n.createdAt).getTime();
                const end = new Date(n.agreedAt || n.updatedAt).getTime();
                if (Number.isNaN(start) || Number.isNaN(end)) return acc;
                return acc + (end - start) / MS_DAY;
            }, 0);
            avgDaysToAgree = Math.round((sum / agreedWithDates.length) * 10) / 10;
        }

        let avgRoundsToAgree = null;
        const agreedWithRounds = agreed.filter(n => (n.rounds || []).length > 0);
        if (agreedWithRounds.length) {
            const sumR = agreedWithRounds.reduce((acc, n) => acc + (n.rounds || []).length, 0);
            avgRoundsToAgree = Math.round((sumR / agreedWithRounds.length) * 10) / 10;
        }

        const dealsFromNegotiations = dealList.filter(d => d.negotiationId).length;
        const conversionRate = agreed.length
            ? Math.round((dealsFromNegotiations / agreed.length) * 100) + '%'
            : '—';

        const disputeList = opts.disputes || [];
        const activeDisputeStatuses = ['raised', 'under_review', 'mediation'];
        const activeDisputes = disputeList.filter(d =>
            activeDisputeStatuses.includes((d.status || '').toLowerCase())
        ).length;
        const disputesUnderReview = disputeList.filter(d => {
            const s = (d.status || '').toLowerCase();
            return s === 'under_review' || s === 'mediation';
        }).length;

        return {
            total: list.length,
            active: active.length,
            open: list.filter(n => (n.status || '').toLowerCase() === 'open').length,
            counterOffered: list.filter(n => (n.status || '').toLowerCase() === 'counter_offered').length,
            agreed: agreed.length,
            stalled: stalled.length,
            expiringSoon: expiring.length,
            agreedNoDeal: agreedNoDeal.length,
            expired: expired.length,
            cancelled: cancelled.length,
            dealsFromNegotiations,
            conversionRate,
            avgDaysToAgree,
            avgRoundsToAgree,
            activeDisputes,
            disputesUnderReview
        };
    }

    /**
     * @param {object} negotiation
     * @param {object} context — { opportunityTitle, partyNames, dealId, exchangeMode }
     */
    function enrichNegotiationRow(negotiation, context) {
        const ctx = context || {};
        const lastAt = getLastActivityAt(negotiation);
        const stallDays = (global.CONFIG && global.CONFIG.MATCHING && global.CONFIG.MATCHING.NEGOTIATION)
            ? (global.CONFIG.MATCHING.NEGOTIATION.STALL_DAYS || 5)
            : 5;
        return {
            id: negotiation.id,
            status: negotiation.status,
            opportunityId: negotiation.opportunityId,
            matchId: negotiation.matchId,
            applicationId: negotiation.applicationId,
            opportunityTitle: ctx.opportunityTitle || negotiation.opportunityId || '—',
            partySummary: ctx.partySummary || '—',
            exchangeMode: ctx.exchangeMode || '—',
            valueDisplay: getEffectiveValue(negotiation),
            roundsCount: (negotiation.rounds || []).length,
            messagesCount: (negotiation.discussionThread || []).length,
            lastActivityAt: lastAt,
            expiresAt: negotiation.expiresAt || null,
            createdAt: negotiation.createdAt,
            updatedAt: negotiation.updatedAt,
            dealId: ctx.dealId || null,
            flags: {
                stalled: isStalled(negotiation, stallDays),
                expiringSoon: isExpiringSoon(negotiation, 48),
                agreedNoDeal: ctx.agreedNoDeal === true,
                hasDispute: ctx.hasActiveDispute === true || !!negotiation.disputeId
            }
        };
    }

    function buildAttentionQueues(enrichedRows) {
        const rows = enrichedRows || [];
        return {
            stalled: rows.filter(r => r.flags && r.flags.stalled),
            expiring: rows.filter(r => r.flags && r.flags.expiringSoon),
            agreedNoDeal: rows.filter(r => r.flags && r.flags.agreedNoDeal),
            active: rows.filter(r => isActiveStatus(r.status))
        };
    }

    const api = {
        getLastActivityAt,
        isStalled,
        isExpiringSoon,
        isAgreedNoDeal,
        buildAdminNegotiationAnalytics,
        enrichNegotiationRow,
        buildAttentionQueues,
        isActiveStatus
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (global) {
        global.AdminNegotiationCommandCenter = api;
    }
})(typeof window !== 'undefined' ? window : global);
