/**
 * Auth flow validation (register, login, password reset).
 */
(function (global) {
    const P = () => global.validationPrimitives;

    function validateRegistrationStep(stepData, options = {}) {
        const ctx = P().createResult();
        const data = stepData || {};
        const policy = P().getPasswordPolicy();

        if (data.email !== undefined) {
            P().assertEmail(data.email, 'email', ctx);
        }
        if (data.password !== undefined) {
            P().assertPassword(data.password, policy, 'password', ctx);
        }
        if (data.password !== undefined && data.confirmPassword !== undefined) {
            P().assertPasswordMatch(data.password, data.confirmPassword, 'confirmPassword', ctx);
        }
        if (options.requireName && data.name !== undefined) {
            P().assertRequired(data.name, 'name', 'Name', ctx);
        }
        if (options.requireTerms && data.termsAccepted === false) {
            ctx.addFieldError('terms', 'You must accept the terms and conditions.');
        }

        return ctx.toResult();
    }

    function validatePasswordReset(data) {
        const ctx = P().createResult();
        const policy = P().getPasswordPolicy();
        P().assertPassword(data.newPassword, policy, 'newPassword', ctx);
        P().assertPasswordMatch(data.newPassword, data.confirmPassword, 'confirmPassword', ctx);
        return ctx.toResult();
    }

    function validatePasswordChange(data) {
        const ctx = P().createResult();
        P().assertRequired(data.currentPassword, 'currentPassword', 'Current password', ctx);
        const policy = P().getPasswordPolicy();
        P().assertPassword(data.newPassword, policy, 'newPassword', ctx);
        P().assertPasswordMatch(data.newPassword, data.confirmPassword, 'confirmPassword', ctx);
        return ctx.toResult();
    }

    global.validateRegistrationStep = validateRegistrationStep;
    global.validatePasswordReset = validatePasswordReset;
    global.validatePasswordChange = validatePasswordChange;
})(typeof window !== 'undefined' ? window : globalThis);
