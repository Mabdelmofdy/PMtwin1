/**
 * Value Compatibility
 * Fuzzy exchange mode matching, itemized value comparison, and model-specific value analysis:
 * one-way value fit, barter equivalence, consortium multi-party balance, circular chain balance.
 * Also computes application-level value score (budget, exchange mode, scope).
 */

(function (global) {
    'use strict';

    const BUDGET_WEIGHT = 0.4;
    const EXCHANGE_MODE_WEIGHT = 0.3;
    const SCOPE_WEIGHT = 0.3;
    const LOW_VALUE_GAP_THRESHOLD = 0.3;

    function parseNumeric(val) {
        if (val == null) return null;
        if (typeof val === 'number' && !isNaN(val)) return val;
        const s = String(val).replace(/,/g, '').replace(/\s/g, '');
        const match = s.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
    }

    function getNormalized(post) {
        const ve = post.value_exchange || {};
        if (ve._normalized) return ve._normalized;
        const totalOffered = ve.estimated_value != null ? Number(ve.estimated_value) : null;
        const totalExpected = totalOffered;
        return {
            totalOffered: totalOffered || 0,
            totalExpected: totalExpected || 0,
            riskAdjustedOffered: totalOffered || 0,
            riskAdjustedExpected: totalExpected || 0
        };
    }

    /**
     * Exchange mode compatibility (fuzzy): uses accepted_modes for partial match.
     * For post-to-post or opportunity vs applicant.
     * @param {Object} postA - { value_exchange: { mode, accepted_modes }, exchangeMode }
     * @param {Object} postB - same shape
     * @returns {number} 0-1
     */
    function exchangeCompatibility(postA, postB) {
        const modeA = (postA.value_exchange && postA.value_exchange.mode) || postA.exchangeMode || '';
        const modeB = (postB.value_exchange && postB.value_exchange.mode) || postB.exchangeMode || '';
        const modesA = postA.value_exchange?.accepted_modes || (modeA ? [modeA] : []);
        const modesB = postB.value_exchange?.accepted_modes || (modeB ? [modeB] : []);
        const a = String(modeA).toLowerCase();
        const b = String(modeB).toLowerCase();
        const setA = Array.isArray(modesA) ? modesA.map(m => String(m).toLowerCase()) : [];
        const setB = Array.isArray(modesB) ? modesB.map(m => String(m).toLowerCase()) : [];

        if (a && b && a === b) return 1.0;
        if (setB.includes(a) || setA.includes(b)) return 0.8;
        const overlap = setA.filter(m => setB.includes(m));
        if (overlap.length > 0) return 0.5 + (0.3 * overlap.length / Math.max(setA.length, setB.length, 1));
        return 0.0;
    }

    /**
     * Value compatibility for post-to-post (need vs offer): ratio of offer to need expected value.
     * @param {Object} needPost - need opportunity with value_exchange (with _normalized if available)
     * @param {Object} offerPost - offer opportunity
     * @returns {number} 0-1
     */
    function valueCompatibility(needPost, offerPost) {
        const normNeed = getNormalized(needPost);
        const normOffer = getNormalized(offerPost);
        const needExpected = normNeed.totalExpected || normNeed.riskAdjustedExpected;
        const offerProvided = normOffer.totalOffered || normOffer.riskAdjustedOffered;

        if (needExpected === 0 || offerProvided === 0) return 0.5;
        const ratio = offerProvided / needExpected;

        if (ratio >= 0.9 && ratio <= 1.1) return 1.0;
        if (ratio >= 0.7 && ratio <= 1.3) return 0.8;
        if (ratio >= 0.5 && ratio <= 1.5) return 0.6;
        if (ratio >= 0.3 && ratio <= 2.0) return 0.3;
        return 0.0;
    }

    /**
     * One-way value fit: gap and coverage ratio (need vs single offer).
     */
    function oneWayValueFit(need, offer) {
        const n = getNormalized(need);
        const o = getNormalized(offer);
        const needVal = n.totalExpected || n.riskAdjustedExpected;
        const offerVal = o.totalOffered || o.riskAdjustedOffered;
        const gap = needVal > 0 ? offerVal - needVal : 0;
        const ratio = needVal > 0 ? offerVal / needVal : 0;
        const riskRatio = n.riskAdjustedExpected > 0 ? o.riskAdjustedOffered / n.riskAdjustedExpected : 0;

        let valueFit = 'weak';
        if (ratio >= 0.8 && ratio <= 1.2) valueFit = 'strong';
        else if (ratio >= 0.5) valueFit = 'partial';

        return {
            valueFit,
            valueGap: gap,
            valueGapPercent: needVal > 0 ? (gap / needVal) * 100 : 0,
            coverageRatio: ratio,
            riskAdjustedRatio: riskRatio
        };
    }

    /**
     * Two-way (barter) value equivalence: do both sides cover each other's expectations?
     */
    function barterValueEquivalence(postA, postB) {
        const nA = getNormalized(postA);
        const nB = getNormalized(postB);
        const aOffersValue = nA.riskAdjustedOffered;
        const bOffersValue = nB.riskAdjustedOffered;
        const aExpectsValue = nA.riskAdjustedExpected || nA.totalExpected;
        const bExpectsValue = nB.riskAdjustedExpected || nB.totalExpected;

        const aExpects = aExpectsValue > 0 ? aExpectsValue : 1;
        const bExpects = bExpectsValue > 0 ? bExpectsValue : 1;
        const aCoversB = bExpects > 0 ? Math.min(aOffersValue / bExpects, 1.0) : 1;
        const bCoversA = aExpects > 0 ? Math.min(bOffersValue / aExpects, 1.0) : 1;
        const symmetry = Math.min(aCoversB, bCoversA) / Math.max(aCoversB, bCoversA, 0.001);
        const gapA = Math.max(aExpectsValue - bOffersValue, 0);
        const gapB = Math.max(bExpectsValue - aOffersValue, 0);
        const equivalenceScore = (symmetry + Math.min(aCoversB, bCoversA, 1.0)) / 2;

        let suggestion = 'Balanced exchange';
        if (gapA > 0 || gapB > 0) {
            suggestion = 'Cash adjustment needed: A pays ' + Math.round(gapA) + ' SAR, B pays ' + Math.round(gapB) + ' SAR';
        }

        return {
            equivalenceScore,
            aCoversB,
            bCoversA,
            symmetry,
            gapA,
            gapB,
            suggestion
        };
    }

    /**
     * Consortium multi-party value balancing: lead need vs array of partner offers.
     */
    function consortiumValueBalance(leadNeed, partnerOffers) {
        const lead = getNormalized(leadNeed);
        const totalBudget = lead.totalOffered || lead.riskAdjustedOffered;
        const totalExpected = lead.totalExpected || lead.riskAdjustedExpected;

        let totalPartnerValue = 0;
        let totalPartnerCost = 0;
        const partnerAllocations = [];

        (partnerOffers || []).forEach(function (partner) {
            const p = getNormalized(partner);
            const partnerValue = p.riskAdjustedOffered;
            const partnerCost = p.riskAdjustedExpected || p.totalExpected;
            totalPartnerValue += partnerValue;
            totalPartnerCost += partnerCost;
            partnerAllocations.push({
                partnerId: partner.creatorId,
                role: partner.role,
                valueProvided: partnerValue,
                costRequested: partnerCost,
                roi: partnerCost > 0 ? partnerValue / partnerCost : 0
            });
        });

        const budgetSurplus = totalBudget - totalPartnerCost;
        const valueSurplus = totalPartnerValue - totalExpected;
        const balanceScore = Math.min(
            totalExpected > 0 ? totalPartnerValue / totalExpected : 1,
            totalPartnerCost > 0 ? totalBudget / totalPartnerCost : 1,
            1.0
        );
        const viable = totalBudget >= totalPartnerCost * 0.8 && totalPartnerValue >= totalExpected * 0.8;

        return {
            balanceScore,
            totalPartnerValue,
            totalPartnerCost,
            budgetSurplus,
            valueSurplus,
            partnerAllocations,
            viable
        };
    }

    /**
     * Circular exchange value balancing: each edge has offeredValue and expectedValue.
     * @param {Array} cycle - array of creator ids [idA, idB, idC]
     * @param {Array} edgeScores - [{ from, to, offeredValue, expectedValue }, ...]
     */
    function circularValueBalance(cycle, edgeScores) {
        const edgeRatios = (edgeScores || []).map(function (edge) {
            const ratio = edge.expectedValue > 0 ? edge.offeredValue / edge.expectedValue : 0;
            const gap = (edge.expectedValue || 0) - (edge.offeredValue || 0);
            return Object.assign({}, edge, { ratio, gap });
        });

        if (edgeRatios.length === 0) {
            return {
                chainBalanceScore: 0,
                edgeDetails: [],
                uniformity: 0,
                totalImbalance: 0,
                imbalancePercent: 0,
                viable: false,
                adjustments: []
            };
        }

        const minRatio = Math.min.apply(null, edgeRatios.map(e => e.ratio));
        const maxRatio = Math.max.apply(null, edgeRatios.map(e => e.ratio));
        const avgRatio = edgeRatios.reduce((s, e) => s + e.ratio, 0) / edgeRatios.length;
        const uniformity = maxRatio > 0 ? minRatio / maxRatio : 0;
        const totalGap = edgeRatios.reduce((s, e) => s + Math.abs(e.gap), 0);
        const totalFlow = edgeRatios.reduce((s, e) => s + (e.offeredValue || 0), 0);
        const chainBalanceScore = uniformity * Math.min(avgRatio, 1.0);
        const imbalancePercent = totalFlow > 0 ? (totalGap / totalFlow) * 100 : 0;
        const viable = uniformity > 0.6 && avgRatio > 0.7;
        const adjustments = edgeRatios.filter(e => e.gap > 0).map(e =>
            e.from + ' -> ' + e.to + ': gap of ' + Math.round(e.gap) + ' SAR needs cash/equity adjustment'
        );

        return {
            chainBalanceScore,
            edgeDetails: edgeRatios,
            uniformity,
            totalImbalance: totalGap,
            imbalancePercent,
            viable,
            adjustments
        };
    }

    // --- Application-level (legacy) ---

    function budgetFit(opportunity, requestedValueNum, currency) {
        const ve = opportunity.value_exchange || {};
        const ed = opportunity.exchangeData || {};
        const norm = getNormalized(opportunity);
        const estimated = ve.estimated_value;
        const budget = ed.budgetRange || opportunity.attributes?.budgetRange;
        const maxVal = estimated != null && !isNaN(Number(estimated))
            ? Number(estimated)
            : (norm.totalOffered || (budget && (budget.max != null ? Number(budget.max) : budget.min != null ? Number(budget.min) : null)));
        if (maxVal == null || isNaN(maxVal) || maxVal <= 0) return 1;
        if (requestedValueNum == null || isNaN(requestedValueNum)) return 0.5;
        if (requestedValueNum <= maxVal) {
            const minVal = budget?.min != null ? Number(budget.min) : 0;
            if (requestedValueNum >= minVal) return 1;
            return Math.max(0, requestedValueNum / maxVal);
        }
        const ratio = maxVal / requestedValueNum;
        return Math.max(0, Math.min(1, ratio));
    }

    /**
     * Exchange mode fit for application: fuzzy when accepted_modes exist, else binary.
     */
    function exchangeModeFit(opportunityMode, applicantMode) {
        const o = (opportunityMode || '').toLowerCase();
        const a = (applicantMode || '').toLowerCase();
        if (o && a && o === a) return 1;
        return 0;
    }

    function scopeFit(opportunity, offeredValueText) {
        const ve = opportunity.value_exchange || {};
        const expected = ve.value_expected;
        if (!Array.isArray(expected) || expected.length === 0) return 1;
        const text = (offeredValueText || '').toLowerCase();
        if (!text) return 0;
        const expectedTerms = expected
            .map(e => (e.label || e.description || e.type || '').toLowerCase())
            .filter(Boolean);
        if (expectedTerms.length === 0) return 1;
        const matchCount = expectedTerms.filter(term => text.includes(term) || term.split(/\s+/).some(w => text.includes(w))).length;
        return matchCount / expectedTerms.length;
    }

    /**
     * Compute full value compatibility for an application (unchanged contract).
     */
    function computeValueCompatibility(opportunity, applicationValue) {
        const oppMode = (opportunity.value_exchange && opportunity.value_exchange.mode)
            || opportunity.exchangeMode
            || (opportunity.exchangeData && opportunity.exchangeData.exchangeMode);
        const appMode = applicationValue.exchange_mode || applicationValue.exchangeMode;
        const requestedRaw = applicationValue.requested_value;
        const requestedNum = typeof requestedRaw === 'number' ? requestedRaw : parseNumeric(requestedRaw);
        const offeredText = typeof applicationValue.offered_value === 'string'
            ? applicationValue.offered_value
            : (applicationValue.offered_value && applicationValue.offered_value.description) || (applicationValue.offered_value && applicationValue.offered_value.label) || '';

        const budgetFitScore = budgetFit(opportunity, requestedNum, applicationValue.currency);
        const exchangeModeFitScore = exchangeModeFit(oppMode, appMode);
        const scopeFitScore = scopeFit(opportunity, offeredText);

        const value_score = BUDGET_WEIGHT * budgetFitScore + EXCHANGE_MODE_WEIGHT * exchangeModeFitScore + SCOPE_WEIGHT * scopeFitScore;
        const value_breakdown = { budgetFit: budgetFitScore, exchangeModeFit: exchangeModeFitScore, scopeFit: scopeFitScore };

        const norm = getNormalized(opportunity);
        let expectedVal = (opportunity.value_exchange && opportunity.value_exchange.estimated_value) != null
            ? Number(opportunity.value_exchange.estimated_value)
            : (norm.totalOffered || norm.totalExpected) || null;
        if (expectedVal == null && opportunity.exchangeData && opportunity.exchangeData.budgetRange) {
            const b = opportunity.exchangeData.budgetRange;
            if (b.max != null || b.min != null) {
                expectedVal = ((Number(b.max) || 0) + (Number(b.min) || 0)) / 2;
            }
        }
        let value_gap = null;
        const exp = expectedVal != null && !isNaN(expectedVal) ? expectedVal : null;
        if (exp != null && requestedNum != null && !isNaN(requestedNum)) {
            value_gap = exp - requestedNum;
        }
        const lowValueMatch = value_gap != null && exp != null && exp > 0 && (value_gap / exp) > LOW_VALUE_GAP_THRESHOLD;

        return {
            value_score: Math.round(value_score * 1000) / 1000,
            value_breakdown,
            value_gap,
            lowValueMatch
        };
    }

    const api = {
        computeValueCompatibility,
        budgetFit,
        exchangeModeFit,
        scopeFit,
        exchangeCompatibility,
        valueCompatibility,
        oneWayValueFit,
        barterValueEquivalence,
        consortiumValueBalance,
        circularValueBalance,
        getNormalized,
        parseNumeric
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.valueCompatibility = api;
    }
})(typeof window !== 'undefined' ? window : this);
