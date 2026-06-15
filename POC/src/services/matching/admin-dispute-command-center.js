/**
 * Admin Dispute Command Center — analytics, queues, enriched list rows (Phase 4).
 */
(function (global) {
    const ACTIVE = ['raised', 'under_review', 'mediation'];
    const TERMINAL = ['resolved', 'escalated', 'withdrawn'];

    function isActiveStatus(status) {
        return ACTIVE.includes((status || '').toLowerCase());
    }

    function isTerminalStatus(status) {
        return TERMINAL.includes((status || '').toLowerCase());
    }

    function getThreadCount(dispute) {
        return (dispute && dispute.thread) ? dispute.thread.length : 0;
    }

    function getLastActivityAt(dispute) {
        if (!dispute) return null;
        const thread = dispute.thread || [];
        const lastMsg = thread[thread.length - 1];
        return lastMsg?.at || dispute.updatedAt || dispute.raisedAt || dispute.createdAt || null;
    }

    function getSlaHours(opts) {
        if (opts && opts.slaHours != null) return Number(opts.slaHours);
        const cfg = global.CONFIG?.MATCHING?.DISPUTE?.SLA_HOURS;
        return (typeof cfg === 'number' && cfg > 0) ? cfg : 48;
    }

    function getDisputeAgeHours(dispute, nowMs) {
        const start = new Date(dispute?.raisedAt || dispute?.createdAt || 0).getTime();
        if (!start || Number.isNaN(start)) return 0;
        return (nowMs - start) / 3600000;
    }

    function isSlaBreached(dispute, opts) {
        if (!dispute || !isActiveStatus(dispute.status)) return false;
        const slaHours = getSlaHours(opts);
        const nowMs = (opts && opts.nowMs != null) ? opts.nowMs : Date.now();
        return getDisputeAgeHours(dispute, nowMs) > slaHours;
    }

    /**
     * @param {object[]} disputes
     * @param {object} [opts]
     */
    function buildAdminDisputeAnalytics(disputes, opts) {
        const list = disputes || [];
        const slaOpts = opts || {};
        const active = list.filter(d => isActiveStatus(d.status));
        const statusCount = (s) => list.filter(d => (d.status || '').toLowerCase() === s).length;

        const resolved = list.filter(d => (d.status || '').toLowerCase() === 'resolved');
        const withOutcome = resolved.filter(d => d.resolution?.outcome);
        const avgDaysToResolve = (() => {
            const samples = withOutcome
                .map(d => {
                    const start = new Date(d.raisedAt || d.createdAt).getTime();
                    const end = new Date(d.resolution.resolvedAt || d.updatedAt).getTime();
                    if (!start || !end || end < start) return null;
                    return (end - start) / 86400000;
                })
                .filter(v => v != null);
            if (!samples.length) return null;
            return Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10;
        })();

        return {
            total: list.length,
            active: active.length,
            raised: statusCount('raised'),
            underReview: statusCount('under_review'),
            mediation: statusCount('mediation'),
            resolved: statusCount('resolved'),
            escalated: statusCount('escalated'),
            withdrawn: statusCount('withdrawn'),
            needsReview: statusCount('raised'),
            slaBreached: active.filter(d => isSlaBreached(d, slaOpts)).length,
            avgDaysToResolve,
            resolutionRate: list.length
                ? Math.round((statusCount('resolved') / list.length) * 100) + '%'
                : '—'
        };
    }

    /**
     * @param {object} dispute
     * @param {object} context — { opportunityTitle, raisedByName, negotiationStatus, slaHours }
     */
    function enrichDisputeRow(dispute, context) {
        const ctx = context || {};
        const status = (dispute.status || '').toLowerCase();
        const slaOpts = { slaHours: ctx.slaHours };
        const ageHours = Math.round(getDisputeAgeHours(dispute, Date.now()) * 10) / 10;
        return {
            id: dispute.id,
            negotiationId: dispute.negotiationId,
            opportunityId: dispute.opportunityId,
            opportunityTitle: ctx.opportunityTitle || dispute.opportunityId || '—',
            raisedByName: ctx.raisedByName || dispute.raisedBy || '—',
            category: dispute.category,
            status: dispute.status,
            description: dispute.description || '',
            raisedAt: dispute.raisedAt,
            updatedAt: dispute.updatedAt,
            lastActivityAt: getLastActivityAt(dispute),
            threadCount: getThreadCount(dispute),
            negotiationStatus: ctx.negotiationStatus || null,
            resolutionOutcome: dispute.resolution?.outcome || null,
            ageHours,
            flags: {
                active: isActiveStatus(status),
                needsReview: status === 'raised',
                inMediation: status === 'mediation',
                terminal: isTerminalStatus(status),
                slaBreached: isSlaBreached(dispute, slaOpts)
            }
        };
    }

    function buildAttentionQueues(enrichedRows) {
        const rows = enrichedRows || [];
        return {
            active: rows.filter(r => r.flags?.active),
            needsReview: rows.filter(r => r.flags?.needsReview),
            mediation: rows.filter(r => r.flags?.inMediation),
            slaBreached: rows.filter(r => r.flags?.slaBreached),
            terminal: rows.filter(r => r.flags?.terminal)
        };
    }

    const api = {
        isActiveStatus,
        isTerminalStatus,
        isSlaBreached,
        getDisputeAgeHours,
        getSlaHours,
        buildAdminDisputeAnalytics,
        enrichDisputeRow,
        buildAttentionQueues,
        getLastActivityAt
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    global.AdminDisputeCommandCenter = api;
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
