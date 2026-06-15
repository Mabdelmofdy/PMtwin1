/**
 * Backward-compatible shim — delegates to unified opportunity-validator.
 */
(function (global) {
    if (typeof global.validateOpportunityForm === 'function') {
        return;
    }
    global.validateOpportunityForm = function validateOpportunityFormLegacy(formState, options) {
        if (typeof global.validateOpportunityData === 'function') {
            return global.validateOpportunityData(formState, options);
        }
        return { isValid: true, errors: [], fieldErrors: {} };
    };
})(typeof window !== 'undefined' ? window : globalThis);
