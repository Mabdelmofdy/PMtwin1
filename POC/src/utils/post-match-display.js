/**
 * Human-readable labels for POST_MATCHES (plain strings — callers escape for HTML).
 */
(function (global) {
    'use strict';

    function uv() {
        return global.unifiedMatchView || {};
    }

    function mapUiType(stored) {
        const fn = uv().mapStoredMatchTypeToUI;
        if (typeof fn === 'function') return fn(stored);
        const s = (stored || 'one_way').toLowerCase();
        if (s === 'two_way') return 'barter';
        if (s === 'consortium') return 'consortium';
        if (s === 'circular') return 'circular';
        return 'recommended';
    }

    function uiTypeLabel(ui) {
        const fn = uv().getUiMatchTypeLabel;
        if (typeof fn === 'function') return fn(ui);
        const m = { recommended: 'Recommended', barter: 'Barter', consortium: 'Consortium', circular: 'Circular' };
        return m[ui] || 'Recommended';
    }

    function formatRole(role) {
        if (!role) return '';
        return String(role).replace(/_/g, ' ').replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    }

    function displayNameForEntity(userId, userById, companyById) {
        const u = userById && userById.get(userId);
        if (u) {
            const p = u.profile || {};
            const nm = (p.name || [p.firstName, p.lastName].filter(Boolean).join(' ')).trim();
            return nm || u.email || userId;
        }
        const c = companyById && companyById.get(userId);
        if (c) {
            const p = c.profile || {};
            return (p.name || c.name || c.companyName || c.legalName || '').trim() || c.email || userId;
        }
        return userId;
    }

    function emailForEntity(userId, userById, companyById) {
        const u = userById && userById.get(userId);
        if (u && u.email) return String(u.email).trim();
        const c = companyById && companyById.get(userId);
        if (c && c.email) return String(c.email).trim();
        return '';
    }

    /**
     * @param {object|null} pm - post match row
     * @param {{ oppById?: Map, userById?: Map, companyById?: Map }} maps
     * @returns {{ matchId: string, headline: string, participantLines: string[], matchTypeLabel: string }}
     */
    function summarizeFromMaps(pm, maps) {
        const mapsSafe = maps || {};
        const oppById = mapsSafe.oppById;
        const userById = mapsSafe.userById;
        const companyById = mapsSafe.companyById;
        const matchId = pm && pm.id ? String(pm.id) : '';
        if (!pm) {
            return { matchId: matchId, headline: matchId || '—', participantLines: [], matchTypeLabel: '' };
        }
        const getPrim = uv().getPrimaryOpportunityIdFromPostMatch;
        const primaryId = typeof getPrim === 'function' ? getPrim(pm) : null;
        let headline = 'Match';
        if (primaryId && oppById && typeof oppById.get === 'function' && oppById.get(primaryId)) {
            const opp = oppById.get(primaryId);
            headline = ((opp.title || opp.name || '').trim()) || headline;
        } else if (primaryId) {
            headline = 'Opportunity ' + primaryId;
        } else if (matchId) {
            headline = 'Match';
        }
        const ui = mapUiType(pm.matchType);
        const matchTypeLabel = uiTypeLabel(ui);
        const seen = new Set();
        const participantLines = [];
        (pm.participants || []).forEach(function (part) {
            const uid = part.userId;
            if (!uid || seen.has(uid)) return;
            seen.add(uid);
            const name = displayNameForEntity(uid, userById, companyById);
            const email = emailForEntity(uid, userById, companyById);
            const role = formatRole(part.role);
            let line = name;
            if (role) line += ' · ' + role;
            if (email) line += ' · ' + email;
            participantLines.push(line);
        });
        return { matchId: matchId, headline: headline, participantLines: participantLines, matchTypeLabel: matchTypeLabel };
    }

    /**
     * @param {string} matchId
     * @param {object} dataService
     */
    async function summarizeFromDataService(matchId, dataService) {
        const mid = matchId ? String(matchId) : '';
        if (!mid || !dataService || typeof dataService.getPostMatchById !== 'function') {
            return { matchId: mid, headline: mid || '—', participantLines: [], matchTypeLabel: '' };
        }
        const pm = await dataService.getPostMatchById(mid);
        if (!pm) {
            return { matchId: mid, headline: mid, participantLines: [], matchTypeLabel: '' };
        }
        const getPrim = uv().getPrimaryOpportunityIdFromPostMatch;
        const primaryId = typeof getPrim === 'function' ? getPrim(pm) : null;
        const oppMap = new Map();
        if (primaryId && typeof dataService.getOpportunityById === 'function') {
            const opp = await dataService.getOpportunityById(primaryId);
            if (opp) oppMap.set(primaryId, opp);
        }
        const userById = new Map();
        const companyById = new Map();
        for (let i = 0; i < (pm.participants || []).length; i++) {
            const uid = pm.participants[i].userId;
            if (!uid || userById.has(uid) || companyById.has(uid)) continue;
            if (typeof dataService.getUserById === 'function') {
                const user = await dataService.getUserById(uid);
                if (user) {
                    userById.set(uid, user);
                    continue;
                }
            }
            if (typeof dataService.getCompanyById === 'function') {
                const comp = await dataService.getCompanyById(uid);
                if (comp) companyById.set(uid, comp);
            }
        }
        return summarizeFromMaps(pm, { oppById: oppMap, userById: userById, companyById: companyById });
    }

    global.postMatchDisplay = {
        summarizeFromMaps: summarizeFromMaps,
        summarizeFromDataService: summarizeFromDataService
    };
})(typeof window !== 'undefined' ? window : globalThis);
