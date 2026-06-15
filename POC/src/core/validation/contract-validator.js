/**
 * Contract edit and review validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    function validateContract(data, options = {}) {
        const ctx = P().createResult();
        const d = data || {};
        const minRating = options.minRating != null ? options.minRating : 1;
        const maxRating = options.maxRating != null ? options.maxRating : 5;

        if (options.requireScope !== false && d.scope !== undefined) {
            P().assertRequired(d.scope, 'scope', 'Scope', ctx);
        }
        if (d.rating !== undefined && d.rating !== '') {
            const rating = P().toNumber(d.rating);
            P().assertMin(rating, minRating, 'rating', 'Rating', ctx);
            P().assertMax(rating, maxRating, 'rating', 'Rating', ctx);
        }

        const milestones = Array.isArray(d.milestones) ? d.milestones : [];
        milestones.forEach((m, i) => {
            if (m.dueDate) {
                P().assertIsoDate(m.dueDate, `milestones[${i}].dueDate`, 'Milestone due date', ctx);
            }
            if (m.amount !== undefined && m.amount !== '') {
                P().assertNonNegative(P().toNumber(m.amount), `milestones[${i}].amount`, 'Milestone amount', ctx);
            }
        });

        return ctx.toResult();
    }

    global.validateContract = validateContract;
})(typeof window !== 'undefined' ? window : globalThis);
