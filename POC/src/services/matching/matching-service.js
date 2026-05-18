/**
 * Matching Service
 * Implements matching algorithm for opportunities and candidates
 */

class MatchingService {
    constructor() {
        this.dataService = window.dataService || dataService;
        this.minThreshold = CONFIG.MATCHING.MIN_THRESHOLD;
        this.autoNotifyThreshold = CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD;
    }

    /**
     * Re-read threshold values from CONFIG.MATCHING. Call after admin updates
     * matching settings so live edits take effect without a page reload.
     */
    refreshFromConfig() {
        if (!CONFIG || !CONFIG.MATCHING) return;
        if (typeof CONFIG.MATCHING.MIN_THRESHOLD === 'number') {
            this.minThreshold = CONFIG.MATCHING.MIN_THRESHOLD;
        }
        if (typeof CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD === 'number') {
            this.autoNotifyThreshold = CONFIG.MATCHING.AUTO_NOTIFY_THRESHOLD;
        }
    }

    /** @deprecated Legacy person-to-opportunity matching; use post_matches only. */
    isLegacyPersonOpportunityEnabled() {
        return !!(CONFIG && CONFIG.MATCHING && CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED === true);
    }

    _warnLegacyMatchingDisabled(functionName) {
        console.warn(
            `[matching] ${functionName} is disabled; use persistPostMatches for post-to-post matching.`
        );
    }

    /**
     * Detect which matching models apply to this opportunity (for auto-routing).
     * @param {Object} opportunity
     * @returns {string[]} model names: one_way, two_way, consortium, circular
     */
    detectMatchingModel(opportunity) {
        const intent = opportunity.intent || 'request';
        const hasNeed = intent === 'request' || intent === 'hybrid';
        const hasOffer = intent === 'offer' || intent === 'hybrid';
        const acceptedModes = opportunity.value_exchange?.accepted_modes || [];
        const isBarter = (opportunity.exchangeMode || '').toLowerCase() === 'barter' ||
            acceptedModes.some(m => String(m).toLowerCase() === 'barter');
        const hasRoles = Array.isArray(opportunity.attributes?.memberRoles) && opportunity.attributes.memberRoles.length > 0 ||
            Array.isArray(opportunity.attributes?.partnerRoles) && opportunity.attributes.partnerRoles.length > 0;
        const subModelType = (opportunity.subModelType || '').toLowerCase();

        const modelList = [];
        if (hasNeed || hasOffer) modelList.push('one_way');
        if (isBarter && (hasNeed || hasOffer)) modelList.push('two_way');
        if (hasRoles || subModelType === 'consortium') modelList.push('consortium');
        return modelList;
    }

    /**
     * Plan which models to run during persistence (circular is always a separate pass).
     * @param {Object} opportunity
     * @param {{ model?: string }} options - when `model` is set, only that model runs (admin/debug preview).
     * @returns {{ models: string[], runCircular: boolean }}
     */
    _buildPersistModelPlan(opportunity, options = {}) {
        const explicit = options.model ? String(options.model).toLowerCase() : null;
        if (explicit === 'circular') {
            return { models: [], runCircular: true };
        }
        if (explicit) {
            return { models: [explicit], runCircular: false };
        }

        let models = this.detectMatchingModel(opportunity) || [];
        models = models.filter(m => m && m !== 'circular');
        if (!models.length) {
            const intent = opportunity.intent || 'request';
            if (intent === 'request' || intent === 'offer' || intent === 'hybrid') {
                models = ['one_way'];
            }
        }
        return { models, runCircular: true };
    }

    resolveModelsForPersistence(opportunity, options = {}) {
        return this._buildPersistModelPlan(opportunity, options);
    }

    /**
     * Add recommendation tier and composite rank to post-to-post matches.
     */
    rankMatches(matches, model) {
        const vc = window.valueCompatibility || (typeof valueCompatibility !== 'undefined' ? valueCompatibility : null);
        return (matches || []).map(m => {
            const valueFit = (m.valueAnalysis && m.valueAnalysis.valueFit) || (m.valueAnalysis && m.valueAnalysis.equivalence && m.valueAnalysis.equivalence.equivalenceScore >= 0.7 ? 'strong' : null);
            const coverageRatio = (m.valueAnalysis && m.valueAnalysis.coverageRatio) != null ? m.valueAnalysis.coverageRatio : (m.valueAnalysis && m.valueAnalysis.equivalence ? (m.valueAnalysis.equivalence.aCoversB + m.valueAnalysis.equivalence.bCoversA) / 2 : 0.5);
            const repScore = (m.breakdown && m.breakdown.reputation) != null ? m.breakdown.reputation : 0.5;
            const timelineScore = (m.breakdown && m.breakdown.timelineFit) != null ? m.breakdown.timelineFit : 0.5;
            const compositeRank = 0.50 * (m.matchScore || 0) + 0.30 * (coverageRatio != null ? Math.min(coverageRatio, 1) : 0.5) + 0.10 * repScore + 0.10 * timelineScore;
            const tier = (m.matchScore >= 0.85 && valueFit === 'strong') ? 'top' : (m.matchScore >= 0.70 ? 'good' : 'possible');
            const recommendation = {
                tier,
                reason: tier === 'top' ? 'Strong skill and value fit' : (tier === 'good' ? 'Good match; review value terms' : 'Possible match; negotiation may be needed'),
                actionRequired: tier === 'top' ? 'Ready to contract' : (tier === 'good' ? 'Review and negotiate' : 'Negotiate value exchange')
            };
            return Object.assign({}, m, { compositeRank, recommendation, scoreBreakdown: m.breakdown });
        }).sort((a, b) => (b.compositeRank != null ? b.compositeRank : b.matchScore) - (a.compositeRank != null ? a.compositeRank : a.matchScore));
    }

