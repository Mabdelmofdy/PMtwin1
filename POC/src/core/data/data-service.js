import { enforceTransition } from "/core/workflow/workflow-engine.js";

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
        this.CURRENT_SEED_VERSION = '1.21.0'; // Deal vs Contract lifecycle: contract legal-only, milestones on deal, migration
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
                await this.mergeDemoData();
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
            
            // Merge demo40 users, companies, and opportunities so demo logins work (demo01@demo.test / demo123, etc.)
            await this.mergeDemoData();
            
            // Migrate legacy contracts to Deal/Contract lifecycle (synthetic deals for contracts without dealId)
            this.migrateContractsToDealContractLifecycle();
            
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
     * Merge demo-users.json, demo-companies.json, and demo-40-opportunities.json into stored data
     * so Demo40 accounts (demo01@demo.test / demo123, company01@demo.test / demo123) can log in.
     */
    async mergeDemoData() {
        const base = this.jsonDataPath;
        const mergeById = (existing, incoming) => {
            const byId = new Map((existing || []).map((x) => [x.id, x]));
            (incoming || []).forEach((r) => byId.set(r.id, r));
            return Array.from(byId.values());
        };
        try {
            const demoUsersRes = await fetch(`${base}demo-users.json`);
            if (demoUsersRes.ok) {
                const json = await demoUsersRes.json();
                if (json.data && json.data.length) {
                    const users = this.storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.USERS, mergeById(users, json.data));
                    console.log(`Merged ${json.data.length} demo users`);
                }
            }
            const demoPendingRes = await fetch(`${base}demo-pending-users.json`);
            if (demoPendingRes.ok) {
                const json = await demoPendingRes.json();
                if (json.data && json.data.length) {
                    const users = this.storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.USERS, mergeById(users, json.data));
                    console.log(`Merged ${json.data.length} demo pending users`);
                }
            }
            const demoCompaniesRes = await fetch(`${base}demo-companies.json`);
            if (demoCompaniesRes.ok) {
                const json = await demoCompaniesRes.json();
                if (json.data && json.data.length) {
                    const companies = this.storage.get(CONFIG.STORAGE_KEYS.COMPANIES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.COMPANIES, mergeById(companies, json.data));
                    console.log(`Merged ${json.data.length} demo companies`);
                }
            }
            const demoOppsRes = await fetch(`${base}demo-40-opportunities.json`);
            if (demoOppsRes.ok) {
                const json = await demoOppsRes.json();
                if (json.data && json.data.length) {
                    const opportunities = this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITIES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, mergeById(opportunities, json.data));
                    console.log(`Merged ${json.data.length} demo opportunities`);
                }
            }
            const demoAppsRes = await fetch(`${base}demo-applications.json`);
            if (demoAppsRes.ok) {
                const json = await demoAppsRes.json();
                if (json.data && json.data.length) {
                    const applications = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATIONS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, mergeById(applications, json.data));
                    console.log(`Merged ${json.data.length} demo applications`);
                }
            }
            const demoDealsRes = await fetch(`${base}demo-deals.json`);
            if (demoDealsRes.ok) {
                const json = await demoDealsRes.json();
                if (json.data && json.data.length) {
                    const deals = this.storage.get(CONFIG.STORAGE_KEYS.DEALS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.DEALS, mergeById(deals, json.data));
                    console.log(`Merged ${json.data.length} demo deals`);
                }
            }
            const demoContractsRes = await fetch(`${base}demo-contracts.json`);
            if (demoContractsRes.ok) {
                const json = await demoContractsRes.json();
                if (json.data && json.data.length) {
                    const contracts = this.storage.get(CONFIG.STORAGE_KEYS.CONTRACTS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, mergeById(contracts, json.data));
                    console.log(`Merged ${json.data.length} demo contracts`);
                }
            }
            const demoMatchesRes = await fetch(`${base}demo-matches.json`);
            if (demoMatchesRes.ok) {
                const json = await demoMatchesRes.json();
                if (json.data && json.data.length) {
                    const matches = this.storage.get(CONFIG.STORAGE_KEYS.MATCHES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, mergeById(matches, json.data));
                    console.log(`Merged ${json.data.length} demo matches`);
                }
            }
            const demoNotificationsRes = await fetch(`${base}demo-notifications.json`);
            if (demoNotificationsRes.ok) {
                const json = await demoNotificationsRes.json();
                if (json.data && json.data.length) {
                    const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, mergeById(notifications, json.data));
                    console.log(`Merged ${json.data.length} demo notifications`);
                }
            }
            const demoPostMatchesRes = await fetch(`${base}demo-post-matches.json`);
            if (demoPostMatchesRes.ok) {
                const json = await demoPostMatchesRes.json();
                if (json.data && json.data.length) {
                    const postMatches = this.storage.get(CONFIG.STORAGE_KEYS.POST_MATCHES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, mergeById(postMatches, json.data));
                    console.log(`Merged ${json.data.length} demo post matches`);
                }
            }
            const demoNegotiationsRes = await fetch(`${base}demo-negotiations.json`);
            if (demoNegotiationsRes.ok) {
                const json = await demoNegotiationsRes.json();
                if (json.data && json.data.length) {
                    const negotiations = this.storage.get(CONFIG.STORAGE_KEYS.NEGOTIATIONS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.NEGOTIATIONS, mergeById(negotiations, json.data));
                    console.log(`Merged ${json.data.length} demo negotiations`);
                }
            }
            const demoAppReqsRes = await fetch(`${base}demo-application-requirements.json`);
            if (demoAppReqsRes.ok) {
                const json = await demoAppReqsRes.json();
                if (json.data && json.data.length) {
                    const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS, mergeById(list, json.data));
                    console.log(`Merged ${json.data.length} application requirements`);
                }
            }
            const demoAppDelsRes = await fetch(`${base}demo-application-deliverables.json`);
            if (demoAppDelsRes.ok) {
                const json = await demoAppDelsRes.json();
                if (json.data && json.data.length) {
                    const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES, mergeById(list, json.data));
                    console.log(`Merged ${json.data.length} application deliverables`);
                }
            }
            const demoAppFilesRes = await fetch(`${base}demo-application-files.json`);
            if (demoAppFilesRes.ok) {
                const json = await demoAppFilesRes.json();
                if (json.data && json.data.length) {
                    const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_FILES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_FILES, mergeById(list, json.data));
                    console.log(`Merged ${json.data.length} application files`);
                }
            }
            const demoAppPayRes = await fetch(`${base}demo-application-payment-terms.json`);
            if (demoAppPayRes.ok) {
                const json = await demoAppPayRes.json();
                if (json.data && json.data.length) {
                    const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS, mergeById(list, json.data));
                    console.log(`Merged ${json.data.length} application payment terms`);
                }
            }
        } catch (e) {
            console.warn('Merge demo data failed (demo files may be missing):', e);
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
     * Migrate legacy contracts (no dealId) to Deal/Contract lifecycle: create synthetic deal,
     * move milestones to deal, set contract.dealId and contract.parties, remove contract.milestones.
     */
    migrateContractsToDealContractLifecycle() {
        const contracts = this.storage.get(CONFIG.STORAGE_KEYS.CONTRACTS) || [];
        const deals = this.storage.get(CONFIG.STORAGE_KEYS.DEALS) || [];
        let contractsChanged = false;
        let dealsChanged = false;
        const now = new Date().toISOString();
        for (const c of contracts) {
            if (c.dealId) continue;
            const parties = this.getContractParties(c);
            const signedAt = c.signedAt || null;
            const participants = parties.map(p => ({
                userId: p.userId,
                role: p.role || 'participant',
                approvalStatus: signedAt ? 'approved' : 'pending',
                signedAt: signedAt
            }));
            const legacyMilestones = c.milestones || [];
            const milestones = legacyMilestones.map(m => this.normalizeMilestone(m));
            const dealStatus = c.status === CONFIG.CONTRACT_STATUS.ACTIVE
                ? (milestones.length > 0 ? CONFIG.DEAL_STATUS.EXECUTION : CONFIG.DEAL_STATUS.ACTIVE)
                : c.status === CONFIG.CONTRACT_STATUS.COMPLETED || c.status === CONFIG.CONTRACT_STATUS.TERMINATED
                    ? CONFIG.DEAL_STATUS.CLOSED
                    : CONFIG.DEAL_STATUS.ACTIVE;
            const newDeal = {
                id: this.generateId(),
                matchId: null,
                applicationId: c.applicationId || null,
                opportunityId: c.opportunityId || null,
                matchType: 'one_way',
                status: dealStatus,
                title: (c.scope && c.scope.substring(0, 80)) || 'Deal',
                participants,
                opportunityIds: c.opportunityId ? [c.opportunityId] : [],
                scope: c.scope || '',
                timeline: { start: null, end: null },
                exchangeMode: c.paymentMode || 'cash',
                valueTerms: { agreedValue: c.agreedValue || null, paymentSchedule: c.paymentSchedule || '' },
                deliverables: '',
                milestones,
                negotiationId: null,
                contractId: c.id,
                createdAt: c.createdAt || now,
                updatedAt: now,
                completedAt: dealStatus === CONFIG.DEAL_STATUS.CLOSED ? now : null,
                closedAt: dealStatus === CONFIG.DEAL_STATUS.CLOSED ? now : null
            };
            deals.push(newDeal);
            dealsChanged = true;
            const contractParties = parties.map(p => ({ userId: p.userId, role: p.role || 'participant', signedAt: signedAt }));
            const idx = contracts.indexOf(c);
            contracts[idx] = {
                ...c,
                dealId: newDeal.id,
                parties: contractParties,
                milestones: undefined,
                updatedAt: now
            };
            delete contracts[idx].milestones;
            contractsChanged = true;
        }
        if (dealsChanged) this.storage.set(CONFIG.STORAGE_KEYS.DEALS, deals);
        if (contractsChanged) this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
        if (contractsChanged || dealsChanged) console.log('Migrated contracts to Deal/Contract lifecycle');
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
            'application_requirements': CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS,
            'application_deliverables': CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES,
            'application_files': CONFIG.STORAGE_KEYS.APPLICATION_FILES,
            'application_payment_terms': CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS,
            'matches': CONFIG.STORAGE_KEYS.MATCHES,
            'post_matches': CONFIG.STORAGE_KEYS.POST_MATCHES,
            'matching_runs': CONFIG.STORAGE_KEYS.MATCHING_RUNS,
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
        let opportunity = opportunities.find(o => o.id === id) || null;
        if (!opportunity && id && id.startsWith('demo-circ-0')) {
            const canonicalId = id.replace(/^demo-circ-0/, 'demo-circ-n');
            opportunity = opportunities.find(o => o.id === canonicalId) || null;
        }
        return opportunity;
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

        if (updates && updates.status != null && updates.status !== opportunities[index].status) {
            enforceTransition('opportunity', opportunities[index], updates.status);
        }
        
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
            if (ms && typeof ms.persistPostMatches === 'function') {
                ms.persistPostMatches(id).catch(err => console.warn('Post-match persistence after publish:', err));
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

    // Application Requirements (Section 4 — Requirements Match)
    async getApplicationRequirements(applicationId) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS) || [];
        return list.filter(r => r.applicationId === applicationId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    async createApplicationRequirement(data) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS) || [];
        const record = { id: this.generateId(), ...data, applicationId: data.applicationId };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS, list);
        return record;
    }

    async replaceApplicationRequirements(applicationId, items) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS) || [];
        const filtered = list.filter(r => r.applicationId !== applicationId);
        const newItems = (items || []).map((item, i) => ({
            id: this.generateId(),
            applicationId,
            requirementKey: item.requirementKey || ('req_' + i),
            requirementLabel: item.requirementLabel || 'Requirement',
            requiredValue: item.requiredValue,
            applicantMatch: item.applicantMatch || 'missing',
            applicantResponse: item.applicantResponse || null,
            sortOrder: i
        }));
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS, filtered.concat(newItems));
        return newItems;
    }

    async computeAndSaveRequirementsMatch(applicationId) {
        const application = await this.getApplicationById(applicationId);
        if (!application) return;
        const opportunity = await this.getOpportunityById(application.opportunityId);
        const applicant = await this.getUserById(application.applicantId) || await this.getCompanyById(application.applicantId);
        if (!opportunity || !applicant) return;
        const computed = this._computeRequirementsMatch(opportunity, applicant, application);
        if (computed.length) await this.replaceApplicationRequirements(applicationId, computed);
    }

    // Application Deliverables (Section 8)
    async getApplicationDeliverables(applicationId) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES) || [];
        return list.filter(d => d.applicationId === applicationId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    async createApplicationDeliverable(data) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES) || [];
        const record = { id: this.generateId(), ...data, applicationId: data.applicationId };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES, list);
        return record;
    }

    async replaceApplicationDeliverables(applicationId, items) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES) || [];
        const filtered = list.filter(d => d.applicationId !== applicationId);
        const newItems = (items || []).map((item, i) => ({
            id: this.generateId(),
            applicationId,
            title: typeof item === 'string' ? item : (item.title || ''),
            description: typeof item === 'string' ? null : (item.description || null),
            sortOrder: i
        }));
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES, filtered.concat(newItems));
        return newItems;
    }

    // Application Files (Section 9)
    async getApplicationFiles(applicationId) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_FILES) || [];
        return list.filter(f => f.applicationId === applicationId);
    }

    async createApplicationFile(data) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_FILES) || [];
        const record = { id: this.generateId(), ...data, applicationId: data.applicationId, uploadedAt: new Date().toISOString() };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_FILES, list);
        return record;
    }

    // Application Payment Terms (Section 6)
    async getApplicationPaymentTerms(applicationId) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS) || [];
        return list.filter(p => p.applicationId === applicationId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    async createApplicationPaymentTerm(data) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS) || [];
        const record = { id: this.generateId(), ...data, applicationId: data.applicationId };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS, list);
        return record;
    }

    /**
     * Get enriched application detail for the full Application Details View.
     * Returns application, applicant, opportunity, requirementsMatch, paymentTerms, deliverables, files, and match info.
     * @param {string} applicationId
     * @param {Object} [options] - { ownerId } to enforce owner check (optional)
     * @returns {Promise<Object|null>}
     */
    async getApplicationDetail(applicationId, options = {}) {
        const application = await this.getApplicationById(applicationId);
        if (!application) return null;

        const opportunity = await this.getOpportunityById(application.opportunityId);
        if (options.ownerId && opportunity && opportunity.creatorId !== options.ownerId) return null;

        const applicant = await this.getUserById(application.applicantId) || await this.getCompanyById(application.applicantId);
        const requirementsMatch = await this.getApplicationRequirements(applicationId);
        const paymentTerms = await this.getApplicationPaymentTerms(applicationId);
        const deliverables = await this.getApplicationDeliverables(applicationId);
        const files = await this.getApplicationFiles(applicationId);

        // Match record for AI breakdown (Section 2)
        const matches = await this.getMatches();
        const candidateId = application.applicantId;
        const match = matches.find(m => m.opportunityId === application.opportunityId && (m.candidateId === candidateId || m.userId === candidateId));
        let matchScore = application.matchScore != null ? application.matchScore : (match && match.matchScore != null ? match.matchScore : null);
        let matchBreakdown = application.matchBreakdown || null;
        if (!matchBreakdown && match && match.criteria) {
            const c = match.criteria;
            if (typeof c === 'object' && !Array.isArray(c)) {
                matchBreakdown = {
                    skillMatch: c.skillMatch ?? c.attributeOverlap ?? null,
                    budgetFit: c.budgetFit ?? (c.budget != null ? c.budget : null),
                    timelineFit: c.timelineFit ?? null,
                    locationFit: c.locationFit ?? null,
                    reputation: c.reputation ?? null
                };
            }
        }
        if (matchScore != null && matchBreakdown && typeof matchBreakdown.skillMatch !== 'number' && match && match.criteria && typeof match.criteria === 'object') {
            const cr = match.criteria;
            if (cr.skillMatch != null || cr.budgetFit != null || cr.timelineFit != null || cr.locationFit != null || cr.reputation != null) {
                matchBreakdown = {
                    skillMatch: cr.skillMatch ?? matchBreakdown.skillMatch,
                    budgetFit: cr.budgetFit ?? matchBreakdown.budgetFit,
                    timelineFit: cr.timelineFit ?? matchBreakdown.timelineFit,
                    locationFit: cr.locationFit ?? matchBreakdown.locationFit,
                    reputation: cr.reputation ?? matchBreakdown.reputation
                };
            }
        }

        // Prefer computed requirements match when we have opportunity + applicant so industry/sectors match correctly
        let requirementsMatchList = requirementsMatch;
        if (opportunity && applicant) {
            requirementsMatchList = await this._computeRequirementsMatch(opportunity, applicant, application);
        }

        return {
            application,
            applicant: applicant || null,
            opportunity: opportunity || null,
            requirementsMatch: requirementsMatchList,
            paymentTerms: paymentTerms.map(p => ({ type: p.type, details: p.details })),
            deliverables: deliverables.map(d => ({ id: d.id, title: d.title, description: d.description })),
            files: files.map(f => ({ id: f.id, fileType: f.fileType, fileName: f.fileName, fileUrl: f.fileUrl })),
            matchScore,
            matchBreakdown,
            matchType: application.matchType || (match && match.model) || null
        };
    }

    async _computeRequirementsMatch(opportunity, applicant, application) {
        const profile = applicant.profile || {};
        const scope = opportunity.scope || {};
        const attrs = opportunity.attributes || {};
        const requiredSkills = scope.requiredSkills || scope.offeredSkills || [];
        // Requirement match uses profile fields. Professionals: typically skills, specializations; may have primaryDomain, sectors.
        // Companies: sectors, primaryDomain, industry, plus skills/specializations if present. Aligned with matching-service skill list.
        const applicantSources = [].concat(
            profile.skills || [],
            profile.specializations || [],
            profile.primaryDomain ? [profile.primaryDomain] : [],
            profile.sectors || [],
            Array.isArray(profile.industry) ? profile.industry : (profile.industry ? [profile.industry] : [])
        ).filter(Boolean);
        const result = [];
        let sortOrder = 0;
        const svc = window.skillService || (typeof skillService !== 'undefined' ? skillService : null);
        let matchedByIndex = [];
        if (svc && requiredSkills.length > 0) {
            const normRequired = await svc.normalizeSkills(requiredSkills);
            const normApplicant = await svc.normalizeSkills(applicantSources);
            const candidateSet = new Set(normApplicant.map(s => String(s).toLowerCase()));
            matchedByIndex = normRequired.map(nr => candidateSet.has(String(nr).toLowerCase()));
        } else {
            const norm = (s) => String(s).toLowerCase().trim();
            const matchesRequirement = (required, sources) => {
                const r = norm(required);
                return sources.some(src => {
                    const s = norm(src);
                    return s === r || s.includes(r) || r.includes(s);
                });
            };
            matchedByIndex = requiredSkills.map(skill => matchesRequirement(skill, applicantSources));
        }
        requiredSkills.forEach((skill, i) => {
            const matched = matchedByIndex[i] === true;
            result.push({
                requirementKey: 'skill_' + String(skill).replace(/\s/g, '_'),
                requirementLabel: 'Required skill',
                requiredValue: skill,
                applicantMatch: matched ? 'match' : 'missing',
                applicantResponse: null,
                sortOrder: sortOrder++
            });
        });
        const expRequired = attrs.yearsExperience || attrs.experienceLevel || scope.experienceRequired;
        if (expRequired != null && String(expRequired).trim() !== '') {
            const years = profile.yearsExperience != null ? Number(profile.yearsExperience) : null;
            const expNum = typeof expRequired === 'number' ? expRequired : parseInt(String(expRequired).replace(/\D/g, ''), 10);
            const match = years != null && !isNaN(expNum) ? (years >= expNum ? 'match' : (years >= Math.floor(expNum * 0.5) ? 'partial' : 'missing')) : 'missing';
            result.push({
                requirementKey: 'experience',
                requirementLabel: 'Experience required',
                requiredValue: String(expRequired),
                applicantMatch: match,
                applicantResponse: years != null ? `${years} years` : null,
                sortOrder: sortOrder++
            });
        }
        return result;
    }

    // Contract Operations (legal agreement only; no milestones)
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

    async getContractByDealId(dealId) {
        const contracts = await this.getContracts();
        return contracts.find(c => c.dealId === dealId) || null;
    }

    /**
     * Returns normalized parties array for a contract (multi-party or legacy two-party).
     * Each party has { userId, role, signedAt }.
     */
    getContractParties(contract) {
        if (!contract) return [];
        if (contract.parties && Array.isArray(contract.parties) && contract.parties.length > 0) {
            return contract.parties.map(p => ({
                userId: p.userId,
                role: p.role || 'participant',
                signedAt: p.signedAt || null
            }));
        }
        const legacy = [];
        if (contract.creatorId) legacy.push({ userId: contract.creatorId, role: 'creator', signedAt: contract.signedAt || null });
        if (contract.contractorId) legacy.push({ userId: contract.contractorId, role: 'contractor', signedAt: contract.signedAt || null });
        return legacy;
    }

    async getContractsByUserId(userId) {
        const contracts = await this.getContracts();
        return contracts.filter(c => this.getContractParties(c).some(p => p.userId === userId));
    }

    async createContract(contractData) {
        const contracts = await this.getContracts();
        const partiesInput = contractData.parties;
        if (!partiesInput || !Array.isArray(partiesInput) || partiesInput.length === 0) {
            throw new Error('createContract requires a non-empty parties array');
        }
        const parties = partiesInput.map(p => ({
            userId: p.userId,
            role: p.role || 'participant',
            signedAt: p.signedAt || null
        }));
        const newContract = {
            id: this.generateId(),
            dealId: contractData.dealId || null,
            opportunityId: contractData.opportunityId || null,
            applicationId: contractData.applicationId || null,
            parties,
            scope: contractData.scope || '',
            paymentMode: contractData.paymentMode || 'cash',
            agreedValue: contractData.agreedValue || null,
            duration: contractData.duration || '',
            paymentSchedule: contractData.paymentSchedule || null,
            equityVesting: contractData.equityVesting || null,
            profitShare: contractData.profitShare || null,
            milestonesSnapshot: contractData.milestonesSnapshot || null,
            status: contractData.status || CONFIG.CONTRACT_STATUS.PENDING,
            signedAt: contractData.signedAt || null,
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

        if (updates && updates.status != null && updates.status !== contracts[index].status) {
            enforceTransition('contract', contracts[index], updates.status);
        }

        contracts[index] = {
            ...contracts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
        return contracts[index];
    }

    // Deal Operations (post-matching collaboration workflow)
    async getDeals() {
        return this.storage.get(CONFIG.STORAGE_KEYS.DEALS) || [];
    }

    async getDealById(id) {
        const deals = await this.getDeals();
        return deals.find(d => d.id === id) || null;
    }

    async getDealByMatchId(matchId) {
        const deals = await this.getDeals();
        return deals.find(d => d.matchId === matchId) || null;
    }

    async getDealByApplicationId(applicationId) {
        const deals = await this.getDeals();
        return deals.find(d => d.applicationId === applicationId) || null;
    }

    async getDealByOpportunityId(opportunityId) {
        const deals = await this.getDeals();
        return deals.find(d => d.opportunityId === opportunityId || (d.opportunityIds && d.opportunityIds.includes(opportunityId))) || null;
    }

    async getDealsByUserId(userId) {
        const deals = await this.getDeals();
        return deals.filter(d => (d.participants || []).some(p => p.userId === userId));
    }

    normalizeMilestone(m) {
        const now = new Date().toISOString();
        const status = m.status === 'completed' ? 'approved' : (m.status || 'pending');
        return {
            id: m.id || this.generateId(),
            title: m.title || '',
            description: m.description || '',
            dueDate: m.dueDate || null,
            status: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'].includes(status) ? status : 'pending',
            deliverables: m.deliverables || '',
            createdAt: m.createdAt || now,
            updatedAt: m.updatedAt || now,
            submittedAt: m.submittedAt || null,
            approvedAt: m.approvedAt || null,
            approvedBy: m.approvedBy || null
        };
    }

    async createDeal(dealData) {
        const deals = await this.getDeals();
        const participants = (dealData.participants || []).map(p => ({
            userId: p.userId,
            role: p.role || 'participant',
            approvalStatus: p.approvalStatus || 'pending',
            signedAt: p.signedAt || null
        }));
        const milestones = (dealData.milestones || []).map(m => this.normalizeMilestone(m));
        const newDeal = {
            id: this.generateId(),
            matchId: dealData.matchId || null,
            applicationId: dealData.applicationId || null,
            opportunityId: dealData.opportunityId || (dealData.opportunityIds && dealData.opportunityIds[0]) || null,
            matchType: dealData.matchType || 'one_way',
            status: dealData.status || CONFIG.DEAL_STATUS.NEGOTIATING,
            title: dealData.title || 'Deal',
            participants,
            opportunityIds: dealData.opportunityIds || [],
            payload: dealData.payload != null ? dealData.payload : null,
            roleSlots: dealData.roleSlots != null ? dealData.roleSlots : null,
            scope: dealData.scope || '',
            timeline: dealData.timeline || { start: null, end: null },
            exchangeMode: dealData.exchangeMode || 'cash',
            valueTerms: dealData.valueTerms || { agreedValue: null, paymentSchedule: '' },
            deliverables: dealData.deliverables || '',
            milestones,
            negotiationId: dealData.negotiationId || null,
            contractId: dealData.contractId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: dealData.completedAt || null,
            closedAt: dealData.closedAt || null
        };
        deals.push(newDeal);
        this.storage.set(CONFIG.STORAGE_KEYS.DEALS, deals);
        return newDeal;
    }

    async updateDeal(id, updates) {
        const deals = await this.getDeals();
        const index = deals.findIndex(d => d.id === id);
        if (index === -1) return null;

        if (updates && updates.status != null && updates.status !== deals[index].status) {
            enforceTransition('deal', deals[index], updates.status);
        }

        if (updates.milestones && Array.isArray(updates.milestones)) {
            updates.milestones = updates.milestones.map(m => this.normalizeMilestone(m));
        }
        deals[index] = {
            ...deals[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.DEALS, deals);
        return deals[index];
    }

    async addDealMilestone(dealId, milestoneData) {
        const deal = await this.getDealById(dealId);
        if (!deal) return null;
        const now = new Date().toISOString();
        const milestone = this.normalizeMilestone({
            ...milestoneData,
            createdAt: now,
            updatedAt: now
        });
        const milestones = [...(deal.milestones || []), milestone];
        return this.updateDeal(dealId, { milestones });
    }

    async updateDealMilestone(dealId, milestoneId, updates) {
        const deal = await this.getDealById(dealId);
        if (!deal || !deal.milestones) return null;
        const index = deal.milestones.findIndex(m => m.id === milestoneId);
        if (index === -1) return null;
        const milestones = [...deal.milestones];
        milestones[index] = this.normalizeMilestone({ ...milestones[index], ...updates, updatedAt: new Date().toISOString() });
        return this.updateDeal(dealId, { milestones });
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

    async getNegotiationsByMatchId(matchId) {
        const list = await this.getNegotiations();
        return list.filter(n => n.matchId === matchId);
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

    // PostMatch Operations (user-facing post-to-post match discovery)
    async getPostMatches() {
        return this.storage.get(CONFIG.STORAGE_KEYS.POST_MATCHES) || [];
    }

    async getPostMatchById(matchId) {
        const list = await this.getPostMatches();
        return list.find(m => m.id === matchId) || null;
    }

    async getPostMatchesForUser(userId) {
        const list = await this.getPostMatches();
        return list.filter(m =>
            (m.participants || []).some(p => p.userId === userId)
        );
    }

    async getPostMatchesByType(userId, matchType) {
        const list = await this.getPostMatchesForUser(userId);
        return list.filter(m => m.matchType === matchType);
    }

    // Matching run tracking (lightweight history)
    async getMatchingRuns() {
        return this.storage.get(CONFIG.STORAGE_KEYS.MATCHING_RUNS) || [];
    }

    async getMatchingRunsForOpportunity(opportunityId) {
        const list = await this.getMatchingRuns();
        return list.filter(r => r.opportunityId === opportunityId);
    }

    async createMatchingRun(data) {
        const list = await this.getMatchingRuns();
        const record = {
            id: this.generateId(),
            opportunityId: data && data.opportunityId ? data.opportunityId : null,
            model: data && data.model ? data.model : null,
            createdAt: new Date().toISOString()
        };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHING_RUNS, list);
        return record;
    }

    _postMatchSignature(record) {
        const type = record.matchType || '';
        const parts = (record.participants || []).map(p => `${p.userId}:${p.opportunityId || ''}`).sort();
        const payloadKeys = record.payload ? Object.keys(record.payload).sort() : [];
        const oppIds = payloadKeys
            .filter(k => k.endsWith('Id') || k === 'cycle' || k === 'roles' || k === 'links')
            .map(k => (record.payload[k] && typeof record.payload[k] === 'object' && !Array.isArray(record.payload[k]))
                ? JSON.stringify(record.payload[k])
                : (record.payload[k] || ''));
        return `${type}:${parts.join('|')}:${oppIds.join(',')}`;
    }

    _postMatchStrongKey(record) {
        if (!record || !record.matchType) return null;
        const type = record.matchType;
        const payload = record.payload || {};

        if (type === 'one_way') {
            const needId = payload.needOpportunityId;
            const offerId = payload.offerOpportunityId;
            if (!needId || !offerId) return null;
            return `one_way:${needId}:${offerId}`;
        }

        if (type === 'two_way') {
            const a = payload.sideA || {};
            const b = payload.sideB || {};
            const side = (s) => ({
                needId: s.needId || '',
                offerId: s.offerId || ''
            });
            const sa = side(a);
            const sb = side(b);
            const keyA = `${sa.needId}:${sa.offerId}`;
            const keyB = `${sb.needId}:${sb.offerId}`;
            const ordered = [keyA, keyB].sort();
            // Even if some ids are missing, this still improves dedupe vs signature-only.
            return `two_way:${ordered[0]}|${ordered[1]}`;
        }

        if (type === 'consortium') {
            const leadNeedId = payload.leadNeedId;
            const roles = Array.isArray(payload.roles) ? payload.roles : [];
            if (!leadNeedId || !roles.length) return null;
            const assignments = roles
                .map(r => `${r.role || ''}:${r.userId || ''}:${r.opportunityId || ''}`)
                .sort();
            return `consortium:${leadNeedId}:${assignments.join('|')}`;
        }

        if (type === 'circular') {
            const cycle = Array.isArray(payload.cycle) ? payload.cycle : [];
            if (!cycle.length) return null;
            const participants = [...new Set(cycle.filter(Boolean))].sort();
            const links = Array.isArray(payload.links) ? payload.links : [];
            const linkKeys = links
                .map(l => `${l.fromCreatorId || l.from || ''}:${l.toCreatorId || l.to || ''}:${l.offerId || ''}:${l.needId || ''}`)
                .sort();
            return `circular:${participants.join(',')}:${linkKeys.join('|')}`;
        }

        return null;
    }

    async createPostMatch(data) {
        const list = await this.getPostMatches();
        const isReplacement = !!data.isReplacement;
        const newRecord = {
            id: this.generateId(),
            matchType: data.matchType || 'one_way',
            status: data.status || CONFIG.POST_MATCH_STATUS.PENDING,
            matchScore: data.matchScore != null ? data.matchScore : 0,
            participants: Array.isArray(data.participants) ? data.participants : [],
            payload: data.payload != null ? data.payload : {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: data.expiresAt || null,
            isReplacement: isReplacement || false,
            replacementDealId: data.replacementDealId || null,
            replacementRole: data.replacementRole || null,
            replacementPayload: data.replacementPayload || null
        };
        if (!isReplacement) {
            const strongKey = this._postMatchStrongKey(newRecord);
            if (strongKey) {
                const duplicateStrong = list.some(m => !m.isReplacement && this._postMatchStrongKey(m) === strongKey);
                if (duplicateStrong) return null;
            }
            const sig = this._postMatchSignature(newRecord);
            const duplicateSig = list.some(m => !m.isReplacement && this._postMatchSignature(m) === sig);
            if (duplicateSig) return null;
        } else {
            const dup = list.some(m => m.isReplacement && m.replacementDealId === newRecord.replacementDealId &&
                (m.participants || []).some(p => p.userId === (newRecord.participants && newRecord.participants[0] && newRecord.participants[0].userId)));
            if (dup) return null;
        }
        list.push(newRecord);
        this.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, list);
        const flatOppIds = [newRecord.payload && newRecord.payload.leadNeedId, newRecord.payload && newRecord.payload.needOpportunityId, newRecord.payload && newRecord.payload.offerOpportunityId].concat((newRecord.payload && newRecord.payload.roles) ? newRecord.payload.roles.map(r => r.opportunityId) : []).filter(Boolean);
        try {
            await this.createAuditLog({
                userId: (newRecord.participants && newRecord.participants[0] && newRecord.participants[0].userId) || 'system',
                action: 'match_created',
                entityType: 'match',
                entityId: newRecord.id,
                details: { matchType: newRecord.matchType, opportunityIds: flatOppIds.length ? flatOppIds : undefined }
            });
        } catch (e) { /* non-fatal */ }
        return newRecord;
    }

    async updatePostMatch(matchId, updates) {
        const list = await this.getPostMatches();
        const index = list.findIndex(m => m.id === matchId);
        if (index === -1) return null;
        list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, list);
        return list[index];
    }

    async updatePostMatchStatus(matchId, userId, newStatus) {
        const match = await this.getPostMatchById(matchId);
        if (!match || !match.participants) return null;

        const participants = match.participants.map(p =>
            p.userId === userId
                ? { ...p, participantStatus: newStatus, respondedAt: new Date().toISOString() }
                : { ...p }
        );
        const allAccepted = participants.every(p => (p.participantStatus || '').toLowerCase() === 'accepted');
        const anyDeclined = participants.some(p => (p.participantStatus || '').toLowerCase() === 'declined');
        const status = anyDeclined
            ? CONFIG.POST_MATCH_STATUS.DECLINED
            : (allAccepted ? CONFIG.POST_MATCH_STATUS.CONFIRMED : CONFIG.POST_MATCH_STATUS.PENDING);

        if (status !== match.status) {
            enforceTransition('post_match', match, status);
        }

        const updated = await this.updatePostMatch(matchId, { participants, status });
        return updated;
    }

    async declinePostMatch(matchId, userId) {
        return this.updatePostMatchStatus(matchId, userId, CONFIG.POST_MATCH_PARTICIPANT_STATUS.DECLINED);
    }

    getPostMatchesByReplacementDealId(dealId) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.POST_MATCHES) || [];
        return list.filter(m => m.isReplacement && m.replacementDealId === dealId);
    }

    /**
     * Get missing role for a dropped participant from deal.roleSlots or deal.payload.roles.
     */
    getMissingRoleFromDeal(deal, droppedUserId) {
        if (deal.roleSlots && typeof deal.roleSlots === 'object') {
            if (deal.roleSlots[droppedUserId]) return deal.roleSlots[droppedUserId];
            const arr = Array.isArray(deal.roleSlots) ? deal.roleSlots : Object.entries(deal.roleSlots).map(([uid, role]) => ({ userId: uid, role }));
            const entry = arr.find(e => e.userId === droppedUserId);
            if (entry && entry.role) return entry.role;
        }
        const roles = (deal.payload && deal.payload.roles) || [];
        const r = roles.find(x => x.userId === droppedUserId);
        return (r && r.role) || null;
    }

    /**
     * Check if consortium deal is viable for replacement (lead present, min participants, stage allowed).
     */
    isConsortiumDealViable(deal) {
        if ((deal.matchType || '') !== 'consortium') return false;
        const allowed = CONFIG.MATCHING.CONSORTIUM_REPLACEMENT_ALLOWED_STAGES;
        if (Array.isArray(allowed) && !allowed.includes(deal.status)) return false;
        const participants = deal.participants || [];
        const active = participants.filter(p => (p.status || 'active') !== 'dropped');
        const hasLead = active.some(p => (p.role || '') === 'consortium_lead');
        if (!hasLead) return false;
        const min = CONFIG.MATCHING.CONSORTIUM_MIN_PARTICIPANTS != null ? CONFIG.MATCHING.CONSORTIUM_MIN_PARTICIPANTS : 2;
        return active.length >= min;
    }

    /**
     * Mark a participant as dropped and return deal, missing role, and viability.
     */
    async markDealParticipantDropped(dealId, userId) {
        const deal = await this.getDealById(dealId);
        if (!deal || !deal.participants) return { deal: null, missingRole: null, viable: false };
        const participants = deal.participants.map(p =>
            p.userId === userId
                ? { ...p, status: 'dropped', droppedAt: new Date().toISOString() }
                : { ...p }
        );
        await this.updateDeal(dealId, { participants });
        const updated = await this.getDealById(dealId);
        const missingRole = this.getMissingRoleFromDeal(updated, userId);
        const viable = this.isConsortiumDealViable(updated);
        return { deal: updated, missingRole: missingRole || 'General', viable };
    }

    /**
     * Add a new party to an existing contract (amendment for replacement); new party has signedAt: null.
     */
    async amendContractAddParty(contractId, party) {
        const contracts = await this.getContracts();
        const index = contracts.findIndex(c => c.id === contractId);
        if (index === -1) return null;
        const contract = contracts[index];
        const parties = [...(contract.parties || []), { userId: party.userId, role: party.role || 'consortium_member', signedAt: null }];
        contracts[index] = { ...contract, parties, updatedAt: new Date().toISOString() };
        this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);
        return contracts[index];
    }

    /**
     * Accept a replacement PostMatch: add user to deal, set replacedByUserId on dropped participant, amend contract if present, log.
     */
    async acceptReplacementPostMatch(matchId, userId) {
        const match = await this.getPostMatchById(matchId);
        if (!match || !match.isReplacement || !match.replacementDealId) return null;
        const deal = await this.getDealById(match.replacementDealId);
        if (!deal) return null;
        const replacementParticipant = (match.participants || []).find(p => p.userId === userId);
        if (!replacementParticipant) return null;
        const participants = (deal.participants || []).map(p =>
            p.status === 'dropped' && !p.replacedByUserId
                ? { ...p, replacedByUserId: userId }
                : p
        );
        const newParticipant = {
            userId: replacementParticipant.userId,
            role: replacementParticipant.role || 'consortium_member',
            opportunityId: replacementParticipant.opportunityId || null,
            approvalStatus: 'pending',
            signedAt: null
        };
        if (participants.some(p => p.userId === userId)) return deal;
        participants.push(newParticipant);
        await this.updateDeal(deal.id, { participants });
        if (deal.contractId) {
            await this.amendContractAddParty(deal.contractId, { userId: newParticipant.userId, role: newParticipant.role });
        }
        const dropped = (deal.participants || []).find(p => p.status === 'dropped');
        await this.createAuditLog({
            userId,
            action: 'replacement_accepted',
            entityType: 'deal',
            entityId: deal.id,
            details: { matchId, replacementRole: match.replacementRole, droppedUserId: dropped && dropped.userId }
        });
        return await this.getDealById(deal.id);
    }

    /**
     * Create a replacement PostMatch for the given candidate and deal (after a participant was dropped).
     */
    async createReplacementPostMatch(dealId, candidate, missingRole, droppedUserId) {
        const leadNeedId = (await this.getDealById(dealId)).opportunityId || ((await this.getDealById(dealId)).opportunityIds && (await this.getDealById(dealId)).opportunityIds[0]);
        const participants = [{
            userId: candidate.userId,
            opportunityId: candidate.opportunityId || null,
            role: 'consortium_member',
            participantStatus: 'pending',
            respondedAt: null
        }];
        const payload = {
            leadNeedId: leadNeedId || null,
            roles: [{ role: missingRole, opportunityId: candidate.opportunityId, userId: candidate.userId, score: candidate.matchScore }]
        };
        const postMatch = await this.createPostMatch({
            matchType: 'consortium',
            status: CONFIG.POST_MATCH_STATUS.PENDING,
            matchScore: candidate.matchScore != null ? candidate.matchScore : 0,
            participants,
            payload,
            isReplacement: true,
            replacementDealId: dealId,
            replacementRole: missingRole,
            replacementPayload: { droppedUserId, droppedAt: new Date().toISOString() }
        });
        if (postMatch) {
            await this.createAuditLog({
                userId: droppedUserId,
                action: 'replacement_invited',
                entityType: 'deal',
                entityId: dealId,
                details: { matchId: postMatch.id, invitedUserId: candidate.userId, replacementRole: missingRole }
            });
        }
        return postMatch;
    }

    /**
     * Invite next replacement candidate after a decline. Returns new PostMatch or null if no more candidates or max attempts reached.
     * @param {string} matchId - Declined replacement match id
     * @param {string} [declinedByUserId] - User who declined (for audit log)
     */
    async inviteNextReplacementCandidate(matchId, declinedByUserId) {
        const match = await this.getPostMatchById(matchId);
        if (!match || !match.isReplacement || !match.replacementDealId) return null;
        const dealId = match.replacementDealId;
        const deal = await this.getDealById(dealId);
        if (!deal) return null;
        const replacementMatches = this.getPostMatchesByReplacementDealId(dealId);
        const maxAttempts = CONFIG.MATCHING.MAX_REPLACEMENT_ATTEMPTS != null ? CONFIG.MATCHING.MAX_REPLACEMENT_ATTEMPTS : 5;
        if (replacementMatches.length >= maxAttempts) return null;
        const missingRole = match.replacementRole || 'General';
        const droppedParticipant = (deal.participants || []).find(p => p.status === 'dropped' && !p.replacedByUserId);
        const droppedUserId = droppedParticipant ? droppedParticipant.userId : null;
        const excludeUserIds = (deal.participants || []).map(p => p.userId);
        const matchingService = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
        if (!matchingService || typeof matchingService.findReplacementCandidatesForRole !== 'function') return null;
        const leadNeedId = deal.opportunityId || (deal.opportunityIds && deal.opportunityIds[0]);
        if (!leadNeedId) return null;
        const { candidates } = await matchingService.findReplacementCandidatesForRole(leadNeedId, missingRole, { excludeUserIds, topN: maxAttempts });
        const alreadyInvited = new Set((replacementMatches || []).flatMap(m => (m.participants || []).map(p => p.userId)));
        const next = (candidates || []).find(c => !alreadyInvited.has(c.userId));
        if (!next) return null;
        await this.createAuditLog({
            userId: declinedByUserId || droppedUserId || '',
            action: 'replacement_declined',
            entityType: 'deal',
            entityId: dealId,
            details: { matchId }
        });
        return await this.createReplacementPostMatch(dealId, next, missingRole, droppedUserId);
    }

    /**
     * Log participant drop (call after markDealParticipantDropped when initiating replacement flow).
     */
    async logParticipantDropped(dealId, userId, reason) {
        return this.createAuditLog({
            userId,
            action: 'participant_dropped',
            entityType: 'deal',
            entityId: dealId,
            details: { droppedUserId: userId, reason: reason || 'dropped' }
        });
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
