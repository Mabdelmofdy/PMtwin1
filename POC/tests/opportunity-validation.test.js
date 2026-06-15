import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('opportunity-validation', () => {
    const validateOpportunityForm = loadValidationSandbox().validateOpportunityForm;

    it('blocks negative cash amount', () => {
        const result = validateOpportunityForm({ exchangeMode: 'cash', cashAmount: -10 });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.cashAmount).toBeTruthy();
    });

    it('blocks negative duration', () => {
        const result = validateOpportunityForm({ durationDays: -1 });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.durationDays).toBeTruthy();
    });

    it('blocks invalid budget ranges', () => {
        const resultNegative = validateOpportunityForm({ budgetMin: -1, budgetMax: 10 });
        expect(resultNegative.isValid).toBe(false);
        expect(resultNegative.fieldErrors.budgetMin).toBeTruthy();

        const resultReversed = validateOpportunityForm({ budgetMin: 20, budgetMax: 10 });
        expect(resultReversed.isValid).toBe(false);
        expect(resultReversed.fieldErrors.budgetMax).toBeTruthy();
    });

    it('blocks negative budget max', () => {
        const result = validateOpportunityForm({ budgetMin: 0, budgetMax: -1 });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.budgetMax).toBeTruthy();
    });

    it('blocks invalid equity and profit percentages', () => {
        const equityResult = validateOpportunityForm({ equityPercentage: 120 });
        const profitResult = validateOpportunityForm({ profitSharePercentage: -5 });
        expect(equityResult.isValid).toBe(false);
        expect(equityResult.fieldErrors.equityPercentage).toBeTruthy();
        expect(profitResult.isValid).toBe(false);
        expect(profitResult.fieldErrors.profitSharePercentage).toBeTruthy();
    });

    it('blocks invalid date ranges', () => {
        const result = validateOpportunityForm({
            startDate: '2026-06-20',
            endDate: '2026-06-10',
            applicationDeadline: '2026-06-21'
        });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.endDate).toBeTruthy();
        expect(result.fieldErrors.applicationDeadline).toBeTruthy();
    });

    it('blocks past dates when disallowPastDates is enabled', () => {
        const today = loadValidationSandbox().validationPrimitives.getTodayIsoDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        const past = `${y}-${m}-${d}`;

        const result = validateOpportunityForm(
            { startDate: past, applicationDeadline: past, endDate: past },
            { disallowPastDates: true }
        );
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.startDate).toBeTruthy();
        expect(today).toBeTruthy();
    });

    it('allows past dates when disallowPastDates is not set', () => {
        const result = validateOpportunityForm({
            startDate: '2020-06-01',
            endDate: '2020-12-31',
            applicationDeadline: '2020-05-01'
        });
        expect(result.isValid).toBe(true);
    });
});
