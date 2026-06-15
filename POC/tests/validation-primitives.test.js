import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('validation-primitives', () => {
    const api = loadValidationSandbox().validationPrimitives;

    it('parses valid ISO dates', () => {
        const parsed = api.parseIsoDate('2026-06-15');
        expect(parsed.valid).toBe(true);
        expect(parsed.value).toBe('2026-06-15');
    });

    it('rejects invalid calendar dates', () => {
        const parsed = api.parseIsoDate('2026-02-30');
        expect(parsed.valid).toBe(false);
    });

    it('assertNonNegative blocks negative prices', () => {
        const ctx = api.createResult();
        api.assertNonNegative(-5, 'price', 'Price', ctx);
        expect(ctx.toResult().isValid).toBe(false);
    });

    it('assertPassword enforces min length from policy', () => {
        const ctx = api.createResult();
        api.assertPassword('short', { passwordMinLength: 8 }, 'password', ctx);
        expect(ctx.toResult().isValid).toBe(false);
    });

    it('assertPassword enforces digit requirement', () => {
        const ctx = api.createResult();
        api.assertPassword('longpassword', { passwordMinLength: 8, passwordRequireDigit: true }, 'password', ctx);
        expect(ctx.toResult().isValid).toBe(false);
    });

    it('assertDateOnOrAfterToday blocks yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        const ctx = api.createResult();
        api.assertDateOnOrAfterToday(`${y}-${m}-${d}`, 'startDate', 'Start date', ctx);
        expect(ctx.toResult().isValid).toBe(false);
    });
});
