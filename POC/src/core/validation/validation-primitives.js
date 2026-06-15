/**
 * Shared validation primitives for PM-Twin POC.
 */
(function (global) {
    const DEFAULT_PASSWORD_POLICY = {
        passwordMinLength: 8,
        passwordRequireDigit: false,
        passwordRequireSymbol: false,
        passwordRequireUppercase: false
    };

    function createResult() {
        const errors = [];
        const fieldErrors = {};
        const addFieldError = (field, message) => {
            if (!field || fieldErrors[field]) return;
            fieldErrors[field] = message;
            errors.push(message);
        };
        return {
            errors,
            fieldErrors,
            addFieldError,
            toResult() {
                return {
                    isValid: errors.length === 0,
                    errors: errors.slice(),
                    fieldErrors: { ...fieldErrors }
                };
            }
        };
    }

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

    function isEmptyValue(value) {
        if (value === null || value === undefined) return true;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'string') return value.trim() === '';
        return false;
    }

    function assertRequired(value, field, label, ctx) {
        if (!isEmptyValue(value)) return true;
        ctx.addFieldError(field, `${label || field} is required.`);
        return false;
    }

    function assertNonNegative(num, field, label, ctx) {
        if (num === null || Number.isNaN(num)) {
            ctx.addFieldError(field, `${label || field} must be a valid number.`);
            return false;
        }
        if (num < 0) {
            ctx.addFieldError(field, `${label || field} cannot be negative.`);
            return false;
        }
        return true;
    }

    function assertPositive(num, field, label, ctx) {
        if (num === null || Number.isNaN(num) || num <= 0) {
            ctx.addFieldError(field, `${label || field} must be a positive number.`);
            return false;
        }
        return true;
    }

    function assertMin(num, min, field, label, ctx) {
        if (num === null || Number.isNaN(num)) {
            ctx.addFieldError(field, `${label || field} must be a valid number.`);
            return false;
        }
        if (num < min) {
            ctx.addFieldError(field, `${label || field} must be at least ${min}.`);
            return false;
        }
        return true;
    }

    function assertMax(num, max, field, label, ctx) {
        if (num === null || Number.isNaN(num)) {
            ctx.addFieldError(field, `${label || field} must be a valid number.`);
            return false;
        }
        if (num > max) {
            ctx.addFieldError(field, `${label || field} must be at most ${max}.`);
            return false;
        }
        return true;
    }

    function assertPercent(num, field, label, ctx) {
        if (num === null || Number.isNaN(num) || num < 0 || num > 100) {
            ctx.addFieldError(field, `${label || field} must be between 0 and 100.`);
            return false;
        }
        return true;
    }

    function assertIsoDate(value, field, label, ctx) {
        if (!value) return true;
        const parsed = parseIsoDate(value);
        if (!parsed || !parsed.valid) {
            ctx.addFieldError(field, `${label || field} is invalid.`);
            return false;
        }
        return true;
    }

    function assertDateOrder(startValue, endValue, endField, ctx, message) {
        const start = parseIsoDate(startValue);
        const end = parseIsoDate(endValue);
        if (!start || !start.valid || !end || !end.valid) return true;
        if (end.value < start.value) {
            ctx.addFieldError(endField, message || 'End date cannot be before start date.');
            return false;
        }
        return true;
    }

    function assertDateBefore(deadlineValue, limitValue, field, ctx, message) {
        const deadline = parseIsoDate(deadlineValue);
        const limit = parseIsoDate(limitValue);
        if (!deadline || !deadline.valid || !limit || !limit.valid) return true;
        if (deadline.value > limit.value) {
            ctx.addFieldError(field, message || 'Date cannot be after the limit date.');
            return false;
        }
        return true;
    }

    function getTodayIsoDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function assertDateOnOrAfter(minDateIso, value, field, label, ctx, message) {
        if (!value || !minDateIso) return true;
        const parsed = parseIsoDate(value);
        const min = parseIsoDate(minDateIso);
        if (!parsed || !parsed.valid || !min || !min.valid) return true;
        if (parsed.value < min.value) {
            ctx.addFieldError(field, message || `${label || field} must be today or a future date.`);
            return false;
        }
        return true;
    }

    function assertDateOnOrAfterToday(value, field, label, ctx, message) {
        return assertDateOnOrAfter(getTodayIsoDate(), value, field, label, ctx, message);
    }

    function assertEmail(value, field, ctx) {
        const raw = String(value || '').trim();
        if (!raw) {
            ctx.addFieldError(field, 'Email is required.');
            return false;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(raw)) {
            ctx.addFieldError(field, 'Please enter a valid email address.');
            return false;
        }
        return true;
    }

    function getPasswordPolicy() {
        try {
            const config = global.CONFIG || {};
            const storageKey = config.STORAGE_KEYS && config.STORAGE_KEYS.SYSTEM_SETTINGS;
            const storage = global.storageService;
            const persisted = storageKey && storage && typeof storage.get === 'function'
                ? storage.get(storageKey)
                : null;
            const security = (persisted && persisted.security) || {};
            return {
                passwordMinLength: Number(security.passwordMinLength) || DEFAULT_PASSWORD_POLICY.passwordMinLength,
                passwordRequireDigit: !!security.passwordRequireDigit,
                passwordRequireSymbol: !!security.passwordRequireSymbol,
                passwordRequireUppercase: !!security.passwordRequireUppercase
            };
        } catch (_e) {
            return { ...DEFAULT_PASSWORD_POLICY };
        }
    }

    function assertPassword(value, policy, field, ctx) {
        const pwd = String(value || '');
        const rules = policy || getPasswordPolicy();
        const minLen = Number(rules.passwordMinLength) || DEFAULT_PASSWORD_POLICY.passwordMinLength;
        if (pwd.length < minLen) {
            ctx.addFieldError(field, `Password must be at least ${minLen} characters.`);
            return false;
        }
        if (rules.passwordRequireDigit && !/\d/.test(pwd)) {
            ctx.addFieldError(field, 'Password must include at least one digit.');
            return false;
        }
        if (rules.passwordRequireUppercase && !/[A-Z]/.test(pwd)) {
            ctx.addFieldError(field, 'Password must include at least one uppercase letter.');
            return false;
        }
        if (rules.passwordRequireSymbol && !/[^A-Za-z0-9]/.test(pwd)) {
            ctx.addFieldError(field, 'Password must include at least one symbol.');
            return false;
        }
        return true;
    }

    function assertPasswordMatch(password, confirm, field, ctx) {
        if (password !== confirm) {
            ctx.addFieldError(field, 'Passwords do not match.');
            return false;
        }
        return true;
    }

    function assertFileSize(bytes, maxBytes, field, label, ctx) {
        if (bytes == null || bytes <= maxBytes) return true;
        const mb = (maxBytes / (1024 * 1024)).toFixed(1);
        ctx.addFieldError(field, `${label || 'File'} must be ${mb} MB or smaller.`);
        return false;
    }

    function assertMaxLength(value, maxLength, field, label, ctx) {
        const raw = value == null ? '' : String(value);
        if (raw.length <= maxLength) return true;
        ctx.addFieldError(field, `${label || field} must be at most ${maxLength} characters.`);
        return false;
    }

    function throwIfInvalid(result, prefix) {
        if (!result || result.isValid) return;
        const message = (result.errors && result.errors[0]) || 'Validation failed.';
        throw new Error(prefix ? `${prefix}: ${message}` : message);
    }

    const api = {
        createResult,
        toNumber,
        parseIsoDate,
        isEmptyValue,
        assertRequired,
        assertNonNegative,
        assertPositive,
        assertMin,
        assertMax,
        assertPercent,
        assertIsoDate,
        assertDateOrder,
        assertDateBefore,
        getTodayIsoDate,
        assertDateOnOrAfter,
        assertDateOnOrAfterToday,
        assertEmail,
        getPasswordPolicy,
        assertPassword,
        assertPasswordMatch,
        assertFileSize,
        assertMaxLength,
        throwIfInvalid,
        DEFAULT_PASSWORD_POLICY
    };

    global.validationPrimitives = api;
})(typeof window !== 'undefined' ? window : globalThis);
