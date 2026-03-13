/**
 * Matches Page – standalone matches list using existing pipeline matching logic.
 */

async function initMatches() {
    try {
        // Ensure pipeline script (and loadMatchesPipeline) is loaded
        if (typeof loadMatchesPipeline !== 'function') {
            if (typeof loadScript === 'function') {
                await loadScript('features/pipeline/pipeline.js');
            }
        }

        if (typeof loadMatchesPipeline === 'function') {
            await loadMatchesPipeline();
        } else {
            console.error('loadMatchesPipeline is not available – matches cannot be loaded.');
        }
    } catch (err) {
        console.error('Error initializing Matches page:', err);
    }
}

