/**
 * Settings page – account and preferences
 */

function initSettings() {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    // Account type (Professional / Consultant) – only for individual users
    const accountTypeCard = document.getElementById('settings-account-type-card');
    const isIndividual = user.role === CONFIG.ROLES.PROFESSIONAL || user.role === CONFIG.ROLES.CONSULTANT;
    if (accountTypeCard) {
        if (isIndividual) {
            accountTypeCard.style.display = 'block';
            const currentType = (user.profile && (user.profile.individualType || user.profile.type)) || user.role;
            const profRadio = document.querySelector('input[name="settings-account-type"][value="professional"]');
            const consRadio = document.querySelector('input[name="settings-account-type"][value="consultant"]');
            if (profRadio) profRadio.checked = currentType === 'professional';
            if (consRadio) consRadio.checked = currentType === 'consultant';
            const saveBtn = document.getElementById('settings-save-account-type');
            const onAccountTypeChange = () => {
                const selected = document.querySelector('input[name="settings-account-type"]:checked');
                if (saveBtn) saveBtn.style.display = selected && selected.value !== currentType ? 'inline-block' : 'none';
            };
            document.querySelectorAll('input[name="settings-account-type"]').forEach(el => el.addEventListener('change', onAccountTypeChange));
            if (saveBtn) {
                saveBtn.onclick = async () => {
                    const selected = document.querySelector('input[name="settings-account-type"]:checked');
                    if (!selected || !dataService || !user.id) return;
                    const newType = selected.value;
                    const newRole = newType === 'professional' ? CONFIG.ROLES.PROFESSIONAL : CONFIG.ROLES.CONSULTANT;
                    try {
                        const updatedProfile = { ...(user.profile || {}), individualType: newType, type: newType };
                        await dataService.updateUser(user.id, { profile: updatedProfile, role: newRole });
                        authService.currentUser = { ...user, profile: updatedProfile, role: newRole };
                        saveBtn.style.display = 'none';
                        if (typeof layoutService !== 'undefined' && layoutService.renderLayout) layoutService.renderLayout();
                    } catch (e) {
                        console.error('Failed to save account type', e);
                        alert('Failed to save account type. Please try again.');
                    }
                };
            }
        } else {
            accountTypeCard.style.display = 'none';
        }
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
