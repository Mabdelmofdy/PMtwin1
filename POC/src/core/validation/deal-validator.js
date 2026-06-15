/**
 * Deal terms and milestone validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    function validateMilestone(milestone, index) {
        const ctx = P().createResult();
        const m = milestone || {};
        const prefix = index != null ? `milestones[${index}]` : 'milestone';

        if (m.dueDate) {
            P().assertIsoDate(m.dueDate, `${prefix}.dueDate`, 'Milestone due date', ctx);
        }
        if (m.amount !== undefined && m.amount !== '') {
            P().assertNonNegative(P().toNumber(m.amount), `${prefix}.amount`, 'Milestone amount', ctx);
        }

        return ctx.toResult();
    }

    function validateDealTerms(data) {
        const ctx = P().createResult();
        const d = data || {};

        if (d.cashAmount !== undefined && d.cashAmount !== '') {
            P().assertNonNegative(P().toNumber(d.cashAmount), 'cashAmount', 'Agreed cash amount', ctx);
        }
        if (d.agreedCashAmount !== undefined && d.agreedCashAmount !== '') {
            P().assertNonNegative(P().toNumber(d.agreedCashAmount), 'agreedCashAmount', 'Agreed cash amount', ctx);
        }

        const milestones = Array.isArray(d.milestones) ? d.milestones : [];
        milestones.forEach((m, i) => {
            const result = validateMilestone(m, i);
            if (!result.isValid) {
                Object.entries(result.fieldErrors).forEach(([field, message]) => {
                    ctx.addFieldError(field, message);
                });
            }
        });

        let prevDate = null;
        milestones.forEach((m, i) => {
            if (!m.dueDate) return;
            const parsed = P().parseIsoDate(m.dueDate);
            if (!parsed || !parsed.valid) return;
            if (prevDate && parsed.value < prevDate) {
                ctx.addFieldError(`milestones[${i}].dueDate`, 'Milestone due dates must be in chronological order.');
            }
            prevDate = parsed.value;
        });

        return ctx.toResult();
    }

    function validateDealUpdate(updates) {
        return validateDealTerms(updates || {});
    }

    global.validateDealTerms = validateDealTerms;
    global.validateDealUpdate = validateDealUpdate;
    global.validateMilestone = validateMilestone;
})(typeof window !== 'undefined' ? window : globalThis);
