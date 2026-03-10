/**
 * Data Service
 * High-level data access layer for all entities
 * Uses browser localStorage for all CRUD operations
 */

class DataService {
    constructor() {
        this.storage = window.storageService || storageService;
        this.initialized = false;
        this.SEED_DATA_VERSION_KEY = 'pmtwin_seed_version';
        this.CURRENT_SEED_VERSION = '1.18.0'; // Production data cleanup: opportunities/contacts cleared; admin-only user seed
    }
    
    /**
     * Get the data path using centralized BASE_PATH
     */
    get jsonDataPath() {
        return (window.CONFIG?.BASE_PATH || '') + 'data/';
    }
    
    /**
     * Initialize data from JSON files on first launch or when seed version changes
     */
    async initializeFromJSON() {
        if (this.initialized) return;
        
        try {
            // Check if we need to seed data
            const storedVersion = this.storage.get(this.SEED_DATA_VERSION_KEY);
            const needsSeed = !storedVersion || storedVersion !== this.CURRENT_SEED_VERSION;
            
            if (!needsSeed) {
                console.log('Data already initialized, skipping seed');
                this.initialized = true;
                return;
            }
            
            console.log('Initializing data from JSON seed files...');
            
            // Clear existing data if re-seeding
            if (storedVersion && storedVersion !== this.CURRENT_SEED_VERSION) {
                console.log('Seed version changed, clearing old data...');
                this.clearAllData();
            }
            
            // Load from JSON files
            const domains = ['users', 'companies', 'opportunities', 'applications', 'matches', 'notifications', 'connections', 'messages', 'audit', 'sessions', 'contracts', 'reviews'];
            
            for (const domain of domains) {
                try {
                    const response = await fetch(`${this.jsonDataPath}${domain}.json`);
                    if (response.ok) {
                        const jsonData = await response.json();
                        if (jsonData.data && Array.isArray(jsonData.data)) {
                            const storageKey = this.getStorageKeyForDomain(domain);
                            if (storageKey) {
                                this.storage.set(storageKey, jsonData.data);
                                console.log(`Loaded ${jsonData.data.length} ${domain} records`);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to load ${domain}.json:`, error);
                    // Initialize with empty array if JSON fails
                    const storageKey = this.getStorageKeyForDomain(domain);
                    if (storageKey && !this.storage.get(storageKey)) {
                        this.storage.set(storageKey, []);
                    }
                }
            }
            
            // Migrate opportunities to unified workflow (intent, collaborationModel, paymentModes)
            this.migrateOpportunitiesToUnifiedWorkflow();
            
            // Normalize users and companies for matching compatibility
            this.normalizeUsersForMatching();
            this.normalizeCompaniesForMatching();
            
            // Store seed version
            this.storage.set(this.SEED_DATA_VERSION_KEY, this.CURRENT_SEED_VERSION);
            
            this.initialized = true;
            console.log('Data initialization complete');
        } catch (error) {
            console.error('Error initializing from JSON:', error);
        }
    }
    
    /**
     * Clear all stored data (useful for reset)
     */
    clearAllData() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            this.storage.remove(key);
        });
    }
    
    /**
     * Force re-seed from JSON files
     */
    async reseedFromJSON() {
        this.storage.remove(this.SEED_DATA_VERSION_KEY);
        this.initialized = false;
        await this.initializeFromJSON();
    }
    
    /**
     * Backfill intent, collaborationModel, paymentModes on existing opportunities (unified workflow)
     */
    migrateOpportunitiesToUnifiedWorkflow() {
        const opportunities = this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITIES) || [];
        const collabMap = {
            project_based_task_based: 'project',
            project_based_consortium: 'consortium',
            project_based_project_jv: 'project',
            project_based_spv: 'project',
            strategic_partnership_strategic_jv: 'advisory',
            strategic_partnership_strategic_alliance: 'advisory',
            strategic_partnership_mentorship: 'advisory',
            resource_pooling_bulk_purchasing: 'service',
            resource_pooling_equipment_sharing: 'service',
            resource_pooling_resource_sharing: 'service',
            hiring_professional_hiring: 'service',
            hiring_consultant_hiring: 'service',
            competition_competition_rfp: 'project'
        };
        let changed = false;
        opportunities.forEach(o => {
            if (o.intent === undefined) {
                o.intent = 'request';
                changed = true;
            }
            if (o.collaborationModel === undefined) {
                const key = `${o.modelType || ''}_${o.subModelType || ''}`;
                o.collaborationModel = collabMap[key] || 'project';
                changed = true;
            }
            if (o.paymentModes === undefined || !Array.isArray(o.paymentModes)) {
                const mode = o.exchangeMode || 'cash';
                o.paymentModes = [mode];
                changed = true;
            }
            // Backfill top-level scope from attributes when scope is missing or empty (for matching)
            const attrs = o.attributes || {};
            const hasScope = o.scope && typeof o.scope === 'object' && (
                (Array.isArray(o.scope.requiredSkills) && o.scope.requiredSkills.length > 0) ||
                (Array.isArray(o.scope.sectors) && o.scope.sectors.length > 0) ||
                (Array.isArray(o.scope.certifications) && o.scope.certifications.length > 0) ||
                (Array.isArray(o.scope.offeredSkills) && o.scope.offeredSkills.length > 0)
            );
            if (!hasScope) {
                const arr = (v) => (Array.isArray(v) ? v : (v ? [v] : []));
                o.scope = {
                    requiredSkills: arr(attrs.requiredSkills),
                    offeredSkills: arr(attrs.offeredSkills),
                    sectors: arr(attrs.sectors),
                    certifications: arr(attrs.certifications),
                    interests: arr(attrs.interests)
                };
                changed = true;
            }
        });
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, opportunities);
            console.log('Migrated opportunities to unified workflow');
        }
    }

    /**
     * Normalize users for matching compatibility
     * Ensures yearsExperience, specializations, sectors, preferredPaymentModes are present
     */
    normalizeUsersForMatching() {
        const users = this.storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
        let changed = false;
        
        // Valid sector values for filtering interests
        const validSectors = ['Construction', 'Infrastructure', 'Technology', 'Energy', 'Manufacturing', 'Real Estate', 'Transportation', 'Architecture', 'Engineering', 'Hospitality', 'Industrial', 'Agriculture', 'Education', 'Legal Services'];
        
        users.forEach(user => {
            if (!user.profile) return;
            const profile = user.profile;
            
            // Ensure yearsExperience from experience
            if (profile.yearsExperience == null && profile.experience != null) {
                profile.yearsExperience = profile.experience;
                changed = true;
            }
            
            // Ensure specializations from skills
            if (!profile.specializations && profile.skills && profile.skills.length > 0) {
                profile.specializations = profile.skills.slice(0, 3);
                changed = true;
            }
            
            // Ensure sectors from interests (filter to valid sector values)
            if (!profile.sectors && profile.interests && profile.interests.length > 0) {
                const derivedSectors = profile.interests.filter(i => 
                    validSectors.some(s => i.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(i.toLowerCase()))
                );
                if (derivedSectors.length > 0) {
                    profile.sectors = derivedSectors;
                    changed = true;
                }
            }
            
            // Ensure preferredPaymentModes has a default
            if (!profile.preferredPaymentModes || !Array.isArray(profile.preferredPaymentModes)) {
                profile.preferredPaymentModes = ['cash'];
                changed = true;
            }
        });
        
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
            console.log('Normalized users for matching');
        }
    }

    /**
     * Normalize companies for matching compatibility
     * Ensures industry (from sectors), financialCapacity, preferredPaymentModes are present
     */
    normalizeCompaniesForMatching() {
        const companies = this.storage.get(CONFIG.STORAGE_KEYS.COMPANIES) || [];
        let changed = false;
        
        companies.forEach(company => {
            if (!company.profile) return;
            const profile = company.profile;
            
            // Ensure industry is a fallback copy of sectors
            if (!profile.industry && profile.sectors && profile.sectors.length > 0) {
                profile.industry = [...profile.sectors];
                changed = true;
            }
            
            // Ensure preferredPaymentModes has a default
            if (!profile.preferredPaymentModes || !Array.isArray(profile.preferredPaymentModes)) {
                profile.preferredPaymentModes = ['cash'];
                changed = true;
            }
            
            // Ensure financialCapacity has a reasonable default based on company type
            if (profile.financialCapacity == null) {
                // Set default based on companyType
                const companyType = profile.companyType || '';
                if (companyType.toLowerCase().includes('large')) {
                    profile.financialCapacity = 100000000; // 100M SAR for large enterprises
                } else if (companyType.toLowerCase().includes('medium')) {
                    profile.financialCapacity = 25000000; // 25M SAR for medium enterprises
                } else {
                    profile.financialCapacity = 5000000; // 5M SAR for small/other
                }
                changed = true;
            }
        });
        
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.COMPANIES, companies);
            console.log('Normalized companies for matching');
        }
    }

    /**
     * Get storage key for a domain
     */
    getStorageKeyForDomain(domain) {
        const keyMap = {
            'users': CONFIG.STORAGE_KEYS.USERS,
            'companies': CONFIG.STORAGE_KEYS.COMPANIES,
            'opportunities': CONFIG.STORAGE_KEYS.OPPORTUNITIES,
            'applications': CONFIG.STORAGE_KEYS.APPLICATIONS,
            'matches': CONFIG.STORAGE_KEYS.MATCHES,
            'notifications': CONFIG.STORAGE_KEYS.NOTIFICATIONS,
            'connections': CONFIG.STORAGE_KEYS.CONNECTIONS,
            'messages': CONFIG.STORAGE_KEYS.MESSAGES,
            'audit': CONFIG.STORAGE_KEYS.AUDIT,
            'sessions': CONFIG.STORAGE_KEYS.SESSIONS,
            'contracts': CONFIG.STORAGE_KEYS.CONTRACTS,
            'negotiations': CONFIG.STORAGE_KEYS.NEGOTIATIONS,
            'reviews': CONFIG.STORAGE_KEYS.REVIEWS,
            'subscription_plans': CONFIG.STORAGE_KEYS.SUBSCRIPTION_PLANS,
            'subscriptions': CONFIG.STORAGE_KEYS.SUBSCRIPTIONS
        };
        return keyMap[domain];
    }
    
    /**
     * Load domain data from JSON file (for seeding/backup)
     */
    async loadDomainDataFromJSON(domain) {
        try {
            const response = await fetch(`${this.jsonDataPath}${domain}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${domain}.json`);
            }
            const jsonData = await response.json();
            return jsonData.data || [];
        } catch (error) {
            console.error(`Error loading ${domain} from JSON:`, error);
            return [];
        }
    }
    
    // User Operations
    async getUsers() {
        return this.storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
    }
    
    async getUserById(id) {
        const users = await this.getUsers();
        return users.find(u => u.id === id) || null;
    }
    
    // Get user or company by ID (checks both)
    async getUserOrCompanyById(id) {
        const user = await this.getUserById(id);
        if (user) return user;
        return await this.getCompanyById(id);
    }
    
    async getUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(u => u.email === email) || null;
    }
    
    // Get user or company by email (for login - checks both)
    async getUserOrCompanyByEmail(email) {
        const user = await this.getUserByEmail(email);
        if (user) return user;
        const companies = await this.getCompanies();
        return companies.find(c => c.email === email) || null;
    }
    
    async createUser(userData) {
        const users = await this.getUsers();
        const newUser = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        this.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
        return newUser;
    }
    
    async updateUser(id, updates) {
        const users = await this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        
        users[index] = {
            ...users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
        return users[index];
    }
    
    // Company Operations
    async getCompanies() {
        return this.storage.get(CONFIG.STORAGE_KEYS.COMPANIES) || [];
    }
    
    async getCompanyById(id) {
        const companies = await this.getCompanies();
        return companies.find(c => c.id === id) || null;
    }
    
    async getCompanyByEmail(email) {
        const companies = await this.getCompanies();
        return companies.find(c => c.email === email) || null;
    }

    async getCompanyMembers(companyId) {
        const users = await this.getUsers();
        return users.filter(u => u.companyId === companyId);
    }

    async getUserCompany(userId) {
        const user = await this.getUserById(userId);
        if (!user || !user.companyId) return null;
        return await this.getCompanyById(user.companyId);
    }

    async createCompany(companyData) {
        const companies = await this.getCompanies();
        const newCompany = {
            id: this.generateId(),
            ...companyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        companies.push(newCompany);
        this.storage.set(CONFIG.STORAGE_KEYS.COMPANIES, companies);
        return newCompany;
    }
    
    async updateCompany(id, updates) {
        const companies = await this.getCompanies();
        const index = companies.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        companies[index] = {
            ...companies[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.COMPANIES, companies);
        return companies[index];
    }
    
    async deleteCompany(id) {
        const companies = await this.getCompanies();
        const filtered = companies.filter(c => c.id !== id);
        this.storage.set(CONFIG.STORAGE_KEYS.COMPANIES, filtered);
        return true;
    }
    
    // Combined User/Company Operations (for People module)
    async getAllPeople() {
        const users = await this.getUsers();
        const companies = await this.getCompanies();
        return [...users, ...companies];
    }
    
    async getPersonById(id) {
        // Check users first
        const user = await this.getUserById(id);
        if (user) return user;
        // Then check companies
        return await this.getCompanyById(id);
    }
    
    // Session Operations
    async getSessions() {
        return this.storage.get(CONFIG.STORAGE_KEYS.SESSIONS) || [];
    }
    
    async createSession(userId, token) {
        const sessions = await this.getSessions();
        const session = {
            userId,
            token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + CONFIG.SESSION_DURATION).toISOString()
        };
        sessions.push(session);
        this.storage.set(CONFIG.STORAGE_KEYS.SESSIONS, sessions);
        return session;
    }
    
    async getSessionByToken(token) {
        const sessions = await this.getSessions();
        return sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date()) || null;
    }
    
    async deleteSession(token) {
        const sessions = await this.getSessions();
        const filtered = sessions.filter(s => s.token !== token);
        this.storage.set(CONFIG.STORAGE_KEYS.SESSIONS, filtered);
    }

    // Password reset tokens (POC: no email sent; token shown for testing)
    async createResetToken(email) {
        const tokens = this.storage.get(CONFIG.STORAGE_KEYS.RESET_TOKENS) || [];
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        const token = `${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
        tokens.push({ email, token, expiresAt });
        this.storage.set(CONFIG.STORAGE_KEYS.RESET_TOKENS, tokens);
        return { token, expiresAt };
    }

    async getResetTokenByToken(token) {
        const tokens = this.storage.get(CONFIG.STORAGE_KEYS.RESET_TOKENS) || [];
        const entry = tokens.find(t => t.token === token && new Date(t.expiresAt) > new Date());
        return entry || null;
    }

    async deleteResetToken(token) {
        const tokens = this.storage.get(CONFIG.STORAGE_KEYS.RESET_TOKENS) || [];
        const filtered = tokens.filter(t => t.token !== token);
        this.storage.set(CONFIG.STORAGE_KEYS.RESET_TOKENS, filtered);
    }
    
    // Opportunity Operations
    async getOpportunities() {
        return this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITIES) || [];
    }
    
    async getOpportunityById(id) {
        const opportunities = await this.getOpportunities();
        return opportunities.find(o => o.id === id) || null;
    }
    
    async createOpportunity(opportunityData) {
        const opportunities = await this.getOpportunities();
        const newOpportunity = {
            id: this.generateId(),
            ...opportunityData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        opportunities.push(newOpportunity);
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, opportunities);
        return newOpportunity;
    }
    
    async updateOpportunity(id, updates) {
        const opportunities = await this.getOpportunities();
        const index = opportunities.findIndex(o => o.id === id);
        if (index === -1) return null;
        
        opportunities[index] = {
            ...opportunities[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, opportunities);
        const updated = opportunities[index];

        // When publishing, trigger matching so match records are generated (any code path that sets status to published)
        if (updates.status === 'published') {
            const ms = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
            if (ms && typeof ms.findMatchesForOpportunity === 'function') {
                ms.findMatchesForOpportunity(id).catch(err => console.warn('Matching after publish:', err));
            }
        }
        return updated;
    }
    
    async deleteOpportunity(id) {
        const opportunities = await this.getOpportunities();
        const filtered = opportunities.filter(o => o.id !== id);
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, filtered);
        return true;
    }
    
    // Application Operations
    async getApplications() {
        return this.storage.get(CONFIG.STORAGE_KEYS.APPLICATIONS) || [];
    }
    
    async getApplicationById(id) {
        const applications = await this.getApplications();
        return applications.find(a => a.id === id) || null;
    }
    
    async createApplication(applicationData) {
        const applications = await this.getApplications();
        const newApplication = {
            id: this.generateId(),
            ...applicationData,
            status: CONFIG.APPLICATION_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        applications.push(newApplication);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, applications);
        return newApplication;
    }
    
    async updateApplication(id, updates) {
        const applications = await this.getApplications();
        const index = applications.findIndex(a => a.id === id);
        if (index === -1) return null;
        
        applications[index] = {
            ...applications[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, applications);
        return applications[index];
    }

    async getApplicationsByOpportunityId(opportunityId) {
        const applications = await this.getApplications();
        return applications.filter(a => a.opportunityId === opportunityId);
    }

    async getApplicationCountByOpportunityId(opportunityId) {
        const applications = await this.getApplicationsByOpportunityId(opportunityId);
        return applications.length;
    }

    // Contract Operations
    async getContracts() {
        return this.storage.get(CONFIG.STORAGE_KEYS.CONTRACTS) || [];
    }

    async getContractById(id) {
        const contracts = await this.getContracts();
        return contracts.find(c => c.id === id) || null;
    }

    async getContractByOpportunityId(opportunityId) {
        const contracts = await this.getContracts();
        return contracts.find(c => c.opportunityId === opportunityId) || null;
    }

    async getContractsByUserId(userId) {
        const contracts = await this.getContracts();
        return contracts.filter(c => c.creatorId === userId || c.contractorId === userId);
    }

    async createContract(contractData) {
        const contracts = await this.getContracts();
        const parties = contractData.parties || (contractData.creatorId && contractData.contractorId
            ? [{ userId: contractData.creatorId, role: 'creator', companyId: contractData.creatorCompanyId || null }, { userId: contractData.contractorId, role: 'contractor', companyId: contractData.contractorCompanyId || null }]
            : []);
        const agreedValue = contractData.agreedValue || null;
        const milestones = (contractData.milestones || []).map(m => ({
            id: m.id || this.generateId(),
            title: m.title,
            deliverables: m.deliverables,
            dueDate: m.dueDate,
            valueRelease: m.valueRelease || { cash: 0, equityVested: 0, barterDelivered: '' },
            status: m.status || 'pending'
        }));
        const newContract = {
            id: this.generateId(),
            opportunityId: contractData.opportunityId,
            applicationId: contractData.applicationId,
            negotiationId: contractData.negotiationId || null,
            creatorId: contractData.creatorId,
            contractorId: contractData.contractorId,
            scope: contractData.scope,
            paymentMode: contractData.paymentMode,
            duration: contractData.duration,
            parties,
            agreedValue,
            milestones,
            status: contractData.status || CONFIG.CONTRACT_STATUS.PENDING,
            signedAt: contractData.signedAt || null,
            paymentSchedule: contractData.paymentSchedule,
            equityVesting: contractData.equityVesting || null,
            profitShare: contractData.profitShare || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        contracts.push(newContract);
        this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
        return newContract;
    }

    async updateContract(id, updates) {
        const contracts = await this.getContracts();
        const index = contracts.findIndex(c => c.id === id);
        if (index === -1) return null;
        contracts[index] = {
            ...contracts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
        return contracts[index];
    }

    // Negotiation Operations (value exchange negotiation phase)
    async getNegotiations() {
        return this.storage.get(CONFIG.STORAGE_KEYS.NEGOTIATIONS) || [];
    }

    async getNegotiationById(id) {
        const list = await this.getNegotiations();
        return list.find(n => n.id === id) || null;
    }

    async getNegotiationsByOpportunityId(opportunityId) {
        const list = await this.getNegotiations();
        return list.filter(n => n.opportunityId === opportunityId);
    }

    async getNegotiationsByApplicationId(applicationId) {
        const list = await this.getNegotiations();
        return list.filter(n => n.applicationId === applicationId);
    }

    async createNegotiation(negotiationData) {
        const list = await this.getNegotiations();
        const newNegotiation = {
            id: this.generateId(),
            opportunityId: negotiationData.opportunityId,
            matchId: negotiationData.matchId || null,
            applicationId: negotiationData.applicationId,
            parties: negotiationData.parties || [],
            status: negotiationData.status || 'open',
            initialTerms: negotiationData.initialTerms || null,
            rounds: negotiationData.rounds || [],
            agreedTerms: negotiationData.agreedTerms || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        list.push(newNegotiation);
        this.storage.set(CONFIG.STORAGE_KEYS.NEGOTIATIONS, list);
        return newNegotiation;
    }

    async updateNegotiation(id, updates) {
        const list = await this.getNegotiations();
        const index = list.findIndex(n => n.id === id);
        if (index === -1) return null;
        list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.NEGOTIATIONS, list);
        return list[index];
    }

    // Review Operations (post-completion reputation)
    async getReviews() {
        return this.storage.get(CONFIG.STORAGE_KEYS.REVIEWS) || [];
    }

    async getReviewById(id) {
        const reviews = await this.getReviews();
        return reviews.find(r => r.id === id) || null;
    }

    async getReviewsByContractId(contractId) {
        const reviews = await this.getReviews();
        return reviews.filter(r => r.contractId === contractId);
    }

    async getReviewsByRevieweeId(revieweeId) {
        const reviews = await this.getReviews();
        return reviews.filter(r => r.revieweeId === revieweeId);
    }

    async getReviewByContractAndReviewer(contractId, reviewerId) {
        const reviews = await this.getReviews();
        return reviews.find(r => r.contractId === contractId && r.reviewerId === reviewerId) || null;
    }

    async createReview(reviewData) {
        const reviews = await this.getReviews();
        const newReview = {
            id: this.generateId(),
            ...reviewData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        reviews.push(newReview);
        this.storage.set(CONFIG.STORAGE_KEYS.REVIEWS, reviews);
        return newReview;
    }

    // Match Operations
    async getMatches() {
        return this.storage.get(CONFIG.STORAGE_KEYS.MATCHES) || [];
    }

    async getMatchesByOpportunityId(opportunityId) {
        const matches = await this.getMatches();
        return matches.filter(m => m.opportunityId === opportunityId);
    }
    
    async createMatch(matchData) {
        const matches = await this.getMatches();
        // Single canonical field for candidate: candidateId (prefer over userId)
        const candidateId = matchData.candidateId != null ? matchData.candidateId : matchData.userId;
        // Single canonical field for breakdown: criteria (prefer over matchReasons)
        const criteria = matchData.criteria != null ? matchData.criteria : matchData.matchReasons;
        const newMatch = {
            id: this.generateId(),
            opportunityId: matchData.opportunityId,
            candidateId,
            matchScore: matchData.matchScore,
            criteria: criteria || undefined,
            notified: matchData.notified === true,
            createdAt: new Date().toISOString()
        };
        matches.push(newMatch);
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, matches);
        return newMatch;
    }
    
    // Notification Operations
    async getNotifications(userId) {
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        return notifications.filter(n => n.userId === userId);
    }
    
    async createNotification(notificationData) {
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const newNotification = {
            id: this.generateId(),
            read: false,
            ...notificationData,
            createdAt: new Date().toISOString()
        };
        notifications.push(newNotification);
        this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, notifications);
        return newNotification;
    }
    
    async markNotificationRead(id) {
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].read = true;
            this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, notifications);
        }
    }

    // Connection Operations (user-to-user connections)
    async getConnections() {
        return this.storage.get(CONFIG.STORAGE_KEYS.CONNECTIONS) || [];
    }

    async getConnectionBetweenUsers(userIdA, userIdB) {
        const connections = await this.getConnections();
        return connections.find(c =>
            (c.fromUserId === userIdA && c.toUserId === userIdB) ||
            (c.fromUserId === userIdB && c.toUserId === userIdA)
        ) || null;
    }

    /** Returns connection status for current user viewing another user: 'none' | 'pending_sent' | 'pending_received' | 'accepted' */
    async getConnectionStatus(currentUserId, otherUserId) {
        if (currentUserId === otherUserId) return 'self';
        const conn = await this.getConnectionBetweenUsers(currentUserId, otherUserId);
        if (!conn) return 'none';
        if (conn.status === CONFIG.CONNECTION_STATUS.ACCEPTED) return 'accepted';
        if (conn.fromUserId === currentUserId) return 'pending_sent';
        return 'pending_received';
    }

    async getConnectionsForUser(userId, status = CONFIG.CONNECTION_STATUS.ACCEPTED) {
        const connections = await this.getConnections();
        return connections.filter(c =>
            (c.fromUserId === userId || c.toUserId === userId) && c.status === status
        );
    }

    async createConnection(fromUserId, toUserId) {
        const existing = await this.getConnectionBetweenUsers(fromUserId, toUserId);
        if (existing) return existing;
        const connections = await this.getConnections();
        const newConnection = {
            id: this.generateId(),
            fromUserId,
            toUserId,
            status: CONFIG.CONNECTION_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        connections.push(newConnection);
        this.storage.set(CONFIG.STORAGE_KEYS.CONNECTIONS, connections);
        return newConnection;
    }

    async updateConnection(id, updates) {
        const connections = await this.getConnections();
        const index = connections.findIndex(c => c.id === id);
        if (index === -1) return null;
        connections[index] = {
            ...connections[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.CONNECTIONS, connections);
        return connections[index];
    }

    async acceptConnection(connectionId) {
        return this.updateConnection(connectionId, { status: CONFIG.CONNECTION_STATUS.ACCEPTED });
    }

    async rejectConnection(connectionId) {
        return this.updateConnection(connectionId, { status: CONFIG.CONNECTION_STATUS.REJECTED });
    }

    /** Ensure a connection exists between two users and is accepted (creates and auto-accepts if needed). Returns the connection. */
    async ensureConnectionAccepted(userIdA, userIdB) {
        let conn = await this.getConnectionBetweenUsers(userIdA, userIdB);
        if (!conn) {
            conn = await this.createConnection(userIdA, userIdB);
        }
        if (conn.status !== CONFIG.CONNECTION_STATUS.ACCEPTED) {
            conn = await this.updateConnection(conn.id, { status: CONFIG.CONNECTION_STATUS.ACCEPTED });
        }
        return conn;
    }

    // Message Operations (1:1 messages between users)
    async getMessages() {
        return this.storage.get(CONFIG.STORAGE_KEYS.MESSAGES) || [];
    }

    async getMessagesBetween(userIdA, userIdB) {
        const messages = await this.getMessages();
        return messages
            .filter(m =>
                (m.senderId === userIdA && m.receiverId === userIdB) ||
                (m.senderId === userIdB && m.receiverId === userIdA)
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    async createMessage(senderId, receiverId, text) {
        const messages = await this.getMessages();
        const newMessage = {
            id: this.generateId(),
            senderId,
            receiverId,
            text: (text || '').trim(),
            read: false,
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        this.storage.set(CONFIG.STORAGE_KEYS.MESSAGES, messages);
        return newMessage;
    }

    async markMessagesAsRead(senderId, receiverId) {
        const messages = await this.getMessages();
        let changed = false;
        messages.forEach(m => {
            if (m.senderId === senderId && m.receiverId === receiverId && !m.read) {
                m.read = true;
                changed = true;
            }
        });
        if (changed) this.storage.set(CONFIG.STORAGE_KEYS.MESSAGES, messages);
    }

    /** Get list of conversation partners for a user (people they have messages with), with last message and unread count */
    async getConversationsForUser(userId) {
        const messages = await this.getMessages();
        const partnerMap = new Map(); // partnerId -> { partnerId, lastMessage, lastAt, unread }
        messages.forEach(m => {
            const isReceiver = m.receiverId === userId;
            const isSender = m.senderId === userId;
            const partnerId = isReceiver ? m.senderId : m.receiverId;
            if (!partnerMap.has(partnerId)) {
                partnerMap.set(partnerId, { partnerId, lastMessage: m.text, lastAt: m.createdAt, unread: 0 });
            }
            const entry = partnerMap.get(partnerId);
            if (new Date(m.createdAt) > new Date(entry.lastAt)) {
                entry.lastMessage = m.text;
                entry.lastAt = m.createdAt;
            }
            if (isReceiver && !m.read) entry.unread++;
        });
        
        // Also include connected people even if no messages yet
        const connections = await this.getConnectionsForUser(userId, CONFIG.CONNECTION_STATUS.ACCEPTED);
        connections.forEach(conn => {
            const partnerId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
            if (!partnerMap.has(partnerId)) {
                partnerMap.set(partnerId, { partnerId, lastMessage: null, lastAt: conn.updatedAt || conn.createdAt, unread: 0 });
            }
        });
        
        return Array.from(partnerMap.values()).sort((a, b) => {
            // Sort by last message time, or connection time if no messages
            const timeA = a.lastMessage ? new Date(a.lastAt) : new Date(0);
            const timeB = b.lastMessage ? new Date(b.lastAt) : new Date(0);
            return timeB - timeA;
        });
    }
    
    // Audit Log Operations
    async createAuditLog(logData) {
        const logs = this.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
        const newLog = {
            id: this.generateId(),
            ...logData,
            timestamp: new Date().toISOString()
        };
        logs.push(newLog);
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }
        this.storage.set(CONFIG.STORAGE_KEYS.AUDIT, logs);
        return newLog;
    }
    
    async getAuditLogs(filters = {}) {
        let logs = this.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
        
        if (filters.userId) {
            logs = logs.filter(l => l.userId === filters.userId);
        }
        if (filters.entityType) {
            logs = logs.filter(l => l.entityType === filters.entityType);
        }
        if (filters.startDate) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
        }
        
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Subscription Plan Operations
    async getSubscriptionPlans() {
        return this.storage.get(CONFIG.STORAGE_KEYS.SUBSCRIPTION_PLANS) || [];
    }

    async getPlanById(id) {
        const plans = await this.getSubscriptionPlans();
        return plans.find(p => p.id === id) || null;
    }

    async createPlan(planData) {
        const plans = await this.getSubscriptionPlans();
        const newPlan = {
            id: this.generateId(),
            name: planData.name || 'Unnamed',
            tier: planData.tier || 'basic',
            maxOpportunities: planData.maxOpportunities ?? 10,
            features: planData.features || {},
            isActive: planData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        plans.push(newPlan);
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTION_PLANS, plans);
        return newPlan;
    }

    async updatePlan(id, updates) {
        const plans = await this.getSubscriptionPlans();
        const index = plans.findIndex(p => p.id === id);
        if (index === -1) return null;
        plans[index] = {
            ...plans[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTION_PLANS, plans);
        return plans[index];
    }

    async deletePlan(id) {
        const plans = await this.getSubscriptionPlans();
        const filtered = plans.filter(p => p.id !== id);
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTION_PLANS, filtered);
        return true;
    }

    // Subscription (assignments) Operations
    async getSubscriptions() {
        return this.storage.get(CONFIG.STORAGE_KEYS.SUBSCRIPTIONS) || [];
    }

    async getSubscriptionsByUserId(userId) {
        const subs = await this.getSubscriptions();
        return subs.filter(s => !s.companyId && s.userId === userId);
    }

    async getSubscriptionsByCompanyId(companyId) {
        const subs = await this.getSubscriptions();
        return subs.filter(s => s.companyId === companyId);
    }

    async getSubscriptionById(id) {
        const subs = await this.getSubscriptions();
        return subs.find(s => s.id === id) || null;
    }

    async assignSubscription(entityId, planId, isCompany, options = {}) {
        const subs = await this.getSubscriptions();
        const now = new Date().toISOString();
        const startsAt = options.startsAt || now;
        const endsAt = options.endsAt || null;
        const newSub = {
            id: this.generateId(),
            userId: isCompany ? undefined : entityId,
            companyId: isCompany ? entityId : undefined,
            planId,
            startsAt,
            endsAt,
            status: options.status || 'active',
            createdAt: now,
            updatedAt: now
        };
        subs.push(newSub);
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, subs);
        return newSub;
    }

    async updateSubscription(id, updates) {
        const subs = await this.getSubscriptions();
        const index = subs.findIndex(s => s.id === id);
        if (index === -1) return null;
        subs[index] = {
            ...subs[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, subs);
        return subs[index];
    }

    async removeSubscription(id) {
        const subs = await this.getSubscriptions();
        const filtered = subs.filter(s => s.id !== id);
        this.storage.set(CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, filtered);
        return true;
    }
    
    // Utility Methods
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const dataService = new DataService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dataService;
} else {
    window.dataService = dataService;
}
