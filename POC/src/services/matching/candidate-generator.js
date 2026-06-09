/**
 * Candidate Generator
 * Filters possible Offer posts for a Need post (or vice versa) before scoring.
 * Reduces comparisons by applying intent, category, budget, location, timeline.
 */

(function (global) {
    const CONFIG = global.CONFIG || {};
    const CANDIDATE_MAX = CONFIG.MATCHING?.CANDIDATE_MAX ?? 200;

    function getHardConstraints() {
        return global.hardConstraints || null;
    }

    /**
     * Check if budget ranges overlap or offer satisfies need (needMax >= offerMin when need has budget).
     */
    function budgetCompatible(needNorm, offerNorm) {
        const needB = needNorm.budget || {};
        const offerB = offerNorm.budget || {};
        const needMin = needB.min != null ? needB.min : 0;
        const needMax = needB.max != null ? needB.max : Infinity;
        const offerMin = offerB.min != null ? offerB.min : 0;
        const offerMax = offerB.max != null ? offerB.max : Infinity;
        if (needMax === Infinity && needMin === 0 && offerMin === 0 && offerMax === Infinity) return true;
        return Math.max(needMin, offerMin) <= Math.min(needMax, offerMax);
    }

    /**
     * Check location compatibility. Remote matches all; same or overlapping region/city matches.
     */
    function locationCompatible(needNorm, offerNorm) {
        const needLoc = (needNorm.location || '').toLowerCase();
        const offerLoc = (offerNorm.location || '').toLowerCase();
        if (needLoc === 'remote' || offerLoc === 'remote') return true;
        if (needLoc === offerLoc) return true;
        if (needLoc === 'ksa' && offerLoc) return true;
        if (offerLoc === 'ksa' && needLoc) return true;
        return false;
    }

    /**
     * Check timeline overlap: need deadline/period vs offer availability.
     */
    function timelineOverlap(needNorm, offerNorm) {
        const needEnd = needNorm.deadline || needNorm.timeline?.end;
        const needStart = needNorm.timeline?.start;
        const offerStart = offerNorm.availability?.start || offerNorm.timeline?.start;
        const offerEnd = offerNorm.availability?.end || offerNorm.timeline?.end;
        if (!needEnd && !needStart && !offerStart && !offerEnd) return true;
        const toDate = (s) => (s ? new Date(s).getTime() : null);
        const nEnd = toDate(needEnd);
        const nStart = toDate(needStart);
        const oStart = toDate(offerStart);
        const oEnd = toDate(offerEnd);
        if (nEnd == null && nStart == null && oStart == null && oEnd == null) return true;
        if (nEnd != null && oStart != null && oStart > nEnd) return false;
        if (oEnd != null && nStart != null && nStart > oEnd) return false;
        return true;
    }

    /**
     * Check category overlap (same or related modelType/subModelType or categories).
     */
    function categoryOverlap(needNorm, offerNorm) {
        const needCat = new Set([].concat(needNorm.modelType, needNorm.subModelType, needNorm.categories || []).filter(Boolean));
        const offerCat = new Set([].concat(offerNorm.modelType, offerNorm.subModelType, offerNorm.categories || []).filter(Boolean));
        if (needCat.size === 0 && offerCat.size === 0) return true;
        for (const c of needCat) {
            if (offerCat.has(c)) return true;
        }
        return false;
    }

    /**
     * Get candidate Offer posts for a Need post.
     * @param {Object} needPost - Full opportunity (Need, intent === 'request')
     * @param {Object[]} offerPosts - All Offer opportunities (intent === 'offer')
     * @param {Object} [options] - { maxCandidates, needNormalized }
     * @returns {Object[]} Filtered list of Offer opportunities (up to maxCandidates)
     */
    function getCandidates(needPost, offerPosts, options = {}) {
        const maxCandidates = options.maxCandidates ?? CANDIDATE_MAX;
        const needNorm = options.needNormalized || needPost.normalized || {};
        const excludeCreatorId = needPost.creatorId;

        const filtered = offerPosts.filter(offer => {
            if (offer.creatorId === excludeCreatorId) return false;
            if (offer.status !== 'published') return false;
            const offerNorm = offer.normalized || {};
            if (!budgetCompatible(needNorm, offerNorm)) return false;
            if (!locationCompatible(needNorm, offerNorm)) return false;
            if (!timelineOverlap(needNorm, offerNorm)) return false;
            if (!categoryOverlap(needNorm, offerNorm)) return false;
            const hard = getHardConstraints();
            if (hard) {
                const gate = hard.passesPair(needPost, offer, { needNorm, offerNorm });
                if (!gate.ok) return false;
            }
            return true;
        });

        const byCategory = (a, b) => {
            const aCat = (a.normalized || {}).modelType || '';
            const bCat = (b.normalized || {}).modelType || '';
            if (aCat === (needNorm.modelType || '')) return -1;
            if (bCat === (needNorm.modelType || '')) return 1;
            return 0;
        };
        filtered.sort(byCategory);
        const result = filtered.slice(0, maxCandidates);
        if (CONFIG.MATCHING && CONFIG.MATCHING.DEBUG && needPost && needPost.id) {
            console.log('[candidate-generator] needId=' + needPost.id + ' offerPool=' + offerPosts.length + ' afterFilter=' + filtered.length + ' returned=' + result.length);
        }
        return result;
    }

    /**
     * Get candidate Need posts for an Offer post (inverse of getCandidates).
     */
    function getCandidatesForOffer(offerPost, needPosts, options = {}) {
        const maxCandidates = options.maxCandidates ?? CANDIDATE_MAX;
        const offerNorm = options.offerNormalized || offerPost.normalized || {};
        const excludeCreatorId = offerPost.creatorId;

        const filtered = needPosts.filter(need => {
            if (need.creatorId === excludeCreatorId) return false;
            if (need.status !== 'published') return false;
            const needNorm = need.normalized || {};
            if (!budgetCompatible(needNorm, offerNorm)) return false;
            if (!locationCompatible(needNorm, offerNorm)) return false;
            if (!timelineOverlap(needNorm, offerNorm)) return false;
            if (!categoryOverlap(needNorm, offerNorm)) return false;
            const hard = getHardConstraints();
            if (hard) {
                const gate = hard.passesPair(need, offerPost, { needNorm, offerNorm });
                if (!gate.ok) return false;
            }
            return true;
        });

        const byCategory = (a, b) => {
            const aCat = (a.normalized || {}).modelType || '';
            const bCat = (b.normalized || {}).modelType || '';
            if (aCat === (offerNorm.modelType || '')) return -1;
            if (bCat === (offerNorm.modelType || '')) return 1;
            return 0;
        };
        filtered.sort(byCategory);
        return filtered.slice(0, maxCandidates);
    }

    const candidateGenerator = {
        getCandidates,
        getCandidatesForOffer,
        budgetCompatible,
        locationCompatible,
        timelineOverlap,
        categoryOverlap
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = candidateGenerator;
    } else {
        global.candidateGenerator = candidateGenerator;
    }
})(typeof window !== 'undefined' ? window : globalThis);
