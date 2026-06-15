/**
 * Admin settings and report filter validation.
 */
(function (global) {
    const P = () => global.validationPrimitives;

    const RANGES = {
        passwordMinLength: { min: 4, max: 64 },
        sessionDurationHours: { min: 1, max: 720 },
        resetTokenTtlMinutes: { min: 5, max: 1440 },
        maxFailedAttempts: { min: 1, max: 20 },
        digestHour: { min: 0, max: 23 },
        negotiationMaxRounds: { min: 1, max: 100 },
        minThreshold: { min: 0, max: 1 },
        autoNotifyThreshold: { min: 0, max: 1 },
        postToPostThreshold: { min: 0, max: 1 },
        candidateMax: { min: 10, max: 1000 }
    };

    function clampNumericField(value, field, label, ctx) {
        const range = RANGES[field];
        if (!range) return;
        const num = P().toNumber(value);
        if (num === null || Number.isNaN(num)) {
            ctx.addFieldError(field, `${label} must be a valid number.`);
            return;
        }
        P().assertMin(num, range.min, field, label, ctx);
        P().assertMax(num, range.max, field, label, ctx);
    }

    function validateAdminSettings(patch) {
        const ctx = P().createResult();
        const s = patch || {};

        if (s.security) {
            clampNumericField(s.security.passwordMinLength, 'passwordMinLength', 'Password minimum length', ctx);
            clampNumericField(s.security.resetTokenTtlMinutes, 'resetTokenTtlMinutes', 'Reset token TTL', ctx);
            clampNumericField(s.security.maxFailedAttempts, 'maxFailedAttempts', 'Max failed attempts', ctx);
        }
        if (s.matching) {
            clampNumericField(s.matching.minThreshold, 'minThreshold', 'Minimum match threshold', ctx);
            clampNumericField(s.matching.autoNotifyThreshold, 'autoNotifyThreshold', 'Auto-notify threshold', ctx);
            clampNumericField(s.matching.postToPostThreshold, 'postToPostThreshold', 'Post-to-post threshold', ctx);
            clampNumericField(s.matching.candidateMax, 'candidateMax', 'Candidate max', ctx);
        }
        if (s.workflow) {
            clampNumericField(s.workflow.negotiationMaxRounds, 'negotiationMaxRounds', 'Negotiation max rounds', ctx);
        }
        if (s.notifications && s.notifications.digestHour !== undefined) {
            clampNumericField(s.notifications.digestHour, 'digestHour', 'Digest hour', ctx);
        }

        return ctx.toResult();
    }

    function validateDateRangeFilter(startDate, endDate) {
        const ctx = P().createResult();
        P().assertIsoDate(startDate, 'startDate', 'Start date', ctx);
        P().assertIsoDate(endDate, 'endDate', 'End date', ctx);
        P().assertDateOrder(startDate, endDate, 'endDate', ctx, 'End date must be on or after start date.');
        return ctx.toResult();
    }

    global.validateAdminSettings = validateAdminSettings;
    global.validateDateRangeFilter = validateDateRangeFilter;
})(typeof window !== 'undefined' ? window : globalThis);
