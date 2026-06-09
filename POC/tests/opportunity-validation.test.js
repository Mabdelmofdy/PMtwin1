import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

function loadValidator() {
    const srcPath = resolve(process.cwd(), 'src/services/opportunities/opportunity-validation.js');
    const code = readFileSync(srcPath, 'utf8');
    const sandbox = { globalThis: {} };
    sandbox.window = sandbox.globalThis;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.globalThis.validateOpportunityForm;
}

describe('opportunity-validation', () => {
    const validateOpportunityForm = loadValidator();

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
});
