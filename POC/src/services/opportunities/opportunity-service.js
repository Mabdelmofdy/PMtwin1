/**
 * Opportunity Service
 * Business logic for opportunity management
 */

class OpportunityService {
    constructor() {
        this.dataService = window.dataService || dataService;
        this.matchingService = window.matchingService || matchingService;
    }
    
    /**
     * Create opportunity and trigger matching
     */
    async createOpportunity(opportunityData) {
        const opportunity = await this.dataService.createOpportunity(opportunityData);
        await this._ensureNormalized(opportunity);
        const updated = await this.dataService.getOpportunityById(opportunity.id);

        // If published, trigger matching (await so callers can show results immediately)
        if (updated.status === 'published') {
            await this.matchingService.findMatchesForOpportunity(updated.id)
                .catch(error => console.error('Error running matching:', error));
        }

        return updated;
    }

    /**
     * Ensure opportunity has normalized payload for matching (post-preprocessor).
     * Call after create or update so matching pipeline has comparable attributes.
     */
    async _ensureNormalized(opportunity) {
        const preprocessor = window.postPreprocessor;
        if (!preprocessor) return;
        const basePath = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH : '';
        let canonical = {};
        try {
            canonical = await preprocessor.loadSkillCanonical(basePath);
        } catch (e) {
            console.warn('Matching: could not load skill-canonical', e);
        }
        const creator = opportunity.creatorId
            ? (await this.dataService.getUserById(opportunity.creatorId)) || (await this.dataService.getCompanyById(opportunity.creatorId))
            : null;
        const normalized = preprocessor.extractAndNormalize(opportunity, canonical, creator);
        await this.dataService.updateOpportunity(opportunity.id, { normalized });
    }
    
    /**
     * Whether cancellation is allowed (only in draft, published, or in_negotiation)
     */
    canCancelOpportunity(opportunity) {
        const status = typeof opportunity === 'string' ? opportunity : opportunity?.status;
        return status === 'draft' || status === 'published' || status === 'in_negotiation';
    }

    /**
     * Update opportunity status with validation (e.g. cancel only before execution)
     */
    async updateOpportunityStatus(opportunityId, newStatus) {
        if (newStatus === 'cancelled') {
            const opportunity = await this.dataService.getOpportunityById(opportunityId);
            if (!opportunity) throw new Error('Opportunity not found');
            if (!this.canCancelOpportunity(opportunity)) {
                throw new Error('Cancellation is not allowed once the opportunity is contracted or in execution. Termination must follow contract rules.');
            }
        }
        const opportunity = await this.dataService.updateOpportunity(opportunityId, {
            status: newStatus
        });
        if (newStatus === 'published') {
            await this._ensureNormalized(opportunity);
            await this.matchingService.findMatchesForOpportunity(opportunityId)
                .catch(error => console.error('Error running matching:', error));
            return this.dataService.getOpportunityById(opportunityId);
        }
        return opportunity;
    }
    
    /**
     * Normalize all published opportunities (e.g. after seed load). Idempotent.
     */
    async normalizeAllOpportunities() {
        const opportunities = await this.dataService.getOpportunities();
        for (const opp of opportunities) {
            if (opp.status !== 'published') continue;
            if (opp.normalized) continue;
            try {
                await this._ensureNormalized(opp);
            } catch (e) {
                console.warn('Normalize opportunity failed:', opp.id, e);
            }
        }
    }

    /**
     * Get opportunities with filters
     */
    async getOpportunities(filters = {}) {
        let opportunities = await this.dataService.getOpportunities();
        
        if (filters.modelType) {
            opportunities = opportunities.filter(o => o.modelType === filters.modelType);
        }
        
        if (filters.status) {
            opportunities = opportunities.filter(o => o.status === filters.status);
        }
        
        if (filters.creatorId) {
            opportunities = opportunities.filter(o => o.creatorId === filters.creatorId);
        }
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            opportunities = opportunities.filter(o =>
                o.title?.toLowerCase().includes(searchLower) ||
                o.description?.toLowerCase().includes(searchLower)
            );
        }
        
        return opportunities;
    }
}

// Create singleton instance
const opportunityService = new OpportunityService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = opportunityService;
} else {
    window.opportunityService = opportunityService;
}
