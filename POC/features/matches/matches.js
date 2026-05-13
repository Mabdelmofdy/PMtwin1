/**
 * Matches Page – standalone matches list using existing pipeline matching logic.
 */

async function initMatches() {
    try {
        const headerMount = document.getElementById('page-context-header-mount');
        if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
            window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.matches);
        }
        document.getElementById('page-cta-matches-top')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('matches-subtab-recommended')?.click();
            document.getElementById('matches-recommended-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.getElementById('page-cta-matches-filters')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('matches-subtabs')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const active = document.querySelector('.matches-subtab.active');
            active?.focus();
        });
        if (typeof loadMatchesPipeline === 'function') {
            await loadMatchesPipeline();
        } else {
            console.error('loadMatchesPipeline is not available – matches cannot be loaded.');
        }
    } catch (err) {
        console.error('Error initializing Matches page:', err);
    }
}

