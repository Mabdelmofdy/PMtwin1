/**
 * Post Preprocessor
 * Extracts and normalizes structured attributes from Need/Offer posts (opportunities)
 * for consistent comparison in the matching pipeline.
 */

(function (global) {
    const CONFIG = global.CONFIG || {};
    const W = CONFIG.MATCHING?.WEIGHTS || {
        ATTRIBUTE_OVERLAP: 0.40,
        BUDGET_FIT: 0.30,
        TIMELINE: 0.15,
        LOCATION: 0.10,
        REPUTATION: 0.05
    };

    let skillCanonicalCache = null;

    /**
     * Load skill-canonical.json (skill synonyms, location canonical). Uses cache.
     * @param {string} [basePath=''] - Base path for data folder
     * @returns {Promise<{ skillSynonyms: Object, locationCanonical: Object, categoryExpansion: Object }>}
     */
    async function loadSkillCanonical(basePath = '') {
        if (skillCanonicalCache) return skillCanonicalCache;
        try {
            const path = (basePath || (global.CONFIG && CONFIG.BASE_PATH) || '') + 'data/skill-canonical.json';
            const res = await fetch(path);
            skillCanonicalCache = await res.json();
            return skillCanonicalCache;
        } catch (e) {
            skillCanonicalCache = {
                skillSynonyms: {},
                locationCanonical: {},
                categoryExpansion: {}
            };
            return skillCanonicalCache;
        }
    }

    /**
     * Normalize a skill string using synonym map (lowercase key lookup).
     * @param {string} skill
     * @param {Object} synonyms - map lowercase -> canonical
     */
    function normalizeSkill(skill, synonyms = {}) {
        if (!skill || typeof skill !== 'string') return '';
        const s = skill.trim();
        if (!s) return '';
        const key = s.toLowerCase();
        return synonyms[key] || s;
    }

    /**
     * Normalize location to a standard value (Remote | KSA | Riyadh | Jeddah | Eastern Province | Tabuk | NEOM | etc.).
     */
    function normalizeLocation(opportunity, locationCanonical = {}) {
        const locReq = opportunity.attributes?.locationRequirement || opportunity.attributes?.workMode;
        if (locReq) {
            const key = String(locReq).toLowerCase().replace(/\s+/g, '-');
            if (locationCanonical[key]) return locationCanonical[key];
            const k2 = String(locReq).toLowerCase();
            if (locationCanonical[k2]) return locationCanonical[k2];
            if (/remote/i.test(locReq)) return 'Remote';
            if (/hybrid/i.test(locReq)) return 'Hybrid';
            if (/on-site|onsite/i.test(locReq)) return 'On-Site';
        }
        const region = (opportunity.locationRegion || '').toLowerCase().replace(/\s+/g, '-');
        const city = (opportunity.locationCity || '').toLowerCase().replace(/\s+/g, '-');
        const country = (opportunity.locationCountry || '').toLowerCase();
        if (region && locationCanonical[region]) return locationCanonical[region];
        if (city && locationCanonical[city]) return locationCanonical[city];
        if (country && locationCanonical[country]) return locationCanonical[country];
        if (opportunity.location && /remote/i.test(opportunity.location)) return 'Remote';
        if (region) return region.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        if (country === 'sa' || country === 'sau') return 'KSA';
        return opportunity.location || 'KSA';
    }

    /**
     * Extract budget as { min, max, currency } from opportunity.
     */
    function extractBudget(opportunity) {
        const ed = opportunity.exchangeData || {};
        const att = opportunity.attributes || {};
        let min = null, max = null, currency = (ed.currency || 'SAR').toUpperCase();
        if (ed.budgetRange && typeof ed.budgetRange === 'object') {
            min = ed.budgetRange.min != null ? Number(ed.budgetRange.min) : null;
            max = ed.budgetRange.max != null ? Number(ed.budgetRange.max) : null;
            if (ed.budgetRange.currency) currency = String(ed.budgetRange.currency).toUpperCase();
        }
        if (min == null && max == null && ed.cashAmount != null) {
            const n = Number(ed.cashAmount);
            min = max = isNaN(n) ? null : n;
        }
        if (min == null && att.salaryRange && typeof att.salaryRange === 'object') {
            min = att.salaryRange.min != null ? Number(att.salaryRange.min) : null;
            max = att.salaryRange.max != null ? Number(att.salaryRange.max) : null;
            if (att.salaryRange.currency) currency = String(att.salaryRange.currency).toUpperCase();
        }
        if (min == null && att.targetPrice != null) {
            const n = Number(att.targetPrice);
            min = max = isNaN(n) ? null : n;
        }
        if (min == null && att.price != null) {
            const n = Number(att.price);
            min = max = isNaN(n) ? null : n;
        }
        return { min: min != null ? min : undefined, max: max != null ? max : undefined, currency };
    }

    /**
     * Extract timeline: start, end (ISO), durationDays.
     */
    function extractTimeline(opportunity) {
        const att = opportunity.attributes || {};
        let start = null, end = null, durationDays = null;
        if (att.startDate) start = att.startDate;
        if (att.tenderDeadline) end = att.tenderDeadline;
        if (att.applicationDeadline) end = att.applicationDeadline || end;
        if (att.endDate && !end) end = att.endDate;
        if (att.availability && typeof att.availability === 'object') {
            start = att.availability.start || start;
            end = att.availability.end || end;
        }
        if (att.deliveryTimeline && typeof att.deliveryTimeline === 'object') {
            start = att.deliveryTimeline.start || start;
            end = att.deliveryTimeline.end || end;
        }
        if (att.duration != null) durationDays = Number(att.duration);
        if (att.projectDuration != null) durationDays = Number(att.projectDuration);
        if (att.contractDuration != null) durationDays = Number(att.contractDuration);
        return { start: start || undefined, end: end || undefined, durationDays: durationDays != null ? durationDays : undefined };
    }

    /**
     * Extract and normalize structured attributes from an opportunity.
     * @param {Object} opportunity - Raw opportunity (Need or Offer post)
     * @param {Object} [canonicalMap] - Optional { skillSynonyms, locationCanonical, categoryExpansion } from skill-canonical.json
     * @param {Object} [creator] - Optional creator profile for reputation (rating, completion count)
     * @returns {Object} normalizedPost - { skills, categories, budget, timeline, deadline, availability, location, reputation }
     */
    function extractAndNormalize(opportunity, canonicalMap = {}, creator = null) {
        const synonyms = canonicalMap.skillSynonyms || {};
        const locationCanonical = canonicalMap.locationCanonical || {};
        const scope = opportunity.scope || {};
        const att = opportunity.attributes || {};

        const rawSkills = [].concat(
            scope.requiredSkills || [],
            scope.offeredSkills || [],
            att.requiredSkills || [],
            att.offeredSkills || []
        ).filter(Boolean);
        const skills = [...new Set(rawSkills.map(s => normalizeSkill(typeof s === 'string' ? s : (s?.label || s), synonyms)))];

        const categories = [].concat(
            opportunity.modelType ? [opportunity.modelType] : [],
            opportunity.subModelType ? [opportunity.subModelType] : [],
            scope.sectors || []
        ).filter(Boolean);

        const budget = extractBudget(opportunity);
        const timeline = extractTimeline(opportunity);
        const deadline = timeline.end || (opportunity.intent === 'request' ? att.tenderDeadline || att.applicationDeadline : undefined);
        const availability = timeline.start && timeline.end ? { start: timeline.start, end: timeline.end } : (att.availability || undefined);

        const location = normalizeLocation(opportunity, locationCanonical);

        let reputation = 0.5;
        if (creator && (creator.profile?.rating != null || creator.rating != null)) {
            const r = Number(creator.profile?.rating ?? creator.rating);
            reputation = isNaN(r) ? 0.5 : Math.max(0, Math.min(1, r));
        } else if (creator && creator.profile?.completedProjects != null) {
            const c = Number(creator.profile.completedProjects);
            reputation = isNaN(c) ? 0.5 : Math.min(1, 0.3 + Math.min(c, 20) / 100);
        }

        if (opportunity.value_exchange) {
            const valueNormalizer = (typeof global !== 'undefined' && global.valueNormalizer) || (typeof window !== 'undefined' && window.valueNormalizer);
            if (valueNormalizer && typeof valueNormalizer.buildNormalized === 'function') {
                try {
                    opportunity.value_exchange._normalized = valueNormalizer.buildNormalized(opportunity.value_exchange);
                } catch (e) {
                    if (global.CONFIG && global.CONFIG.MATCHING && global.CONFIG.MATCHING.DEBUG) {
                        console.warn('[post-preprocessor] value normalization failed:', e);
                    }
                }
            }
        }

        return {
            skills,
            categories,
            budget,
            timeline,
            deadline: deadline || undefined,
            availability: availability || undefined,
            location,
            reputation,
            intent: opportunity.intent || 'request',
            modelType: opportunity.modelType,
            subModelType: opportunity.subModelType
        };
    }

    const postPreprocessor = {
        loadSkillCanonical,
        extractAndNormalize,
        normalizeSkill,
        normalizeLocation,
        extractBudget,
        extractTimeline
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = postPreprocessor;
    } else {
        global.postPreprocessor = postPreprocessor;
    }
})(typeof window !== 'undefined' ? window : globalThis);
