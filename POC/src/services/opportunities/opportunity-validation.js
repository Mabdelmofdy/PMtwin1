/**
 * Centralized validation for create/edit opportunity flows.
 */
(function (global) {
    function toNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : NaN;
    }

    function parseIsoDate(value) {
        if (!value) return null;
        const raw = String(value).trim();
        if (!raw) return null;
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
        if (!match) return { valid: false, value: null };
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        const valid = date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day;
        return { valid, value: valid ? raw : null };
    }

    function validateOpportunityForm(formState, options = {}) {
        const state = formState || {};
        const requiredFields = Array.isArray(options.requiredFields) ? options.requiredFields : [];
        const errors = [];
        const fieldErrors = {};
        const addFieldError = (field, message) => {
            if (!field || fieldErrors[field]) return;
            fieldErrors[field] = message;
            errors.push(message);
        };

        requiredFields.forEach((fieldName) => {
            const value = state[fieldName];
            if (value === null || value === undefined || String(value).trim() === '') {
                addFieldError(fieldName, `${fieldName} is required.`);
            }
        });

        const exchangeMode = state.exchangeMode;
        const cashAmountNum = toNumber(state.cashAmount);
        if (exchangeMode === 'cash' || (state.cashAmount !== undefined && state.cashAmount !== '')) {
            if (cashAmountNum === null || Number.isNaN(cashAmountNum) || cashAmountNum <= 0) {
                addFieldError('cashAmount', 'Cash Amount must be a positive number.');
            }
        }

        const durationNum = toNumber(state.durationDays ?? state.duration);
        if (state.durationDays !== undefined || state.duration !== undefined) {
            if (durationNum === null || Number.isNaN(durationNum) || durationNum < 1) {
                addFieldError('durationDays', 'Duration must be at least 1 day.');
            }
        }

        const budgetMinNum = toNumber(state.budgetMin);
        const budgetMaxNum = toNumber(state.budgetMax);
        if (state.budgetMin !== undefined || state.budgetMax !== undefined) {
            if (budgetMinNum === null || Number.isNaN(budgetMinNum) || budgetMinNum < 0) {
                addFieldError('budgetMin', 'Budget minimum must be a valid number greater than or equal to 0.');
            }
            if (budgetMaxNum === null || Number.isNaN(budgetMaxNum)) {
                addFieldError('budgetMax', 'Budget maximum must be a valid positive number.');
            } else if (budgetMinNum !== null && !Number.isNaN(budgetMinNum) && budgetMaxNum < budgetMinNum) {
                addFieldError('budgetMax', 'Budget maximum must be greater than or equal to budget minimum.');
            }
        }

        const equityNum = toNumber(state.equityPercentage);
        if (state.equityPercentage !== undefined && state.equityPercentage !== '') {
            if (equityNum === null || Number.isNaN(equityNum) || equityNum < 0 || equityNum > 100) {
                addFieldError('equityPercentage', 'Equity Percentage must be between 0 and 100.');
            }
        }

        const profitShareNum = toNumber(state.profitSharePercentage);
        if (state.profitSharePercentage !== undefined && state.profitSharePercentage !== '') {
            if (profitShareNum === null || Number.isNaN(profitShareNum) || profitShareNum < 0 || profitShareNum > 100) {
                addFieldError('profitSharePercentage', 'Profit Share Percentage must be between 0 and 100.');
            }
        }

        const startDate = parseIsoDate(state.startDate);
        const endDate = parseIsoDate(state.endDate);
        const applicationDeadline = parseIsoDate(state.applicationDeadline);

        if (state.startDate && (!startDate || !startDate.valid)) {
            addFieldError('startDate', 'Start date is invalid.');
        }
        if (state.endDate && (!endDate || !endDate.valid)) {
            addFieldError('endDate', 'End date is invalid.');
        }
        if (state.applicationDeadline && (!applicationDeadline || !applicationDeadline.valid)) {
            addFieldError('applicationDeadline', 'Application deadline is invalid.');
        }

        if (startDate && startDate.valid && endDate && endDate.valid && endDate.value < startDate.value) {
            addFieldError('endDate', 'End date cannot be before start date.');
        }
        if (startDate && startDate.valid && applicationDeadline && applicationDeadline.valid && applicationDeadline.value > startDate.value) {
            addFieldError('applicationDeadline', 'Application deadline cannot be after start date.');
        }
        if (endDate && endDate.valid && applicationDeadline && applicationDeadline.valid && applicationDeadline.value > endDate.value) {
            addFieldError('applicationDeadline', 'Application deadline cannot be after end date.');
        }

        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }

    global.validateOpportunityForm = validateOpportunityForm;
})(typeof window !== 'undefined' ? window : globalThis);