    /**
     * Post-to-post matching: return { model, matches }.
     * When `options.model` is set (admin debug / persistPostMatches), runs only that model.
     * When omitted, uses route precedence (single model) — use persistPostMatches for multi-model publish saves.
     */
    async findMatchesForPost(opportunityId, options = {}) {
        const models = window.matchingModels || (typeof matchingModels !== 'undefined' && matchingModels);
        if (!models) return { model: 'one_way', matches: [] };

        const opportunity = await this.dataService.getOpportunityById(opportunityId);
        if (!opportunity) return { model: 'one_way', matches: [] };

        const intent = opportunity.intent || 'request';
        const exchangeMode = (opportunity.exchangeMode || '').toLowerCase();
        const subModelType = (opportunity.subModelType || '').toLowerCase();
        const forcedModel = options.model ? String(options.model).toLowerCase() : null;

        if (forcedModel && !['one_way', 'two_way', 'consortium', 'circular'].includes(forcedModel)) {
            console.warn('[matching] findMatchesForPost: unknown model', forcedModel);
            return { model: forcedModel, matches: [] };
        }

        if (forcedModel === 'circular') {
            const result = await models.findCircularExchanges(options);
            result.matches = this.rankMatches(result.matches || [], 'circular');
            return result;
        }
        if (forcedModel === 'consortium') {
            const result = await models.findConsortiumCandidates(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'consortium');
            return result;
        }
        if (forcedModel === 'two_way') {
            const result = await models.findBarterMatches(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'two_way');
            return result;
        }
        if (forcedModel === 'one_way') {
            if (intent === 'offer') {
                const result = await models.findNeedsForOffer(opportunityId, options);
                result.matches = this.rankMatches(result.matches || [], 'one_way');
                result.direction = 'offer_to_needs';
                return result;
            }
            const result = await models.findOffersForNeed(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'one_way');
            return result;
        }

        if (subModelType === 'consortium') {
            const result = await models.findConsortiumCandidates(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'consortium');
            return result;
        }
        if (exchangeMode === 'barter') {
            const result = await models.findBarterMatches(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'two_way');
            return result;
        }
        if (intent === 'request') {
            const result = await models.findOffersForNeed(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'one_way');
            return result;
        }
        if (intent === 'offer') {
            const result = await models.findNeedsForOffer(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'one_way');
            result.direction = 'offer_to_needs';
            return result;
        }
        if (intent === 'hybrid') {
            const oneWay = await models.findOffersForNeed(opportunityId, options);
            const twoWay = await models.findBarterMatches(opportunityId, options);
            const combined = this.rankMatches([].concat(oneWay.matches || [], twoWay.matches || []));
            return { model: 'auto', matches: combined, byModel: { one_way: oneWay.matches, two_way: twoWay.matches } };
        }
        return { model: 'one_way', matches: [] };
    }

    /**
     * Find offers that match a need (One-Way). Convenience wrapper.
     */
    async findOffersForNeed(needPostId, options = {}) {
        const models = window.matchingModels;
        return models ? await models.findOffersForNeed(needPostId, options) : { model: 'one_way', matches: [] };
    }

    /**
     * Find replacement candidates for a single role in a consortium deal.
     * @param {string} leadNeedId - Lead opportunity id
     * @param {string} missingRole - Role label to fill
     * @param {{ excludeUserIds?: string[], topN?: number }} options
     * @returns {{ candidates: Array<{ userId, opportunityId, role, matchScore }> }}
     */
    async findReplacementCandidatesForRole(leadNeedId, missingRole, options = {}) {
        const models = window.matchingModels || (typeof matchingModels !== 'undefined' && matchingModels);
        if (!models || typeof models.findReplacementCandidatesForRole !== 'function') return { candidates: [] };
        return await models.findReplacementCandidatesForRole(leadNeedId, missingRole, options);
    }

    /**
     * @deprecated Legacy person-to-opportunity matching.
     * User-facing matching now uses post_matches only.
     * Do not call this from UI or publish flows.
     */
    async findMatchesForOpportunity(opportunityId) {
        if (!this.isLegacyPersonOpportunityEnabled()) {
            this._warnLegacyMatchingDisabled('findMatchesForOpportunity');
            return [];
        }
        const opportunity = await this.dataService.getOpportunityById(opportunityId);
        if (!opportunity) {
            throw new Error('Opportunity not found');
        }
        
        const allUsers = await this.dataService.getUsers();
        const activeUsers = allUsers.filter(u => u.status === 'active');
        
        const matches = [];
        
        for (const user of activeUsers) {
            // Skip the creator
            if (user.id === opportunity.creatorId) {
                continue;
            }
            
            const matchScore = await this.calculateMatchScore(opportunity, user);
            
            if (matchScore >= this.minThreshold) {
                matches.push({
                    opportunityId,
                    candidateId: user.id,
                    matchScore,
                    criteria: await this.getMatchCriteria(opportunity, user),
                    notified: false
                });
            }
        }
        
        // Sort by match score (highest first)
        matches.sort((a, b) => b.matchScore - a.matchScore);
        
        // Legacy store only (never reached when LEGACY_PERSON_OPPORTUNITY_ENABLED is false)
        for (const match of matches) {
            await this.dataService.createMatch(match);
        }

        return matches;
    }
    
    /**
     * @deprecated Legacy person-to-opportunity matching.
     * User-facing matching now uses post_matches only.
     * Do not call this from UI or publish flows.
     */
    async calculateMatchScore(opportunity, candidate) {
        if (!this.isLegacyPersonOpportunityEnabled()) {
            return 0;
        }
        let totalScore = 0;
        let maxScore = 0;
        const scope = opportunity.scope || opportunity.attributes || {};
        const candidateProfile = candidate.profile || {};

        const skills = scope.requiredSkills || scope.offeredSkills || [];
        const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);
        if (skillsArr.length > 0) {
            const professionalFieldLabels = (candidateProfile.professionalFields || [])
                .map(pf => pf.label || pf.fieldId)
                .filter(Boolean);
            const candidateSectorsForSkills = candidateProfile.sectors || (candidateProfile.industry ? (Array.isArray(candidateProfile.industry) ? candidateProfile.industry : [candidateProfile.industry]) : []);
            const rawCandidateSkills = [].concat(
                candidateProfile.specializations || [],
                candidateProfile.skills || [],
                candidateProfile.services || [],
                (candidateProfile.classifications || []).map(c => typeof c === 'string' ? c : c.label),
                professionalFieldLabels,
                candidateProfile.primaryDomain ? [candidateProfile.primaryDomain] : [],
                Array.isArray(candidateSectorsForSkills) ? candidateSectorsForSkills : []
            ).filter(Boolean);

            const svc = window.skillService || (typeof skillService !== 'undefined' ? skillService : null);
            let matchCount = 0;
            if (svc) {
                const normRequired = await svc.normalizeSkills(skillsArr);
                const normCandidate = await svc.normalizeSkills(rawCandidateSkills);
                const candidateSet = new Set(normCandidate.map(s => s.toLowerCase()));
                matchCount = normRequired.filter(s => candidateSet.has(s.toLowerCase())).length;
                this._lastSkillDetail = {
                    matched: normRequired.filter(s => candidateSet.has(s.toLowerCase())),
                    unmatched: normRequired.filter(s => !candidateSet.has(s.toLowerCase())),
                    score: normRequired.length > 0 ? matchCount / normRequired.length : 0
                };
            } else {
                matchCount = skillsArr.filter(s =>
                    rawCandidateSkills.some(cs => String(cs).toLowerCase().includes(String(s).toLowerCase()))
                ).length;
                this._lastSkillDetail = null;
            }
            totalScore += (matchCount / skillsArr.length) * 50;
            maxScore += 50;
        } else {
            this._lastSkillDetail = null;
        }
        
        const sectors = scope.sectors || [];
        const sectorsArr = Array.isArray(sectors) ? sectors : (sectors ? [sectors] : []);
        if (sectorsArr.length > 0) {
            const candidateSectors = candidateProfile.sectors || candidateProfile.industry || [];
            const candArr = Array.isArray(candidateSectors) ? candidateSectors : (candidateSectors ? [candidateSectors] : []);
            const sectorMatch = sectorsArr.some(s =>
                candArr.some(c => String(c).toLowerCase().includes(String(s).toLowerCase()))
            );
            totalScore += sectorMatch ? 15 : 0;
            maxScore += 15;
        }
        
