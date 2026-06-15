import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('validateNegotiationProposal', () => {
    const validate = () => loadValidationSandbox().validateNegotiationProposal;

    it('accepts valid cash proposal fields', () => {
        const result = validate()({
            value: 250000,
            currency: 'SAR',
            paymentSchedule: '30/40/30',
            duration: '4 months',
            scope: 'Full BIM package'
        });
        expect(result.isValid).toBe(true);
    });

    it('rejects negative value', () => {
        const result = validate()({ value: -100 });
        expect(result.isValid).toBe(false);
    });

    it('rejects invalid equity percentage', () => {
        const result = validate()({ equityPercentage: 150 });
        expect(result.isValid).toBe(false);
    });

    it('rejects malformed profit split', () => {
        const result = validate()({ profitSplit: 'sixty-forty' });
        expect(result.isValid).toBe(false);
    });

    it('accepts profit split pattern', () => {
        const result = validate()({ profitSplit: '65-35' });
        expect(result.isValid).toBe(true);
    });

    it('rejects end date before start date', () => {
        const result = validate()({ startDate: '2026-06-15', endDate: '2026-06-01' });
        expect(result.isValid).toBe(false);
    });
});
