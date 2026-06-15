/**
 * Dispute raise/resolution validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    const CATEGORIES = ['value_mismatch', 'scope_disagreement', 'payment_terms', 'bad_faith', 'other'];
    const OUTCOMES = ['amend_terms', 'force_close', 'extend_deadline', 'dismiss', 'escalate_external'];

    function validateRaiseDispute(data) {
        const ctx = P().createResult();
        const d = data || {};
        P().assertRequired(d.category, 'category', 'Dispute category', ctx);
        if (d.category && !CATEGORIES.includes(String(d.category).toLowerCase())) {
            ctx.addFieldError('category', 'Dispute category is not supported.');
        }
        P().assertRequired(d.description, 'description', 'Description', ctx);
        if (d.description != null && String(d.description).trim().length < 10) {
            ctx.addFieldError('description', 'Description must be at least 10 characters.');
        }
        if (d.description != null && String(d.description).length > 2000) {
            ctx.addFieldError('description', 'Description is too long.');
        }
        return ctx.toResult();
    }

    function validateResolveDispute(data) {
        const ctx = P().createResult();
        const d = data || {};
        P().assertRequired(d.outcome, 'outcome', 'Resolution outcome', ctx);
        if (d.outcome && !OUTCOMES.includes(String(d.outcome).toLowerCase())) {
            ctx.addFieldError('outcome', 'Resolution outcome is not supported.');
        }
        if (d.notes != null && String(d.notes).length > 2000) {
            ctx.addFieldError('notes', 'Resolution notes are too long.');
        }
        return ctx.toResult();
    }

    global.validateRaiseDispute = validateRaiseDispute;
    global.validateResolveDispute = validateResolveDispute;
})(typeof window !== 'undefined' ? window : globalThis);
