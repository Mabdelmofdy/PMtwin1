/**
 * Admin Settings Component
 */

async function initAdminSettings() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.settings.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    loadFormFromSettings();
    await loadSystemInfo();
    setupSettingsForm();
}

function loadFormFromSettings() {
    const settings = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
    const platformNameEl = document.getElementById('platform-name');
    const maintenanceEl = document.getElementById('maintenance-mode');
    const matchingEl = document.getElementById('matching-threshold');
    const autoNotifyEl = document.getElementById('auto-notify-threshold');
    const sessionEl = document.getElementById('session-duration');
    if (platformNameEl) platformNameEl.value = settings.platformName || CONFIG.APP_NAME || '';
    if (maintenanceEl) maintenanceEl.checked = !!settings.maintenanceMode;
    if (matchingEl) matchingEl.value = Math.round((settings.matchingThreshold ?? CONFIG.MATCHING.MIN_THRESHOLD ?? 0.7) * 100);
    if (autoNotifyEl) autoNotifyEl.value = Math.round((settings.autoNotifyThreshold ?? CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD ?? 0.8) * 100);
    if (sessionEl) sessionEl.value = Math.round((settings.sessionDuration ?? CONFIG.SESSION_DURATION ?? 24 * 60 * 60 * 1000) / (60 * 60 * 1000));
}

async function loadSystemInfo() {
    try {
        const users = await dataService.getUsers();
        const opportunities = await dataService.getOpportunities();
        
        document.getElementById('total-users-count').textContent = users.length;
        document.getElementById('total-opportunities-count').textContent = opportunities.length;
    } catch (error) {
        console.error('Error loading system info:', error);
    }
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    const saveBtn = form.querySelector('button[type="submit"]');
    if (saveBtn && typeof authService !== 'undefined' && authService.hasAdminCapability && !authService.hasAdminCapability('admin.settings.write')) {
        saveBtn.disabled = true;
        saveBtn.title = 'You do not have permission to change settings.';
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            authService.assertAdminCapability('admin.settings.write');
        } catch (err) {
            alert(err && err.message ? err.message : 'You do not have permission to change settings.');
            return;
        }
        const formData = new FormData(form);
        const settings = {
            platformName: formData.get('platformName')?.toString().trim() || CONFIG.APP_NAME,
            maintenanceMode: formData.get('maintenanceMode') === '1',
            matchingThreshold: parseFloat(formData.get('matchingThreshold')) / 100,
            autoNotifyThreshold: parseFloat(formData.get('autoNotifyThreshold')) / 100,
            sessionDuration: parseInt(formData.get('sessionDuration'), 10) * 60 * 60 * 1000
        };

        try {
            const currentSettings = storageService.get(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS) || {};
            const updatedSettings = { ...currentSettings, ...settings };
            storageService.set(CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS, updatedSettings);

            CONFIG.APP_NAME = settings.platformName;
            CONFIG.MATCHING.MIN_THRESHOLD = settings.matchingThreshold;
            CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD = settings.autoNotifyThreshold;
            CONFIG.SESSION_DURATION = settings.sessionDuration;

            if (window.layoutService && typeof window.layoutService.updateNavigation === 'function') {
                await window.layoutService.updateNavigation();
            }
            alert('Settings saved successfully!');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        }
    });
}
