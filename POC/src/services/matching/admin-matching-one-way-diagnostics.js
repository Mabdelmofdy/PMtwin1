/**
 * One-way matching diagnostics for Admin Matching (read-only; does not alter scoring).
 */
(function (global) {
    const CONFIG = global.CONFIG || {};
    const POST_THRESHOLD = CONFIG.MATCHING?.POST_TO_POST_THRESHOLD ?? 0.50;
    const CANDIDATE_MAX = CONFIG.MATCHING?.CANDIDATE_MAX ?? 200;

    function getDataService() {
        return global.dataService || (global.window && global.window.dataService);
    }

    function getScoring() {
        return global.postToPostScoring || (global.window && global.window.postToPostScoring);
    }

    function getCandidateGenerator() {
        return global.candidateGenerator || (global.window && global.window.candidateGenerator);
    }

    function getSemanticProfile() {
        return global.semanticProfile || (global.window && global.window.semanticProfile);
    }

    function getPreprocessor() {
        return global.postPreprocessor || (global.window && global.window.postPreprocessor);
    }

    function inferWeakDimensions(breakdown, labels) {
        const weak = [];
        const b = breakdown || {};
        const l = labels || {};
        const skill = b.attributeOverlap ?? b.skills ?? l.skillMatch ?? l.attributeOverlap;
        const budget = b.budgetFit ?? l.budgetFit;
        const location = b.location ?? l.locationFit;
        const timeline = b.timeline ?? l.timelineFit;
        if (skill != null && skill < 0.35) weak.push('skill mismatch');
        if (budget != null && budget < 0.35) weak.push('budget mismatch');
        if (location != null && location < 0.35) weak.push('location mismatch');
        if (timeline != null && timeline < 0.35) weak.push('timeline mismatch');
        if (!skill && !budget && !location && !timeline) weak.push('missing attributes');
        return weak;
    }

    function bumpReason(map, reason) {
        if (!reason) return;
        map[reason] = (map[reason] || 0) + 1;
    }

    /**
     * Collect one-way diagnostics for the same capped need/offer set as the admin live report.
     * @param {object} [options] - { needLimit, offerLimit }
     */
    async function collectOneWayDiagnostics(options = {}) {
        const ds = getDataService();
        const gen = getCandidateGenerator();
        const scoring = getScoring();
        const semantic = getSemanticProfile();
        const preprocessor = getPreprocessor();

        const empty = {
            needsInspected: 0,
            offersInspected: 0,
            publishedNeedCount: 0,
            publishedOfferCount: 0,
            candidatePairsFromGenerator: 0,
            candidatePairsConsidered: 0,
            scoredPairs: 0,
            pairsAboveThreshold: 0,
            pairsBelowThreshold: 0,
            threshold: POST_THRESHOLD,
            topBelowThreshold: [],
            rejectionReasons: {},
            servicesAvailable: !!(ds && gen && scoring)
        };
        if (!ds || !gen || !scoring) return empty;

        const opportunities = await ds.getOpportunities();
        const published = opportunities.filter(o => o.status === 'published');
        const needs = published.filter(o => (o.intent || 'request') === 'request');
        const offers = published.filter(o => (o.intent || '') === 'offer');
        const needLimit = options.needLimit != null ? options.needLimit : Math.min(20, needs.length);
        const offerLimit = options.offerLimit != null ? options.offerLimit : Math.min(20, offers.length);

        const summary = {
            ...empty,
            publishedNeedCount: needs.length,
            publishedOfferCount: offers.length,
            needsInspected: needLimit,
            offersInspected: offerLimit
        };

        const canonical = preprocessor && preprocessor.loadSkillCanonical
            ? await preprocessor.loadSkillCanonical(CONFIG.BASE_PATH || '')
            : {};
        const belowThreshold = [];
        const rejectionReasons = {};

        async function inspectNeedToOffers(needPost) {
            const offerPosts = offers;
            let needNorm = needPost.normalized;
            if (!needNorm && preprocessor) needNorm = preprocessor.extractAndNormalize(needPost, canonical);
            const needProfile = semantic && needNorm ? semantic.buildSemanticProfile(needNorm, needPost, canonical) : null;
            const candidates = gen.getCandidates(needPost, offerPosts, {
                maxCandidates: CANDIDATE_MAX,
                needNormalized: needNorm
            });
            summary.candidatePairsFromGenerator += candidates.length;
            summary.candidatePairsConsidered += offerPosts.length;

            for (const offer of candidates) {
                const offerNorm = offer.normalized || (preprocessor ? preprocessor.extractAndNormalize(offer, canonical) : {});
                const offerProfile = semantic && offerNorm ? semantic.buildSemanticProfile(offerNorm, offer, {}) : null;
                const { score, breakdown, labels } = scoring.scorePair(needPost, offer, needNorm, offerNorm, needProfile, offerProfile);
                summary.scoredPairs++;
                if (score >= POST_THRESHOLD) {
                    summary.pairsAboveThreshold++;
                } else {
                    summary.pairsBelowThreshold++;
                    const weak = inferWeakDimensions(breakdown, labels);
                    weak.forEach(r => bumpReason(rejectionReasons, r));
                    belowThreshold.push({
                        direction: 'need_to_offers',
                        needId: needPost.id,
                        offerId: offer.id,
                        score: Math.round(score * 1000) / 1000,
                        weak
                    });
                }
            }
        }

        async function inspectOfferToNeeds(offerPost) {
            const needPosts = needs;
            let offerNorm = offerPost.normalized;
            if (!offerNorm && preprocessor) offerNorm = preprocessor.extractAndNormalize(offerPost, canonical);
            const offerProfile = semantic && offerNorm ? semantic.buildSemanticProfile(offerNorm, offerPost, canonical) : null;
            const candidates = gen.getCandidatesForOffer
                ? gen.getCandidatesForOffer(offerPost, needPosts, { maxCandidates: CANDIDATE_MAX, offerNormalized: offerNorm })
                : [];
            summary.candidatePairsFromGenerator += candidates.length;
            summary.candidatePairsConsidered += needPosts.length;

            for (const need of candidates) {
                const needNorm = need.normalized || (preprocessor ? preprocessor.extractAndNormalize(need, canonical) : {});
                const needProfile = semantic && needNorm ? semantic.buildSemanticProfile(needNorm, need, {}) : null;
                const { score, breakdown, labels } = scoring.scorePair(need, offerPost, needNorm, offerNorm, needProfile, offerProfile);
                summary.scoredPairs++;
                if (score >= POST_THRESHOLD) {
                    summary.pairsAboveThreshold++;
                } else {
                    summary.pairsBelowThreshold++;
                    const weak = inferWeakDimensions(breakdown, labels);
                    weak.forEach(r => bumpReason(rejectionReasons, r));
                    belowThreshold.push({
                        direction: 'offer_to_needs',
                        offerId: offerPost.id,
                        needId: need.id,
                        score: Math.round(score * 1000) / 1000,
                        weak
                    });
                }
            }
        }

        for (let i = 0; i < needLimit; i++) {
            await inspectNeedToOffers(needs[i]);
        }
        for (let i = 0; i < offerLimit; i++) {
            await inspectOfferToNeeds(offers[i]);
        }

        belowThreshold.sort((a, b) => b.score - a.score);
        summary.topBelowThreshold = belowThreshold.slice(0, 10);
        summary.rejectionReasons = rejectionReasons;
        return summary;
    }

    const api = { collectOneWayDiagnostics, inferWeakDimensions };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (global) {
        global.AdminMatchingOneWayDiagnostics = api;
    }
})(typeof window !== 'undefined' ? window : global);
