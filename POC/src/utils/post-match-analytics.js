/**
 * Post-match analytics helpers (admin reporting only; does not change stored statuses).
 */
(function (global) {
    /**
     * True when a saved post_match counts as confirmed for admin analytics.
     * Legacy demo data may use status "accepted" instead of "confirmed".
     * @param {{ status?: string }|null|undefined} match
     * @returns {boolean}
     */
    function isConfirmedLikeMatch(match) {
        if (!match) return false;
        const s = (match.status || '').toLowerCase();
        return s === 'confirmed' || s === 'accepted';
    }

    function countConfirmedLikeMatches(postMatches) {
        return (postMatches || []).filter(isConfirmedLikeMatch).length;
    }

    const api = { isConfirmedLikeMatch, countConfirmedLikeMatches };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (global) {
        global.postMatchAnalytics = api;
    }
})(typeof window !== 'undefined' ? window : global);
