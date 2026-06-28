/**
 * Pure helpers for the opportunity detail Applications UI.
 *
 * Kept framework-free and DOM-free so they can be unit tested in Node and
 * reused by the browser feature script via `window.opportunityApplicationsUtils`.
 */
(function (global) {
    /**
     * Collapse the various `application_value` shapes the platform has produced
     * over time into one predictable object the UI can read.
     *
     * Known shapes:
     *  - Wizard submit (snake_case): { offered_value, requested_value, currency, exchange_mode, value_score, value_breakdown, lowValueMatch }
     *  - Legacy/display (camelCase): { offeredValue, requestedValue, requestedCurrency, exchangeMode }
     *  - Seed data: { amount, currency } or { exchangeMode, barterValue, currency } or { profitSplit }
     */
    function normalizeApplicationValue(rawValue) {
        const av = rawValue || {};

        const firstDefined = (...vals) => {
            for (const v of vals) {
                if (v !== undefined && v !== null && v !== '') return v;
            }
            return null;
        };

        const requestedValue = firstDefined(
            av.requestedValue,
            av.requested_value,
            av.amount,
            av.barterValue,
            av.barter_value
        );

        const offeredValue = firstDefined(av.offeredValue, av.offered_value);

        const currency = firstDefined(av.requestedCurrency, av.requested_currency, av.currency) || 'SAR';

        const exchangeMode = firstDefined(av.exchangeMode, av.exchange_mode);

        const valueScore = firstDefined(av.value_score, av.valueScore);

        const valueBreakdown = firstDefined(av.value_breakdown, av.valueBreakdown);

        const toNumber = (v) => {
            if (v == null) return null;
            if (typeof v === 'number') return isNaN(v) ? null : v;
            const n = parseFloat(String(v).replace(/,/g, ''));
            return isNaN(n) ? null : n;
        };

        const requestedNumber = toNumber(requestedValue);

        return {
            requestedValue,
            requestedNumber,
            offeredValue,
            currency,
            exchangeMode,
            profitSplit: firstDefined(av.profitSplit, av.profit_split),
            valueScore: valueScore != null ? Number(valueScore) : null,
            valueScorePct: valueScore != null ? Math.round(Number(valueScore) * 100) : null,
            valueBreakdown: valueBreakdown || null,
            lowValueMatch: av.lowValueMatch === true || av.low_value_match === true,
            valueGap: firstDefined(av.value_gap, av.valueGap)
        };
    }

    /**
     * Human-readable amount string for an application card, or null when there
     * is nothing meaningful to show.
     */
    function formatApplicationValueAmount(rawValue) {
        const n = normalizeApplicationValue(rawValue);
        const amount = n.requestedNumber != null ? n.requestedNumber : n.requestedValue;
        if (amount != null && String(amount).trim() !== '') {
            const display = typeof amount === 'number' ? amount.toLocaleString() : String(amount);
            return `${display} ${n.currency}`;
        }
        if (n.profitSplit) return `Profit split ${n.profitSplit}`;
        return null;
    }

    /** Filter applications down to a single opportunity. */
    function filterApplicationsForOpportunity(allApplications, opportunityId) {
        if (!Array.isArray(allApplications) || !opportunityId) return [];
        return allApplications.filter((a) => a && a.opportunityId === opportunityId);
    }

    /**
     * Sort applications by value compatibility score (desc). Missing scores sort
     * last. Returns a new array; does not mutate the input.
     */
    function sortApplicationsByValueScore(applications) {
        if (!Array.isArray(applications)) return [];
        const score = (a) => {
            const v = normalizeApplicationValue(a && a.application_value).valueScore;
            return v != null ? v : -1;
        };
        return [...applications].sort((a, b) => score(b) - score(a));
    }

    /**
     * Resolve which application-related sections should be visible, so the DOM
     * toggling logic has a single, testable source of truth.
     *
     * @returns {{ showApplicationsList: boolean, showApplyCta: boolean, showAlreadyApplied: boolean }}
     */
    function resolveApplicationSectionVisibility(ctx = {}) {
        const {
            isOwner = false,
            canViewApplications = false,
            canApply = false,
            acceptsApplications = true,
            currentApplication = null,
            existingDeal = null
        } = ctx;

        if (!acceptsApplications) {
            return { showApplicationsList: false, showApplyCta: false, showAlreadyApplied: false };
        }

        const showApplicationsList = !!(isOwner || canViewApplications);
        // Owners never see the applicant-facing apply/already-applied panels.
        const showApplyCta = !isOwner && !!canApply;
        const showAlreadyApplied = !isOwner && !canApply && !!(currentApplication || existingDeal);

        return { showApplicationsList, showApplyCta, showAlreadyApplied };
    }

    const api = {
        normalizeApplicationValue,
        formatApplicationValueAmount,
        filterApplicationsForOpportunity,
        sortApplicationsByValueScore,
        resolveApplicationSectionVisibility
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.opportunityApplicationsUtils = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