        const certifications = scope.certifications || [];
        const certArr = Array.isArray(certifications) ? certifications : (certifications ? [certifications] : []);
        if (certArr.length > 0) {
            const candidateCerts = candidateProfile.certifications || [];
            const candCerts = Array.isArray(candidateCerts) ? candidateCerts : (candidateCerts ? [candidateCerts] : []);
            const candCertStrings = candCerts.map(cd => typeof cd === 'object' && cd !== null && cd.name != null ? cd.name : String(cd));
            const certMatch = certArr.filter(c =>
                candCertStrings.some(cd => cd.toLowerCase().includes(String(c).toLowerCase()))
            ).length;
            totalScore += (certMatch / certArr.length) * 15;
            maxScore += 15;
        }
        
        // Payment compatibility: opportunity.paymentModes vs candidate preferredPaymentModes (use same id convention, e.g. lookup ids: cash, barter, equity)
        const paymentModes = opportunity.paymentModes || (opportunity.exchangeMode ? [opportunity.exchangeMode] : []);
        let paymentCompatible = false;
        if (paymentModes.length > 0) {
            const candidatePreferred = candidateProfile.preferredPaymentModes || candidateProfile.exchangeTypes || [];
            const preferredArr = Array.isArray(candidatePreferred) ? candidatePreferred : (candidatePreferred ? [candidatePreferred] : []);
            paymentCompatible = paymentModes.some(pm =>
                preferredArr.some(pp => String(pp).toLowerCase() === String(pm).toLowerCase())
            );
            totalScore += paymentCompatible ? 10 : (preferredArr.length === 0 ? 5 : 0);
            maxScore += 10;
        }

        // Value compatibility: budget fit (opportunity estimated_value / budgetRange vs candidate desired range if any)
        const valueCompatPoints = CONFIG.MATCHING.VALUE_COMPATIBILITY_MAX_POINTS != null ? CONFIG.MATCHING.VALUE_COMPATIBILITY_MAX_POINTS : 15;
        const oppBudget = opportunity.exchangeData?.budgetRange || opportunity.attributes?.budgetRange;
        const oppEstimated = (opportunity.value_exchange && opportunity.value_exchange.estimated_value) != null
            ? Number(opportunity.value_exchange.estimated_value)
            : (oppBudget && (oppBudget.min != null || oppBudget.max != null))
                ? ((Number(oppBudget.min) || 0) + (Number(oppBudget.max) || 0)) / 2
                : null;
        const candMin = candidateProfile.desiredBudgetMin != null ? Number(candidateProfile.desiredBudgetMin) : (candidateProfile.salaryRange && candidateProfile.salaryRange.min != null ? Number(candidateProfile.salaryRange.min) : null);
        const candMax = candidateProfile.desiredBudgetMax != null ? Number(candidateProfile.desiredBudgetMax) : (candidateProfile.salaryRange && candidateProfile.salaryRange.max != null ? Number(candidateProfile.salaryRange.max) : null);
        let valueCompatScore = 0.5;
        if (oppEstimated != null && !isNaN(oppEstimated)) {
            if (candMin != null && candMax != null && !isNaN(candMin) && !isNaN(candMax)) {
                const overlapMin = Math.max(oppBudget?.min != null ? Number(oppBudget.min) : 0, candMin);
                const overlapMax = Math.min(oppBudget?.max != null ? Number(oppBudget.max) : oppEstimated * 2, candMax);
                valueCompatScore = overlapMax > overlapMin ? Math.min(1, (overlapMax - overlapMin) / (candMax - candMin)) : 0;
            } else {
                valueCompatScore = 1;
            }
        }
        totalScore += valueCompatScore * valueCompatPoints;
        maxScore += valueCompatPoints;
        
        const modelType = opportunity.modelType;
        const subModelType = opportunity.subModelType;
        const attributes = opportunity.attributes || {};
        
        if (modelType) {
        // Model-specific matching logic (when modelType present)
        switch (modelType) {
            case CONFIG.MODELS.PROJECT_BASED:
                totalScore += await this.matchProjectBased(opportunity, candidate, subModelType);
                maxScore += 100;
                break;
                
            case CONFIG.MODELS.STRATEGIC_PARTNERSHIP:
                totalScore += await this.matchStrategicPartnership(opportunity, candidate, subModelType);
                maxScore += 100;
                break;
                
            case CONFIG.MODELS.RESOURCE_POOLING:
                totalScore += await this.matchResourcePooling(opportunity, candidate, subModelType);
                maxScore += 100;
                break;
                
            case CONFIG.MODELS.HIRING:
                totalScore += await this.matchHiring(opportunity, candidate, subModelType);
                maxScore += 100;
                break;
                
            case CONFIG.MODELS.COMPETITION:
                totalScore += await this.matchCompetition(opportunity, candidate);
                maxScore += 100;
                break;
        }
        }
        
        const performanceScore = await this.getPastPerformanceScore(candidate, modelType || 'project_based');
        totalScore += performanceScore;
        maxScore += 20;
        
