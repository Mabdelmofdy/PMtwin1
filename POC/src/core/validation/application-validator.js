/**
 * Application submission validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    function validateApplication(data, options = {}) {
        const ctx = P().createResult();
        const d = data || {};

        if (options.requireProposal !== false) {
            P().assertRequired(d.proposal || d.proposalText, 'proposal', 'Proposal', ctx);
        }
        if (d.estimatedDurationDays !== undefined && d.estimatedDurationDays !== '') {
            const days = P().toNumber(d.estimatedDurationDays);
            if (days === null || Number.isNaN(days) || days < 1) {
                ctx.addFieldError('estimatedDurationDays', 'Estimated duration must be at least 1 day.');
            }
        }
        if (d.offeredValue !== undefined && d.offeredValue !== '') {
            const offeredNum = P().toNumber(d.offeredValue);
            if (offeredNum !== null && !Number.isNaN(offeredNum)) {
                P().assertNonNegative(offeredNum, 'offeredValue', 'Offered value', ctx);
            }
        }
        if (d.bidAmount !== undefined && d.bidAmount !== '') {
            P().assertNonNegative(P().toNumber(d.bidAmount), 'bidAmount', 'Bid amount', ctx);
        }
        if (d.availabilityDate) {
            P().assertIsoDate(d.availabilityDate, 'availabilityDate', 'Availability date', ctx);
        }

        return ctx.toResult();
    }

    global.validateApplication = validateApplication;
})(typeof window !== 'undefined' ? window : globalThis);
