import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('deal-validator', () => {
    const g = loadValidationSandbox();

    it('blocks negative cash amounts', () => {
        const result = g.validateDealTerms({ cashAmount: -100 });
        expect(result.isValid).toBe(false);
    });

    it('allows zero cash amount', () => {
        const result = g.validateDealTerms({ cashAmount: 0 });
        expect(result.isValid).toBe(true);
    });

    it('validates milestone due dates', () => {
        const result = g.validateDealTerms({
            milestones: [{ dueDate: 'not-a-date' }]
        });
        expect(result.isValid).toBe(false);
    });
});
