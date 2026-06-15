/**
 * Unified opportunity validation for create/edit and data layer.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    function normalizeOpportunityState(state) {
        const s = state || {};
        const budgetRange = s.budgetRange || {};
        return {
            ...s,
            budgetMin: s.budgetMin ?? budgetRange.min,
            budgetMax: s.budgetMax ?? budgetRange.max,
            durationDays: s.durationDays ?? s.duration,
            cashAmount: s.cashAmount ?? s.exchangeData?.cashAmount,
            equityPercentage: s.equityPercentage ?? s.exchangeData?.equityPercentage,
            profitSharePercentage: s.profitSharePercentage ?? s.exchangeData?.profitSharePercentage
        };
    }

    function validateOpportunityForm(formState, options = {}) {
        const state = normalizeOpportunityState(formState);
        const requiredFields = Array.isArray(options.requiredFields) ? options.requiredFields : [];
        const ctx = P().createResult();

        requiredFields.forEach((fieldName) => {
            P().assertRequired(state[fieldName], fieldName, fieldName, ctx);
        });

        const exchangeMode = state.exchangeMode;
        const cashAmountNum = P().toNumber(state.cashAmount);
        if (exchangeMode === 'cash' || (state.cashAmount !== undefined && state.cashAmount !== '')) {
            P().assertPositive(cashAmountNum, 'cashAmount', 'Cash Amount', ctx);
        }

        const durationNum = P().toNumber(state.durationDays);
        if (state.durationDays !== undefined || state.duration !== undefined) {
            if (durationNum === null || Number.isNaN(durationNum) || durationNum < 1) {
                ctx.addFieldError('durationDays', 'Duration must be at least 1 day.');
            }
        }

        const budgetMinNum = P().toNumber(state.budgetMin);
        const budgetMaxNum = P().toNumber(state.budgetMax);
        if (state.budgetMin !== undefined || state.budgetMax !== undefined) {
            P().assertNonNegative(budgetMinNum, 'budgetMin', 'Budget minimum', ctx);
            if (budgetMaxNum === null || Number.isNaN(budgetMaxNum) || budgetMaxNum < 0) {
                ctx.addFieldError('budgetMax', 'Budget maximum must be a valid number greater than or equal to 0.');
            } else if (budgetMinNum !== null && !Number.isNaN(budgetMinNum) && budgetMaxNum < budgetMinNum) {
                ctx.addFieldError('budgetMax', 'Budget maximum must be greater than or equal to budget minimum.');
            }
        }

        const equityNum = P().toNumber(state.equityPercentage);
        if (state.equityPercentage !== undefined && state.equityPercentage !== '') {
            P().assertPercent(equityNum, 'equityPercentage', 'Equity Percentage', ctx);
        }

        const profitShareNum = P().toNumber(state.profitSharePercentage);
        if (state.profitSharePercentage !== undefined && state.profitSharePercentage !== '') {
            P().assertPercent(profitShareNum, 'profitSharePercentage', 'Profit Share Percentage', ctx);
        }

        P().assertIsoDate(state.startDate, 'startDate', 'Start date', ctx);
        P().assertIsoDate(state.endDate, 'endDate', 'End date', ctx);
        P().assertIsoDate(state.applicationDeadline, 'applicationDeadline', 'Application deadline', ctx);

        P().assertDateOrder(state.startDate, state.endDate, 'endDate', ctx);
        P().assertDateBefore(state.applicationDeadline, state.startDate, 'applicationDeadline', ctx,
            'Application deadline cannot be after start date.');
        P().assertDateBefore(state.applicationDeadline, state.endDate, 'applicationDeadline', ctx,
            'Application deadline cannot be after end date.');

        if (options.disallowPastDates) {
            const today = P().getTodayIsoDate();
            P().assertDateOnOrAfter(today, state.startDate, 'startDate', 'Start date', ctx,
                'Start date cannot be in the past.');
            P().assertDateOnOrAfter(today, state.applicationDeadline, 'applicationDeadline', 'Application deadline', ctx,
                'Application deadline cannot be in the past.');
            P().assertDateOnOrAfter(today, state.endDate, 'endDate', 'Project / contract end date', ctx,
                'Project / contract end date cannot be in the past.');
        }

        if (options.modelKey && options.subModelKey && state.modelAttributes) {
            const modelResult = global.validateModelAttributes(
                state.modelAttributes,
                options.modelKey,
                options.subModelKey,
                { disallowPastDates: !!options.disallowPastDates }
            );
            if (!modelResult.isValid) {
                Object.entries(modelResult.fieldErrors).forEach(([field, message]) => {
                    ctx.addFieldError(`modelAttributes.${field}`, message);
                });
            }
        }

        return ctx.toResult();
    }

    function validateOpportunityData(data, options = {}) {
        const opp = data || {};
        const exchange = opp.exchangeData || opp.value_exchange || {};
        const state = {
            exchangeMode: opp.exchangeMode || exchange.exchangeMode,
            cashAmount: exchange.cashAmount ?? opp.cashAmount,
            durationDays: opp.durationDays ?? opp.duration ?? opp.estimatedDurationDays,
            budgetMin: opp.budgetMin ?? opp.budgetRange?.min,
            budgetMax: opp.budgetMax ?? opp.budgetRange?.max,
            equityPercentage: exchange.equityPercentage ?? opp.equityPercentage,
            profitSharePercentage: exchange.profitSharePercentage ?? opp.profitSharePercentage,
            startDate: opp.startDate ?? opp.timeline?.startDate,
            endDate: opp.endDate ?? opp.timeline?.endDate,
            applicationDeadline: opp.applicationDeadline ?? opp.timeline?.applicationDeadline,
            modelAttributes: opp.modelAttributes || opp.attributes,
            modelKey: opp.modelKey || opp.collaborationModel,
            subModelKey: opp.subModelKey || opp.subModel
        };
        return validateOpportunityForm(state, {
            modelKey: state.modelKey,
            subModelKey: state.subModelKey,
            ...options
        });
    }

    global.validateOpportunityForm = validateOpportunityForm;
    global.validateOpportunityData = validateOpportunityData;
})(typeof window !== 'undefined' ? window : globalThis);
