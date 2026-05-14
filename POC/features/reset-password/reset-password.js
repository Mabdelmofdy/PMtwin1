/**
 * Reset Password – set new password using token from URL
 */

function initResetPassword(params) {
    const form = document.getElementById('reset-password-form');
    const errorEl = document.getElementById('reset-error');

    if (!form) return;

    const qs = typeof window !== 'undefined' ? (window.location.search || '') : '';
    const token = params?.token || new URLSearchParams(qs).get('token');
    if (!token) {
        errorEl.textContent = 'Invalid or missing reset link. Please request a new password reset.';
        errorEl.style.display = 'block';
        const backLink = form?.closest('.page-container')?.querySelector('a[data-route="/login"]');
        if (backLink) backLink.focus();
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.style.display = 'block';
            return;
        }
        if (newPassword.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters.';
            errorEl.style.display = 'block';
            return;
        }

        try {
            await authService.resetPassword(token, newPassword);
            if (window.router) {
                router.navigate(CONFIG.ROUTES.LOGIN);
            } else {
                const bp = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/*$/, '') : '';
                window.location.href = `${window.location.origin}${bp}/login`;
            }
        } catch (err) {
            errorEl.textContent = err.message || 'Failed to reset password. The link may have expired.';
            errorEl.style.display = 'block';
        }
    });
}
