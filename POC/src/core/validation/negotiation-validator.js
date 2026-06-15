/**
 * Negotiation proposal validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    const EXCHANGE_MODES = ['cash', 'barter', 'equity', 'profit_sharing', 'profit-sharing', 'profit sharing'];
    const MAX_TEXT = 2000;
    const MAX_SHORT = 200;

    function validateNegotiationProposal(data) {
        const ctx = P().createResult();
        const d = data || {};

        if (d.value !== undefined && d.value !== '' && d.value !== null) {
            P().assertNonNegative(P().toNumber(d.value), 'value', 'Proposed value', ctx);
        }
        if (d.proposedValue !== undefined && d.proposedValue !== '' && d.proposedValue !== null) {
            P().assertNonNegative(P().toNumber(d.proposedValue), 'proposedValue', 'Proposed value', ctx);
        }

        if (d.currency != null && String(d.currency).trim() !== '') {
            if (String(d.currency).trim().length > 10) {
                ctx.addFieldError('currency', 'Currency code is too long.');
            }
        }

        if (d.paymentSchedule != null && String(d.paymentSchedule).length > MAX_TEXT) {
            ctx.addFieldError('paymentSchedule', 'Payment schedule is too long.');
        }
        if (d.duration != null && String(d.duration).length > MAX_SHORT) {
            ctx.addFieldError('duration', 'Duration is too long.');
        }
        if (d.scope != null && String(d.scope).length > MAX_TEXT) {
            ctx.addFieldError('scope', 'Scope is too long.');
        }
        if (d.profitDistribution != null && String(d.profitDistribution).length > MAX_TEXT) {
            ctx.addFieldError('profitDistribution', 'Profit distribution text is too long.');
        }

        if (d.equityPercentage !== undefined && d.equityPercentage !== '' && d.equityPercentage !== null) {
            const pct = P().toNumber(d.equityPercentage);
            if (Number.isNaN(pct) || pct < 0 || pct > 100) {
                ctx.addFieldError('equityPercentage', 'Equity percentage must be between 0 and 100.');
            }
        }

        if (d.profitSplit != null && String(d.profitSplit).trim() !== '') {
            const split = String(d.profitSplit).trim();
            if (!/^\d{1,3}\s*[-–]\s*\d{1,3}$/.test(split)) {
                ctx.addFieldError('profitSplit', 'Profit split should look like 65-35.');
            }
        }

        if (d.exchangeMode != null && String(d.exchangeMode).trim() !== '') {
            const mode = String(d.exchangeMode).toLowerCase().trim();
            const normalized = mode === 'profit-sharing' || mode === 'profit sharing' ? 'profit_sharing' : mode;
            if (!EXCHANGE_MODES.includes(mode) && normalized !== 'profit_sharing') {
                ctx.addFieldError('exchangeMode', 'Exchange mode is not supported.');
            }
        }

        if (d.startDate != null && String(d.startDate).trim() !== '') {
            const parsed = P().parseIsoDate(d.startDate);
            if (!parsed.valid) {
                ctx.addFieldError('startDate', 'Start date must be YYYY-MM-DD.');
            }
        }
        if (d.endDate != null && String(d.endDate).trim() !== '') {
            const parsedEnd = P().parseIsoDate(d.endDate);
            if (!parsedEnd.valid) {
                ctx.addFieldError('endDate', 'End date must be YYYY-MM-DD.');
            } else if (d.startDate) {
                const parsedStart = P().parseIsoDate(d.startDate);
                if (parsedStart.valid && parsedEnd.value < parsedStart.value) {
                    ctx.addFieldError('endDate', 'End date must be on or after start date.');
                }
            }
        }

        return ctx.toResult();
    }

    global.validateNegotiationProposal = validateNegotiationProposal;
})(typeof window !== 'undefined' ? window : globalThis);
