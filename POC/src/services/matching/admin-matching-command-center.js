/**
 * Admin Matching Command Center helpers (Phase 8).
 * Preview run summaries, selectable rows, lifecycle queues — no UI.
 */
(function (global) {
    const MATCH_TYPE_FILTER_KEYS = {
        'One Way': 'one-way',
        'Barter': 'two-way',
        'Consortium': 'consortium',
        'Circular': 'circular'
    };

    function getAdminMatchingMaxCircularRows() {
        const n = CONFIG && CONFIG.MATCHING && CONFIG.MATCHING.ADMIN_MATCHING_MAX_CIRCULAR_ROWS;
        return (typeof n === 'number' && n > 0) ? n : 100;
    }

    function sortCircularCycles(cycles) {
        return (cycles || []).slice().sort((a, b) => {
            const sa = a && a.matchScore != null ? a.matchScore : 0;
            const sb = b && b.matchScore != null ? b.matchScore : 0;
            return sb - sa;
        });
    }

    /**
     * Cap circular cycles for display (summary counts use full report.circularExchanges).
     * @returns {{ cycles: object[], total: number, displayed: number, hidden: number, maxRows: number }}
     */
    function capCircularCyclesForDisplay(cycles, maxRows) {
        const sorted = sortCircularCycles(cycles);
        const total = sorted.length;
        const limit = maxRows != null ? maxRows : getAdminMatchingMaxCircularRows();
        const displayed = Math.min(total, limit);
        return {
            cycles: sorted.slice(0, displayed),
            total,
            displayed,
            hidden: Math.max(0, total - displayed),
            maxRows: limit
        };
    }

    function getCircularDisplayMeta(report) {
        const total = (report && report.circularExchanges != null)
            ? report.circularExchanges
            : ((report && report.circularCycles) ? report.circularCycles.length : 0);
        const cap = capCircularCyclesForDisplay((report && report.circularCycles) || []);
        return {
            total,
            displayed: cap.displayed,
            hidden: cap.hidden,
            maxRows: cap.maxRows,
            note: cap.hidden > 0
                ? 'Showing top ' + cap.displayed + ' of ' + total + ' circular results. Use filters to narrow results.'
                : null
        };
    }

    function buildPreviewRunSummary(report) {
        const r = report || {};
        const rows = buildSelectableMatchRows(r);
        return {
            totalPostsAnalyzed: r.totalPostsAnalyzed || 0,
            totalNeeds: r.totalNeeds || 0,
            totalOffers: r.totalOffers || 0,
            totalMatchesFound: r.totalMatchesFound || 0,
            oneWayMatches: r.oneWayMatches || 0,
            twoWayMatches: r.twoWayMatches || 0,
            groupFormations: r.groupFormations || 0,
            circularExchanges: r.circularExchanges || 0,
            selectableRowCount: rows.length
        };
    }

    function buildSelectableMatchRows(report) {
        const creatorNames = (report && report.creatorNames) || {};
        const getName = (id) => creatorNames[id] || id || '';
        const rows = [];

        (report.oneWayNeedToOffers || []).forEach(item => {
            (item.matches || []).forEach(m => {
                const matchedId = (m.matchedOpportunity && m.matchedOpportunity.id)
                    || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].opportunityId);
                const oppIds = [item.opportunityId, matchedId].filter(Boolean);
                rows.push(summaryRow(report, {
                    matchType: 'One Way',
                    item,
                    m,
                    getName,
                    oppIds,
                    rowKey: 'ow-need:' + item.opportunityId + ':' + (matchedId || '')
                }));
            });
        });
        (report.oneWayOfferToNeeds || []).forEach(item => {
            (item.matches || []).forEach(m => {
                const matchedId = (m.matchedOpportunity && m.matchedOpportunity.id)
                    || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].opportunityId);
                const oppIds = [item.opportunityId, matchedId].filter(Boolean);
                rows.push(summaryRow(report, {
                    matchType: 'One Way',
                    item,
                    m,
                    getName,
                    oppIds,
                    rowKey: 'ow-offer:' + item.opportunityId + ':' + (matchedId || '')
                }));
            });
        });
        (report.twoWayPairs || []).forEach(p => {
            const oppIds = [p.needA && p.needA.id, p.matchedNeed && p.matchedNeed.id].filter(Boolean);
            const nameA = getName(p.needA && p.needA.creatorId);
            const nameB = getName(p.matchedNeed && p.matchedNeed.creatorId);
            const participants = [nameA, nameB].filter(Boolean).join(', ') || '—';
            const oppRefs = oppIds.join(' ↔ ') || '—';
            const score = (p.breakdown && (p.breakdown.scoreAtoB != null || p.breakdown.scoreBtoA != null))
                ? Math.round(((p.breakdown.scoreAtoB ?? 0) + (p.breakdown.scoreBtoA ?? 0)) / 2 * 100) + '%'
                : '—';
            rows.push({
                matchType: 'Barter',
                participants,
                opportunityRefs: oppRefs,
                matchScore: score,
                status: 'Suggested',
                filterKey: MATCH_TYPE_FILTER_KEYS['Barter'],
                rowKey: 'tw:' + oppIds.slice().sort().join(':'),
                opportunityIds: oppIds
            });
        });
        (report.consortiumLeads || []).forEach(lead => {
            const match = (lead.matches && lead.matches[0]) ? lead.matches[0] : null;
            const partners = (match && match.suggestedPartners) ? match.suggestedPartners : [];
            const participantNames = [getName(lead.creatorId)].concat(partners.map(sp => getName(sp.creatorId))).filter(Boolean);
            const participants = participantNames.length ? participantNames.join(', ') : '—';
            const oppRefs = lead.opportunityId + (partners.length ? ' (+' + partners.length + ' roles)' : '');
            const score = (match && match.matchScore != null) ? Math.round(match.matchScore * 100) + '%' : '—';
            rows.push({
                matchType: 'Consortium',
                participants,
                opportunityRefs: oppRefs,
                matchScore: score,
                status: 'Suggested',
                filterKey: MATCH_TYPE_FILTER_KEYS['Consortium'],
                rowKey: 'con:' + lead.opportunityId,
                opportunityIds: [lead.opportunityId]
            });
        });
        const circularCap = capCircularCyclesForDisplay((report && report.circularCycles) || []);
        circularCap.cycles.forEach(c => {
            const cycleIds = c.cycle || [];
            const participants = cycleIds.map(id => getName(id)).join(' → ')
                + (cycleIds.length ? ' → ' + getName(cycleIds[0]) : '');
            const oppIds = (c.opportunityIds && c.opportunityIds.length)
                ? c.opportunityIds.slice()
                : (c.linkScores || []).map(l => l.opportunityId).filter(Boolean);
            const oppRefs = oppIds.length ? oppIds.join(' → ') : (cycleIds.join(' → ') || '—');
            const score = (c.matchScore != null) ? Math.round(c.matchScore * 100) + '%' : '—';
            rows.push({
                matchType: 'Circular',
                participants,
                opportunityRefs: oppRefs,
                matchScore: score,
                status: 'Suggested',
                filterKey: MATCH_TYPE_FILTER_KEYS['Circular'],
                rowKey: 'circ:' + (oppIds.length ? oppIds.slice().sort().join(':') : cycleIds.join(':')),
                opportunityIds: oppIds.length ? oppIds : []
            });
        });
        return rows;
    }

    function summaryRow(report, ctx) {
        const { matchType, item, m, getName, oppIds, rowKey } = ctx;
        const partId = (m.matchedOpportunity && m.matchedOpportunity.creatorId)
            || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
        const participants = [getName(item.creatorId), getName(partId)].filter(Boolean).join(', ') || '—';
        const oppRefs = oppIds.join(' ↔ ') || '—';
        const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '—';
        return {
            matchType,
            participants,
            opportunityRefs: oppRefs,
            matchScore: score,
            status: 'Suggested',
            filterKey: MATCH_TYPE_FILTER_KEYS[matchType],
            rowKey,
            opportunityIds: oppIds
        };
    }

    function collectOpportunityIdsFromSelections(rows, selectedRowKeys) {
        const keySet = new Set(selectedRowKeys || []);
        const ids = new Set();
        (rows || []).forEach(row => {
            if (!keySet.has(row.rowKey)) return;
            (row.opportunityIds || []).forEach(id => { if (id) ids.add(id); });
        });
        return Array.from(ids);
    }

    function collectOpportunityIdsFromIdList(opportunityIds) {
        return Array.from(new Set((opportunityIds || []).filter(Boolean)));
    }

    /**
     * Build post_match-shaped stubs from a preview report so unified view models can enrich cards.
     * @param {object} report
     * @returns {object[]}
     */
    function buildPreviewPostMatchStubsFromReport(report) {
        const r = report || {};
        const stubs = [];
        const seen = new Set();

        function pushStub(stub) {
            const key = stub.id || stub.rowKey;
            if (!key || seen.has(key)) return;
            seen.add(key);
            stubs.push(stub);
        }

        (r.oneWayNeedToOffers || []).forEach(item => {
            (item.matches || []).forEach(m => {
                const matchedOpp = m.matchedOpportunity || (m.suggestedPartners && m.suggestedPartners[0]) || null;
                const offerId = matchedOpp?.id || matchedOpp?.opportunityId;
                const partId = matchedOpp?.creatorId || (m.suggestedPartners && m.suggestedPartners[0]?.creatorId);
                const rowKey = 'ow-need:' + item.opportunityId + ':' + (offerId || '');
                pushStub({
                    id: 'preview-' + rowKey,
                    rowKey,
                    matchType: 'one_way',
                    status: 'pending',
                    matchScore: m.matchScore,
                    previewOnly: true,
                    filterKey: MATCH_TYPE_FILTER_KEYS['One Way'],
                    participants: [
                        { userId: item.creatorId, role: 'need_owner', opportunityId: item.opportunityId },
                        { userId: partId, role: 'offer_provider', opportunityId: offerId }
                    ].filter(p => p.userId),
                    payload: {
                        needOpportunityId: item.opportunityId,
                        offerOpportunityId: offerId,
                        breakdown: m.breakdown || m.labels || {}
                    }
                });
            });
        });

        (r.oneWayOfferToNeeds || []).forEach(item => {
            (item.matches || []).forEach(m => {
                const matchedOpp = m.matchedOpportunity || (m.suggestedPartners && m.suggestedPartners[0]) || null;
                const needId = matchedOpp?.id || matchedOpp?.opportunityId;
                const partId = matchedOpp?.creatorId || (m.suggestedPartners && m.suggestedPartners[0]?.creatorId);
                const rowKey = 'ow-offer:' + item.opportunityId + ':' + (needId || '');
                pushStub({
                    id: 'preview-' + rowKey,
                    rowKey,
                    matchType: 'one_way',
                    status: 'pending',
                    matchScore: m.matchScore,
                    previewOnly: true,
                    filterKey: MATCH_TYPE_FILTER_KEYS['One Way'],
                    participants: [
                        { userId: item.creatorId, role: 'offer_provider', opportunityId: item.opportunityId },
                        { userId: partId, role: 'need_owner', opportunityId: needId }
                    ].filter(p => p.userId),
                    payload: {
                        needOpportunityId: needId,
                        offerOpportunityId: item.opportunityId,
                        breakdown: m.breakdown || m.labels || {}
                    }
                });
            });
        });

        (r.twoWayPairs || []).forEach(p => {
            const needAId = p.needA && p.needA.id;
            const needBId = p.matchedNeed && p.matchedNeed.id;
            const offerAId = p.offerA && p.offerA.id;
            const offerBId = p.matchedOffer && p.matchedOffer.id;
            const oppIds = [needAId, needBId].filter(Boolean);
            const rowKey = 'tw:' + oppIds.slice().sort().join(':');
            const score = (p.breakdown && (p.breakdown.scoreAtoB != null || p.breakdown.scoreBtoA != null))
                ? ((p.breakdown.scoreAtoB ?? 0) + (p.breakdown.scoreBtoA ?? 0)) / 2
                : p.matchScore;
            pushStub({
                id: 'preview-' + rowKey,
                rowKey,
                matchType: 'two_way',
                status: 'pending',
                matchScore: score,
                previewOnly: true,
                filterKey: MATCH_TYPE_FILTER_KEYS['Barter'],
                participants: [
                    { userId: p.needA && p.needA.creatorId, role: 'need_owner', opportunityId: needAId },
                    { userId: p.matchedNeed && p.matchedNeed.creatorId, role: 'need_owner', opportunityId: needBId }
                ].filter(party => party.userId),
                payload: {
                    needOpportunityId: needAId,
                    offerOpportunityId: offerAId,
                    matchedNeedId: needBId,
                    matchedOfferId: offerBId,
                    breakdown: p.breakdown || {}
                }
            });
        });

        (r.consortiumLeads || []).forEach(lead => {
            const match = (lead.matches && lead.matches[0]) ? lead.matches[0] : null;
            const partners = (match && match.suggestedPartners) ? match.suggestedPartners : [];
            const rowKey = 'con:' + lead.opportunityId;
            pushStub({
                id: 'preview-' + rowKey,
                rowKey,
                matchType: 'consortium',
                status: 'pending',
                matchScore: match && match.matchScore != null ? match.matchScore : null,
                previewOnly: true,
                filterKey: MATCH_TYPE_FILTER_KEYS['Consortium'],
                participants: [{ userId: lead.creatorId, role: 'lead', opportunityId: lead.opportunityId }]
                    .concat(partners.map(sp => ({
                        userId: sp.creatorId,
                        role: sp.role || 'partner',
                        opportunityId: sp.opportunityId
                    })).filter(party => party.userId)),
                payload: {
                    leadNeedId: lead.opportunityId,
                    suggestedPartners: partners,
                    breakdown: (match && (match.breakdown || match.labels)) || {}
                }
            });
        });

        const circularCap = capCircularCyclesForDisplay((r && r.circularCycles) || []);
        circularCap.cycles.forEach(c => {
            const cycleIds = c.cycle || [];
            const oppIds = (c.opportunityIds && c.opportunityIds.length)
                ? c.opportunityIds.slice()
                : (c.linkScores || []).map(l => l.opportunityId).filter(Boolean);
            const rowKey = 'circ:' + (oppIds.length ? oppIds.slice().sort().join(':') : cycleIds.join(':'));
            pushStub({
                id: 'preview-' + rowKey,
                rowKey,
                matchType: 'circular',
                status: 'pending',
                matchScore: c.matchScore,
                previewOnly: true,
                filterKey: MATCH_TYPE_FILTER_KEYS['Circular'],
                participants: cycleIds.map((creatorId, idx) => ({
                    userId: creatorId,
                    role: 'participant',
                    opportunityId: oppIds[idx] || null
                })).filter(party => party.userId),
                payload: {
                    cycle: cycleIds,
                    links: c.links || c.linkScores || [],
                    opportunityIds: oppIds
                }
            });
        });

        return stubs;
    }

    async function buildLifecycleQueues(dataService) {
        const empty = {
            invitations: [],
            negotiations: [],
            disputes: [],
            replacements: [],
            blockedMatches: [],
            matchingRuns: [],
            previewRuns: []
        };
        if (!dataService) return empty;

        const [
            invitations,
            negotiations,
            disputes,
            replacements,
            postMatches,
            matchingRuns,
            previewRuns
        ] = await Promise.all([
            typeof dataService.getOpportunityInvitations === 'function' ? dataService.getOpportunityInvitations() : [],
            typeof dataService.getNegotiations === 'function' ? dataService.getNegotiations() : [],
            typeof dataService.getDisputes === 'function' ? dataService.getDisputes() : [],
            typeof dataService.getReplacementRequests === 'function' ? dataService.getReplacementRequests() : [],
            typeof dataService.getPostMatches === 'function' ? dataService.getPostMatches() : [],
            typeof dataService.getMatchingRuns === 'function' ? dataService.getMatchingRuns() : [],
            typeof dataService.getMatchingPreviewRuns === 'function' ? dataService.getMatchingPreviewRuns() : []
        ]);

        const sentStatus = (typeof CONFIG !== 'undefined' && CONFIG.INVITATION_STATUS)
            ? CONFIG.INVITATION_STATUS.SENT
            : 'sent';
        const openNeg = (typeof CONFIG !== 'undefined' && CONFIG.MATCHING && CONFIG.MATCHING.NEGOTIATION)
            ? (CONFIG.MATCHING.NEGOTIATION.STATUS.OPEN || 'open')
            : 'open';
        const agreedNeg = (typeof CONFIG !== 'undefined' && CONFIG.MATCHING && CONFIG.MATCHING.NEGOTIATION)
            ? (CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED || 'agreed')
            : 'agreed';
        const replPending = (typeof CONFIG !== 'undefined' && CONFIG.REPLACEMENT_REQUEST_STATUS)
            ? CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_OWNER_REVIEW
            : 'pending_owner_review';
        const replAccepted = (typeof CONFIG !== 'undefined' && CONFIG.REPLACEMENT_REQUEST_STATUS)
            ? CONFIG.REPLACEMENT_REQUEST_STATUS.REPLACEMENT_ACCEPTED
            : 'replacement_accepted';

        const invitationQueue = invitations
            .filter(i => {
                const s = (i.status || '').toLowerCase();
                return s === sentStatus || s === 'invitation_sent';
            })
            .slice(0, 25)
            .map(i => ({
                id: i.id,
                matchId: i.matchId,
                opportunityId: i.opportunityId,
                kind: i.invitationKind || 'apply',
                status: i.status,
                createdAt: i.createdAt
            }));

        const negotiationQueue = negotiations
            .filter(n => {
                const s = (n.status || '').toLowerCase();
                return s === openNeg || s === agreedNeg;
            })
            .slice(0, 25)
            .map(n => ({
                id: n.id,
                matchId: n.matchId,
                applicationId: n.applicationId,
                status: n.status,
                updatedAt: n.updatedAt || n.createdAt
            }));

        const activeDisputeStatuses = ['raised', 'under_review', 'mediation'];
        const disputeQueue = disputes
            .filter(d => activeDisputeStatuses.includes((d.status || '').toLowerCase()))
            .slice(0, 25)
            .map(d => ({
                id: d.id,
                negotiationId: d.negotiationId,
                opportunityId: d.opportunityId,
                category: d.category,
                status: d.status,
                raisedAt: d.raisedAt || d.createdAt
            }));

        const replacementQueue = replacements
            .filter(r => {
                const s = (r.status || '').toLowerCase();
                return s === replPending || s === replAccepted;
            })
            .slice(0, 25)
            .map(r => ({
                id: r.id,
                matchId: r.matchId,
                opportunityId: r.opportunityId,
                status: r.status,
                roleToFill: r.roleToFill,
                updatedAt: r.updatedAt || r.createdAt
            }));

        const blockedMatches = postMatches
            .filter(m => m.blocked || m.replacementBlocked || (m.metadata && m.metadata.blocked))
            .slice(0, 15)
            .map(m => ({
                id: m.id,
                matchType: m.matchType,
                status: m.status,
                opportunityId: (m.payload && (m.payload.leadNeedId || m.payload.needOpportunityId)) || null
            }));

        const runHistory = matchingRuns
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        const previewHistory = previewRuns
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        return {
            invitations: invitationQueue,
            negotiations: negotiationQueue,
            disputes: disputeQueue,
            replacements: replacementQueue,
            blockedMatches,
            matchingRuns: runHistory,
            previewRuns: previewHistory
        };
    }

    const api = {
        MATCH_TYPE_FILTER_KEYS,
        getAdminMatchingMaxCircularRows,
        sortCircularCycles,
        capCircularCyclesForDisplay,
        getCircularDisplayMeta,
        buildPreviewRunSummary,
        buildSelectableMatchRows,
        buildPreviewPostMatchStubsFromReport,
        collectOpportunityIdsFromSelections,
        collectOpportunityIdsFromIdList,
        buildLifecycleQueues
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (global) {
        global.AdminMatchingCommandCenter = api;
    }
})(typeof window !== 'undefined' ? window : global);
