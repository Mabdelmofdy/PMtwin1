import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('dispute validators', () => {
    const sandbox = () => loadValidationSandbox(['core/validation/dispute-validator.js']);

    it('validateRaiseDispute requires category and description', () => {
        const { validateRaiseDispute } = sandbox();
        expect(validateRaiseDispute({}).isValid).toBe(false);
        expect(validateRaiseDispute({
            category: 'value_mismatch',
            description: 'short'
        }).isValid).toBe(false);
        expect(validateRaiseDispute({
            category: 'value_mismatch',
            description: 'Value mismatch on barter equivalent terms.'
        }).isValid).toBe(true);
    });

    it('validateResolveDispute requires supported outcome', () => {
        const { validateResolveDispute } = sandbox();
        expect(validateResolveDispute({}).isValid).toBe(false);
        expect(validateResolveDispute({ outcome: 'invalid' }).isValid).toBe(false);
        expect(validateResolveDispute({ outcome: 'dismiss', notes: 'No merit.' }).isValid).toBe(true);
    });
});
