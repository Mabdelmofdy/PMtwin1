/**
 * Settings page – account and preferences
 */

function initSettings() {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    const langSelect = document.getElementById('settings-language');
    if (langSelect) {
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        langSelect.value = currentLang === 'ar' ? 'ar' : 'en';
        if (authService.isPendingApproval && authService.isPendingApproval()) {
            langSelect.disabled = true;
            langSelect.setAttribute('title', 'Action disabled until your account is approved.');
        } else {
            langSelect.addEventListener('change', () => {
                const lang = langSelect.value;
                if (lang === 'ar') {
                    document.documentElement.setAttribute('dir', 'rtl');
                    document.documentElement.setAttribute('lang', 'ar');
                } else {
                    document.documentElement.setAttribute('dir', 'ltr');
                    document.documentElement.setAttribute('lang', 'en');
                }
                if (typeof layoutService !== 'undefined' && layoutService.renderLayout) {
                    layoutService.renderLayout();
                }
            });
        }
    }
}
