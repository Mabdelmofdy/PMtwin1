import { describe, expect, it, beforeEach, vi } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('data-service opportunity validation gate', () => {
    let validators;

    beforeEach(() => {
        validators = loadValidationSandbox();
        global.window = global;
        Object.assign(global, validators);
        global.CONFIG = {
            STORAGE_KEYS: { OPPORTUNITIES: 'opportunities' },
            OPPORTUNITY_STATUS: { DRAFT: 'draft' }
        };
        global.storageService = {
            get: vi.fn(() => []),
            set: vi.fn()
        };
    });

    it('validateOpportunityData rejects negative budget min', () => {
        const result = global.validateOpportunityData({ budgetMin: -1, budgetMax: 10 });
        expect(result.isValid).toBe(false);
    });

    it('validateOpportunityData rejects negative budget max', () => {
        const result = global.validateOpportunityData({ budgetMin: 0, budgetMax: -5 });
        expect(result.isValid).toBe(false);
    });

    it('validateOpportunityData accepts valid budget range', () => {
        const result = global.validateOpportunityData({ budgetMin: 10, budgetMax: 100 });
        expect(result.isValid).toBe(true);
    });

    it('validateOpportunityData rejects past start date on create', () => {
        const result = global.validateOpportunityData(
            { startDate: '2020-01-01' },
            { disallowPastDates: true }
        );
        expect(result.isValid).toBe(false);
    });
});