        return maxScore > 0 ? totalScore / maxScore : 0;
    }
    
    /**
     * Match for Project-Based opportunities
     */
    async matchProjectBased(opportunity, candidate, subModelType) {
        let score = 0;
        const attributes = opportunity.attributes || {};
        const candidateProfile = candidate.profile || {};
        
        switch (subModelType) {
            case CONFIG.SUB_MODELS.TASK_BASED: {
                if (attributes.requiredSkills) {
                    const requiredSkills = Array.isArray(attributes.requiredSkills)
                        ? attributes.requiredSkills
                        : [attributes.requiredSkills];
                    const candidateSkills = [].concat(
                        candidateProfile.specializations || [],
                        candidateProfile.skills || [],
                        candidateProfile.services || []
                    ).filter(Boolean);

                    const svc = window.skillService || (typeof skillService !== 'undefined' ? skillService : null);
                    if (svc) {
                        const normReq = await svc.normalizeSkills(requiredSkills);
                        const normCand = await svc.normalizeSkills(candidateSkills);
                        const candSet = new Set(normCand.map(s => s.toLowerCase()));
                        const matchingCount = normReq.filter(s => candSet.has(s.toLowerCase())).length;
                        score += normReq.length > 0 ? (matchingCount / normReq.length) * 40 : 0;
                    } else {
                        const matchingSkills = requiredSkills.filter(skill =>
                            candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
                        );
                        score += (matchingSkills.length / requiredSkills.length) * 40;
                    }
                }
                
                // Experience match (20 points)
                if (attributes.experienceLevel) {
                    const candidateExp = candidateProfile.yearsExperience || 0;
                    const expMap = { 'Junior': 0, 'Mid-Level': 3, 'Senior': 7, 'Expert': 10 };
                    const requiredExp = expMap[attributes.experienceLevel] || 0;
                    
                    if (candidateExp >= requiredExp) {
                        score += 20;
                    } else {
                        score += (candidateExp / requiredExp) * 20;
                    }
                }
                
                // Budget compatibility (20 points)
                if (attributes.budgetRange) {
                    // Assume candidate has rate in profile or use default
                    score += 20; // Simplified - would check against candidate's rate
                }
                
                // Location compatibility (10 points)
                if (attributes.locationRequirement) {
                    score += 10; // Simplified - would check candidate's location preferences
                }
                
                // Availability match (10 points)
                if (attributes.startDate) {
                    score += 10;
                }
                break;
            }
            case CONFIG.SUB_MODELS.CONSORTIUM:
            case CONFIG.SUB_MODELS.PROJECT_JV:
                // Scope match (30 points)
                if (attributes.memberRoles || attributes.partnerRoles) {
                    const roles = attributes.memberRoles || attributes.partnerRoles || [];
                    const rawCaps = candidateProfile.classifications || candidateProfile.specializations || [];
                    const candidateCapabilities = rawCaps.map(c => (typeof c === 'string' ? c : (c?.label || c?.role || ''))).filter(Boolean);
                    
                    if (Array.isArray(roles) && roles.length > 0) {
                        const roleStr = (r) => (typeof r === 'string' ? r : (r?.role || r?.label || ''));
                        const matchingRoles = roles.filter(role => {
                            const r = roleStr(role);
                            if (!r) return false;
                            return candidateCapabilities.some(cap =>
                                cap.toLowerCase().includes(r.toLowerCase())
                            );
                        });
                        score += (matchingRoles.length / roles.length) * 30;
                    } else {
                        score += 30;
                    }
                }
                
                // Financial capacity (30 points)
                if (attributes.projectValue || attributes.capitalContribution) {
                    const projectValue = attributes.projectValue || attributes.capitalContribution || 0;
                    const candidateCapacity = candidateProfile.financialCapacity || 0;
                    
                    if (candidateCapacity >= projectValue * 0.1) { // At least 10% of project value
                        score += 30;
                    } else {
                        score += (candidateCapacity / (projectValue * 0.1)) * 30;
                    }
                }
                
                // Experience match (20 points)
                score += 20; // Simplified
                
                // Geographic proximity (20 points)
                if (attributes.projectLocation) {
                    score += 20; // Simplified
                }
                break;
                
            case CONFIG.SUB_MODELS.SPV:
                // Financial capacity (50 points) - critical for SPV
                if (attributes.projectValue) {
                    const candidateCapacity = candidateProfile.financialCapacity || 0;
                    const minRequired = 50000000; // 50M SAR minimum
                    
                    if (candidateCapacity >= minRequired) {
                        score += 50;
                    } else {
                        score += (candidateCapacity / minRequired) * 50;
                    }
                }
                
                // Sector expertise (30 points)
                if (attributes.projectType) {
                    score += 30; // Simplified
                }
                
                // Project experience (20 points)
                const candidateExp = candidateProfile.yearsExperience || 0;
                if (candidateExp >= 10) {
                    score += 20;
                } else {
                    score += (candidateExp / 10) * 20;
                }
                break;
        }
        
        return score;
    }
    
    /**
     * Match for Strategic Partnership opportunities
     */
    async matchStrategicPartnership(opportunity, candidate, subModelType) {
        let score = 0;
        const attributes = opportunity.attributes || {};
        const candidateProfile = candidate.profile || {};
        
        // Strategic alignment (40 points)
        score += 40; // Simplified - would analyze strategic objectives
        
        // Complementary strengths (30 points)
        if (attributes.partnerContributions || attributes.partnerRequirements) {
            score += 30; // Simplified
        }
        
        // Financial capacity (20 points)
        if (attributes.initialCapital) {
            const candidateCapacity = candidateProfile.financialCapacity || 0;
            if (candidateCapacity >= attributes.initialCapital * 0.1) {
                score += 20;
            }
        }
        
        // Market presence (10 points)
        if (attributes.geographicScope) {
            score += 10; // Simplified
        }
        
        return score;
    }
    
    /**
     * Match for Resource Pooling opportunities
     */
    async matchResourcePooling(opportunity, candidate, subModelType) {
        let score = 0;
        const attributes = opportunity.attributes || {};
        
        // Resource match (50 points)
        if (attributes.resourceType || attributes.productService) {
            score += 50; // Simplified
        }
        
        // Quantity alignment (20 points)
        if (attributes.quantityNeeded || attributes.quantity) {
            score += 20; // Simplified
        }
        
        // Timeline alignment (20 points)
        if (attributes.deliveryTimeline || attributes.availability) {
            score += 20; // Simplified
        }
        
        // Geographic proximity (10 points)
        if (attributes.deliveryLocation || attributes.location) {
            score += 10; // Simplified
        }
        
        return score;
    }
    
    /**
     * Match for Hiring opportunities
     */
    async matchHiring(opportunity, candidate, subModelType) {
        let score = 0;
        const attributes = opportunity.attributes || {};
        const candidateProfile = candidate.profile || {};
        
        // Qualification match (30 points)
        if (attributes.requiredQualifications) {
            const required = Array.isArray(attributes.requiredQualifications)
                ? attributes.requiredQualifications
                : [attributes.requiredQualifications];
            const candidateCerts = Array.isArray(candidateProfile.certifications)
                ? candidateProfile.certifications
                : [];
            
            const matching = required.filter(req => 
                candidateCerts.some(cert => cert.toLowerCase().includes(req.toLowerCase()))
            );
            score += (matching.length / required.length) * 30;
        }
        
        // Experience match (30 points)
        if (attributes.requiredExperience) {
            const candidateExp = candidateProfile.yearsExperience || 0;
            if (candidateExp >= attributes.requiredExperience) {
                score += 30;
            } else {
                score += (candidateExp / attributes.requiredExperience) * 30;
            }
        }
        
        if (attributes.requiredSkills) {
            const required = Array.isArray(attributes.requiredSkills)
                ? attributes.requiredSkills
                : [attributes.requiredSkills];
            const candidateSkills = [].concat(
                candidateProfile.specializations || [],
                candidateProfile.skills || [],
                candidateProfile.services || []
            ).filter(Boolean);

            const svc = window.skillService || (typeof skillService !== 'undefined' ? skillService : null);
            if (svc) {
                const normReq = await svc.normalizeSkills(required);
                const normCand = await svc.normalizeSkills(candidateSkills);
                const candSet = new Set(normCand.map(s => s.toLowerCase()));
                const matchCount = normReq.filter(s => candSet.has(s.toLowerCase())).length;
                score += normReq.length > 0 ? (matchCount / normReq.length) * 30 : 0;
            } else {
                const matching = required.filter(req =>
                    candidateSkills.some(skill => String(skill).toLowerCase().includes(String(req).toLowerCase()))
                );
                score += (matching.length / required.length) * 30;
            }
        }

        if (attributes.location || attributes.workMode) {
            score += 10;
        }

        return score;
    }
    
    /**
     * Match for Competition opportunities
     */
    async matchCompetition(opportunity, candidate) {
        let score = 0;
        const attributes = opportunity.attributes || {};
        
        // Eligibility criteria match (60 points)
        if (attributes.eligibilityCriteria) {
            score += 60; // Simplified
        }
        
        // Experience match (40 points)
        const candidateProfile = candidate.profile || {};
        const candidateExp = candidateProfile.yearsExperience || 0;
        score += Math.min(candidateExp / 10, 1) * 40;
        
        return score;
    }
    
    /**
     * Get past performance score
     */
    async getPastPerformanceScore(candidate, modelType) {
        // Get past applications for this model type
        const allApplications = await this.dataService.getApplications();
        const candidateApplications = allApplications.filter(a => 
            a.applicantId === candidate.id && a.status === 'accepted'
        );
        
        if (candidateApplications.length === 0) {
            return 10; // Default score for new users
        }
        
        // Calculate average performance (simplified)
        // In production, would use ratings/reviews
        const acceptanceRate = candidateApplications.length / 
            allApplications.filter(a => a.applicantId === candidate.id).length;
        
        return acceptanceRate * 20; // Max 20 points
    }
    
    /**
     * Get match criteria breakdown
     */
    async getMatchCriteria(opportunity, candidate) {
        const scope = opportunity.scope || opportunity.attributes || {};
        const sectors = scope.sectors || [];
        const candidateSectors = candidate.profile?.sectors || candidate.profile?.industry || [];
        const sectorMatch = Array.isArray(sectors) && sectors.length > 0
            ? sectors.some(s => (Array.isArray(candidateSectors) ? candidateSectors : []).some(c =>
                String(c).toLowerCase().includes(String(s).toLowerCase())))
            : false;

        const paymentModes = opportunity.paymentModes || (opportunity.exchangeMode ? [opportunity.exchangeMode] : []);
        const candidatePreferred = candidate.profile?.preferredPaymentModes || [];
        const paymentCompatible = paymentModes.length > 0
            ? paymentModes.some(pm => candidatePreferred.some(pp => String(pp).toLowerCase() === String(pm).toLowerCase()))
            : true;

        return {
            modelType: opportunity.modelType,
            subModelType: opportunity.subModelType,
            skillMatch: this._lastSkillDetail || null,
            sectorMatch,
            paymentCompatible,
            matchedAt: new Date().toISOString()
        };
    }
    
    /**
     * @deprecated Legacy person-to-opportunity notifications. Use notifyPostMatch for post_matches.
     */
    async notifyMatch() {
        console.warn('[matching] notifyMatch is deprecated; use notifyPostMatch for post_matches.');
    }

    _canonicalMatchNotificationType(type) {
        const aliases = {
            match_found: 'new_match_found',
            opportunity_match: 'new_match_found',
            candidate_match: 'new_match_found',
            match: 'new_match_found'
        };
        return aliases[type] || type || 'new_match_found';
    }

    /**
     * Build title/message for a post_match notification (by match type).
     * @returns {Promise<{ title: string, message: string }>}
     */
    async buildPostMatchNotificationContent(postMatch) {
        const ds = this.dataService;
        const scorePct = Math.round((postMatch.matchScore || 0) * 100);

        if (postMatch.isReplacement) {
            return {
                title: 'Consortium replacement invitation',
                message: 'You have been invited to replace a participant in a consortium deal.'
            };
        }

        if (postMatch.matchType === 'one_way') {
            const needId = postMatch.payload?.needOpportunityId;
            const offerId = postMatch.payload?.offerOpportunityId;
            const needOpp = needId ? await ds.getOpportunityById(needId) : null;
            const offerOpp = offerId ? await ds.getOpportunityById(offerId) : null;
            const needTitle = needOpp?.title || 'Need';
            const offerTitle = offerOpp?.title || 'Offer';
            return {
                title: 'New Need/Offer match',
                message: `Offer "${offerTitle}" matches Need "${needTitle}" (${scorePct}% exchange compatibility).`
            };
        }
        if (postMatch.matchType === 'two_way') {
            const eq = postMatch.payload?.valueEquivalence || '';
            return {
                title: 'New barter match',
                message: `Barter match between published posts (${scorePct}% barter compatibility).${eq ? ` Value: ${eq}` : ''}`
            };
        }
        if (postMatch.matchType === 'consortium') {
            const leadId = postMatch.payload?.leadNeedId;
            const leadOpp = leadId ? await ds.getOpportunityById(leadId) : null;
            const projectTitle = leadOpp?.title || 'Project';
            const n = (postMatch.payload?.roles || []).length;
            return {
                title: 'New consortium match',
                message: `Need "${projectTitle}" has consortium role fit for ${n} partner Offer post(s).`
            };
        }
        if (postMatch.matchType === 'circular') {
            const n = (postMatch.payload?.cycle || []).length;
            return {
                title: 'New circular exchange match',
                message: `A ${n}-party circular exchange chain includes you (${scorePct}% chain compatibility).`
            };
        }

        return {
            title: 'New match',
            message: `You have a ${scorePct}% Need/Offer compatibility match.`
        };
    }

    /**
     * Notify all participants of a post-match (type-specific message, link to match detail).
     */
    async notifyPostMatch(postMatch) {
        if (!postMatch || !postMatch.participants || !postMatch.id) return;
        const ds = this.dataService;
        const matchLink = `/matches/${postMatch.id}`;
        const { title, message } = await this.buildPostMatchNotificationContent(postMatch);
        const notificationType = this._canonicalMatchNotificationType('new_match_found');

        const seen = new Set();
        for (const p of postMatch.participants) {
            if (!p.userId || seen.has(p.userId)) continue;
            seen.add(p.userId);
            const notifyFn = ds.createLifecycleNotification || ds.createNotification.bind(ds);
            await notifyFn.call(ds, {
                userId: p.userId,
                type: notificationType,
                entityType: 'match',
                entityId: postMatch.id,
                postMatchId: postMatch.id,
                title,
                message,
                link: matchLink,
                read: false
            });
        }
    }

    _emptyPersistStats() {
        return { created: [], createdCount: 0, skippedDuplicateCount: 0, resultCount: 0, topScores: [] };
    }

    _recordPersistAttempt(stats, matchScore, postMatch) {
        if (matchScore != null && !Number.isNaN(Number(matchScore))) {
            stats.topScores.push(Number(matchScore));
        }
        if (postMatch) {
            stats.created.push(postMatch);
            stats.createdCount += 1;
        } else {
            stats.skippedDuplicateCount += 1;
        }
    }

    _postMatchDedupeProbe(matchType, payload, participants = []) {
        return { matchType, payload: payload || {}, participants: participants || [] };
    }

    _strongKeyForPersist(ds, matchType, payload, participants) {
        if (ds && typeof ds.getPostMatchStrongKey === 'function') {
            return ds.getPostMatchStrongKey(this._postMatchDedupeProbe(matchType, payload, participants));
        }
        return null;
    }

    /**
     * createPostMatch with in-run + storage dedupe (used by all persist paths).
     */
    async _createPostMatchForPersist(ds, data, seenKeysInRun) {
        const key = this._strongKeyForPersist(ds, data.matchType, data.payload, data.participants);
        if (key && seenKeysInRun && seenKeysInRun.has(key)) {
            return null;
        }
        const postMatch = await ds.createPostMatch(data);
        if (postMatch && key && seenKeysInRun) {
            seenKeysInRun.add(key);
        } else if (!postMatch && key && seenKeysInRun) {
            seenKeysInRun.add(key);
        }
        return postMatch;
    }

    async _persistOneWayMatches(opportunity, opportunityId, matches, runId, threshold, stats, findResult) {
        const ds = this.dataService;
        const intent = opportunity.intent || 'request';
        const offerToNeeds = findResult && findResult.direction === 'offer_to_needs';
        for (const m of matches) {
            stats.resultCount += 1;
            if ((m.matchScore || 0) < threshold) continue;
            let needId;
            let offerId;
            if (offerToNeeds || intent === 'offer') {
                needId = m.matchedOpportunity?.id;
                offerId = opportunityId;
            } else {
                needId = intent === 'request' || intent === 'hybrid' ? opportunityId : (m.matchedOpportunity?.id);
                offerId = intent === 'offer' ? opportunityId : (m.matchedOpportunity?.id);
            }
            if (!needId || !offerId || needId === offerId) continue;
            const needOpp = await ds.getOpportunityById(needId);
            const offerOpp = await ds.getOpportunityById(offerId);
            if (!needOpp || !offerOpp) continue;
            if (needOpp.creatorId === offerOpp.creatorId) continue;
            const participants = [
                { userId: needOpp.creatorId, opportunityId: needId, role: 'need_owner', participantStatus: 'pending', respondedAt: null },
                { userId: offerOpp.creatorId, opportunityId: offerId, role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
            ];
            const payload = {
                needOpportunityId: needId,
                offerOpportunityId: offerId,
                breakdown: m.breakdown || m.scoreBreakdown || {},
                valueAnalysis: m.valueAnalysis || null
            };
            const postMatch = await this._createPostMatchForPersist(ds, {
                matchType: 'one_way',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                matchScore: m.matchScore,
                runId,
                participants,
                payload
            }, this._persistSeenKeysInRun);
            this._recordPersistAttempt(stats, m.matchScore, postMatch);
            if (postMatch) await this.notifyPostMatch(postMatch);
        }
    }

    /**
     * Hydrate a barter side with the creator's published need + offer pair.
     * If the anchor post is a Need, needId is that post and offerId is the creator's published Offer (and vice versa).
     * @param {string} creatorId
     * @param {Object|null} anchorOpportunity - published post for this side (trigger or matched need)
     * @param {Object[]} allOpportunities
     * @param {{ matchedNeed?: Object, matchedOffer?: Object }} [pairHints] - optional matcher pair for the other side
     * @returns {{ userId: string, needId: string|null, offerId: string|null }}
     */
    _hydrateBarterSide(creatorId, anchorOpportunity, allOpportunities, pairHints = {}) {
        if (!creatorId) {
            return { userId: null, needId: null, offerId: null };
        }

        const published = (allOpportunities || []).filter(
            o => o.creatorId === creatorId && (o.status || '') === 'published'
        );
        const needs = published.filter(o => (o.intent || '') === 'request');
        const offers = published.filter(o => (o.intent || '') === 'offer');

        let needId = pairHints.matchedNeed?.id || null;
        let offerId = pairHints.matchedOffer?.id || null;

        const anchorId = anchorOpportunity?.id || null;
        const intent = (anchorOpportunity?.intent || '').toLowerCase();

        if (intent === 'request' && anchorId) {
            needId = anchorId;
            if (!offerId) {
                offerId = offers.find(o => o.id !== anchorId)?.id || offers[0]?.id || null;
            }
        } else if (intent === 'offer' && anchorId) {
            offerId = anchorId;
            if (!needId) {
                needId = needs.find(o => o.id !== anchorId)?.id || needs[0]?.id || null;
            }
        } else if (anchorId) {
            if (needs.some(o => o.id === anchorId)) needId = anchorId;
            if (offers.some(o => o.id === anchorId)) offerId = anchorId;
        }

        if (!needId) needId = needs[0]?.id || null;
        if (!offerId) offerId = offers[0]?.id || null;

        return { userId: creatorId, needId, offerId };
    }

    async _persistTwoWayMatches(opportunity, opportunityId, matches, runId, threshold, stats) {
        const ds = this.dataService;
        const allOpportunities = await ds.getOpportunities();
        const ourUserId = opportunity.creatorId;

        for (const m of matches) {
            stats.resultCount += 1;
            if ((m.matchScore || 0) < threshold) continue;
            const matchedNeed = m.matchedNeed;
            const matchedOffer = m.matchedOffer;
            if (!matchedNeed || !matchedOffer) continue;
            const otherUserId = matchedNeed.creatorId || matchedOffer.creatorId;
            if (!otherUserId || otherUserId === ourUserId) continue;

            const sideA = this._hydrateBarterSide(ourUserId, opportunity, allOpportunities);
            const sideB = this._hydrateBarterSide(otherUserId, matchedNeed, allOpportunities, {
                matchedNeed,
                matchedOffer
            });
            if (!sideA.userId || !sideA.needId || !sideA.offerId || !sideB.userId || !sideB.needId || !sideB.offerId) continue;
            const participants = [
                { userId: sideA.userId, opportunityId: sideA.needId, role: 'need_owner', participantStatus: 'pending', respondedAt: null },
                { userId: sideA.userId, opportunityId: sideA.offerId, role: 'offer_provider', participantStatus: 'pending', respondedAt: null },
                { userId: sideB.userId, opportunityId: sideB.needId, role: 'need_owner', participantStatus: 'pending', respondedAt: null },
                { userId: sideB.userId, opportunityId: sideB.offerId, role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
            ];
            const payload = {
                sideA,
                sideB,
                scoreAtoB: m.breakdown?.scoreAtoB,
                scoreBtoA: m.breakdown?.scoreBtoA,
                valueEquivalence: m.valueEquivalence || null
            };
            const postMatch = await this._createPostMatchForPersist(ds, {
                matchType: 'two_way',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                matchScore: m.matchScore,
                runId,
                participants,
                payload
            }, this._persistSeenKeysInRun);
            this._recordPersistAttempt(stats, m.matchScore, postMatch);
            if (postMatch) await this.notifyPostMatch(postMatch);
        }
    }

    async _persistConsortiumMatches(opportunity, opportunityId, matches, runId, threshold, stats) {
        const ds = this.dataService;
        for (const m of matches) {
            stats.resultCount += 1;
            if ((m.matchScore || 0) < threshold) continue;
            const leadNeedId = opportunityId;
            const roles = m.suggestedPartners || [];
            const participants = [
                { userId: opportunity.creatorId, opportunityId: leadNeedId, role: 'consortium_lead', participantStatus: 'pending', respondedAt: null }
            ];
            roles.forEach(r => {
                if (!r.creatorId || r.creatorId === opportunity.creatorId) return;
                participants.push({
                    userId: r.creatorId,
                    opportunityId: r.opportunityId,
                    role: 'consortium_member',
                    participantStatus: 'pending',
                    respondedAt: null
                });
            });
            const payload = {
                leadNeedId,
                roles: roles.map(r => ({ role: r.role, opportunityId: r.opportunityId, userId: r.creatorId, score: m.breakdown?.[r.role] })),
                valueBalance: m.valueAnalysis || null
            };
            const postMatch = await this._createPostMatchForPersist(ds, {
                matchType: 'consortium',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                matchScore: m.matchScore,
                runId,
                participants,
                payload
            }, this._persistSeenKeysInRun);
            this._recordPersistAttempt(stats, m.matchScore, postMatch);
            if (postMatch) await this.notifyPostMatch(postMatch);
        }
    }

    _normalizeCycleRing(cycle) {
        const models = window.matchingModels || (typeof matchingModels !== 'undefined' ? matchingModels : null);
        if (models && typeof models.normalizeCycleRing === 'function') {
            return models.normalizeCycleRing(cycle);
        }
        if (!Array.isArray(cycle) || !cycle.length) return [];
        const ring = cycle.filter(Boolean);
        if (ring.length > 1 && ring[0] === ring[ring.length - 1]) {
            return ring.slice(0, -1);
        }
        return ring;
    }

    /**
     * Normalize circular link payloads so every edge has fromCreatorId, toCreatorId, needId, offerId, score.
     * @param {string[]} cycle
     * @param {Array} rawLinks - linkScores and/or legacy links
     * @param {Object} [ds] - optional dataService for edge lookup fallback
     * @returns {Promise<{ cycle: string[], links: Array }>}
     */
    async _normalizeCircularLinks(cycle, rawLinks, ds = null) {
        const ring = this._normalizeCycleRing(cycle);
        const linkList = Array.isArray(rawLinks) ? rawLinks : [];
        const byEdge = new Map();

        for (const l of linkList) {
            const fromCreatorId = l.fromCreatorId || l.from;
            const toCreatorId = l.toCreatorId || l.to;
            if (!fromCreatorId || !toCreatorId) continue;
            const needId = l.needId || l.need?.id || null;
            const offerId = l.offerId || l.offer?.id || null;
            byEdge.set(`${fromCreatorId}->${toCreatorId}`, {
                fromCreatorId,
                toCreatorId,
                needId,
                offerId,
                score: l.score
            });
        }

        const links = [];
        for (let i = 0; i < ring.length; i++) {
            const fromCreatorId = ring[i];
            const toCreatorId = ring[(i + 1) % ring.length];
            const key = `${fromCreatorId}->${toCreatorId}`;
            let entry = byEdge.get(key) || {
                fromCreatorId,
                toCreatorId,
                needId: null,
                offerId: null,
                score: null
            };

            if ((!entry.needId || !entry.offerId) && ds && typeof ds.getOpportunities === 'function') {
                const hydrated = await this._lookupCircularEdgeOpportunities(ds, fromCreatorId, toCreatorId);
                if (hydrated) {
                    entry = { ...entry, needId: entry.needId || hydrated.needId, offerId: entry.offerId || hydrated.offerId };
                }
            }

            if (!entry.fromCreatorId || !entry.toCreatorId || !entry.needId || !entry.offerId || entry.score == null) {
                continue;
            }
            links.push({
                fromCreatorId: entry.fromCreatorId,
                toCreatorId: entry.toCreatorId,
                needId: entry.needId,
                offerId: entry.offerId,
                score: entry.score
            });
        }

        return { cycle: ring, links };
    }

    /**
     * Fallback: published need from `from` creator + published offer from `to` creator.
     */
    async _lookupCircularEdgeOpportunities(ds, fromCreatorId, toCreatorId) {
        const all = await ds.getOpportunities();
        const published = (all || []).filter(o => (o.status || '') === 'published');
        const need = published.find(o => o.creatorId === fromCreatorId && (o.intent || '') === 'request');
        const offer = published.find(o => o.creatorId === toCreatorId && (o.intent || '') === 'offer');
        if (!need?.id || !offer?.id) return null;
        return { needId: need.id, offerId: offer.id };
    }

    async _persistCircularMatches(opportunity, opportunityId, matches, runId, threshold, stats) {
        const ds = this.dataService;
        for (const m of matches) {
            stats.resultCount += 1;
            if ((m.matchScore || 0) < threshold) continue;
            const rawCycle = m.cycle || [];
            if (!rawCycle.includes(opportunity.creatorId)) continue;

            const { cycle, links } = await this._normalizeCircularLinks(
                rawCycle,
                m.linkScores || m.links || [],
                ds
            );
            if (!cycle.length || !links.length || links.length < cycle.length) continue;
            if (links.some(l => !l.fromCreatorId || !l.toCreatorId || !l.needId || !l.offerId || l.score == null)) continue;

            const participants = [];
            const seenUser = new Set();
            for (const uid of cycle) {
                if (seenUser.has(uid)) continue;
                seenUser.add(uid);
                const link = links.find(l => l.toCreatorId === uid) || links.find(l => l.fromCreatorId === uid);
                const oppId = link?.offerId || link?.needId || null;
                participants.push({
                    userId: uid,
                    opportunityId: oppId,
                    role: 'chain_participant',
                    participantStatus: 'pending',
                    respondedAt: null
                });
            }
            const payload = {
                cycle,
                links,
                linkScores: links,
                chainBalance: m.valueAnalysis || null
            };
            const postMatch = await this._createPostMatchForPersist(ds, {
                matchType: 'circular',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                matchScore: m.matchScore,
                runId,
                participants,
                payload
            }, this._persistSeenKeysInRun);
            this._recordPersistAttempt(stats, m.matchScore, postMatch);
            if (postMatch) await this.notifyPostMatch(postMatch);
        }
    }

    async _persistFindResult(opportunity, opportunityId, model, findResult, runId, threshold, stats) {
        const matches = findResult.matches || [];
        if (model === 'one_way') {
            await this._persistOneWayMatches(opportunity, opportunityId, matches, runId, threshold, stats, findResult);
        } else if (model === 'two_way') {
            await this._persistTwoWayMatches(opportunity, opportunityId, matches, runId, threshold, stats);
        } else if (model === 'consortium') {
            await this._persistConsortiumMatches(opportunity, opportunityId, matches, runId, threshold, stats);
        } else if (model === 'circular') {
            await this._persistCircularMatches(opportunity, opportunityId, matches, runId, threshold, stats);
        }
    }

    /**
     * Persist post-to-post matches when an opportunity is published (or admin save).
     * 1. Load opportunity
     * 2. detectMatchingModel(opportunity) → run each model via findMatchesForPost(..., { model })
     * 3. findMatchesForPost(..., { model: 'circular' }) — cycles including published post creator only
     * 4. Dedupe via createPostMatch strong keys + in-run seen set
     * @param {string} opportunityId
     * @param {{ model?: string, source?: string, actorId?: string }} options - `model` limits to one model (admin/debug)
     * @returns {Promise<{ created: Array, createdCount: number, skippedDuplicateCount: number, resultCount: number }>}
     */
    async persistPostMatches(opportunityId, options = {}) {
        const startedAt = Date.now();
        const emptyResult = { created: [], createdCount: 0, skippedDuplicateCount: 0, resultCount: 0 };

        const adminPersistSources = new Set(['admin_save', 'admin_command_center', 'manual_debug']);
        if (adminPersistSources.has(options.source || '')) {
            const actorRole = options.actorRole
                || (typeof window !== 'undefined' && window.authService?.getCurrentUser?.()?.role)
                || null;
            if (actorRole && typeof window !== 'undefined' && window.hasAdminCapability) {
                if (!window.hasAdminCapability(actorRole, 'admin.matching.persist')) {
                    throw new Error('You do not have permission to perform this action.');
                }
            }
        }

        // 1. Load opportunity
        const opportunity = await this.dataService.getOpportunityById(opportunityId);
        if (!opportunity || opportunity.status !== 'published') return emptyResult;

        const ds = this.dataService;
        const threshold = CONFIG.MATCHING.POST_TO_POST_THRESHOLD ?? 0.50;
        const { model: _explicitModelOpt, ...findOptions } = options;
        const { models, runCircular } = this._buildPersistModelPlan(opportunity, options);
        const modelsRun = runCircular ? models.concat(['circular']) : models.slice();
        const source = options.source || (options.model ? 'manual_debug' : 'publish');

        const stats = this._emptyPersistStats();
        this._persistSeenKeysInRun = new Set();
        let runId = null;

        try {
            if (ds && typeof ds.createMatchingRun === 'function') {
                const run = await ds.createMatchingRun({
                    opportunityId,
                    model: modelsRun.length === 1 ? modelsRun[0] : 'multi',
                    modelsRun,
                    source,
                    actorId: options.actorId || null,
                    threshold,
                    weightsProfile: (CONFIG.MATCHING && CONFIG.MATCHING.WEIGHTS_PROFILE) || null
                });
                runId = run?.id || null;
            }

            // 2–3. Each detected model + circular (explicit model per call — no route precedence)
            for (const model of models) {
                try {
                    const findResult = await this.findMatchesForPost(opportunityId, { ...findOptions, model });
                    await this._persistFindResult(opportunity, opportunityId, model, findResult, runId, threshold, stats);
                } catch (err) {
                    console.warn('persistPostMatches model=' + model + ':', err);
                }
            }

            if (runCircular) {
                try {
                    const circularResult = await this.findMatchesForPost(opportunityId, { ...findOptions, model: 'circular' });
                    await this._persistFindResult(opportunity, opportunityId, 'circular', circularResult, runId, threshold, stats);
                } catch (err) {
                    console.warn('persistPostMatches circular:', err);
                }
            }

            stats.topScores = stats.topScores.sort((a, b) => b - a).slice(0, 10);
            const durationMs = Date.now() - startedAt;

            if (runId && ds && typeof ds.updateMatchingRun === 'function') {
                await ds.updateMatchingRun(runId, {
                    candidateCount: stats.resultCount,
                    resultCount: stats.resultCount,
                    createdCount: stats.createdCount,
                    skippedDuplicateCount: stats.skippedDuplicateCount,
                    topScores: stats.topScores,
                    durationMs
                });
            }

            return {
                created: stats.created,
                createdCount: stats.createdCount,
                skippedDuplicateCount: stats.skippedDuplicateCount,
                resultCount: stats.resultCount
            };
        } finally {
            this._persistSeenKeysInRun = null;
        }
    }

    /**
     * Persist matches for multiple opportunities (admin command center bulk save).
     * @param {string[]} opportunityIds
     * @param {{ source?: string, actorId?: string, previewRunId?: string }} options
     * @returns {Promise<{ opportunityCount: number, created: Array, createdCount: number, skippedDuplicateCount: number, failedCount: number, errors: Array }>}
     */
    async persistPreviewOpportunities(opportunityIds, options = {}) {
        const actorRole = options.actorRole
            || (typeof window !== 'undefined' && window.authService?.getCurrentUser?.()?.role)
            || null;
        if (typeof window !== 'undefined' && window.assertAdminCapability && actorRole) {
            window.assertAdminCapability(actorRole, 'admin.matching.persist');
        } else if (actorRole && typeof window !== 'undefined' && window.hasAdminCapability) {
            if (!window.hasAdminCapability(actorRole, 'admin.matching.persist')) {
                throw new Error('You do not have permission to perform this action.');
            }
        }

        const unique = Array.from(new Set((opportunityIds || []).filter(Boolean)));
        const source = options.source || 'admin_command_center';
        const created = [];
        const errors = [];
        let createdCount = 0;
        let skippedDuplicateCount = 0;
        const ds = this.dataService;
        const actorId = options.actorId || null;

        if (ds && typeof ds.auditMatchingSelectedPersist === 'function') {
            await ds.auditMatchingSelectedPersist('started', {
                actorId,
                actorRole,
                previewRunId: options.previewRunId || null,
                opportunityIds: unique
            });
        }

        for (const opportunityId of unique) {
            try {
                const batch = await this.persistPostMatches(opportunityId, {
                    actorId: options.actorId || null,
                    source,
                    previewRunId: options.previewRunId || null
                });
                if (batch && batch.created && batch.created.length) {
                    created.push(...batch.created);
                }
                createdCount += batch?.createdCount || 0;
                skippedDuplicateCount += batch?.skippedDuplicateCount || 0;
            } catch (err) {
                errors.push({
                    opportunityId,
                    message: (err && err.message) ? err.message : 'Persist failed'
                });
            }
        }

        if (ds && typeof ds.auditMatchingSelectedPersist === 'function') {
            await ds.auditMatchingSelectedPersist('completed', {
                actorId,
                actorRole,
                previewRunId: options.previewRunId || null,
                opportunityIds: unique,
                createdCount,
                errorCount: errors.length
            });
        }

        return {
            opportunityCount: unique.length,
            created,
            createdCount,
            skippedDuplicateCount,
            failedCount: errors.length,
            errors
        };
    }
    
    /**
     * @deprecated Legacy person-to-opportunity matching.
     * User-facing matching now uses post_matches only.
     * Do not call this from UI or publish flows.
     */
    async findOpportunitiesForCandidate(candidateId, options = {}) {
        if (!this.isLegacyPersonOpportunityEnabled()) {
            this._warnLegacyMatchingDisabled('findOpportunitiesForCandidate');
            return [];
        }
        const allOpportunities = await this.dataService.getOpportunities();
        const publishedOpportunities = allOpportunities.filter(o => o.status === 'published');
        const minThreshold = options.minThreshold != null ? options.minThreshold : this.minThreshold;
        // Try to find candidate as user first, then as company
        const candidate = await this.dataService.getUserById(candidateId) 
            || await this.dataService.getCompanyById(candidateId);
        
        if (!candidate) {
            throw new Error('Candidate not found');
        }
        
        const matches = [];
        
        for (const opportunity of publishedOpportunities) {
            // Skip own opportunities
            if (opportunity.creatorId === candidateId) {
                continue;
            }
            
            const matchScore = await this.calculateMatchScore(opportunity, candidate);
            
            if (matchScore >= minThreshold) {
                matches.push({
                    opportunity,
                    matchScore,
                    criteria: await this.getMatchCriteria(opportunity, candidate)
                });
            }
        }
        
        // Sort by match score
        matches.sort((a, b) => b.matchScore - a.matchScore);
        
        return matches;
    }
}

// Create singleton instance
const matchingService = new MatchingService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = matchingService;
} else {
    window.matchingService = matchingService;
}
