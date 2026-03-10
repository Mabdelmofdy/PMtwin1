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
        if (hasNeed) modelList.push('one_way');
        if (isBarter && (hasNeed || hasOffer)) modelList.push('two_way');
        if (hasRoles || subModelType === 'consortium') modelList.push('consortium');
        return modelList;
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
     * Post-to-post matching: route by post type and options, return { model, matches }.
     * When options.model is omitted, auto-detects and may run multiple models and merge (one_way + two_way if barter, etc.).
     */
    async findMatchesForPost(opportunityId, options = {}) {
        const models = window.matchingModels || (typeof matchingModels !== 'undefined' && matchingModels);
        if (!models) return { model: 'one_way', matches: [] };

        const opportunity = await this.dataService.getOpportunityById(opportunityId);
        if (!opportunity) return { model: 'one_way', matches: [] };

        const intent = opportunity.intent || 'request';
        const exchangeMode = (opportunity.exchangeMode || '').toLowerCase();
        const subModelType = (opportunity.subModelType || '').toLowerCase();

        if (options.model === 'circular') {
            const result = await models.findCircularExchanges(options);
            result.matches = this.rankMatches(result.matches || [], 'circular');
            return result;
        }
        if (options.model === 'consortium' || subModelType === 'consortium') {
            const result = await models.findConsortiumCandidates(opportunityId, options);
            result.matches = this.rankMatches(result.matches || [], 'consortium');
            return result;
        }
        if (options.model === 'two_way' || exchangeMode === 'barter') {
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
     * Find matches for an opportunity
     */
    async findMatchesForOpportunity(opportunityId) {
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
        
        // Save matches
        for (const match of matches) {
            await this.dataService.createMatch(match);
            const candidate = await this.dataService.getUserById(match.candidateId) || await this.dataService.getCompanyById(match.candidateId);
            if (candidate && match.matchScore >= this.autoNotifyThreshold) {
                await this.notifyMatch(match, opportunity, candidate);
            }
        }
        
        return matches;
    }
    
    /**
     * Calculate match score between opportunity and candidate
     * Uses scope (skills, sectors, interests, certifications) and payment compatibility when present
     */
    async calculateMatchScore(opportunity, candidate) {
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
     * Notify user about match
     */
    async notifyMatch(match, opportunity, candidate) {
        await this.dataService.createNotification({
            userId: candidate.id,
            type: 'match_found',
            title: 'New Match Found',
            message: `You have a ${Math.round(match.matchScore * 100)}% match for "${opportunity.title}"`
        });
        
        // Update match as notified
        await this.dataService.updateMatch(match.id, { notified: true });
    }

    /**
     * Notify all participants of a post-match (type-specific message, link to match detail).
     */
    async notifyPostMatch(postMatch) {
        if (!postMatch || !postMatch.participants || !postMatch.id) return;
        const ds = this.dataService;
        const scorePct = Math.round((postMatch.matchScore || 0) * 100);
        const matchLink = `/matches/${postMatch.id}`;
        let title = 'New Match Found';
        let message = `You have a ${scorePct}% match.`;

        if (postMatch.matchType === 'one_way') {
            const needId = postMatch.payload?.needOpportunityId;
            const offerId = postMatch.payload?.offerOpportunityId;
            const needOpp = needId ? await ds.getOpportunityById(needId) : null;
            const offerOpp = offerId ? await ds.getOpportunityById(offerId) : null;
            const needTitle = needOpp?.title || 'Need';
            const offerTitle = offerOpp?.title || 'Offer';
            title = 'Recommended Provider Found';
            message = `${offerTitle} matches ${needTitle} (${scorePct}% match).`;
        } else if (postMatch.matchType === 'two_way') {
            title = 'Barter Match Found';
            const eq = postMatch.payload?.valueEquivalence || '';
            message = `Exchange opportunity found (${scorePct}% match). ${eq ? `Value: ${eq}` : ''}`;
        } else if (postMatch.matchType === 'consortium') {
            title = 'Consortium Opportunity';
            const leadId = postMatch.payload?.leadNeedId;
            const leadOpp = leadId ? await ds.getOpportunityById(leadId) : null;
            const projectTitle = leadOpp?.title || 'Project';
            const n = (postMatch.payload?.roles || []).length;
            message = `${projectTitle} has found potential partners for ${n} role(s).`;
        } else if (postMatch.matchType === 'circular') {
            title = 'Circular Exchange Detected';
            const n = (postMatch.payload?.cycle || []).length;
            message = `A ${n}-party exchange chain includes you (${scorePct}% match).`;
        }

        const seen = new Set();
        for (const p of postMatch.participants) {
            if (!p.userId || seen.has(p.userId)) continue;
            seen.add(p.userId);
            await ds.createNotification({
                userId: p.userId,
                type: 'match',
                title,
                message,
                link: matchLink,
                read: false
            });
        }
    }

    /**
     * Persist post-to-post matches when an opportunity is published.
     * Runs findMatchesForPost, converts results to PostMatch records, deduplicates, and notifies participants.
     */
    async persistPostMatches(opportunityId) {
        const opportunity = await this.dataService.getOpportunityById(opportunityId);
        if (!opportunity || opportunity.status !== 'published') return [];

        const ds = this.dataService;
        const created = [];
        const threshold = CONFIG.MATCHING.POST_TO_POST_THRESHOLD ?? 0.50;

        // One-way or two-way from findMatchesForPost(opportunityId)
        const result = await this.findMatchesForPost(opportunityId, {});
        const model = result.model || 'one_way';
        const matches = result.matches || [];

        if (model === 'one_way' || (result.direction === 'offer_to_needs')) {
            for (const m of matches) {
                if ((m.matchScore || 0) < threshold) continue;
                const needId = opportunity.intent === 'request' ? opportunityId : (m.matchedOpportunity?.id);
                const offerId = opportunity.intent === 'offer' ? opportunityId : (m.matchedOpportunity?.id);
                if (!needId || !offerId) continue;
                const needOpp = await ds.getOpportunityById(needId);
                const offerOpp = await ds.getOpportunityById(offerId);
                if (!needOpp || !offerOpp) continue;
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
                const postMatch = await ds.createPostMatch({
                    matchType: 'one_way',
                    status: CONFIG.POST_MATCH_STATUS.PENDING,
                    matchScore: m.matchScore,
                    participants,
                    payload
                });
                if (postMatch) {
                    created.push(postMatch);
                    await this.notifyPostMatch(postMatch);
                }
            }
        } else if (model === 'two_way') {
            for (const m of matches) {
                if ((m.matchScore || 0) < threshold) continue;
                const matchedNeed = m.matchedNeed;
                const matchedOffer = m.matchedOffer;
                if (!matchedNeed || !matchedOffer) continue;
                const otherUserId = matchedNeed.creatorId;
                const ourUserId = opportunity.creatorId;
                const ourOppId = opportunityId;
                const ourRole = opportunity.intent === 'request' ? 'need_owner' : 'offer_provider';
                const participants = [
                    { userId: ourUserId, opportunityId: ourOppId, role: ourRole, participantStatus: 'pending', respondedAt: null },
                    { userId: otherUserId, opportunityId: matchedNeed.id, role: 'need_owner', participantStatus: 'pending', respondedAt: null },
                    { userId: otherUserId, opportunityId: matchedOffer.id, role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
                ];
                const payload = {
                    sideA: { userId: ourUserId, needId: opportunity.intent === 'request' ? ourOppId : null, offerId: opportunity.intent === 'offer' ? ourOppId : null },
                    sideB: { userId: otherUserId, needId: matchedNeed.id, offerId: matchedOffer.id },
                    scoreAtoB: m.breakdown?.scoreAtoB,
                    scoreBtoA: m.breakdown?.scoreBtoA,
                    valueEquivalence: m.valueEquivalence || null
                };
                const postMatch = await ds.createPostMatch({
                    matchType: 'two_way',
                    status: CONFIG.POST_MATCH_STATUS.PENDING,
                    matchScore: m.matchScore,
                    participants,
                    payload
                });
                if (postMatch) {
                    created.push(postMatch);
                    await this.notifyPostMatch(postMatch);
                }
            }
        } else if (model === 'consortium') {
            for (const m of matches) {
                if ((m.matchScore || 0) < threshold) continue;
                const leadNeedId = opportunityId;
                const roles = m.suggestedPartners || [];
                const participants = [
                    { userId: opportunity.creatorId, opportunityId: leadNeedId, role: 'consortium_lead', participantStatus: 'pending', respondedAt: null }
                ];
                roles.forEach(r => {
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
                const postMatch = await ds.createPostMatch({
                    matchType: 'consortium',
                    status: CONFIG.POST_MATCH_STATUS.PENDING,
                    matchScore: m.matchScore,
                    participants,
                    payload
                });
                if (postMatch) {
                    created.push(postMatch);
                    await this.notifyPostMatch(postMatch);
                }
            }
        }

        // Circular: run global scan and persist cycles that include this opportunity's creator
        try {
            const circularResult = await this.findMatchesForPost(opportunityId, { model: 'circular' });
            const cycles = circularResult.matches || [];
            for (const m of cycles) {
                if ((m.matchScore || 0) < threshold) continue;
                const cycle = m.cycle || [];
                if (!cycle.includes(opportunity.creatorId)) continue;
                const links = m.linkScores || m.links || [];
                const participants = [];
                const seenUser = new Set();
                for (const uid of cycle) {
                    if (seenUser.has(uid)) continue;
                    seenUser.add(uid);
                    const link = links.find(l => l.fromCreatorId === uid || l.from === uid);
                    const oppId = link?.offerId || null;
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
                    links: links.map(l => ({
                        fromCreatorId: l.fromCreatorId || l.from,
                        toCreatorId: l.toCreatorId || l.to,
                        offerId: l.offerId,
                        needId: l.needId,
                        score: l.score
                    })),
                    chainBalance: m.valueAnalysis || null
                };
                const postMatch = await ds.createPostMatch({
                    matchType: 'circular',
                    status: CONFIG.POST_MATCH_STATUS.PENDING,
                    matchScore: m.matchScore,
                    participants,
                    payload
                });
                if (postMatch) {
                    created.push(postMatch);
                    await this.notifyPostMatch(postMatch);
                }
            }
        } catch (err) {
            console.warn('persistPostMatches circular:', err);
        }

        return created;
    }
    
    /**
     * Find opportunities for a candidate
     * @param {string} candidateId
     * @param {{ minThreshold?: number }} options - optional minThreshold override (0-1) from profile matching preferences
     */
    async findOpportunitiesForCandidate(candidateId, options = {}) {
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

// Add updateMatch method to dataService if not exists
if (window.dataService && !window.dataService.updateMatch) {
    window.dataService.updateMatch = async function(matchId, updates) {
        const matches = await this.getMatches();
        const index = matches.findIndex(m => m.id === matchId);
        if (index === -1) return null;
        
        matches[index] = {
            ...matches[index],
            ...updates
        };
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, matches);
        return matches[index];
    };
}

// Create singleton instance
const matchingService = new MatchingService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = matchingService;
} else {
    window.matchingService = matchingService;
}
