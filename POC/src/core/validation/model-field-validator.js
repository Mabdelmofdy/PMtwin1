/**
 * Schema-driven validation for opportunity model dynamic attributes.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    /** Model attributes collected on Step 6 (value exchange), not Step 5 model details. */
    const EXCHANGE_DEFERRED_ATTRIBUTE_KEYS = ['paymentTerms', 'exchangeType', 'barterOffer'];

    function getModelAttributes(modelKey, subModelKey) {
        const models = global.OPPORTUNITY_MODELS;
        if (!models || !modelKey || !subModelKey) return [];
        const model = models[modelKey];
        const sub = model && model.subModels && model.subModels[subModelKey];
        return (sub && sub.attributes) || [];
    }

    function isFieldApplicable(field, attributes) {
        if (!field.conditional) return true;
        const condField = field.conditional.field;
        const condValues = Array.isArray(field.conditional.value)
            ? field.conditional.value
            : [field.conditional.value];
        const actual = attributes[condField];
        if (Array.isArray(actual)) {
            return actual.some(v => condValues.includes(v));
        }
        return condValues.includes(actual);
    }

    function validateModelAttributes(attributes, modelKey, subModelKey, options = {}) {
        const ctx = P().createResult();
        const excludeKeys = new Set(options.excludeKeys || []);
        const schema = getModelAttributes(modelKey, subModelKey)
            .filter((field) => !excludeKeys.has(field.key));
        const data = attributes || {};

        schema.forEach((field) => {
            if (!isFieldApplicable(field, data)) return;
            const key = field.key;
            const label = field.label || key;
            const value = data[key];

            if (field.type === 'currency-range') {
                const range = typeof value === 'object' && value !== null ? value : {};
                const minRaw = range.min ?? data[`${key}_min`];
                const maxRaw = range.max ?? data[`${key}_max`];
                const minEmpty = P().isEmptyValue(minRaw);
                const maxEmpty = P().isEmptyValue(maxRaw);
                if (field.required && (minEmpty || maxEmpty)) {
                    ctx.addFieldError(key, `${label} is required.`);
                    return;
                }
                if (minEmpty && maxEmpty) return;

                const minNum = P().toNumber(minRaw);
                const maxNum = P().toNumber(maxRaw);
                if (!minEmpty) {
                    P().assertNonNegative(minNum, `${key}_min`, `${label} minimum`, ctx);
                }
                if (!maxEmpty) {
                    P().assertNonNegative(maxNum, `${key}_max`, `${label} maximum`, ctx);
                }
                if (!minEmpty && !maxEmpty && minNum !== null && maxNum !== null
                    && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && maxNum < minNum) {
                    ctx.addFieldError(`${key}_max`, `${label} maximum must be greater than or equal to minimum.`);
                }
                return;
            }

            if (field.required && P().isEmptyValue(value)) {
                ctx.addFieldError(key, `${label} is required.`);
                return;
            }
            if (P().isEmptyValue(value)) return;

            if (field.maxLength != null) {
                P().assertMaxLength(value, field.maxLength, key, label, ctx);
            }

            if (field.type === 'number' || field.type === 'currency') {
                const num = P().toNumber(value);
                if (field.min != null) {
                    P().assertMin(num, field.min, key, label, ctx);
                } else if (field.type === 'currency') {
                    P().assertNonNegative(num, key, label, ctx);
                } else if (field.type === 'number' && /duration/i.test(`${key}${label}`)) {
                    P().assertMin(num, 1, key, label, ctx);
                }
            }

            if (field.type === 'date') {
                P().assertIsoDate(value, key, label, ctx);
                if (options.disallowPastDates) {
                    P().assertDateOnOrAfterToday(value, key, label, ctx);
                }
            }

            if (field.type === 'date-range') {
                const range = typeof value === 'object' && value !== null ? value : {};
                const start = range.start || data[`${key}_start`];
                const end = range.end || data[`${key}_end`];
                if (start) {
                    P().assertIsoDate(start, `${key}_start`, `${label} (start)`, ctx);
                    if (options.disallowPastDates) {
                        P().assertDateOnOrAfterToday(start, `${key}_start`, `${label} (start)`, ctx);
                    }
                }
                if (end) {
                    P().assertIsoDate(end, `${key}_end`, `${label} (end)`, ctx);
                    if (options.disallowPastDates) {
                        P().assertDateOnOrAfterToday(end, `${key}_end`, `${label} (end)`, ctx);
                    }
                }
                if (start && end) {
                    P().assertDateOrder(start, end, `${key}_end`, ctx, `${label} end date cannot be before start date.`);
                }
            }
        });

        if (options.validateTags !== false) {
            schema.filter(f => f.type === 'tags' && f.required).forEach((field) => {
                const value = data[field.key];
                const items = Array.isArray(value) ? value : String(value || '').split(',').map(s => s.trim()).filter(Boolean);
                if (!items.length) {
                    ctx.addFieldError(field.key, `${field.label || field.key} is required.`);
                }
            });
        }

        return ctx.toResult();
    }

    global.validateModelAttributes = validateModelAttributes;
    global.EXCHANGE_DEFERRED_ATTRIBUTE_KEYS = EXCHANGE_DEFERRED_ATTRIBUTE_KEYS;
})(typeof window !== 'undefined' ? window : globalThis);
