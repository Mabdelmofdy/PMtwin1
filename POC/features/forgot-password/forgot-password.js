/**
 * Forgot Password – request password reset
 */

function initForgotPassword() {
    const form = document.getElementById('forgot-password-form');
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const pocLinkEl = document.getElementById('forgot-poc-link');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
        pocLinkEl.style.display = 'none';

        const email = document.getElementById('forgot-email').value.trim();
        try {
            const result = await authService.requestPasswordReset(email);
            if (!result) {
                errorEl.textContent = 'No account found with this email.';
                errorEl.style.display = 'block';
                return;
            }
            successEl.textContent = 'If an account exists, a reset link would be sent. In this POC, use the link below to reset your password:';
            successEl.style.display = 'block';
            const resetUrl = `${window.location.origin}${(typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/?$/, '') : ''}/reset-password?token=${encodeURIComponent(result.token)}`;
            pocLinkEl.innerHTML = `<strong>Reset link (POC):</strong> <a href="${resetUrl}" class="text-primary underline">Click here to set a new password</a>`;
            pocLinkEl.style.display = 'block';
        } catch (err) {
            errorEl.textContent = err.message || 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
        }
    });
}
