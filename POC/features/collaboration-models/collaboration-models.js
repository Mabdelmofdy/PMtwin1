/**
 * Collaboration Models Page
 * Overview of collaboration models with links to Wizard and Knowledge Base
 */

async function initCollaborationModels() {
    if (window.siteContentService && typeof siteContentService.applyPage === 'function') {
        try {
            await siteContentService.applyPage('collaboration-models');
        } catch (e) {
            console.warn('Collaboration models site content:', e);
        }
    }
}
