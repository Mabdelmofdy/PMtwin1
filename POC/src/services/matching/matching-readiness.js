/**
 * Opportunity matching readiness — quality hints before publish (does not change matching execution).
 */

const READINESS_WEIGHTS = {
    intent: 12,
    title: 12,
    description: 10,
    skills: 14,
    exchange: 14,
    location: 10,
    timeline: 10,
    consortiumRoles: 10,
    hybridNeedOffer: 8
};

function arr(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v == null || v === '') return [];
    return [v];
}

function plainText(htmlOrText) {
    if (!htmlOrText) return '';
    const s = String(htmlOrText);
    if (s.includes('<')) {
        return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return s.trim();
}

function hasSkillsOrCategories(opp) {
    const scope = opp.scope || {};
    const attrs = opp.attributes || opp.modelData || {};
    const skills = [
        ...arr(scope.requiredSkills),
        ...arr(scope.offeredSkills),
        ...arr(attrs.requiredSkills),
        ...arr(attrs.offeredSkills),
        ...arr(attrs.skills)
    ];
    const sectors = [...arr(scope.sectors), ...arr(attrs.sectors)];
    const interests = [...arr(scope.interests), ...arr(attrs.interests)];
    return skills.length > 0 || sectors.length > 0 || interests.length > 0;
}

function hasExchangeOrValue(opp) {
    const mode = opp.exchangeMode || (opp.paymentModes && opp.paymentModes[0]);
    if (!mode) return false;
    const ex = opp.exchangeData || {};
    const ve = opp.value_exchange || {};
    if (ve.estimated_value != null || ve.value_expected?.length) return true;
    if (mode === 'cash' && (ex.cashAmount > 0 || ex.budgetRange?.max > 0)) return true;
    if (mode === 'barter' && (plainText(ex.barterOffer) || plainText(ex.barterNeed))) return true;
    if (mode === 'equity' && ex.equityPercentage > 0) return true;
    if (mode === 'profit_sharing' && (ex.profitSharePercentage > 0 || ex.profitDuration)) return true;
    if (mode === 'hybrid') return true;
    if (ex.budgetRange && (ex.budgetRange.min > 0 || ex.budgetRange.max > 0)) return true;
    return !!mode;
}

function hasLocationOrRemote(opp) {
    const attrs = opp.attributes || opp.modelData || {};
    const locReq = (attrs.locationRequirement || opp.locationRequirement || '').toLowerCase();
    if (locReq.includes('remote') || locReq.includes('anywhere') || locReq.includes('flexible')) return true;
    if (opp.latitude != null && opp.longitude != null) return true;
    if (opp.locationCity || opp.locationCountry || (opp.location && String(opp.location).trim())) return true;
    return false;
}

function hasTimeline(opp) {
    const attrs = opp.attributes || opp.modelData || {};
    return !!(
        attrs.startDate || attrs.endDate || attrs.applicationDeadline
        || opp.startDate || opp.endDate || opp.applicationDeadline
    );
}

function needsConsortiumRoles(opp) {
    const sub = (opp.subModelType || '').toLowerCase();
    const mt = (opp.modelType || '').toLowerCase();
    return sub === 'consortium' || mt.includes('consortium')
        || arr(opp.attributes?.memberRoles).length > 0
        || arr(opp.attributes?.partnerRoles).length > 0;
}

function hasConsortiumRoles(opp) {
    const attrs = opp.attributes || opp.modelData || {};
    const roles = arr(attrs.memberRoles).concat(arr(attrs.partnerRoles));
    return roles.length > 0;
}

function needsHybridNeedOffer(opp) {
    const intent = (opp.intent || '').toLowerCase();
    const mode = (opp.exchangeMode || '').toLowerCase();
    return intent === 'hybrid' || mode === 'barter';
}

function hasHybridNeedOffer(opp) {
    const scope = opp.scope || {};
    const hasNeed = arr(scope.requiredSkills).length > 0;
    const hasOffer = arr(scope.offeredSkills).length > 0;
    const ex = opp.exchangeData || {};
    if (hasNeed && hasOffer) return true;
    if (plainText(ex.barterOffer) && plainText(ex.barterNeed)) return true;
    return false;
}

function countCandidateMatches(opp) {
    const preview = Array.isArray(opp.matchPreviewCandidates) ? opp.matchPreviewCandidates.length : null;
    if (preview != null) return preview;
    const postMatches = Array.isArray(opp.post_matches) ? opp.post_matches : [];
    if (!postMatches.length) return null;
    return postMatches.filter((pm) => {
        const status = String(pm.status || '').toLowerCase();
        return status !== 'declined' && status !== 'expired' && status !== 'blocked';
    }).length;
}

/**
 * @param {object} opportunity - opportunity record or publish payload
 * @returns {{
 *   status: 'ready'|'warning'|'incomplete',
 *   score: number,
 *   missingFields: string[],
 *   warnings: string[],
 *   recommendations: string[],
 *   canPublish: boolean,
 *   indicatorLabel: string,
 *   indicatorClass: string
 * }}
 */
export function buildMatchingReadinessReport(opportunity) {
    const opp = opportunity || {};
    const missingFields = [];
    const warnings = [];
    const recommendations = [];
    let score = 0;
    const maxScore = Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0);

    const intent = (opp.intent || '').trim();
    const title = plainText(opp.title);
    const description = plainText(opp.description);

    if (!intent) {
        missingFields.push('Opportunity type (Need, Offer, or Need & Offer)');
    } else {
        score += READINESS_WEIGHTS.intent;
    }

    if (!title) {
        missingFields.push('Title');
    } else {
        score += READINESS_WEIGHTS.title;
    }

    if (!description || description.length < 40) {
        warnings.push('Add a clear description so partners understand your opportunity.');
        recommendations.push('Write a short summary of goals, deliverables, and expectations.');
    } else {
        score += READINESS_WEIGHTS.description;
    }

    if (!hasSkillsOrCategories(opp)) {
        warnings.push('Skills or categories');
        recommendations.push('Add skills, sectors, or interests to improve match relevance.');
    } else {
        score += READINESS_WEIGHTS.skills;
    }

    if (!hasExchangeOrValue(opp)) {
        warnings.push('Budget or value model');
        recommendations.push('Set an exchange mode and budget or value range.');
    } else {
        score += READINESS_WEIGHTS.exchange;
    }

    if (!hasLocationOrRemote(opp)) {
        warnings.push('Location or remote availability');
        recommendations.push('Specify where work happens or mark the opportunity as remote.');
    } else {
        score += READINESS_WEIGHTS.location;
    }

    if (!hasTimeline(opp)) {
        warnings.push('Timeline');
        recommendations.push('Add start date, end date, or application deadline.');
    } else {
        score += READINESS_WEIGHTS.timeline;
    }

    if (needsConsortiumRoles(opp)) {
        if (!hasConsortiumRoles(opp)) {
            warnings.push('Consortium roles');
            recommendations.push('Define member roles so consortium matching can find partners.');
        } else {
            score += READINESS_WEIGHTS.consortiumRoles;
        }
    } else {
        score += READINESS_WEIGHTS.consortiumRoles;
    }

    if (needsHybridNeedOffer(opp)) {
        if (!hasHybridNeedOffer(opp)) {
            warnings.push('Need and Offer details');
            recommendations.push('For Need & Offer or Barter, describe both what you need and what you offer.');
        } else {
            score += READINESS_WEIGHTS.hybridNeedOffer;
        }
    } else {
        score += READINESS_WEIGHTS.hybridNeedOffer;
    }

    const pct = Math.round((score / maxScore) * 100);
    const candidateCount = countCandidateMatches(opp);
    let adjustedPct = pct;
    if (candidateCount === 0) {
        adjustedPct = Math.min(adjustedPct, 35);
        warnings.push('No candidate matches available yet');
        recommendations.push('Publish and refine scope/skills to attract relevant candidates.');
    }
    const criticalMissing = missingFields.length > 0;
    const canPublish = !criticalMissing;

    let status = 'ready';
    if (criticalMissing) status = 'incomplete';
    else if (warnings.length > 0) status = 'warning';

    let indicatorLabel = 'Ready to publish';
    let indicatorClass = 'readiness--ready';
    if (status === 'incomplete') {
        indicatorLabel = 'Missing key details';
        indicatorClass = 'readiness--incomplete';
    } else if (status === 'warning') {
        indicatorLabel = 'Could be improved';
        indicatorClass = 'readiness--warning';
    }

    return {
        status,
        score: adjustedPct,
        missingFields,
        warnings,
        recommendations,
        canPublish,
        indicatorLabel,
        indicatorClass
    };
}

export function getOpportunityMatchingReadiness(opportunity) {
    return buildMatchingReadinessReport(opportunity);
}

if (typeof window !== 'undefined') {
    window.MatchingReadiness = {
        buildMatchingReadinessReport,
        getOpportunityMatchingReadiness
    };
}
