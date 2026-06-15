import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('auth-validator', () => {
    const g = loadValidationSandbox();

    it('rejects short passwords on registration', () => {
        const result = g.validateRegistrationStep({ email: 'a@b.com', password: 'abc', confirmPassword: 'abc' });
        expect(result.isValid).toBe(false);
    });

    it('rejects mismatched passwords', () => {
        const result = g.validateRegistrationStep({ email: 'a@b.com', password: 'validpass1', confirmPassword: 'otherpass1' });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.confirmPassword).toBeTruthy();
    });

    it('accepts valid password reset', () => {
        const result = g.validatePasswordReset({ newPassword: 'validpass1', confirmPassword: 'validpass1' });
        expect(result.isValid).toBe(true);
    });
});
