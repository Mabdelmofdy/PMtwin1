/**
 * Shared accept/decline handlers for post_match list surfaces (dashboard, matches).
 * Mirrors match-detail.js behavior without navigating away by default.
 */
(function (global) {
    'use strict';

    function isPostMatchExpired(postMatch) {
        if (!postMatch || typeof CONFIG === 'undefined') return false;
        if ((postMatch.status || '') === CONFIG.POST_MATCH_STATUS.EXPIRED) return true;
        if (postMatch.expiresAt) {
            const t = new Date(postMatch.expiresAt).getTime();
            return !Number.isNaN(t) && t < Date.now();
        }
        return false;
    }

    function feedbackMessage(updated, matchBefore) {
        if (!updated) return { message: 'Could not update this match.', tone: 'danger' };
        if (isPostMatchExpired(updated)) {
            return { message: 'This match has expired.', tone: 'danger' };
        }
        const st = (updated.status || '').toLowerCase();
        if (st === (CONFIG.POST_MATCH_STATUS.DECLINED || 'declined')) {
            return { message: 'This match was declined.', tone: 'danger' };
        }
        if (st === (CONFIG.POST_MATCH_STATUS.CONFIRMED || 'confirmed')) {
            return {
                message: 'All participants have accepted. Open match details to start a deal.',
                tone: 'success'
            };
        }
        return { message: 'Waiting for all participants to accept.', tone: 'info' };
    }

    async function acceptPostMatchFromList(matchId, userId, dataService) {
        const ds = dataService || global.dataService;
        if (!ds || !matchId || !userId) {
            return { ok: false, message: 'Could not accept this match.', tone: 'danger' };
        }
        try {
            const match = await ds.getPostMatchById(matchId);
            if (!match) {
                return { ok: false, message: 'Match not found.', tone: 'danger' };
            }
            if (isPostMatchExpired(match)) {
                return { ok: false, message: 'This match has expired.', tone: 'danger', match };
            }
            if (match.isReplacement && match.replacementDealId) {
                const deal = await ds.acceptReplacementPostMatch(matchId, userId);
                if (deal && global.router && typeof global.router.navigate === 'function') {
                    return { ok: true, navigateTo: '/deals/' + deal.id, match };
                }
            }
            const updated = await ds.updatePostMatchStatus(
                matchId,
                userId,
                CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED
            );
            const fb = feedbackMessage(updated, match);
            return { ok: !!updated, ...fb, match: updated || match };
        } catch (err) {
            return {
                ok: false,
                message: (err && err.message) ? err.message : 'Could not accept this match.',
                tone: 'danger'
            };
        }
    }

    async function declinePostMatchFromList(matchId, userId, dataService) {
        const ds = dataService || global.dataService;
        if (!ds || !matchId || !userId) {
            return { ok: false, message: 'Could not decline this match.', tone: 'danger' };
        }
        const match = await ds.getPostMatchById(matchId);
        const isReplacement = match && match.isReplacement;
        const msg = isReplacement
            ? 'Decline this replacement invitation? The next replacement for this role may be invited.'
            : 'Decline this match? Other participants will be notified.';
        if (typeof global.confirm === 'function' && !global.confirm(msg)) {
            return { ok: false, cancelled: true };
        }
        try {
            await ds.declinePostMatch(matchId, userId);
            if (isReplacement && typeof ds.inviteNextReplacementCandidate === 'function') {
                const nextMatch = await ds.inviteNextReplacementCandidate(matchId, userId);
                if (nextMatch) {
                    return { ok: true, navigateTo: '/matches/' + nextMatch.id };
                }
            }
            const matchesRoute = (typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.MATCHES)
                ? CONFIG.ROUTES.MATCHES
                : '/matches';
            return { ok: true, navigateTo: matchesRoute };
        } catch (err) {
            return {
                ok: false,
                message: (err && err.message) ? err.message : 'Could not decline this match.',
                tone: 'danger'
            };
        }
    }

    function notifyListResult(result) {
        if (!result || result.cancelled) return;
        const msg = result.message;
        if (!msg) return;
        if (global.modalService && typeof global.modalService[result.tone === 'danger' ? 'error' : 'success'] === 'function') {
            global.modalService[result.tone === 'danger' ? 'error' : 'success'](msg, result.tone === 'danger' ? 'Error' : 'Success');
        } else if (typeof global.showNotification === 'function') {
            global.showNotification(msg, result.tone === 'danger' ? 'error' : 'success');
        } else if (result.tone === 'danger') {
            global.alert(msg);
        }
    }

    function navigateIfNeeded(result) {
        if (!result || !result.navigateTo || !global.router || typeof global.router.navigate !== 'function') {
            return;
        }
        global.router.navigate(result.navigateTo);
    }

    const api = {
        isPostMatchExpired,
        acceptPostMatchFromList,
        declinePostMatchFromList,
        notifyListResult,
        navigateIfNeeded
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    global.postMatchListActions = api;
})(typeof window !== 'undefined' ? window : global);
