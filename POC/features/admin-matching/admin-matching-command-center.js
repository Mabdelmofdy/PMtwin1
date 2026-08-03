/**
 * Admin Matching Command Center — data assembly, analytics, and tab rendering.
 * Uses POST_MATCHES and related entities only (no parallel matching model).
 */
(function (global) {
    'use strict';

    const TITLE_NO_PERM = 'You do not have permission to perform this action.';
    const NEG_STALE_DAYS = 14;
    const INV_STALE_DAYS = 14;

    const MATCHING_AUDIT_ACTIONS = new Set([
        'match_created', 'match_refreshed', 'match_accepted', 'match_declined', 'match_confirmed', 'match_converted_to_deal',
        'opportunity_invitation_sent', 'opportunity_invitation_accepted', 'opportunity_invitation_declined',
        'replacement_suggested', 'replacement_suggestion_approved', 'replacement_suggestion_rejected',
        'replacement_invitation_sent', 'replacement_invitation_accepted', 'replacement_invitation_declined',
        'replacement_superseded', 'participant_replaced',
        'negotiation_started', 'negotiation_agreed', 'negotiation_cancelled',
        'deal_created_from_match', 'deal_created_from_negotiation',
        'contract_signature_blocked', 'matching_settings_updated'
    ]);

    function escapeHtml(s) {
        if (s == null || s === '') return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function daysBetween(a, b) {
        const t1 = new Date(a || 0).getTime();
        const t2 = new Date(b || 0).getTime();
        if (!Number.isFinite(t1) || !Number.isFinite(t2)) return 0;
        return Math.floor((t2 - t1) / (86400000));
    }

    function mapUiMatchType(stored) {
        const x = (stored || 'one_way').toLowerCase();
        if (x === 'two_way') return 'barter';
        if (x === 'consortium') return 'consortium';
        if (x === 'circular') return 'circular';
        return 'recommended';
    }

    function mapUiMatchLabel(ui) {
        const m = { recommended: 'Recommended', barter: 'Barter', consortium: 'Consortium', circular: 'Circular' };
        return m[ui] || 'Recommended';
    }

    function getPrimaryOpportunityId(pm) {
        const uv = global.unifiedMatchView;
        if (uv && typeof uv.getPrimaryOpportunityIdFromPostMatch === 'function') {
            return uv.getPrimaryOpportunityIdFromPostMatch(pm);
        }
        return null;
    }

    function collectOpportunityIdsFromPostMatch(pm) {
        const ids = new Set();
        const p = pm.payload || {};
        const mt = (pm.matchType || 'one_way').toLowerCase();
        if (mt === 'one_way') {
            if (p.needOpportunityId) ids.add(p.needOpportunityId);
            if (p.offerOpportunityId) ids.add(p.offerOpportunityId);
        } else if (mt === 'two_way') {
            if (p.sideA) {
                if (p.sideA.needId) ids.add(p.sideA.needId);
                if (p.sideA.offerId) ids.add(p.sideA.offerId);
            }
            if (p.sideB) {
                if (p.sideB.needId) ids.add(p.sideB.needId);
                if (p.sideB.offerId) ids.add(p.sideB.offerId);
            }
        } else if (mt === 'consortium') {
            if (p.leadNeedId) ids.add(p.leadNeedId);
            (p.roles || []).forEach(r => { if (r.opportunityId) ids.add(r.opportunityId); });
        } else if (mt === 'circular') {
            (p.links || []).forEach(l => {
                if (l.needId) ids.add(l.needId);
                if (l.offerId) ids.add(l.offerId);
            });
            (pm.participants || []).forEach(part => { if (part.opportunityId) ids.add(part.opportunityId); });
        }
        return Array.from(ids);
    }

    function scoreQuality(score) {
        const s = typeof score === 'number' ? score : 0;
        if (s >= 0.9) return 'top';
        if (s >= 0.7) return 'high';
        return 'standard';
    }

    function routeMatch(id) {
        const pat = global.CONFIG && global.CONFIG.ROUTES && global.CONFIG.ROUTES.MATCH_DETAIL;
        if (pat && pat.indexOf(':id') >= 0) return pat.replace(':id', id);
        return '/matches/' + id;
    }

    function routeOpp(id) {
        return '/opportunities/' + id;
    }

    function routeDeal(id) {
        const pat = global.CONFIG && global.CONFIG.ROUTES && global.CONFIG.ROUTES.DEAL_DETAIL;
        if (pat && pat.indexOf(':id') >= 0) return pat.replace(':id', id);
        return '/deals/' + id;
    }

    function routeContract(id) {
        return '/contracts/' + id;
    }

    function badgeHtml(status, context) {
        const sb = global.statusBadgeSystem;
        if (sb && typeof sb.renderStatusBadge === 'function') {
            return sb.renderStatusBadge(status || '—', context || 'system');
        }
        return '<span class="badge badge--neutral">' + escapeHtml(status || '—') + '</span>';
    }

    function ui() {
        return global.amccUi || {};
    }

    function ensurePaginationDefaults() {
        window.__amccPagination = window.__amccPagination || {};
        ['opportunity', 'invitations', 'negotiations', 'audit'].forEach(function (k) {
            if (!window.__amccPagination[k]) window.__amccPagination[k] = { page: 1, pageSize: 25 };
        });
    }

    function paginatedRows(arr, key) {
        ensurePaginationDefaults();
        const st = window.__amccPagination[key];
        const pageSize = st.pageSize === 50 ? 50 : 25;
        st.pageSize = pageSize;
        const total = arr.length;
        const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
        if (st.page > maxPage) st.page = maxPage;
        if (st.page < 1) st.page = 1;
        const start = (st.page - 1) * pageSize;
        return {
            slice: arr.slice(start, start + pageSize),
            total: total,
            page: st.page,
            pageSize: pageSize,
            maxPage: maxPage
        };
    }

    function isContractActive(c) {
        return !!(c && (c.status || '').toLowerCase() === 'active');
    }

    async function getAdminMatchingCommandCenterData(dataService) {
        if (!dataService) {
            return {
                postMatches: [], deals: [], contracts: [], negotiations: [], invitations: [],
                replacements: [], applications: [], opportunities: [], auditLogs: [],
                userById: new Map(),
                companyById: new Map(),
                oppById: new Map()
            };
        }
        const [
            postMatches,
            deals,
            contracts,
            negotiations,
            invitations,
            replacements,
            applications,
            opportunities,
            auditRaw,
            users,
            companies
        ] = await Promise.all([
            dataService.getPostMatches(),
            dataService.getDeals(),
            dataService.getContracts(),
            dataService.getNegotiations(),
            typeof dataService.getOpportunityInvitations === 'function' ? dataService.getOpportunityInvitations() : [],
            typeof dataService.getReplacementRequests === 'function' ? dataService.getReplacementRequests() : [],
            typeof dataService.getApplications === 'function' ? dataService.getApplications() : [],
            dataService.getOpportunities(),
            dataService.getAuditLogs({}),
            typeof dataService.getUsers === 'function' ? dataService.getUsers() : [],
            typeof dataService.getCompanies === 'function' ? dataService.getCompanies() : []
        ]);

        const auditLogs = (auditRaw || []).filter(l => l && MATCHING_AUDIT_ACTIONS.has(l.action));

        const dealById = new Map(deals.map(d => [d.id, d]));
        const contractsByDealId = new Map();
        for (const c of contracts) {
            if (c.dealId) {
                if (!contractsByDealId.has(c.dealId)) contractsByDealId.set(c.dealId, []);
                contractsByDealId.get(c.dealId).push(c);
            }
        }
        const negotiationsByMatchId = new Map();
        for (const n of negotiations) {
            if (!n.matchId) continue;
            if (!negotiationsByMatchId.has(n.matchId)) negotiationsByMatchId.set(n.matchId, []);
            negotiationsByMatchId.get(n.matchId).push(n);
        }
        const invitationsByMatchId = new Map();
        for (const inv of invitations) {
            if (!inv.matchId) continue;
            if (!invitationsByMatchId.has(inv.matchId)) invitationsByMatchId.set(inv.matchId, []);
            invitationsByMatchId.get(inv.matchId).push(inv);
        }
        const replacementsByMatchId = new Map();
        for (const r of replacements) {
            if (!r.matchId) continue;
            if (!replacementsByMatchId.has(r.matchId)) replacementsByMatchId.set(r.matchId, []);
            replacementsByMatchId.get(r.matchId).push(r);
        }
        const dealsByMatchId = new Map();
        for (const d of deals) {
            if (!d.matchId) continue;
            if (!dealsByMatchId.has(d.matchId)) dealsByMatchId.set(d.matchId, []);
            dealsByMatchId.get(d.matchId).push(d);
        }
        const dealByNegotiationId = new Map();
        for (const d of deals) {
            if (d.negotiationId) dealByNegotiationId.set(d.negotiationId, d);
        }

        const oppById = new Map(opportunities.map(o => [o.id, o]));
        const userById = new Map((users || []).map(u => [u.id, u]));
        const companyById = new Map((companies || []).map(c => [c.id, c]));

        return {
            postMatches,
            deals,
            contracts,
            negotiations,
            invitations,
            replacements,
            applications,
            opportunities,
            auditLogs,
            dealById,
            contractsByDealId,
            negotiationsByMatchId,
            invitationsByMatchId,
            replacementsByMatchId,
            dealsByMatchId,
            dealByNegotiationId,
            oppById,
            userById,
            companyById
        };
    }

    function buildAdminMatchingOverview(state, baseStats) {
        const stats = baseStats || {};
        const pm = state.postMatches;
        const confirmedStatus = (global.CONFIG && global.CONFIG.POST_MATCH_STATUS && global.CONFIG.POST_MATCH_STATUS.CONFIRMED)
            ? global.CONFIG.POST_MATCH_STATUS.CONFIRMED
            : 'confirmed';
        const confirmedNorm = String(confirmedStatus || 'confirmed').toLowerCase();
        const confirmed = pm.filter(m => (m.status || '').toLowerCase() === confirmedNorm).length;
        const dealsFromMatches = state.deals.filter(d => d.matchId).length;
        const matchedDealIds = new Set(state.deals.filter(d => d.matchId).map(d => d.id));
        let contractsFromMatchedDeals = 0;
        for (const c of state.contracts) {
            if (c.dealId && matchedDealIds.has(c.dealId)) contractsFromMatchedDeals++;
        }
        const scores = pm.map(m => m.matchScore).filter(s => typeof s === 'number');
        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        const invitations = state.invitations || [];
        const pendingInvitations = invitations.filter(i => {
            const s = (i.status || '').toLowerCase();
            return (s === 'sent' || s === 'invitation_sent') && !i.applicationId;
        }).length;
        const blockedRows = getBlockedMatches(state);
        return {
            ...stats,
            confirmedMatches: confirmed,
            dealsFromMatches,
            contractsFromMatchedDeals,
            avgMatchScorePct: avgScore != null ? Math.round(avgScore * 100) + '%' : '—',
            conversionConfirmedToDeal: confirmed > 0
                ? Math.round((dealsFromMatches / confirmed) * 100) + '%'
                : '—',
            blockedMatchesCount: blockedRows.length,
            pendingInvitations
        };
    }

    function consortiumMissingRole(pm) {
        const p = pm.payload || {};
        const roles = p.roles || [];
        if (!roles.length) return false;
        const parts = pm.participants || [];
        for (const r of roles) {
            const oid = r.opportunityId;
            const uid = r.userId;
            const ok = parts.some(part =>
                (oid && part.opportunityId === oid) || (uid && part.userId === uid)
            );
            if (!ok) return true;
        }
        return false;
    }

    function circularChainIncomplete(pm) {
        const p = pm.payload || {};
        const cyc = p.cycle || [];
        const links = p.links || [];
        if ((pm.matchType || '').toLowerCase() !== 'circular') return false;
        if (cyc.length && links.length && links.length < cyc.length) return true;
        const parts = pm.participants || [];
        return parts.some(part => (part.participantStatus || '').toLowerCase() === 'declined');
    }

    function contractSignatureBlockedForMatch(pm, state) {
        const deals = state.dealsByMatchId.get(pm.id) || [];
        for (const d of deals) {
            const clist = state.contractsByDealId.get(d.id) || [];
            for (const c of clist) {
                if ((c.status || '').toLowerCase() !== 'pending') continue;
                if (typeof state.dataService !== 'undefined' && state.dataService.allContractPartiesSigned) {
                    if (!state.dataService.allContractPartiesSigned(c)) return { contract: c, deal: d };
                } else {
                    const parties = c.parties || [];
                    if (parties.some(p => p && p.userId && !p.signedAt)) return { contract: c, deal: d };
                }
            }
        }
        return null;
    }

    function getBlockedMatches(state) {
        const out = [];
        const now = new Date().toISOString();
        for (const pm of state.postMatches) {
            const mt = (pm.matchType || '').toLowerCase();
            const parts = pm.participants || [];
            const repls = state.replacementsByMatchId.get(pm.id) || [];
            const reasons = [];
            let blockedParticipant = null;
            let roleHint = null;

            const declined = parts.find(p => (p.participantStatus || '').toLowerCase() === 'declined');
            if (declined) {
                reasons.push({ key: 'declined', label: 'Participant declined', participant: declined.userId, role: declined.role });
                blockedParticipant = declined.userId || blockedParticipant;
                roleHint = declined.role || roleHint;
            }

            const stalePending = parts.filter(p => (p.participantStatus || '').toLowerCase() === 'pending'
                && daysBetween(pm.createdAt || pm.updatedAt, now) >= (mt === 'consortium' || mt === 'circular' ? 7 : INV_STALE_DAYS));
            if (stalePending.length && (mt === 'consortium' || mt === 'circular' || mt === 'one_way' || mt === 'two_way')) {
                reasons.push({
                    key: 'no_response',
                    label: 'Waiting for response',
                    participant: stalePending[0].userId,
                    role: stalePending[0].role
                });
                blockedParticipant = blockedParticipant || stalePending[0].userId;
            }

            if (mt === 'consortium' && consortiumMissingRole(pm)) {
                reasons.push({ key: 'missing_role', label: 'Missing consortium role', participant: null, role: null });
            }
            if (mt === 'circular' && circularChainIncomplete(pm)) {
                reasons.push({ key: 'circular_blocked', label: 'Circular chain blocked', participant: null, role: null });
            }

            const pendingRepl = repls.filter(r => (r.status || '').toLowerCase() === 'pending_owner_review');
            if (pendingRepl.length) {
                reasons.push({ key: 'repl_review', label: 'Replacement pending owner review', participant: pendingRepl[0].blockedParticipantId, role: pendingRepl[0].roleToFill });
                blockedParticipant = blockedParticipant || pendingRepl[0].blockedParticipantId;
                roleHint = roleHint || pendingRepl[0].roleToFill;
            }
            const invSent = repls.filter(r => ['invitation_sent', 'pending_invitation'].includes((r.status || '').toLowerCase()));
            if (invSent.length) {
                reasons.push({ key: 'repl_invite', label: 'Replacement invitation sent', participant: invSent[0].blockedParticipantId, role: invSent[0].roleToFill });
            }

            const sig = contractSignatureBlockedForMatch(pm, state);
            if (sig) {
                reasons.push({ key: 'signature', label: 'Waiting for signature', participant: null, role: null, contractId: sig.contract.id, dealId: sig.deal.id });
            }

            const negs = state.negotiationsByMatchId.get(pm.id) || [];
            for (const n of negs) {
                if ((n.status || '').toLowerCase() === 'open' && daysBetween(n.createdAt, now) >= NEG_STALE_DAYS) {
                    reasons.push({ key: 'neg_stale', label: 'Negotiation open for extended period', participant: null, role: null, negotiationId: n.id });
                }
            }

            if (!reasons.length) continue;

            const primaryOid = getPrimaryOpportunityId(pm);
            const opp = primaryOid ? state.oppById.get(primaryOid) : null;
            const deals = state.dealsByMatchId.get(pm.id) || [];
            const deal = deals[0] || null;
            let contract = null;
            if (deal) {
                const cl = state.contractsByDealId.get(deal.id) || [];
                contract = cl[0] || null;
            }

            out.push({
                match: pm,
                matchId: pm.id,
                matchTypeUi: mapUiMatchType(pm.matchType),
                score: pm.matchScore,
                reasons,
                projectId: pm.projectId || (opp && opp.projectId) || null,
                opportunityId: primaryOid,
                opportunityTitle: opp ? opp.title : null,
                blockedParticipant,
                roleHint,
                replacementStatus: repls.length ? (repls[repls.length - 1].status || '') : '',
                deal,
                contract,
                lastActivity: pm.updatedAt || pm.createdAt
            });
        }
        return out;
    }

    function getInvitationAnalytics(state) {
        const inv = state.invitations || [];
        const sent = inv.filter(i => ['sent', 'invitation_sent'].includes((i.status || '').toLowerCase())).length;
        const withApp = inv.filter(i => !!i.applicationId).length;
        const appsFromInv = state.applications.filter(a => !!a.invitationId).length;
        const denom = Math.max(1, sent + inv.filter(i => (i.status || '').toLowerCase() === 'accepted').length);
        const rate = Math.round((appsFromInv / denom) * 100) + '%';
        const replAccepted = inv.filter(i =>
            (i.invitationKind || '').toLowerCase() === 'replacement'
            && ((i.status || '').toLowerCase() === 'accepted' || !!i.applicationId)
        ).length;
        const dealsFromInvitedApps = state.deals.filter(d => {
            if (!d.matchId) return false;
            return state.applications.some(a => a.invitationId && a.matchId === d.matchId);
        }).length;
        return { sent, withApp, appsFromInv, invitationToApplicationRate: rate, replAccepted, dealsFromInvitedApps };
    }

    function getReplacementAnalytics(state) {
        const r = state.replacements || [];
        const suggested = r.length;
        const invited = r.filter(x => ['invitation_sent', 'pending_invitation'].includes((x.status || '').toLowerCase())).length;
        const accepted = r.filter(x => (x.status || '').toLowerCase() === 'replacement_accepted').length;
        const completed = r.filter(x => (x.status || '').toLowerCase() === 'completed').length;
        const conv = invited > 0 ? Math.round((completed / invited) * 100) + '%' : '—';
        return { suggested, invited, accepted, completed, conversion: conv };
    }

    function getNegotiationAnalytics(state) {
        const n = (state.negotiations || []).filter(x => x.matchId);
        const started = n.length;
        const agreed = n.filter(x => (x.status || '').toLowerCase() === 'agreed').length;
        const cancelled = n.filter(x => ['cancelled', 'failed', 'expired'].includes((x.status || '').toLowerCase())).length;
        const withDeal = n.filter(x => state.dealByNegotiationId.has(x.id)).length;
        const open = n.filter(x => (x.status || '').toLowerCase() === 'open').length;
        let sumDays = 0;
        let countAgree = 0;
        for (const neg of n) {
            if ((neg.status || '').toLowerCase() !== 'agreed') continue;
            const agreedAt = neg.updatedAt || neg.agreedAt;
            if (neg.createdAt && agreedAt) {
                const days = daysBetween(neg.createdAt, agreedAt);
                if (days >= 0) {
                    sumDays += days;
                    countAgree++;
                }
            }
        }
        const avgDaysAgree = countAgree > 0 ? (sumDays / countAgree).toFixed(1) + ' d' : '—';
        const conv = agreed > 0 ? Math.round((withDeal / agreed) * 100) + '%' : '—';
        return { started, agreed, cancelled, withDeal, open, avgDaysToAgreement: avgDaysAgree, negotiationToDealRate: conv };
    }

    function getMatchingConversionFunnels(state) {
        const confirmedStatus = (global.CONFIG && global.CONFIG.POST_MATCH_STATUS && global.CONFIG.POST_MATCH_STATUS.CONFIRMED)
            ? global.CONFIG.POST_MATCH_STATUS.CONFIRMED
            : 'confirmed';
        const pm = state.postMatches;
        const totalMatches = pm.length;
        const confirmed = pm.filter(m => (m.status || '').toLowerCase() === confirmedStatus).length;
        const deals = state.deals.filter(d => d.matchId).length;
        const matchedDealIds = new Set(state.deals.filter(d => d.matchId).map(d => d.id));
        let contracts = 0;
        for (const c of state.contracts) {
            if (c.dealId && matchedDealIds.has(c.dealId)) contracts++;
        }

        const inv = state.invitations || [];
        const invSent = inv.filter(i => ['sent', 'invitation_sent'].includes((i.status || '').toLowerCase())).length;
        const appsSubmitted = state.applications.filter(a => !!a.invitationId).length;
        const appsAccepted = state.applications.filter(a =>
            a.invitationId && (a.status || '').toLowerCase() === 'accepted'
        ).length;
        const dealsFromInvited = state.deals.filter(d => d.matchId && state.applications.some(a => a.invitationId && a.matchId === d.matchId)).length;

        const neg = state.negotiations.filter(n => n.matchId);
        const negStarted = neg.length;
        const negAgreed = neg.filter(n => (n.status || '').toLowerCase() === 'agreed').length;
        const negDeals = neg.filter(n => state.dealByNegotiationId.has(n.id)).length;

        const repl = state.replacements;
        const replSug = repl.length;
        const replInv = repl.filter(r => ['invitation_sent', 'pending_invitation'].includes((r.status || '').toLowerCase())).length;
        const replAcc = repl.filter(r => (r.status || '').toLowerCase() === 'replacement_accepted').length;
        const replDone = repl.filter(r => (r.status || '').toLowerCase() === 'completed').length;

        return {
            funnel1: { matches: totalMatches, confirmed, deals, contracts },
            funnel2: { invitationsSent: invSent, applicationsSubmitted: appsSubmitted, applicationsAccepted: appsAccepted, deals: dealsFromInvited },
            funnel3: { started: negStarted, agreed: negAgreed, dealsCreated: negDeals },
            funnel4: { suggestions: replSug, invitationsSent: replInv, replacementsAccepted: replAcc, participantsReplaced: replDone }
        };
    }

    async function getMatchingAuditLogs(dataService) {
        if (!dataService || typeof dataService.getAuditLogs !== 'function') return [];
        const logs = await dataService.getAuditLogs({});
        return (logs || []).filter(l => l && MATCHING_AUDIT_ACTIONS.has(l.action));
    }

    function renderKpiCard(value, label, hint, trend) {
        const U = ui();
        if (U.renderSummaryCard) return U.renderSummaryCard(value, label, hint, trend);
        return ''
            + '<div class="admin-kpi-card admin-kpi-card--compact amcc-kpi">'
            + '<span class="admin-kpi-value">' + escapeHtml(String(value)) + '</span>'
            + '<span class="admin-kpi-label">' + escapeHtml(label) + '</span>'
            + (hint ? '<span class="admin-kpi-trend">' + escapeHtml(hint) + '</span>' : '')
            + (trend ? '<span class="admin-kpi-trend">' + escapeHtml(trend) + '</span>' : '')
            + '</div>';
    }

    function renderBarRow(label, value, max) {
        const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
        return ''
            + '<div class="amcc-bar-row">'
            + '<span class="amcc-bar-label">' + escapeHtml(label) + '</span>'
            + '<span class="amcc-bar-val">' + escapeHtml(String(value)) + '</span>'
            + '<div class="amcc-bar-track"><div class="amcc-bar-fill" style="width:' + pct + '%"></div></div>'
            + '</div>';
    }

    function renderEmpty(iconClass, title, desc, ctaHtml) {
        const U = ui();
        if (U.renderEmpty) return U.renderEmpty(iconClass, title, desc, ctaHtml);
        return ''
            + '<div class="amcc-empty">'
            + '<span class="amcc-empty-icon"><i class="' + escapeHtml(iconClass || 'ph-duotone ph-folder-open') + '" aria-hidden="true"></i></span>'
            + '<p class="amcc-empty-title">' + escapeHtml(title) + '</p>'
            + '<p class="amcc-empty-desc">' + escapeHtml(desc) + '</p>'
            + (ctaHtml || '')
            + '</div>';
    }

    function textMatches(q, parts) {
        if (!q) return true;
        const s = q.toLowerCase();
        return parts.some(p => (p && String(p).toLowerCase().indexOf(s) >= 0));
    }

    function humanizeSnake(str) {
        const s = String(str || '').replace(/_/g, ' ').trim();
        if (!s) return '—';
        return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function renderOverviewPanel(state, overview, filters) {
        const q = (filters.search || '').trim();
        const totalMatches = overview.totalPostMatches != null ? overview.totalPostMatches : state.postMatches.length;
        const blockedCount = overview.blockedMatchesCount != null ? overview.blockedMatchesCount : getBlockedMatches(state).length;
        const pendingInv = overview.pendingInvitations != null ? overview.pendingInvitations : '—';

        const el = document.getElementById('amcc-overview-kpis');
        if (el) {
            el.innerHTML = ''
                + renderKpiCard(totalMatches, 'Saved matches', 'In this workspace', '')
                + renderKpiCard(overview.confirmedMatches, 'Confirmed', 'Parties aligned on the match', '')
                + renderKpiCard(overview.dealsFromMatches, 'Deals started', 'Created from saved matches', '');
        }

        const sec = document.getElementById('amcc-overview-secondary');
        if (sec) {
            const rows = [
                { k: 'Recommended', v: overview.recommendedCount },
                { k: 'Barter', v: overview.barterCount },
                { k: 'Consortium', v: overview.consortiumCount },
                { k: 'Circular', v: overview.circularCount },
                { k: 'Avg score', v: overview.avgMatchScorePct || overview.avgScorePct || '—' },
                { k: 'Contracts from those deals', v: overview.contractsFromMatchedDeals },
                { k: 'Confirmed → deal rate', v: overview.conversionConfirmedToDeal || overview.conversionRate || '—' },
                { k: 'Open negotiations', v: overview.negotiationsOpen },
                { k: 'Replacement reviews', v: overview.replacementPending },
                { k: 'Blocked matches', v: blockedCount },
                { k: 'Invites waiting on apply', v: pendingInv }
            ];
            sec.innerHTML = '<div class="amcc-quick-stats" aria-label="More counts">'
                + rows.map(function (r) {
                    return '<div class="amcc-quick-stat"><span class="amcc-quick-stat__k">' + escapeHtml(r.k) + '</span>'
                        + '<span class="amcc-quick-stat__v">' + escapeHtml(String(r.v)) + '</span></div>';
                }).join('')
                + '</div>';
        }

        const pm = state.postMatches;
        const byType = { recommended: 0, barter: 0, consortium: 0, circular: 0 };
        const byStatus = {};
        const byQuality = { top: 0, high: 0, standard: 0 };
        for (const m of pm) {
            const uiType = mapUiMatchType(m.matchType);
            byType[uiType] = (byType[uiType] || 0) + 1;
            const st = (m.status || 'pending').toLowerCase();
            byStatus[st] = (byStatus[st] || 0) + 1;
            const qk = scoreQuality(m.matchScore);
            byQuality[qk]++;
        }
        const maxType = Math.max(1, ...Object.values(byType));
        const maxSt = Math.max(1, ...Object.values(byStatus));
        const maxQ = Math.max(1, ...Object.values(byQuality));
        const typeBars = ''
            + renderBarRow('Recommended', byType.recommended || 0, maxType)
            + renderBarRow('Barter', byType.barter || 0, maxType)
            + renderBarRow('Consortium', byType.consortium || 0, maxType)
            + renderBarRow('Circular', byType.circular || 0, maxType);
        const qualBars = ''
            + renderBarRow('Strong (≥90%)', byQuality.top, maxQ)
            + renderBarRow('Good (70–89%)', byQuality.high, maxQ)
            + renderBarRow('Below 70%', byQuality.standard, maxQ);
        const statusKeys = Object.keys(byStatus).sort();
        const statusInner = statusKeys.length
            ? statusKeys.map(function (k) {
                return renderBarRow(humanizeSnake(k), byStatus[k], maxSt);
            }).join('')
            : '<p class="amcc-overview-muted">No status data yet.</p>';

        const breakdownEl = document.getElementById('amcc-overview-breakdown');
        if (breakdownEl) {
            breakdownEl.innerHTML = ''
                + '<h3 class="amcc-overview-card-title">How matches spread out</h3>'
                + '<p class="amcc-overview-card-lede">Types and score bands across everything saved right now.</p>'
                + '<div class="amcc-overview-breakdown-cols">'
                + '<div class="amcc-overview-breakdown-col" aria-label="By type">'
                + '<h4 class="amcc-overview-subhead">Match type</h4>' + typeBars
                + '</div>'
                + '<div class="amcc-overview-breakdown-col" aria-label="By score band">'
                + '<h4 class="amcc-overview-subhead">Score band</h4>' + qualBars
                + '</div>'
                + '</div>'
                + '<details class="amcc-overview-status-details">'
                + '<summary class="amcc-overview-status-summary">Workflow status <span class="amcc-overview-muted">(expand)</span></summary>'
                + '<div class="amcc-overview-status-body">' + statusInner + '</div>'
                + '</details>';
        }

        const attention = document.getElementById('amcc-overview-attention');
        if (attention) {
            const blocked = getBlockedMatches(state).filter(function (b) {
                const sm = matchSummaryFromState(state, b.matchId);
                return textMatches(q, [b.matchId, b.opportunityTitle, b.projectId, sm.headline, sm.matchTypeLabel].concat(sm.participantLines, b.reasons.map(r => r.label)));
            });
            const items = [];
            blocked.slice(0, 6).forEach(b => {
                items.push('<li class="amcc-attention-item">' + renderMatchSummaryCompact(state, b.matchId) + '<span class="amcc-attention-reason">' + escapeHtml(b.reasons.map(r => r.label).join(' · ')) + '</span></li>');
            });
            const invStale = state.invitations.filter(i => {
                const s = (i.status || '').toLowerCase();
                if (!['sent', 'invitation_sent'].includes(s) || i.applicationId) return false;
                return daysBetween(i.createdAt, new Date().toISOString()) >= INV_STALE_DAYS;
            });
            invStale.slice(0, 4).forEach(i => {
                items.push('<li class="amcc-attention-item"><span class="amcc-attention-reason">Invitation ' + escapeHtml(i.id) + ' — sent a while ago, still no application</span></li>');
            });
            const pendingInvNum = overview.pendingInvitations != null ? Number(overview.pendingInvitations) : NaN;
            const negOpen = Number(overview.negotiationsOpen) || 0;
            const jumps = []
                .concat(blockedCount > 0 ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-jump-tab="blocked">Review blocked</button>' : [])
                .concat(!Number.isNaN(pendingInvNum) && pendingInvNum > 0 ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-jump-tab="invitations">Open invitations</button>' : [])
                .concat(negOpen > 0 ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-jump-tab="negotiations">Open negotiations</button>' : []);
            const jumpRow = jumps.length
                ? '<div class="amcc-overview-jumps" role="group" aria-label="Related tabs">' + jumps.join(' ') + '</div>'
                : '';
            attention.innerHTML = ''
                + '<h3 class="amcc-overview-card-title">May need a follow-up</h3>'
                + '<p class="amcc-overview-card-lede">Blocked or stale items from saved data. Showing a short list; full detail is in the matching tabs.</p>'
                + (items.length
                    ? '<ul class="amcc-attention-list amcc-attention-list--simple">' + items.join('') + '</ul>'
                    + jumpRow
                    : '<p class="amcc-overview-muted">Nothing urgent surfaced—nice and quiet.</p>' + jumpRow);
        }

        const actEl = document.getElementById('amcc-overview-activity');
        if (actEl) {
            const logs = (state.auditLogs || []).filter(l => textMatches(q, [l.action, l.entityId, (l.details && l.details.matchId)])).slice(0, 12);
            const U = ui();
            if (!logs.length) {
                const emptyInner = renderEmpty('ph-duotone ph-clock', 'No activity yet', 'When people accept matches, send invites, or negotiate, it will show up here.', '');
                actEl.innerHTML = U.renderActivityTimeline
                    ? U.renderActivityTimeline('Recent activity', '', emptyInner)
                    : '<h3 class="section-title">Recent activity</h3>' + emptyInner;
            } else {
                const items = logs.map(function (l) {
                    return '<li class="amcc-time-row">'
                        + '<span class="amcc-time-dot" aria-hidden="true"></span>'
                        + '<div class="amcc-time-body">'
                        + '<span class="amcc-act">' + escapeHtml(l.action) + '</span> '
                        + '<span class="amcc-act-meta">' + escapeHtml(formatDate(l.timestamp)) + '</span>'
                        + (l.details && l.details.matchId ? ' · ' + renderMatchHeadlineLink(state, l.details.matchId) : '')
                        + '</div></li>';
                }).join('');
                actEl.innerHTML = U.renderActivityTimeline
                    ? U.renderActivityTimeline('Recent activity', items, '')
                    : '<h3 class="section-title">Recent activity</h3><ul class="amcc-activity-list">'
                        + logs.map(l => '<li><span class="amcc-act">' + escapeHtml(l.action) + '</span> '
                        + '<span class="amcc-act-meta">' + escapeHtml(formatDate(l.timestamp)) + '</span>'
                        + (l.details && l.details.matchId ? ' · ' + renderMatchHeadlineLink(state, l.details.matchId) : '')
                        + '</li>').join('')
                        + '</ul>';
            }
        }
    }

    function aggregateProjectRows(state, filters) {
        const q = (filters.search || '').trim();
        const rows = new Map();
        const blockedIds = new Set(getBlockedMatches(state).map(b => b.matchId));
        for (const pm of state.postMatches) {
            if (filters.matchType && mapUiMatchType(pm.matchType) !== filters.matchType) continue;
            const oppIds = collectOpportunityIdsFromPostMatch(pm);
            let projectId = pm.projectId || null;
            let projectName = null;
            for (const oid of oppIds) {
                const o = state.oppById.get(oid);
                if (o && o.projectId) {
                    projectId = o.projectId;
                    projectName = o.projectName || o.projectTitle || projectId;
                    break;
                }
            }
            const key = projectId || '__none__';
            if (!rows.has(key)) {
                rows.set(key, {
                    projectId: projectId || null,
                    projectName: projectName || (key === '__none__' ? 'No project linked' : projectId),
                    opportunityIds: new Set(),
                    matches: [],
                    blocked: 0,
                    scores: []
                });
            }
            const row = rows.get(key);
            oppIds.forEach(id => row.opportunityIds.add(id));
            row.matches.push(pm);
            if (blockedIds.has(pm.id)) row.blocked++;
            if (typeof pm.matchScore === 'number') row.scores.push(pm.matchScore);
        }
        const list = [];
        rows.forEach((row, key) => {
            const matches = row.matches;
            const counts = { recommended: 0, barter: 0, consortium: 0, circular: 0, confirmed: 0 };
            const confirmedSt = String((global.CONFIG && global.CONFIG.POST_MATCH_STATUS && global.CONFIG.POST_MATCH_STATUS.CONFIRMED) || 'confirmed').toLowerCase();
            let deals = 0;
            let contracts = 0;
            for (const m of matches) {
                const ui = mapUiMatchType(m.matchType);
                counts[ui]++;
                if ((m.status || '').toLowerCase() === confirmedSt) counts.confirmed++;
                const ds = state.dealsByMatchId.get(m.id) || [];
                deals += ds.length;
                for (const d of ds) {
                    const cl = state.contractsByDealId.get(d.id) || [];
                    contracts += cl.length;
                }
            }
            const avg = row.scores.length ? Math.round((row.scores.reduce((a, b) => a + b, 0) / row.scores.length) * 100) + '%' : '—';
            let last = null;
            matches.forEach(m => {
                const t = m.updatedAt || m.createdAt;
                if (t && (!last || t > last)) last = t;
            });
            const title = row.projectName || row.projectId || 'No project linked';
            if (!textMatches(q, [title, row.projectId, key])) return;
            list.push({
                key,
                title,
                projectId: row.projectId,
                firstMatchId: matches[0] ? matches[0].id : null,
                oppCount: row.opportunityIds.size,
                total: matches.length,
                counts,
                confirmed: counts.confirmed,
                deals,
                contracts,
                blocked: row.blocked,
                avg,
                lastActivity: last
            });
        });
        list.sort((a, b) => b.total - a.total);
        return list;
    }

    function renderProjectMatches(state, filters) {
        const body = document.getElementById('amcc-project-matches-body');
        if (!body) return;
        const rows = aggregateProjectRows(state, filters);
        if (!rows.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-folders', 'No matches found', 'Run the matching report or persist matches from opportunities.', '');
            return;
        }
        const U = ui();
        body.innerHTML = '<div class="amcc-card-grid">'
            + rows.map(function (r) {
                const headerHtml = '<h4>' + escapeHtml(r.title) + '</h4>'
                    + (r.projectId ? '<span class="amcc-muted">' + escapeHtml(r.projectId) + '</span>' : '');
                const dl = '<dl class="amcc-dl">'
                    + '<div><dt>Opportunities</dt><dd>' + r.oppCount + '</dd></div>'
                    + '<div><dt>Total matches</dt><dd>' + r.total + '</dd></div>'
                    + '<div><dt>Recommended</dt><dd>' + r.counts.recommended + '</dd></div>'
                    + '<div><dt>Barter</dt><dd>' + r.counts.barter + '</dd></div>'
                    + '<div><dt>Consortium</dt><dd>' + r.counts.consortium + '</dd></div>'
                    + '<div><dt>Circular</dt><dd>' + r.counts.circular + '</dd></div>'
                    + '<div><dt>Confirmed</dt><dd>' + r.confirmed + '</dd></div>'
                    + '<div><dt>Deals</dt><dd>' + r.deals + '</dd></div>'
                    + '<div><dt>Contracts</dt><dd>' + r.contracts + '</dd></div>'
                    + '<div><dt>Blocked</dt><dd>' + r.blocked + '</dd></div>'
                    + '<div><dt>Avg score</dt><dd>' + escapeHtml(r.avg) + '</dd></div>'
                    + '<div><dt>Last activity</dt><dd>' + escapeHtml(formatDate(r.lastActivity)) + '</dd></div>'
                    + '</dl>';
                const footerHtml = ''
                    + (r.firstMatchId ? '<a href="#" class="btn btn-primary btn-sm" data-route="' + escapeHtml(routeMatch(r.firstMatchId)) + '">View project matches</a>' : '')
                    + '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml((global.CONFIG && global.CONFIG.ROUTES && global.CONFIG.ROUTES.ADMIN_AUDIT) || '/admin/audit') + '">View audit</a>';
                if (U.renderDetailsCard) {
                    return U.renderDetailsCard({ headerHtml: headerHtml, bodyHtml: dl, footerHtml: footerHtml });
                }
                return ''
                    + '<article class="amcc-card">'
                    + '<header class="amcc-card-head"><h4>' + escapeHtml(r.title) + '</h4>'
                    + (r.projectId ? '<span class="amcc-muted">' + escapeHtml(r.projectId) + '</span>' : '')
                    + '</header>'
                    + dl
                    + '<footer class="amcc-card-actions">' + footerHtml + '</footer>'
                    + '</article>';
            }).join('')
            + '</div>';
    }

    function aggregateOpportunityRows(state, filters) {
        const q = (filters.search || '').trim();
        const byOpp = new Map();
        for (const pm of state.postMatches) {
            if (filters.matchType && mapUiMatchType(pm.matchType) !== filters.matchType) continue;
            const oid = getPrimaryOpportunityId(pm);
            if (!oid) continue;
            if (!byOpp.has(oid)) {
                byOpp.set(oid, { opportunityId: oid, matches: [], scores: [] });
            }
            const row = byOpp.get(oid);
            row.matches.push(pm);
            if (typeof pm.matchScore === 'number') row.scores.push(pm.matchScore);
        }
        const list = [];
        byOpp.forEach(row => {
            const opp = state.oppById.get(row.opportunityId);
            const title = opp ? opp.title : row.opportunityId;
            const owner = opp ? opp.creatorId : '';
            if (!textMatches(q, [title, row.opportunityId, owner])) return;
            const invs = state.invitations.filter(i => i.opportunityId === row.opportunityId);
            const negs = state.negotiations.filter(n => n.opportunityId === row.opportunityId);
            const deals = state.deals.filter(d => row.matches.some(m => m.id === d.matchId));
            const scores = row.scores;
            const best = scores.length ? Math.round(Math.max(...scores) * 100) + '%' : '—';
            const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) + '%' : '—';
            const types = {};
            row.matches.forEach(m => { types[mapUiMatchType(m.matchType)] = true; });
            list.push({
                opportunityId: row.opportunityId,
                matches: row.matches,
                title,
                projectName: opp && opp.projectName ? opp.projectName : (opp && opp.projectId) || '—',
                owner,
                matchCount: row.matches.length,
                best,
                avg,
                types: Object.keys(types).map(mapUiMatchLabel).join(', ') || '—',
                invitationsSent: invs.filter(i => ['sent', 'invitation_sent'].includes((i.status || '').toLowerCase())).length,
                appsFromInv: state.applications.filter(a => a.opportunityId === row.opportunityId && a.invitationId).length,
                negotiations: negs.length,
                deals: deals.length,
                oppStatus: opp ? opp.status : '—',
                lastRun: null
            });
        });
        list.sort((a, b) => b.matchCount - a.matchCount);
        return list;
    }

    function renderOpportunityMatches(state, filters) {
        const body = document.getElementById('amcc-opportunity-matches-body');
        if (!body) return;
        const persist = typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.matching.persist');
        const rows = aggregateOpportunityRows(state, filters);
        if (!rows.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-briefcase', 'No opportunity matches', 'Persisted POST_MATCHES need a primary opportunity id.', '');
            return;
        }
        const persistBtn = (id) => persist
            ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-persist="' + escapeHtml(id) + '">Persist matches</button>'
            : '<button type="button" class="btn btn-secondary btn-sm" disabled title="' + escapeHtml(TITLE_NO_PERM) + '">Persist matches</button>';
        const refreshBtn = (id) => persist
            ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-refresh="' + escapeHtml(id) + '">Refresh matching</button>'
            : '<button type="button" class="btn btn-secondary btn-sm" disabled title="' + escapeHtml(TITLE_NO_PERM) + '">Refresh matching</button>';
        const pg = paginatedRows(rows, 'opportunity');
        const pageRows = pg.slice;
        const U = ui();
        const theadCols = [
            { title: 'Opportunity' },
            { title: 'Project' },
            { title: 'Owner' },
            { title: 'Matches', align: 'right' },
            { title: 'Best', align: 'right' },
            { title: 'Avg', align: 'right' },
            { title: 'Types' },
            { title: 'Invites', align: 'right' },
            { title: 'Apps from invites', align: 'right' },
            { title: 'Negotiations', align: 'right' },
            { title: 'Deals', align: 'right' },
            { title: 'Status' },
            { title: 'Actions' }
        ];
        const tbody = pageRows.map(function (r) {
                const firstMatch = r.matches && r.matches[0];
                const matchLink = firstMatch
                    ? '<a href="#" class="btn btn-primary btn-sm" data-route="' + escapeHtml(routeMatch(firstMatch.id)) + '">View matches</a>'
                    : '';
                return '<tr>'
                    + '<td>' + escapeHtml(r.title) + '</td>'
                    + '<td>' + escapeHtml(r.projectName) + '</td>'
                    + '<td>' + escapeHtml(r.owner || '—') + '</td>'
                    + '<td class="amcc-td-num">' + r.matchCount + '</td>'
                    + '<td class="amcc-td-num">' + escapeHtml(r.best) + '</td>'
                    + '<td class="amcc-td-num">' + escapeHtml(r.avg) + '</td>'
                    + '<td>' + escapeHtml(r.types) + '</td>'
                    + '<td class="amcc-td-num">' + r.invitationsSent + '</td>'
                    + '<td class="amcc-td-num">' + r.appsFromInv + '</td>'
                    + '<td class="amcc-td-num">' + r.negotiations + '</td>'
                    + '<td class="amcc-td-num">' + r.deals + '</td>'
                    + '<td>' + badgeHtml(r.oppStatus, 'opportunity') + '</td>'
                    + '<td class="amcc-actions">'
                    + matchLink
                    + '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeOpp(r.opportunityId)) + '">View opportunity</a>'
                    + refreshBtn(r.opportunityId)
                    + persistBtn(r.opportunityId)
                    + '</td></tr>';
            }).join('');
        if (U.renderDataTable) {
            body.innerHTML = U.renderDataTable(theadCols, tbody, {
                key: 'opportunity',
                page: pg.page,
                pageSize: pg.pageSize,
                total: pg.total,
                maxPage: pg.maxPage
            });
        } else {
            body.innerHTML = '<div class="amcc-table-wrap"><table class="amcc-table"><thead><tr>'
                + '<th>Opportunity</th><th>Project</th><th>Owner</th><th>Matches</th><th>Best</th><th>Avg</th><th>Types</th>'
                + '<th>Invites</th><th>Apps from invites</th><th>Negotiations</th><th>Deals</th><th>Status</th><th>Actions</th>'
                + '</tr></thead><tbody>'
                + tbody
                + '</tbody></table></div>';
        }
    }

    function renderBlockedMatches(state, filters) {
        const body = document.getElementById('amcc-blocked-body');
        if (!body) return;
        const blocked = getBlockedMatches(state).filter(function (b) {
            if (filters.matchType && mapUiMatchType(b.match.matchType) !== filters.matchType) return false;
            const sm = matchSummaryFromState(state, b.matchId);
            return textMatches(filters.search, [b.matchId, b.opportunityTitle, b.projectId, sm.headline, sm.matchTypeLabel].concat(sm.participantLines, b.reasons.map(x => x.label)));
        });
        if (!blocked.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-seal-check', 'No blocked matches', 'When participants decline, signatures stall, or replacements stall, they will surface here.', '');
            return;
        }
        const U = ui();
        body.innerHTML = '<div class="amcc-card-grid">'
            + blocked.map(function (b) {
                const headerHtml = badgeHtml('blocked', 'system') + ' '
                    + badgeHtml(b.matchTypeUi, 'match')
                    + '<span class="amcc-card-score">' + (typeof b.score === 'number' ? Math.round(b.score * 100) + '%' : '—') + '</span>';
                const bodyHtml = '<p><strong>Match</strong></p>' + renderMatchSummaryStack(state, b.matchId, 'amcc-match-summary-link')
                    + '<p><strong>Project</strong> ' + escapeHtml(b.projectId || '—') + '</p>'
                    + '<p><strong>Opportunity</strong> ' + escapeHtml(b.opportunityTitle || b.opportunityId || '—') + '</p>'
                    + '<p><strong>Blockers</strong> ' + escapeHtml(b.reasons.map(r => r.label).join('; ')) + '</p>';
                const footerHtml = ''
                    + '<a href="#" class="btn btn-primary btn-sm" data-route="' + escapeHtml(routeMatch(b.matchId)) + '">View match</a>'
                    + (b.deal ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeDeal(b.deal.id)) + '">View deal</a>' : '')
                    + (b.contract ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeContract(b.contract.id)) + '">View contract</a>' : '');
                if (U.renderDetailsCard) {
                    return U.renderDetailsCard({
                        modifierClass: 'amcc-card--blocked',
                        headerHtml: headerHtml,
                        bodyHtml: bodyHtml,
                        footerHtml: footerHtml
                    });
                }
                return ''
                    + '<article class="amcc-card amcc-card--blocked">'
                    + '<header class="amcc-card-head">' + headerHtml + '</header>'
                    + bodyHtml
                    + '<footer class="amcc-card-actions">' + footerHtml + '</footer>'
                    + '</article>';
            }).join('')
            + '</div>';
    }

    function renderInvitations(state, filters) {
        const body = document.getElementById('amcc-invitations-body');
        const metrics = document.getElementById('amcc-invitations-metrics');
        if (metrics) {
            const a = getInvitationAnalytics(state);
            metrics.innerHTML = '<div class="amcc-metric-inline">' + renderKpiCard(a.sent, 'Invitations sent', '', '')
                + renderKpiCard(a.appsFromInv, 'Applications from invitations', '', '')
                + renderKpiCard(a.invitationToApplicationRate, 'Invitation → application', '', '')
                + renderKpiCard(a.dealsFromInvitedApps, 'Deals from invited applications', '', '')
                + renderKpiCard(a.replAccepted, 'Replacement invites accepted', '', '') + '</div>';
        }
        if (!body) return;
        let list = state.invitations.slice();
        const fk = filters.invitationFilter || 'all';
        if (fk === 'apply') list = list.filter(i => (i.invitationKind || 'apply').toLowerCase() !== 'replacement');
        if (fk === 'replacement') list = list.filter(i => (i.invitationKind || '').toLowerCase() === 'replacement');
        if (fk === 'sent') list = list.filter(i => ['sent', 'invitation_sent'].includes((i.status || '').toLowerCase()));
        if (fk === 'accepted') list = list.filter(i => (i.status || '').toLowerCase() === 'accepted');
        if (fk === 'declined') list = list.filter(i => (i.status || '').toLowerCase() === 'declined');
        if (fk === 'expired') list = list.filter(i => (i.status || '').toLowerCase() === 'expired');
        if (fk === 'superseded') list = list.filter(i => (i.status || '').toLowerCase() === 'superseded');
        if (fk === 'with_app') list = list.filter(i => !!i.applicationId);
        if (fk === 'without_app') list = list.filter(i => !i.applicationId);
        if (fk === 'with_deal') list = list.filter(i => !!i.dealId);
        if (fk === 'without_deal') list = list.filter(i => !i.dealId);
        list = list.filter(function (i) {
            const extra = i.matchId ? (function () {
                const sm = matchSummaryFromState(state, i.matchId);
                return [sm.headline, sm.matchTypeLabel].concat(sm.participantLines);
            })() : [];
            return textMatches(filters.search, [i.id, i.opportunityId, i.matchId, i.invitedUserId, i.invitedCompanyId].concat(extra));
        });
        if (!list.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-paper-plane-tilt', 'No invitations yet', 'Invite-to-apply and replacement invitations will be listed here.', '');
            return;
        }
        const pg = paginatedRows(list, 'invitations');
        const pageRows = pg.slice;
        const U = ui();
        const theadCols = [
            { title: 'Type' },
            { title: 'Status' },
            { title: 'Opportunity' },
            { title: 'Match' },
            { title: 'Invited' },
            { title: 'By' },
            { title: 'Application' },
            { title: 'Deal' },
            { title: 'Created' },
            { title: 'Responded' },
            { title: 'Actions' }
        ];
        const tbody = pageRows.map(function (inv) {
                const kind = (inv.invitationKind || 'apply').toLowerCase() === 'replacement' ? 'Replacement' : 'Apply';
                const invited = inv.invitedUserId || inv.invitedCompanyId || '—';
                const deal = inv.dealId ? 'Yes' : '—';
                return '<tr>'
                    + '<td>' + escapeHtml(kind) + '</td>'
                    + '<td>' + badgeHtml(inv.status, 'notification') + '</td>'
                    + '<td>' + escapeHtml(inv.opportunityId || '—') + '</td>'
                    + '<td>' + (inv.matchId ? renderMatchSummaryCompact(state, inv.matchId) : '—') + '</td>'
                    + '<td>' + escapeHtml(invited) + '</td>'
                    + '<td>' + escapeHtml(inv.invitedBy || '—') + '</td>'
                    + '<td>' + (inv.applicationId ? escapeHtml(inv.applicationId) : '—') + '</td>'
                    + '<td>' + escapeHtml(deal) + '</td>'
                    + '<td>' + escapeHtml(formatDate(inv.createdAt)) + '</td>'
                    + '<td>' + escapeHtml(formatDate(inv.respondedAt)) + '</td>'
                    + '<td class="amcc-actions">'
                    + (inv.matchId ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeMatch(inv.matchId)) + '">View match</a>' : '')
                    + '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeOpp(inv.opportunityId)) + '">View opportunity</a>'
                    + (inv.applicationId ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeOpp(inv.opportunityId) + '?applicationId=' + encodeURIComponent(inv.applicationId)) + '">View application</a>' : '')
                    + (inv.dealId ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeDeal(inv.dealId)) + '">View deal</a>' : '')
                    + '</td></tr>';
            }).join('');
        if (U.renderDataTable) {
            body.innerHTML = U.renderDataTable(theadCols, tbody, {
                key: 'invitations',
                page: pg.page,
                pageSize: pg.pageSize,
                total: pg.total,
                maxPage: pg.maxPage
            });
        } else {
            body.innerHTML = '<div class="amcc-table-wrap"><table class="amcc-table"><thead><tr>'
                + '<th>Type</th><th>Status</th><th>Opportunity</th><th>Match</th><th>Invited</th><th>By</th><th>Application</th><th>Deal</th><th>Created</th><th>Responded</th><th>Actions</th>'
                + '</tr></thead><tbody>'
                + tbody
                + '</tbody></table></div>';
        }
    }

    function renderReplacements(state, filters) {
        const body = document.getElementById('amcc-replacements-body');
        if (!body) return;
        const persist = typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.matching.persist');
        let list = (state.replacements || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        list = list.filter(function (r) {
            const extra = r.matchId ? (function () {
                const sm = matchSummaryFromState(state, r.matchId);
                return [sm.headline, sm.matchTypeLabel].concat(sm.participantLines);
            })() : [];
            return textMatches(filters.search, [r.id, r.matchId, r.opportunityId, r.blockedParticipantId].concat(extra));
        });
        if (!list.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-arrows-clockwise', 'No replacement requests', 'Consortium and circular replacement flows will appear here.', '');
            return;
        }
        const U = ui();
        body.innerHTML = '<div class="amcc-card-grid">'
            + list.map(function (r) {
                const dk = (r.status || '').toLowerCase() === 'cancelled' && r.supersededByReplacementRequestId ? 'superseded' : (r.status || '');
                const inv = r.invitationId ? state.invitations.find(i => i.id === r.invitationId) : null;
                let contract = null;
                if (r.contractId) contract = state.contracts.find(c => c.id === r.contractId) || null;
                if (!contract && r.dealId) {
                    const cl = state.contractsByDealId.get(r.dealId) || [];
                    contract = cl[0] || null;
                }
                const contractActive = isContractActive(contract);
                const finDisabled = (dk || '').toLowerCase() !== 'replacement_accepted' || contractActive || !persist;
                const finTitle = !persist ? TITLE_NO_PERM : (contractActive ? 'This contract is already active. Use contract amendment or termination flow.' : '');
                const headerHtml = badgeHtml(dk, 'replacement_request');
                const dl = '<dl class="amcc-dl">'
                    + '<div><dt>Match</dt><dd>' + renderMatchSummaryCompact(state, r.matchId) + '</dd></div>'
                    + '<div><dt>Opportunity</dt><dd>' + escapeHtml(r.opportunityId || '—') + '</dd></div>'
                    + '<div><dt>Requested by</dt><dd>' + escapeHtml(r.requestedBy || '—') + ' (' + escapeHtml(r.requestedByRole || '—') + ')</dd></div>'
                    + '<div><dt>Role to fill</dt><dd>' + escapeHtml(r.roleToFill || '—') + '</dd></div>'
                    + '<div><dt>Blocked participant</dt><dd>' + escapeHtml(r.blockedParticipantId || '—') + '</dd></div>'
                    + '<div><dt>Suggested</dt><dd>' + escapeHtml(r.suggestedUserId || r.suggestedCompanyId || '—') + '</dd></div>'
                    + '<div><dt>Invitation</dt><dd>' + escapeHtml(r.invitationId || (inv ? inv.id : '—')) + '</dd></div>'
                    + '<div><dt>Dates</dt><dd>' + escapeHtml(formatDate(r.createdAt)) + ' / reviewed ' + escapeHtml(formatDate(r.reviewedAt)) + ' / responded ' + escapeHtml(formatDate(r.respondedAt)) + '</dd></div>'
                    + '</dl>';
                const footerHtml = ''
                    + '<a href="#" class="btn btn-primary btn-sm" data-route="' + escapeHtml(routeMatch(r.matchId)) + '">View match</a>'
                    + ((dk || '').toLowerCase() === 'pending_owner_review' && persist
                        ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-repl-approve="' + escapeHtml(r.id) + '">Approve suggestion</button>'
                        + '<button type="button" class="btn btn-secondary btn-sm" data-amcc-repl-reject="' + escapeHtml(r.id) + '">Reject suggestion</button>'
                        : ((dk || '').toLowerCase() === 'pending_owner_review'
                            ? '<button type="button" class="btn btn-secondary btn-sm" disabled title="' + escapeHtml(TITLE_NO_PERM) + '">Approve suggestion</button>'
                            : ''))
                    + (!finDisabled
                        ? '<button type="button" class="btn btn-secondary btn-sm" data-amcc-repl-finalize="' + escapeHtml(r.id) + '">Finalize replacement</button>'
                        : ((dk || '').toLowerCase() === 'replacement_accepted'
                            ? '<button type="button" class="btn btn-secondary btn-sm" disabled title="' + escapeHtml(finTitle) + '">Finalize replacement</button>'
                            : ''));
                if (U.renderDetailsCard) {
                    return U.renderDetailsCard({
                        headerHtml: headerHtml,
                        bodyHtml: dl,
                        footerHtml: footerHtml,
                        dataRowAttr: r.id
                    });
                }
                return ''
                    + '<article class="amcc-card" data-replacement-row="' + escapeHtml(r.id) + '">'
                    + '<header class="amcc-card-head">' + headerHtml + '</header>'
                    + dl
                    + '<footer class="amcc-card-actions">' + footerHtml + '</footer>'
                    + '</article>';
            }).join('')
            + '</div>';
    }

    function resolveParticipantLabel(state, userId) {
        if (!userId) return '';
        const u = state.userById && state.userById.get(userId);
        if (u) {
            const p = u.profile || {};
            const nm = (p.name || [p.firstName, p.lastName].filter(Boolean).join(' ')).trim();
            return nm || u.email || userId;
        }
        const c = state.companyById && state.companyById.get(userId);
        if (c) {
            const p = c.profile || {};
            return (p.name || c.name || c.companyName || c.legalName || '').trim() || userId;
        }
        return userId;
    }

    function opportunityDisplay(state, opportunityId) {
        if (!opportunityId) {
            return { title: '—', subtitle: '', href: '' };
        }
        const href = routeOpp(opportunityId);
        const opp = state.oppById ? state.oppById.get(opportunityId) : null;
        if (!opp) {
            return { title: 'Opportunity (details unavailable)', subtitle: opportunityId, href: href };
        }
        const title = (opp.title || opp.name || '').trim() || 'Untitled opportunity';
        const subtitle = (opp.projectName || opp.projectTitle || '').trim()
            || ((opp.projectId && opp.projectId !== opportunityId) ? String(opp.projectId) : '');
        return { title: title, subtitle: subtitle, href: href };
    }

    function matchSummaryFromState(state, matchId) {
        const mid = matchId ? String(matchId) : '';
        if (!mid) {
            return { matchId: '', headline: '—', participantLines: [], matchTypeLabel: '' };
        }
        const pm = (state.postMatches || []).find(function (m) { return m.id === mid; });
        const P = global.postMatchDisplay;
        if (!pm || !P || typeof P.summarizeFromMaps !== 'function') {
            return { matchId: mid, headline: mid, participantLines: [], matchTypeLabel: '' };
        }
        return P.summarizeFromMaps(pm, {
            oppById: state.oppById,
            userById: state.userById,
            companyById: state.companyById
        });
    }

    function renderMatchSummaryStack(state, matchId, anchorClass) {
        const sm = matchSummaryFromState(state, matchId);
        const route = routeMatch(matchId);
        const title = 'Match ID: ' + (sm.matchId || String(matchId));
        const ac = anchorClass || 'amcc-match-summary-link';
        let inner = '<span class="amcc-match-summary__head">' + escapeHtml(sm.headline) + '</span>';
        sm.participantLines.forEach(function (line) {
            inner += '<span class="amcc-match-summary__line">' + escapeHtml(line) + '</span>';
        });
        if (sm.matchTypeLabel) {
            inner += '<span class="amcc-match-summary__type">' + escapeHtml(sm.matchTypeLabel) + '</span>';
        }
        return '<div class="amcc-match-summary"><a href="#" class="' + escapeHtml(ac) + '" data-route="' + escapeHtml(route) + '" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + '">' + inner + '</a></div>';
    }

    function renderMatchSummaryCompact(state, matchId) {
        const sm = matchSummaryFromState(state, matchId);
        const route = routeMatch(matchId);
        const title = 'Match ID: ' + (sm.matchId || String(matchId));
        let sub = sm.participantLines[0] || '';
        if (sm.participantLines.length > 1) {
            sub += ' (+' + String(sm.participantLines.length - 1) + ')';
        }
        let inner = '<span class="amcc-match-summary__head">' + escapeHtml(sm.headline) + '</span>';
        if (sub) inner += '<span class="amcc-match-summary__line">' + escapeHtml(sub) + '</span>';
        if (sm.matchTypeLabel) {
            inner += '<span class="amcc-match-summary__type">' + escapeHtml(sm.matchTypeLabel) + '</span>';
        }
        return '<div class="amcc-match-summary amcc-match-summary--compact"><a href="#" class="amcc-match-summary-link" data-route="' + escapeHtml(route) + '" title="' + escapeHtml(title) + '">' + inner + '</a></div>';
    }

    function renderMatchHeadlineLink(state, matchId) {
        const sm = matchSummaryFromState(state, matchId);
        const route = routeMatch(matchId);
        const title = 'Match ID: ' + (sm.matchId || String(matchId));
        return '<a href="#" data-route="' + escapeHtml(route) + '" title="' + escapeHtml(title) + '">' + escapeHtml(sm.headline) + '</a>';
    }

    function negotiationSearchParts(state, n) {
        const parts = [n.id, n.matchId, n.opportunityId];
        const disp = opportunityDisplay(state, n.opportunityId);
        parts.push(disp.title, disp.subtitle);
        if (n.matchId) {
            const msm = matchSummaryFromState(state, n.matchId);
            parts.push(msm.headline, msm.matchTypeLabel);
            msm.participantLines.forEach(function (ln) { parts.push(ln); });
        }
        (n.parties || []).forEach(function (p) {
            parts.push(p.userId, p.role, resolveParticipantLabel(state, p.userId));
        });
        return parts;
    }

    function formatRoleLabel(role) {
        if (!role) return '';
        return String(role).replace(/_/g, ' ').replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    }

    function renderNegotiations(state, filters) {
        const body = document.getElementById('amcc-negotiations-body');
        const metrics = document.getElementById('amcc-negotiations-metrics');
        if (metrics) {
            const n = getNegotiationAnalytics(state);
            metrics.innerHTML = '<section class="amcc-neg-summary" aria-label="Negotiation summary metrics">'
                + '<div class="amcc-neg-summary-grid">'
                + '<div class="amcc-neg-summary-card"><span class="amcc-neg-summary-label">Negotiations started</span>'
                + '<span class="amcc-neg-summary-value">' + escapeHtml(String(n.started)) + '</span>'
                + '<span class="amcc-neg-summary-hint">With a linked match</span></div>'
                + '<div class="amcc-neg-summary-card"><span class="amcc-neg-summary-label">Terms agreed</span>'
                + '<span class="amcc-neg-summary-value">' + escapeHtml(String(n.agreed)) + '</span>'
                + '<span class="amcc-neg-summary-hint">Closed successfully</span></div>'
                + '<div class="amcc-neg-summary-card"><span class="amcc-neg-summary-label">Deals from negotiations</span>'
                + '<span class="amcc-neg-summary-value">' + escapeHtml(String(n.withDeal)) + '</span>'
                + '<span class="amcc-neg-summary-hint">Linked workspaces</span></div>'
                + '<div class="amcc-neg-summary-card"><span class="amcc-neg-summary-label">Negotiation → deal</span>'
                + '<span class="amcc-neg-summary-value">' + escapeHtml(String(n.negotiationToDealRate)) + '</span>'
                + '<span class="amcc-neg-summary-hint">Share of agreed threads</span></div>'
                + '<div class="amcc-neg-summary-card"><span class="amcc-neg-summary-label">Avg. time to agreement</span>'
                + '<span class="amcc-neg-summary-value">' + escapeHtml(String(n.avgDaysToAgreement)) + '</span>'
                + '<span class="amcc-neg-summary-hint">Among agreed negotiations</span></div>'
                + '</div></section>';
        }
        if (!body) return;
        let list = state.negotiations.filter(n => n.matchId);
        const fk = filters.negotiationFilter || 'all';
        if (fk === 'open') list = list.filter(n => (n.status || '').toLowerCase() === 'open');
        if (fk === 'agreed') list = list.filter(n => (n.status || '').toLowerCase() === 'agreed');
        if (fk === 'cancelled') list = list.filter(n => ['cancelled', 'failed', 'expired'].includes((n.status || '').toLowerCase()));
        if (fk === 'deal') list = list.filter(n => state.dealByNegotiationId.has(n.id));
        if (fk === 'no_deal') list = list.filter(n => !state.dealByNegotiationId.has(n.id));
        list = list.filter(n => textMatches(filters.search, negotiationSearchParts(state, n)));
        if (!list.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-chats-circle', 'No negotiations yet', 'Negotiations created from matches will appear here.', '');
            return;
        }
        const pg = paginatedRows(list, 'negotiations');
        const pageRows = pg.slice;
        const U = ui();
        const cards = pageRows.map(function (n) {
            const pm = state.postMatches.find(m => m.id === n.matchId);
            const typeLabel = pm ? mapUiMatchLabel(mapUiMatchType(pm.matchType)) : '—';
            const deal = state.dealByNegotiationId.get(n.id);
            const od = opportunityDisplay(state, n.opportunityId);
            const agreedAt = (n.status || '').toLowerCase() === 'agreed' ? (n.updatedAt || n.agreedAt) : null;
            const participants = (n.parties || []).length
                ? '<ul class="amcc-neg-participant-list" role="list">'
                    + (n.parties || []).map(function (p) {
                        const who = resolveParticipantLabel(state, p.userId);
                        const rl = formatRoleLabel(p.role);
                        return '<li class="amcc-neg-participant-item">'
                            + '<span class="amcc-neg-participant-name">' + escapeHtml(who) + '</span>'
                            + (rl ? '<span class="amcc-neg-participant-role">' + escapeHtml(rl) + '</span>' : '')
                            + '</li>';
                    }).join('')
                    + '</ul>'
                : '<p class="amcc-neg-muted">—</p>';
            const oppBlock = od.href
                ? '<a href="#" class="amcc-neg-opp-title" data-route="' + escapeHtml(od.href) + '">' + escapeHtml(od.title) + '</a>'
                + (od.subtitle ? '<span class="amcc-neg-opp-project">' + escapeHtml(od.subtitle) + '</span>' : '')
                : '<span class="amcc-neg-opp-title">' + escapeHtml(od.title) + '</span>';
            const dealTitleTxt = deal ? (deal.title || deal.scope || '').trim() : '';
            const dealPrimary = dealTitleTxt || (deal && deal.id) || '';
            const dealSubId = deal && dealTitleTxt && deal.id ? deal.id : '';
            const dealLine = deal
                ? '<a href="#" class="amcc-neg-deal-link" data-route="' + escapeHtml(routeDeal(deal.id)) + '">'
                + escapeHtml(dealPrimary || deal.id)
                + '</a>'
                + (dealSubId ? '<span class="amcc-neg-deal-id">' + escapeHtml(dealSubId) + '</span>' : '')
                : '<span class="amcc-neg-muted">—</span>';
            const matchLine = n.matchId
                ? renderMatchSummaryStack(state, n.matchId, 'amcc-neg-match-link')
                : '<span class="amcc-neg-muted">—</span>';
            const actions = ''
                + (n.matchId ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeMatch(n.matchId)) + '">View match</a>' : '')
                + (n.matchId ? '<a href="#" class="btn btn-primary btn-sm" data-route="' + escapeHtml(routeMatch(n.matchId)) + '">Continue negotiation</a>' : '')
                + (n.opportunityId && od.href ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(od.href) + '">View opportunity</a>' : '')
                + (deal ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeDeal(deal.id)) + '">View deal</a>' : '');
            return ''
                + '<article class="amcc-neg-card" data-negotiation-id="' + escapeHtml(n.id) + '">'
                + '<div class="amcc-neg-card-head">'
                + '<div class="amcc-neg-card-badges">' + badgeHtml(n.status, 'negotiation')
                + '<span class="amcc-neg-type-pill">' + escapeHtml(typeLabel) + '</span></div>'
                + '<div class="amcc-neg-card-dates">'
                + '<span><strong>Created</strong> ' + escapeHtml(formatDate(n.createdAt)) + '</span>'
                + '<span><strong>Agreed</strong> ' + escapeHtml(formatDate(agreedAt)) + '</span>'
                + '</div></div>'
                + '<div class="amcc-neg-card-body">'
                + '<div class="amcc-neg-col amcc-neg-col--opp">'
                + '<span class="amcc-neg-field-label">Opportunity</span>'
                + '<div class="amcc-neg-opp-block">' + oppBlock + '</div></div>'
                + '<div class="amcc-neg-col amcc-neg-col--match">'
                + '<span class="amcc-neg-field-label">Match</span>' + matchLine + '</div>'
                + '<div class="amcc-neg-col amcc-neg-col--people">'
                + '<span class="amcc-neg-field-label">Participants</span>' + participants + '</div>'
                + '<div class="amcc-neg-col amcc-neg-col--deal">'
                + '<span class="amcc-neg-field-label">Deal</span><div class="amcc-neg-deal-block">' + dealLine + '</div></div>'
                + '</div>'
                + (actions ? '<footer class="amcc-neg-card-actions">' + actions + '</footer>' : '')
                + '</article>';
        }).join('');
        const pgNav = U.renderPaginationNav ? U.renderPaginationNav({
            key: 'negotiations',
            page: pg.page,
            pageSize: pg.pageSize,
            total: pg.total,
            maxPage: pg.maxPage
        }) : '';
        body.innerHTML = ''
            + '<div class="amcc-neg-queue">'
            + '<div class="amcc-neg-queue-head">'
            + '<h3 class="amcc-neg-queue-title">Active negotiations</h3>'
            + '<p class="amcc-neg-queue-meta">' + escapeHtml(String(pg.total)) + ' total'
            + (pg.total > 0
                ? ' · showing ' + escapeHtml(String((pg.page - 1) * pg.pageSize + 1))
                    + '–' + escapeHtml(String(Math.min(pg.page * pg.pageSize, pg.total)))
                : '')
            + '</p>'
            + '</div>'
            + '<div class="amcc-neg-card-list" role="list">' + cards + '</div>'
            + pgNav
            + '</div>';
    }

    function renderConversionFunnelCard(title, iconClass, stages) {
        const vals = stages.map(function (s) { return typeof s.value === 'number' ? s.value : 0; });
        const top = vals.length ? vals[0] : 0;
        const fallback = vals.length ? Math.max.apply(null, [1].concat(vals)) : 1;
        const denom = top > 0 ? top : fallback;
        const rows = stages.map(function (s, idx) {
            const v = typeof s.value === 'number' ? s.value : 0;
            const pct = denom > 0 ? Math.min(100, Math.round((v / denom) * 100)) : 0;
            let hint = '';
            if (idx > 0) {
                const prev = typeof stages[idx - 1].value === 'number' ? stages[idx - 1].value : 0;
                if (prev > 0) {
                    hint = Math.round((v / prev) * 100) + '% of prior stage';
                } else if (v > 0) {
                    hint = 'No prior volume';
                } else {
                    hint = '—';
                }
            } else {
                hint = 'First stage';
            }
            return ''
                + '<div class="amcc-conv-funnel-stage">'
                + '<div class="amcc-conv-funnel-stage__row">'
                + '<span class="amcc-conv-funnel-stage__label">' + escapeHtml(s.label) + '</span>'
                + '<span class="amcc-conv-funnel-stage__val">' + escapeHtml(String(v)) + '</span>'
                + '</div>'
                + '<div class="amcc-conv-funnel-stage__track" role="presentation"><span class="amcc-conv-funnel-stage__fill" style="width:' + pct + '%"></span></div>'
                + '<span class="amcc-conv-funnel-stage__hint">' + escapeHtml(hint) + '</span>'
                + '</div>';
        }).join('');
        return ''
            + '<article class="amcc-conv-card" role="group" aria-label="' + escapeHtml(title) + '">'
            + '<header class="amcc-conv-card__head">'
            + '<span class="amcc-conv-card__icon" aria-hidden="true"><i class="' + escapeHtml(iconClass || 'ph-duotone ph-funnel-simple') + '"></i></span>'
            + '<div class="amcc-conv-card__head-text">'
            + '<h3 class="amcc-conv-card__title">' + escapeHtml(title) + '</h3>'
            + '</div>'
            + '</header>'
            + '<div class="amcc-conv-funnel">' + rows + '</div>'
            + '</article>';
    }

    function renderConversionPctBarRow(label, displayStr, pctValue) {
        const has = typeof pctValue === 'number' && !Number.isNaN(pctValue);
        const pct = has ? Math.min(100, Math.max(0, Math.round(pctValue * 100))) : 0;
        return ''
            + '<div class="amcc-bar-row amcc-conv-pct-row">'
            + '<span class="amcc-bar-label">' + escapeHtml(label) + '</span>'
            + '<span class="amcc-bar-val">' + escapeHtml(displayStr) + '</span>'
            + '<div class="amcc-bar-track"><div class="amcc-bar-fill" style="width:' + (has ? pct : 0) + '%"></div></div>'
            + '</div>';
    }

    function renderConversion(state) {
        const el = document.getElementById('amcc-conversion-body');
        if (!el) return;
        const f = getMatchingConversionFunnels(state);
        const pm = state.postMatches;
        const scores = pm.map(m => m.matchScore).filter(s => typeof s === 'number');
        const buckets = { b0: 0, b1: 0, b2: 0, b3: 0 };
        scores.forEach(s => {
            if (s < 0.5) buckets.b0++;
            else if (s < 0.7) buckets.b1++;
            else if (s < 0.9) buckets.b2++;
            else buckets.b3++;
        });
        const byTypeScore = {};
        pm.forEach(m => {
            const ui = mapUiMatchType(m.matchType);
            if (!byTypeScore[ui]) byTypeScore[ui] = [];
            if (typeof m.matchScore === 'number') byTypeScore[ui].push(m.matchScore);
        });
        const typeOrder = ['recommended', 'barter', 'consortium', 'circular'];
        const avgBars = typeOrder.map(function (k) {
            const arr = byTypeScore[k] || [];
            const label = mapUiMatchLabel(k);
            if (!arr.length) {
                return renderConversionPctBarRow(label, '—', null);
            }
            const avg = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
            return renderConversionPctBarRow(label, Math.round(avg * 100) + '%', avg);
        }).join('');

        const distMax = Math.max(buckets.b0, buckets.b1, buckets.b2, buckets.b3, 1);
        const distRows = scores.length
            ? ''
                + renderBarRow('0.90–1.00 (top tier)', buckets.b3, distMax)
                + renderBarRow('0.70–0.89 (strong fit)', buckets.b2, distMax)
                + renderBarRow('0.50–0.69 (emerging)', buckets.b1, distMax)
                + renderBarRow('0.00–0.49 (wide net)', buckets.b0, distMax)
            : '<p class="amcc-conv-chart-empty">No scored matches in this workspace yet.</p>';

        const funnelHtml = ''
            + renderConversionFunnelCard('Matches → contracts', 'ph-duotone ph-link-simple', [
                { label: 'Matches', value: f.funnel1.matches },
                { label: 'Confirmed', value: f.funnel1.confirmed },
                { label: 'Deals', value: f.funnel1.deals },
                { label: 'Contracts', value: f.funnel1.contracts }
            ])
            + renderConversionFunnelCard('Invitations → deals', 'ph-duotone ph-paper-plane-tilt', [
                { label: 'Invitations sent', value: f.funnel2.invitationsSent },
                { label: 'Applications submitted', value: f.funnel2.applicationsSubmitted },
                { label: 'Applications accepted', value: f.funnel2.applicationsAccepted },
                { label: 'Deals', value: f.funnel2.deals }
            ])
            + renderConversionFunnelCard('Negotiations (with match)', 'ph-duotone ph-chats-circle', [
                { label: 'Started', value: f.funnel3.started },
                { label: 'Agreed', value: f.funnel3.agreed },
                { label: 'Deals created', value: f.funnel3.dealsCreated }
            ])
            + renderConversionFunnelCard('Replacements', 'ph-duotone ph-arrows-clockwise', [
                { label: 'Suggestions', value: f.funnel4.suggestions },
                { label: 'Invitations sent', value: f.funnel4.invitationsSent },
                { label: 'Replacements accepted', value: f.funnel4.replacementsAccepted },
                { label: 'Participants replaced', value: f.funnel4.participantsReplaced }
            ]);

        el.innerHTML = ''
            + '<div class="amcc-conversion" aria-label="Conversion analytics">'
            + '<p class="amcc-conversion-lede">Funnel bar width is scaled to the <strong>first stage</strong> in each card so you can see drop-off at a glance.</p>'
            + '<div class="amcc-conversion-funnels">' + funnelHtml + '</div>'
            + '<div class="amcc-conversion-charts">'
            + '<section class="amcc-conv-chart-panel" aria-labelledby="amcc-conv-dist-heading">'
            + '<div class="amcc-conv-chart-panel__head">'
            + '<span class="amcc-conv-chart-panel__icon" aria-hidden="true"><i class="ph-duotone ph-chart-bar-horizontal"></i></span>'
            + '<div>'
            + '<h3 id="amcc-conv-dist-heading" class="amcc-conv-chart-panel__title">Match score distribution</h3>'
            + '<p class="amcc-conv-chart-panel__desc">Counts of saved matches by engine score band.</p>'
            + '</div></div>'
            + '<div class="amcc-conv-chart-panel__body">' + distRows + '</div>'
            + '</section>'
            + '<section class="amcc-conv-chart-panel" aria-labelledby="amcc-conv-type-heading">'
            + '<div class="amcc-conv-chart-panel__head">'
            + '<span class="amcc-conv-chart-panel__icon" aria-hidden="true"><i class="ph-duotone ph-chart-line-up"></i></span>'
            + '<div>'
            + '<h3 id="amcc-conv-type-heading" class="amcc-conv-chart-panel__title">Average score by match type</h3>'
            + '<p class="amcc-conv-chart-panel__desc">Mean match score within each persisted match type (0–100%).</p>'
            + '</div></div>'
            + '<div class="amcc-conv-chart-panel__body">' + avgBars + '</div>'
            + '</section>'
            + '</div>'
            + '<aside class="amcc-conv-callout" role="note">'
            + '<span class="amcc-conv-callout__icon" aria-hidden="true"><i class="ph-duotone ph-info"></i></span>'
            + '<p><strong>Top matched skills</strong> is not shown here yet: there is no structured skills taxonomy on opportunities in the current seed data. Add normalized skill tags to unlock category-level charts.</p>'
            + '</aside>'
            + '</div>';
    }

    function renderAudit(state, filters) {
        const body = document.getElementById('amcc-audit-body');
        if (!body) return;
        let logs = (state.auditLogs || []).slice();
        if (filters.auditAction) logs = logs.filter(l => (l.action || '') === filters.auditAction);
        logs = logs.filter(function (l) {
            const d = l.details || {};
            const mid = d.matchId || l.matchId;
            const parts = [l.action, l.entityId, l.userId, JSON.stringify(d).slice(0, 200)];
            if (mid) {
                const sm = matchSummaryFromState(state, mid);
                parts.push(sm.headline, sm.matchTypeLabel);
                sm.participantLines.forEach(function (ln) { parts.push(ln); });
            }
            return textMatches(filters.search, parts);
        });
        if (!logs.length) {
            body.innerHTML = renderEmpty('ph-duotone ph-list-checks', 'No audit logs found', 'Try clearing filters or perform matching actions to generate audit entries.', '');
            return;
        }
        const pg = paginatedRows(logs, 'audit');
        const pageRows = pg.slice;
        const U = ui();
        const theadCols = [
            { title: 'Action' },
            { title: 'Actor' },
            { title: 'Entity' },
            { title: 'IDs' },
            { title: 'Date' },
            { title: 'Actions' }
        ];
        const tbody = pageRows.map(function (l) {
                const d = l.details || {};
                const mid = d.matchId || l.matchId;
                const oid = d.opportunityId || l.opportunityId;
                const did = d.dealId || l.dealId;
                const cid = d.contractId || l.contractId;
                let idCellHtml;
                if (mid) {
                    const extraParts = [oid, d.projectId].filter(Boolean).map(function (x) { return escapeHtml(String(x)); });
                    idCellHtml = '<div class="amcc-audit-idcell">'
                        + '<div class="amcc-audit-idcell__match">' + renderMatchHeadlineLink(state, mid) + '</div>'
                        + '<div class="amcc-mono amcc-audit-idcell__id">' + escapeHtml(mid) + '</div>'
                        + (extraParts.length ? '<div class="amcc-muted">' + extraParts.join(' · ') + '</div>' : '')
                        + '</div>';
                } else {
                    idCellHtml = escapeHtml([oid, d.projectId].filter(Boolean).join(' · ') || '—');
                }
                return '<tr>'
                    + '<td>' + escapeHtml(l.action || '—') + '</td>'
                    + '<td>' + escapeHtml(l.userId || l.userName || '—') + '</td>'
                    + '<td>' + escapeHtml(l.entityType || '—') + ' / ' + escapeHtml(l.entityId || '—') + '</td>'
                    + '<td class="amcc-audit-ids">' + idCellHtml + '</td>'
                    + '<td>' + escapeHtml(formatDate(l.timestamp)) + '</td>'
                    + '<td class="amcc-actions">'
                    + (mid ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeMatch(mid)) + '">View match</a>' : '')
                    + (oid ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeOpp(oid)) + '">View opportunity</a>' : '')
                    + (did ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeDeal(did)) + '">View deal</a>' : '')
                    + (cid ? '<a href="#" class="btn btn-secondary btn-sm" data-route="' + escapeHtml(routeContract(cid)) + '">View contract</a>' : '')
                    + '</td></tr>';
            }).join('');
        if (U.renderDataTable) {
            body.innerHTML = U.renderDataTable(theadCols, tbody, {
                key: 'audit',
                page: pg.page,
                pageSize: pg.pageSize,
                total: pg.total,
                maxPage: pg.maxPage
            });
        } else {
            body.innerHTML = '<div class="amcc-table-wrap"><table class="amcc-table"><thead><tr>'
                + '<th>Action</th><th>Actor</th><th>Entity</th><th>IDs</th><th>Date</th><th>Actions</th>'
                + '</tr></thead><tbody>'
                + tbody
                + '</tbody></table></div>';
        }
    }

    function syncAmccFilterControlsVisibility(activeTab) {
        const root = document.getElementById('amcc-global-filters');
        if (!root) return;
        root.querySelectorAll('[data-amcc-for-tab]').forEach(el => {
            const forTab = el.getAttribute('data-amcc-for-tab');
            const show = forTab === activeTab;
            el.hidden = !show;
            el.setAttribute('aria-hidden', show ? 'false' : 'true');
        });
    }

    async function refreshAdminMatchingCommandCenterUI(dataService, options) {
        ensurePaginationDefaults();
        const filters = options && options.filters ? options.filters : {};
        const activeTab = options && options.activeTab ? options.activeTab : 'overview';
        const ds = dataService || global.dataService;
        const state = await getAdminMatchingCommandCenterData(ds);
        state.dataService = ds;
        const baseStats = typeof global.getAdminMatchingAnalytics === 'function' ? await global.getAdminMatchingAnalytics(ds) : {};
        const overview = buildAdminMatchingOverview(state, baseStats);

        renderOverviewPanel(state, overview, filters);
        renderProjectMatches(state, filters);
        renderOpportunityMatches(state, filters);
        renderBlockedMatches(state, filters);
        renderInvitations(state, filters);
        renderReplacements(state, filters);
        renderNegotiations(state, filters);
        renderConversion(state);
        renderAudit(state, filters);

        const panels = document.querySelectorAll('.amcc-tab-panel');
        panels.forEach(p => {
            const id = p.getAttribute('id');
            const tab = id && id.replace('amcc-panel-', '');
            p.classList.toggle('is-active', tab === activeTab);
            p.hidden = tab !== activeTab;
        });
        document.querySelectorAll('.amcc-tab').forEach(btn => {
            const t = btn.getAttribute('data-amcc-tab');
            const sel = t === activeTab;
            btn.classList.toggle('is-active', sel);
            btn.setAttribute('aria-selected', sel ? 'true' : 'false');
        });
        syncAmccFilterControlsVisibility(activeTab);
    }

    function setupPaginationDelegation() {
        const root = document.querySelector('.admin-matching-page');
        if (!root || root.dataset.amccPgDeleg === '1') return;
        root.dataset.amccPgDeleg = '1';
        root.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-amcc-pg-dir]');
            if (!btn || btn.disabled) return;
            e.preventDefault();
            const key = btn.getAttribute('data-amcc-pg-key');
            const dir = btn.getAttribute('data-amcc-pg-dir');
            if (!key || !dir) return;
            ensurePaginationDefaults();
            const st = window.__amccPagination[key];
            if (!st) return;
            if (dir === 'prev') st.page = Math.max(1, (st.page || 1) - 1);
            else if (dir === 'next') st.page = (st.page || 1) + 1;
            if (typeof global.refreshAdminMatchingCommandCenterUI === 'function') {
                void global.refreshAdminMatchingCommandCenterUI(global.dataService, {
                    filters: window.__amccFilters || {},
                    activeTab: window.__amccActiveTab || 'overview'
                });
            }
        });
        root.addEventListener('change', function (e) {
            const sel = e.target.closest('select[data-amcc-pg-psize]');
            if (!sel) return;
            const key = sel.getAttribute('data-amcc-pg-key');
            if (!key) return;
            const val = parseInt(sel.value, 10) || 25;
            ensurePaginationDefaults();
            window.__amccPagination[key].pageSize = val === 50 ? 50 : 25;
            window.__amccPagination[key].page = 1;
            if (typeof global.refreshAdminMatchingCommandCenterUI === 'function') {
                void global.refreshAdminMatchingCommandCenterUI(global.dataService, {
                    filters: window.__amccFilters || {},
                    activeTab: window.__amccActiveTab || 'overview'
                });
            }
        });
    }

    function setupReplacementDelegation() {
        const root = document.getElementById('amcc-replacements-body');
        if (!root || root.dataset.delegationBound === '1') return;
        root.dataset.delegationBound = '1';
        root.addEventListener('click', async (e) => {
            const ap = e.target.closest('[data-amcc-repl-approve]');
            const rj = e.target.closest('[data-amcc-repl-reject]');
            const fin = e.target.closest('[data-amcc-repl-finalize]');
            const ds = global.dataService;
            const user = typeof authService !== 'undefined' && authService.getCurrentUser ? authService.getCurrentUser() : null;
            const userId = user && user.id;
            const opt = {
                isAdmin: typeof authService !== 'undefined' && authService.canAccessAdmin && authService.canAccessAdmin(),
                hasMatchingPersist: typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.matching.persist')
            };
            if (!ds || !userId) return;
            if (fin) {
                e.preventDefault();
                const id = fin.getAttribute('data-amcc-repl-finalize');
                try {
                    const res = await ds.finalizeParticipantReplacement(id, userId, opt);
                    if (res && res.ok === false && res.code === 'ACTIVE_CONTRACT') {
                        global.alert(res.message || 'This contract is already active. Use contract amendment or termination flow.');
                        return;
                    }
                } catch (err) {
                    global.alert(err && err.message ? err.message : 'Finalize failed.');
                    return;
                }
                await refreshAdminMatchingCommandCenterUI(ds, { filters: window.__amccFilters || {}, activeTab: 'replacements' });
                return;
            }
            if (ap) {
                e.preventDefault();
                try {
                    await ds.approveReplacementSuggestion(ap.getAttribute('data-amcc-repl-approve'), userId, opt);
                } catch (err) {
                    global.alert(err && err.message ? err.message : 'Approve failed.');
                    return;
                }
                await refreshAdminMatchingCommandCenterUI(ds, { filters: window.__amccFilters || {}, activeTab: 'replacements' });
                return;
            }
            if (rj) {
                e.preventDefault();
                try {
                    await ds.rejectReplacementSuggestion(rj.getAttribute('data-amcc-repl-reject'), userId, opt);
                } catch (err) {
                    global.alert(err && err.message ? err.message : 'Reject failed.');
                    return;
                }
                await refreshAdminMatchingCommandCenterUI(ds, { filters: window.__amccFilters || {}, activeTab: 'replacements' });
            }
        });
    }

    function setupOpportunityActions() {
        const root = document.getElementById('amcc-opportunity-matches-body');
        if (!root || root.dataset.oppBound === '1') return;
        root.dataset.oppBound = '1';
        root.addEventListener('click', async (e) => {
            const ref = e.target.closest('[data-amcc-refresh]');
            const per = e.target.closest('[data-amcc-persist]');
            if (ref) {
                e.preventDefault();
                const id = ref.getAttribute('data-amcc-refresh');
                if (!global.matchingService || !id) return;
                try {
                    await global.matchingService.findMatchesForPost(id, {});
                    global.alert('Matching recomputed in memory for this opportunity. Use Persist to save POST_MATCHES.');
                } catch (err) {
                    global.alert(err && err.message ? err.message : 'Refresh failed.');
                }
                return;
            }
            if (per) {
                e.preventDefault();
                const id = per.getAttribute('data-amcc-persist');
                if (typeof global.persistPostMatchesForAdmin === 'function') {
                    await global.persistPostMatchesForAdmin(id);
                }
            }
        });
    }

    window.__amccFilters = window.__amccFilters || { search: '', matchType: '', invitationFilter: 'all', negotiationFilter: 'all', auditAction: '' };
    global.resetAmccTablePagination = function () {
        window.__amccPagination = {
            opportunity: { page: 1, pageSize: 25 },
            invitations: { page: 1, pageSize: 25 },
            negotiations: { page: 1, pageSize: 25 },
            audit: { page: 1, pageSize: 25 }
        };
    };
    global.getAdminMatchingCommandCenterData = getAdminMatchingCommandCenterData;
    global.buildAdminMatchingOverview = buildAdminMatchingOverview;
    global.getBlockedMatches = getBlockedMatches;
    global.getInvitationAnalytics = function (state) { return getInvitationAnalytics(state); };
    global.getReplacementAnalytics = function (state) { return getReplacementAnalytics(state); };
    global.getNegotiationAnalytics = function (state) { return getNegotiationAnalytics(state); };
    global.getMatchingConversionFunnels = getMatchingConversionFunnels;
    global.getMatchingAuditLogs = getMatchingAuditLogs;
    global.refreshAdminMatchingCommandCenterUI = refreshAdminMatchingCommandCenterUI;
    global.setupAdminMatchingCommandCenterDelegation = function () {
        setupPaginationDelegation();
        setupReplacementDelegation();
        setupOpportunityActions();
    };
})(typeof window !== 'undefined' ? window : globalThis);
