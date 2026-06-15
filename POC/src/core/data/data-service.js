import { enforceTransition } from "/core/workflow/workflow-engine.js";
import { PMTWIN_EVENTS, emitDataChange } from "../events/event-bus.js";
import {
    createDealFromMatch as buildDealPayloadFromMatch,
    buildDealPayloadFromApplication
} from "../../utils/deals.js";
import {
    canCreateDealFromApplication,
    canCreateDealFromNegotiation
} from "../../services/matching/deal-lifecycle.js";
import {
    pickActiveInvitation,
    isActiveInvitation
} from "../../services/matching/opportunity-invitation-tracking.js";
import {
    isActiveNegotiation,
    isTerminalNegotiation,
    buildFinalAgreedSnapshot,
    getNegotiationRequiredParticipantIds,
    hasParticipantAgreed,
    allRequiredParticipantsAgreed
} from "../../services/matching/negotiation-lifecycle.js";
import {
    mergeProposalTerms,
    getEffectiveTerms
} from "../../services/matching/negotiation-terms.js";
import {
    isActiveDispute,
    negotiationFormalActionsFrozen,
    DISPUTE_STATUS,
    RESOLUTION_OUTCOMES
} from "../../services/matching/dispute-lifecycle.js";
import {
    getNotificationPrefs,
    shouldDeliverEmail,
    appendDeliveryLog
} from "../../services/notifications/notification-delivery.js";
import {
    isTerminalInvitationStatus,
    shouldExpireInvitation,
    computeDefaultInvitationExpiresAt
} from "../../services/matching/opportunity-invitation-lifecycle.js";
import { normalizeAuditAction } from "../../services/matching/lifecycle-constants.js";
import {
    isReplacementEligibleMatchType,
    buildReplacementSlotKey,
    getReplacementRequestStatusLabel,
    invitationAcceptsActor
} from "../../services/matching/replacement-lifecycle.js";
import {
    PERMISSION_ERRORS,
    assertMatchParticipant,
    assertMatchOwner,
    assertReplacementOwnerOrAdmin,
    assertNotReadOnlyAdmin,
    assertAdminMatchingPersist,
    assertAdminMatchingRead,
    buildLifecycleAuditDetails,
    auditLogMatchesDealOrOpportunity,
    hasRecentDuplicateNotification,
    notificationDedupeKey
} from "../../services/matching/matching-lifecycle-permissions.js";

function _runWindowValidator(fnName, data, options) {
    const fn = typeof window !== 'undefined' ? window[fnName] : null;
    if (typeof fn !== 'function') return;
    const result = fn(data, options);
    if (result && !result.isValid) {
        throw new Error(result.errors[0] || 'Validation failed');
    }
}

function _opportunityUpdateTouchesDates(updates) {
    if (!updates || typeof updates !== 'object') return false;
    const dateKeys = ['startDate', 'endDate', 'applicationDeadline'];
    if (dateKeys.some((key) => updates[key] !== undefined)) return true;
    if (updates.attributes && dateKeys.some((key) => updates.attributes[key] !== undefined)) return true;
    if (updates.timeline) return true;
    return false;
}

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
        this.CURRENT_SEED_VERSION = '2.2.1'; // clamp inflated post_match scores; refreshed demo-post-matches
    }
    
    /**
     * Get the data path using centralized BASE_PATH
     */
    get jsonDataPath() {
        return (window.CONFIG?.BASE_PATH || '') + 'data/';
    }

    /**
     * Block portal mutations for pending-approval accounts (central guard — GAP-P01).
     * No-op when authService is unavailable (e.g. unit tests) or options skip the check.
     * @param {{ skipPendingCheck?: boolean, internal?: boolean, adminAction?: boolean }} [options]
     */
    _assertPortalCanMutate(options = {}) {
        if (options.skipPendingCheck || options.internal || options.adminAction) return;
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (auth && typeof auth.assertCanMutate === 'function') {
            auth.assertCanMutate(options);
        }
    }

    /** Block write operations for auditor (read-only admin) accounts — GAP-P10. */
    _assertNotAuditorWrite(options = {}) {
        if (options.skipAuditorCheck || options.internal) return;
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (auth && typeof auth.isReadOnlyAdmin === 'function' && auth.isReadOnlyAdmin()) {
            throw new Error(PERMISSION_ERRORS.READ_ONLY_AUDITOR);
        }
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
                this.normalizePostMatchScores();
                this.initialized = true;
                return;
            }
            
            console.log('Initializing data from JSON seed files...');
            
            // Clear existing data if re-seeding
            if (storedVersion && storedVersion !== this.CURRENT_SEED_VERSION) {
                console.log('Seed version changed, clearing old data...');
                this.clearAllData();
            }
            
            // Load from JSON files (legacy matches.json skipped when person-to-opportunity matching is off)
            const domains = ['users', 'companies', 'opportunities', 'applications', 'notifications', 'connections', 'messages', 'audit', 'sessions', 'contracts', 'reviews'];
            if (this._isLegacyPersonOpportunityEnabled()) {
                domains.splice(4, 0, 'matches');
            }
            
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
            this.normalizePostMatchScores();
            
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
        /** Demo merge runs on every load; preserve local read flags so "mark read" survives refresh. */
        const mergeNotificationsById = (existing, incoming) => {
            const byId = new Map((existing || []).map((x) => [x.id, { ...x }]));
            (incoming || []).forEach((r) => {
                const prev = byId.get(r.id);
                if (prev) {
                    const read = prev.read === true || r.read === true;
                    byId.set(r.id, { ...r, read });
                } else {
                    byId.set(r.id, { ...r });
                }
            });
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
            const seedUsersRes = await fetch(`${base}seed-controlled-users.json`);
            if (seedUsersRes.ok) {
                const json = await seedUsersRes.json();
                if (json.data && json.data.length) {
                    const users = this.storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.USERS, mergeById(users, json.data));
                    console.log(`Merged ${json.data.length} controlled seed users`);
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
            if (this._isLegacyPersonOpportunityEnabled()) {
                const demoMatchesRes = await fetch(`${base}demo-matches.json`);
                if (demoMatchesRes.ok) {
                    const json = await demoMatchesRes.json();
                    if (json.data && json.data.length) {
                        const matches = this.storage.get(CONFIG.STORAGE_KEYS.MATCHES) || [];
                        this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, mergeById(matches, json.data));
                        console.log(`Merged ${json.data.length} demo matches`);
                    }
                }
            } else {
                this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, []);
            }
            const demoNotificationsRes = await fetch(`${base}demo-notifications.json`);
            if (demoNotificationsRes.ok) {
                const json = await demoNotificationsRes.json();
                if (json.data && json.data.length) {
                    const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, mergeNotificationsById(notifications, json.data));
                    console.log(`Merged ${json.data.length} demo notifications`);
                }
            }
            const demoConnectionsRes = await fetch(`${base}demo-connections.json`);
            if (demoConnectionsRes.ok) {
                const json = await demoConnectionsRes.json();
                if (json.data && json.data.length) {
                    const connections = this.storage.get(CONFIG.STORAGE_KEYS.CONNECTIONS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.CONNECTIONS, mergeById(connections, json.data));
                    console.log(`Merged ${json.data.length} demo connections`);
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
            const demoDisputesRes = await fetch(`${base}demo-disputes.json`);
            if (demoDisputesRes.ok) {
                const json = await demoDisputesRes.json();
                if (json.data && json.data.length) {
                    const disputes = this.storage.get(CONFIG.STORAGE_KEYS.DISPUTES) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.DISPUTES, mergeById(disputes, json.data));
                    console.log(`Merged ${json.data.length} demo disputes`);
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
            const demoReviewsRes = await fetch(`${base}demo-reviews.json`);
            if (demoReviewsRes.ok) {
                const json = await demoReviewsRes.json();
                if (json.data && json.data.length) {
                    const reviews = this.storage.get(CONFIG.STORAGE_KEYS.REVIEWS) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.REVIEWS, mergeById(reviews, json.data));
                    console.log(`Merged ${json.data.length} demo reviews`);
                }
            }
            const demoAuditRes = await fetch(`${base}demo-audit.json`);
            if (demoAuditRes.ok) {
                const json = await demoAuditRes.json();
                if (json.data && json.data.length) {
                    const audit = this.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
                    this.storage.set(CONFIG.STORAGE_KEYS.AUDIT, mergeById(audit, json.data));
                    console.log(`Merged ${json.data.length} demo audit logs`);
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
     * Clamp legacy post_match scores that exceeded 1.0 due to misconfigured weight totals.
     */
    normalizePostMatchScores() {
        const key = CONFIG.STORAGE_KEYS.POST_MATCHES;
        const matches = this.storage.get(key) || [];
        let changed = false;
        const normalized = matches.map((match) => {
            const raw = Number(match.matchScore);
            if (!Number.isFinite(raw) || raw <= 1) return match;
            changed = true;
            return {
                ...match,
                matchScore: Math.min(1, Math.round(raw * 1000) / 1000)
            };
        });
        if (changed) {
            this.storage.set(key, normalized);
            console.log('Normalized inflated post_match scores');
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
            'application_requirements': CONFIG.STORAGE_KEYS.APPLICATION_REQUIREMENTS,
            'application_deliverables': CONFIG.STORAGE_KEYS.APPLICATION_DELIVERABLES,
            'application_files': CONFIG.STORAGE_KEYS.APPLICATION_FILES,
            'application_payment_terms': CONFIG.STORAGE_KEYS.APPLICATION_PAYMENT_TERMS,
            'opportunity_invitations': CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS,
            'replacement_requests': CONFIG.STORAGE_KEYS.REPLACEMENT_REQUESTS,
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
            'disputes': CONFIG.STORAGE_KEYS.DISPUTES,
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
    
    async updateUser(id, updates, options = {}) {
        this._assertNotAuditorWrite(options);
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

    async deleteUser(id, options = {}) {
        this._assertNotAuditorWrite(options);
        const refs = await this.findActorReferences(id);
        if (this.hasReferences(refs)) {
            const parts = [];
            if (refs.opportunities) parts.push('opportunities');
            if (refs.applications) parts.push('applications');
            if (refs.postMatches) parts.push('post_matches');
            if (refs.deals) parts.push('deals');
            if (refs.contracts) parts.push('contracts');
            if (refs.notifications) parts.push('notifications');
            if (refs.audit) parts.push('audit');
            throw new Error(`Cannot delete user "${id}" because they are still referenced by ${parts.join(', ')}. Remove or reassign those references first.`);
        }
        const users = await this.getUsers();
        const filtered = users.filter(u => u.id !== id);
        this.storage.set(CONFIG.STORAGE_KEYS.USERS, filtered);
        return true;
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
    
    async updateCompany(id, updates, options = {}) {
        this._assertNotAuditorWrite(options);
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
        const refs = await this.findActorReferences(id);
        if (this.hasReferences(refs)) {
            const parts = [];
            if (refs.opportunities) parts.push('opportunities');
            if (refs.applications) parts.push('applications');
            if (refs.postMatches) parts.push('post_matches');
            if (refs.deals) parts.push('deals');
            if (refs.contracts) parts.push('contracts');
            if (refs.notifications) parts.push('notifications');
            if (refs.audit) parts.push('audit');
            throw new Error(`Cannot delete company "${id}" because it is still referenced by ${parts.join(', ')}. Remove or reassign those references first.`);
        }
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
    
    async createOpportunity(opportunityData, options = {}) {
        this._assertPortalCanMutate(options);
        this._assertNotAuditorWrite(options);
        _runWindowValidator('validateOpportunityData', opportunityData, { disallowPastDates: true });
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
    
    async updateOpportunity(id, updates, options = {}) {
        this._assertPortalCanMutate(options);
        this._assertNotAuditorWrite(options);
        const opportunities = await this.getOpportunities();
        const index = opportunities.findIndex(o => o.id === id);
        if (index === -1) return null;

        const previousStatus = opportunities[index].status;
        const isNewlyPublished = updates && updates.status === 'published' && previousStatus !== 'published';

        if (isNewlyPublished) {
            const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
            const actor = auth && typeof auth.getCurrentUser === 'function' ? auth.getCurrentUser() : null;
            const pc = (typeof profileCompletion !== 'undefined' && profileCompletion)
                || (typeof window !== 'undefined' && window.profileCompletion);
            if (actor && pc && typeof pc.assertProfileReadyForPublish === 'function') {
                const profileCheck = pc.assertProfileReadyForPublish(actor);
                if (!profileCheck.ok) {
                    throw new Error(profileCheck.message || 'Complete your profile before publishing.');
                }
            }
        }

        if (updates && updates.status != null && updates.status !== previousStatus) {
            enforceTransition('opportunity', opportunities[index], updates.status);
        }

        const mergedForValidation = { ...opportunities[index], ...updates };
        _runWindowValidator('validateOpportunityData', mergedForValidation, {
            disallowPastDates: _opportunityUpdateTouchesDates(updates)
        });
        
        opportunities[index] = {
            ...opportunities[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, opportunities);
        const updated = opportunities[index];

        // Publish → persistPostMatches → findMatchesForPost → createPostMatch → notify (no legacy pmtwin_matches)
        if (isNewlyPublished) {
            const ms = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
            if (ms && typeof ms.persistPostMatches === 'function') {
                ms.persistPostMatches(id, { source: 'publish' }).catch(err => console.warn('Post-match persistence after publish:', err));
            }
        }
        return updated;
    }
    
    /**
     * Returns true if any reference count in refs is > 0.
     * @param {{ [key: string]: number }} refs - e.g. { applications: 2, deals: 1 }
     */
    hasReferences(refs) {
        if (!refs || typeof refs !== 'object') return false;
        return Object.values(refs).some(n => typeof n === 'number' && n > 0);
    }

    /**
     * Find all entities that reference the given opportunity (for safe-delete checks).
     * @param {string} opportunityId
     * @returns {Promise<{ applications: number, postMatches: number, deals: number, contracts: number }>}
     */
    async findOpportunityReferences(opportunityId) {
        const id = opportunityId;
        const applications = await this.getApplications();
        const appCount = applications.filter(a => a.opportunityId === id).length;

        const postMatches = await this.getPostMatches();
        const postMatchCount = postMatches.filter(m => {
            if (!m) return false;
            const participants = m.participants || [];
            if (participants.some(p => p.opportunityId === id)) return true;
            const payload = m.payload || {};
            if (payload.needOpportunityId === id || payload.offerOpportunityId === id || payload.leadNeedId === id) return true;
            const roles = payload.roles || [];
            if (roles.some(r => r.opportunityId === id)) return true;
            const links = payload.links || [];
            if (links.some(l => (l.needId === id || l.offerId === id))) return true;
            return false;
        }).length;

        const deals = await this.getDeals();
        const dealCount = deals.filter(d => d.opportunityId === id || (Array.isArray(d.opportunityIds) && d.opportunityIds.includes(id))).length;

        const contracts = await this.getContracts();
        const contractCount = contracts.filter(c => c.opportunityId === id).length;

        return { applications: appCount, postMatches: postMatchCount, deals: dealCount, contracts: contractCount };
    }

    /**
     * Find all entities that reference the given user/company id (actor id).
     * @param {string} userId - user id or company id (both used as "actor" in participants, creatorId, etc.)
     * @returns {Promise<{ opportunities: number, applications: number, postMatches: number, deals: number, contracts: number, notifications: number, audit: number }>}
     */
    async findActorReferences(userId) {
        const opportunities = await this.getOpportunities();
        const oppCount = opportunities.filter(o => o.creatorId === userId).length;

        const applications = await this.getApplications();
        const appCount = applications.filter(a => a.applicantId === userId).length;

        const postMatches = await this.getPostMatches();
        const postMatchCount = postMatches.filter(m => (m.participants || []).some(p => p.userId === userId)).length;

        const deals = await this.getDeals();
        const dealCount = deals.filter(d => (d.participants || []).some(p => p.userId === userId)).length;

        const contracts = await this.getContracts();
        const contractCount = contracts.filter(c => this.getContractParties(c).some(p => p.userId === userId)).length;

        const notificationCount = (await this.getNotifications(userId)).length;
        const auditLogs = await this.getAuditLogs({ userId });
        const auditCount = auditLogs.length;

        return { opportunities: oppCount, applications: appCount, postMatches: postMatchCount, deals: dealCount, contracts: contractCount, notifications: notificationCount, audit: auditCount };
    }

    async deleteOpportunity(id, options = {}) {
        this._assertPortalCanMutate(options);
        this._assertNotAuditorWrite(options);
        const refs = await this.findOpportunityReferences(id);
        if (this.hasReferences(refs)) {
            const parts = [];
            if (refs.applications) parts.push('applications');
            if (refs.postMatches) parts.push('post_matches');
            if (refs.deals) parts.push('deals');
            if (refs.contracts) parts.push('contracts');
            throw new Error(`Cannot delete opportunity "${id}" because it is still referenced by ${parts.join(', ')}. Remove or reassign those references first.`);
        }
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
    
    async createApplication(applicationData, options = {}) {
        this._assertPortalCanMutate(options);
        _runWindowValidator('validateApplication', applicationData, { requireProposal: false });
        const applications = await this.getApplications();
        const applicantId = applicationData.applicantId;
        let companyId = options.companyId || applicationData.applicantCompanyId || null;
        if (!companyId && applicantId) {
            const applicantUser = await this.getUserById(applicantId);
            if (applicantUser?.companyId) companyId = applicantUser.companyId;
        }

        const invitation = applicationData.opportunityId
            ? await this.findActiveInvitationForApplicant({
                opportunityId: applicationData.opportunityId,
                userId: applicantId,
                companyId,
                matchId: options.matchId || applicationData.matchId,
                isReplacementApplication: !!options.isReplacementApplication
            })
            : null;

        const payload = { ...applicationData };
        if (invitation) {
            payload.invitationId = invitation.id;
            payload.matchId = invitation.matchId || payload.matchId;
            if (invitation.projectId && !payload.projectId) payload.projectId = invitation.projectId;
            if (invitation.invitationKind && !payload.invitationKind) payload.invitationKind = invitation.invitationKind;
            if (invitation.replacementRequestId && !payload.replacementRequestId) {
                payload.replacementRequestId = invitation.replacementRequestId;
            }
        }

        const newApplication = {
            id: this.generateId(),
            ...payload,
            status: CONFIG.APPLICATION_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        applications.push(newApplication);
        this.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, applications);

        if (invitation) {
            await this.linkApplicationToInvitation(invitation, newApplication, options);
        }

        return newApplication;
    }

    // Opportunity invitation operations (Phase 4)
    async sweepExpiredOpportunityInvitations(now) {
        return this.expireOpportunityInvitations(now);
    }

    async getOpportunityInvitations() {
        await this.sweepExpiredOpportunityInvitations();
        return this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS) || [];
    }

    async getOpportunityInvitationById(id) {
        const list = await this.getOpportunityInvitations();
        return list.find(i => i.id === id) || null;
    }

    async getInvitationsByMatchId(matchId) {
        const list = await this.getOpportunityInvitations();
        return list.filter(i => i.matchId === matchId);
    }

    async getInvitationsByOpportunityId(opportunityId) {
        const list = await this.getOpportunityInvitations();
        return list.filter(i => i.opportunityId === opportunityId);
    }

    async findActiveInvitationForApplicant(options = {}) {
        const list = await this.getOpportunityInvitations();
        return pickActiveInvitation(list, options);
    }

    async createOpportunityInvitation(invitationData) {
        await this.sweepExpiredOpportunityInvitations();
        const list = this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS) || [];
        const kind = invitationData.invitationKind
            || (invitationData.isReplacement ? CONFIG.INVITATION_KIND.REPLACEMENT : CONFIG.INVITATION_KIND.APPLY);
        const createdAt = invitationData.createdAt || new Date().toISOString();
        const terminalOnCreate = isTerminalInvitationStatus(invitationData.status);
        const expiresAt = invitationData.expiresAt != null
            ? invitationData.expiresAt
            : (terminalOnCreate
                ? null
                : computeDefaultInvitationExpiresAt(
                    createdAt,
                    CONFIG.DEFAULT_INVITATION_EXPIRY_DAYS
                ));
        const newInvitation = {
            id: this.generateId(),
            opportunityId: invitationData.opportunityId,
            matchId: invitationData.matchId || null,
            projectId: invitationData.projectId || null,
            invitedUserId: invitationData.invitedUserId || null,
            invitedCompanyId: invitationData.invitedCompanyId || null,
            invitedByUserId: invitationData.invitedByUserId || null,
            invitationKind: kind,
            replacementRequestId: invitationData.replacementRequestId || null,
            roleToFill: invitationData.roleToFill || null,
            blockedParticipantId: invitationData.blockedParticipantId || null,
            blockedOpportunityId: invitationData.blockedOpportunityId || null,
            status: invitationData.status || CONFIG.INVITATION_STATUS.SENT,
            applicationId: invitationData.applicationId || null,
            message: invitationData.message || null,
            respondedAt: invitationData.respondedAt || null,
            expiresAt,
            createdAt,
            updatedAt: new Date().toISOString()
        };
        list.push(newInvitation);
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS, list);
        return newInvitation;
    }

    async updateOpportunityInvitation(id, updates) {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS) || [];
        const index = list.findIndex(i => i.id === id);
        if (index === -1) return null;
        list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS, list);
        return list[index];
    }

    /**
     * Resolve invite target from a unified match (post_match or legacy).
     */
    async resolveMatchInviteContext(matchRecord, senderUserId) {
        if (!matchRecord || !senderUserId) return null;

        const isLegacy = !matchRecord.matchType && !matchRecord.participants?.length && matchRecord.opportunityId;
        if (isLegacy) {
            const opp = await this.getOpportunityById(matchRecord.opportunityId);
            if (!opp || opp.creatorId !== senderUserId) return null;
            const invitedUserId = matchRecord.candidateId || matchRecord.userId;
            if (!invitedUserId || invitedUserId === senderUserId) return null;
            return {
                opportunityId: matchRecord.opportunityId,
                invitedUserId,
                invitedCompanyId: null,
                matchId: matchRecord.id,
                isLegacy: true
            };
        }

        const participants = matchRecord.participants || [];
        const payload = matchRecord.payload || {};
        let sourceOpportunityId = payload.needOpportunityId || payload.leadNeedId || null;
        if (!sourceOpportunityId && matchRecord.matchType === 'consortium') {
            sourceOpportunityId = payload.leadNeedId;
        }
        if (!sourceOpportunityId && matchRecord.matchType === 'two_way') {
            const sideA = payload.sideA || {};
            const sideB = payload.sideB || {};
            if (sideA.userId === senderUserId) sourceOpportunityId = sideA.needId;
            else if (sideB.userId === senderUserId) sourceOpportunityId = sideB.needId;
        }
        if (!sourceOpportunityId) {
            const needOwner = participants.find(p =>
                p.role === 'need_owner' || p.role === 'consortium_lead'
            );
            if (needOwner?.userId === senderUserId) {
                sourceOpportunityId = payload.needOpportunityId || payload.leadNeedId;
            }
        }

        const sourceOpp = sourceOpportunityId ? await this.getOpportunityById(sourceOpportunityId) : null;
        if (!sourceOpp || sourceOpp.creatorId !== senderUserId) return null;

        const inviteePart = participants.find(p => p.userId && p.userId !== senderUserId);
        if (!inviteePart?.userId) return null;

        let invitedCompanyId = null;
        const inviteeEntity = await this.getUserOrCompanyById(inviteePart.userId);
        if (inviteeEntity?.companyId) invitedCompanyId = inviteeEntity.companyId;
        else if (inviteeEntity?.profile?.companyName && !inviteeEntity.email?.includes('@')) {
            invitedCompanyId = inviteePart.userId;
        }

        return {
            opportunityId: sourceOpportunityId,
            invitedUserId: inviteePart.userId,
            invitedCompanyId,
            matchId: matchRecord.id,
            isLegacy: false,
            invitationKind: matchRecord.isReplacement
                ? CONFIG.INVITATION_KIND.REPLACEMENT
                : CONFIG.INVITATION_KIND.APPLY,
            replacementRequestId: matchRecord.replacementRequestId || null
        };
    }

    async _getActorRole(actorUserId) {
        if (!actorUserId) return null;
        const entity = await this.getUserOrCompanyById(actorUserId);
        return entity?.role || null;
    }

    async createLifecycleNotification(spec) {
        const userId = spec.userId;
        if (!userId) return null;
        const existing = await this.getNotifications(userId);
        const dedupeKey = spec.dedupeKey
            || notificationDedupeKey(spec.type, spec.entityType, spec.entityId);
        if (hasRecentDuplicateNotification(existing, {
            type: spec.type,
            dedupeKey,
            link: spec.link,
            entityType: spec.entityType,
            entityId: spec.entityId
        })) {
            return null;
        }
        return this.createNotification({ ...spec, dedupeKey });
    }

    async createOpportunityInvitationFromMatch(matchId, senderUserId, options = {}) {
        if (!senderUserId) {
            throw new Error(PERMISSION_ERRORS.DENIED);
        }
        const postMatch = await this.getPostMatchById(matchId);
        let matchRecord = postMatch;
        let isLegacy = false;
        if (!matchRecord && this._isLegacyPersonOpportunityEnabled()) {
            const legacy = await this.getMatches();
            matchRecord = legacy.find(m => m.id === matchId) || null;
            isLegacy = !!matchRecord;
        }
        if (!matchRecord) {
            throw new Error('Match not found.');
        }

        const ctx = await this.resolveMatchInviteContext(matchRecord, senderUserId);
        if (!ctx) {
            throw new Error('You can only invite from a match where you own the source opportunity.');
        }

        const existing = (await this.getInvitationsByMatchId(matchId)).find(inv =>
            isActiveInvitation(inv)
            && inv.invitedUserId === ctx.invitedUserId
            && inv.opportunityId === ctx.opportunityId
        );
        if (existing) return existing;

        const invitation = await this.createOpportunityInvitation({
            opportunityId: ctx.opportunityId,
            matchId: ctx.matchId,
            invitedUserId: ctx.invitedUserId,
            invitedCompanyId: ctx.invitedCompanyId,
            invitedByUserId: senderUserId,
            invitationKind: ctx.invitationKind,
            replacementRequestId: ctx.replacementRequestId,
            status: matchRecord.isReplacement ? 'invitation_sent' : CONFIG.INVITATION_STATUS.SENT,
            message: options.message || null
        });

        if (isLegacy) {
            await this.updateMatch(matchId, { invitationId: invitation.id });
        } else {
            await this.updatePostMatch(matchId, { invitationId: invitation.id });
        }

        const opp = await this.getOpportunityById(ctx.opportunityId);
        const inviteTitle = matchRecord.isReplacement
            ? 'Replacement invitation'
            : 'Invitation to apply';
        const inviteMessage = matchRecord.isReplacement
            ? `You have been invited to apply as a replacement for "${opp?.title || 'an opportunity'}".`
            : `You have been invited to apply to "${opp?.title || 'an opportunity'}".`;

        try {
            await this.createLifecycleNotification({
                userId: ctx.invitedUserId,
                type: matchRecord.isReplacement ? 'replacement_invitation_sent' : 'opportunity_invitation',
                entityType: 'invitation',
                entityId: invitation.id,
                title: inviteTitle,
                message: inviteMessage,
                link: '/opportunities/' + ctx.opportunityId + '?matchId=' + encodeURIComponent(matchId),
                read: false
            });
        } catch (e) {
            void e;
        }

        try {
            await this.createAuditLog({
                userId: senderUserId,
                action: matchRecord.isReplacement ? 'replacement_invitation_sent' : 'opportunity_invitation_sent',
                entityType: 'invitation',
                entityId: invitation.id,
                details: buildLifecycleAuditDetails({
                    summary: matchRecord.isReplacement ? 'Replacement invitation sent' : 'Invitation to apply sent',
                    invitationId: invitation.id,
                    matchId,
                    opportunityId: ctx.opportunityId,
                    sourceOpportunityId: ctx.opportunityId,
                    invitedUserId: ctx.invitedUserId,
                    invitedCompanyId: ctx.invitedCompanyId,
                    invitationKind: invitation.invitationKind
                }, { actorRole: await this._getActorRole(senderUserId) })
            });
        } catch (e) {
            void e;
        }

        return invitation;
    }

    async linkApplicationToInvitation(invitation, application, options = {}) {
        const acceptedStatus = CONFIG.INVITATION_STATUS.ACCEPTED;
        await this.updateOpportunityInvitation(invitation.id, {
            status: acceptedStatus,
            applicationId: application.id,
            respondedAt: new Date().toISOString()
        });

        if (invitation.matchId) {
            const postMatch = await this.getPostMatchById(invitation.matchId);
            if (postMatch) {
                await this.updatePostMatch(invitation.matchId, {
                    applicationId: application.id,
                    invitationId: invitation.id
                });
            } else if (this._isLegacyPersonOpportunityEnabled()) {
                await this.updateMatch(invitation.matchId, {
                    applicationId: application.id,
                    invitationId: invitation.id
                });
            }
        }

        const opp = await this.getOpportunityById(invitation.opportunityId);
        const ownerId = opp?.creatorId;
        const isReplacement = (invitation.invitationKind || '') === CONFIG.INVITATION_KIND.REPLACEMENT
            || !!invitation.replacementRequestId;

        if (ownerId) {
            try {
                await this.createLifecycleNotification({
                    userId: ownerId,
                    type: isReplacement ? 'replacement_invitation_accepted' : 'invitation_accepted',
                    entityType: 'invitation',
                    entityId: invitation.id,
                    title: isReplacement ? 'Replacement invitation accepted' : 'Invitation accepted',
                    message: isReplacement
                        ? 'The invited replacement provider has applied or accepted the invitation.'
                        : 'An invited participant has applied to your opportunity.',
                    link: isReplacement
                        ? '/matches/' + (invitation.matchId || '')
                        : '/opportunities/' + invitation.opportunityId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: options.actorId || application.applicantId || 'system',
                action: isReplacement ? 'replacement_invitation_accepted' : 'opportunity_invitation_accepted',
                entityType: 'invitation',
                entityId: invitation.id,
                details: {
                    invitationId: invitation.id,
                    matchId: invitation.matchId,
                    opportunityId: invitation.opportunityId,
                    projectId: invitation.projectId,
                    applicationId: application.id,
                    invitedUserId: invitation.invitedUserId,
                    invitedCompanyId: invitation.invitedCompanyId,
                    invitationKind: invitation.invitationKind
                }
            });
        } catch (e) {
            void e;
        }
    }

    async getInvitationMatchingAnalytics() {
        const invitations = await this.getOpportunityInvitations();
        const applications = await this.getApplications();
        const deals = await this.getDeals();

        const sentStatuses = new Set([
            CONFIG.INVITATION_STATUS.SENT,
            'invitation_sent',
            CONFIG.INVITATION_STATUS.ACCEPTED
        ]);
        const invitationsSent = invitations.filter(i => sentStatuses.has((i.status || '').toLowerCase())).length;
        const appsFromInvitations = applications.filter(a => a.invitationId);
        const applicationsFromInvitations = appsFromInvitations.length;
        const acceptedInvitations = invitations.filter(i =>
            (i.status || '').toLowerCase() === CONFIG.INVITATION_STATUS.ACCEPTED
        ).length;
        const invitationAcceptanceRate = invitationsSent > 0
            ? Math.round((acceptedInvitations / invitationsSent) * 100) + '%'
            : '—';
        const replacementInvitationsAccepted = invitations.filter(i =>
            (i.invitationKind === CONFIG.INVITATION_KIND.REPLACEMENT || i.replacementRequestId)
            && (i.status || '').toLowerCase() === CONFIG.INVITATION_STATUS.ACCEPTED
        ).length;
        const invitedAppIds = new Set(appsFromInvitations.map(a => a.id));
        const dealsFromInvitedApplications = deals.filter(d =>
            d.applicationId && invitedAppIds.has(d.applicationId)
        ).length;

        return {
            invitationsSent,
            applicationsFromInvitations,
            invitationAcceptanceRate,
            replacementInvitationsAccepted,
            dealsFromInvitedApplications
        };
    }

    async declineOpportunityInvitation(invitationId, actorId, reason) {
        const invitation = await this.getOpportunityInvitationById(invitationId);
        if (!invitation) throw new Error('Invitation not found.');
        const status = (invitation.status || '').toLowerCase();
        if (status === CONFIG.INVITATION_STATUS.DECLINED) return invitation;
        if (isTerminalInvitationStatus(status)) {
            throw new Error('Cannot decline this invitation.');
        }
        if (!isActiveInvitation(invitation)) {
            throw new Error('Cannot decline this invitation.');
        }

        const user = await this.getUserById(actorId);
        const companyId = user?.companyId || null;
        if (!invitationAcceptsActor(invitation, actorId, companyId)) {
            throw new Error('Only the invited party can decline this invitation.');
        }

        const updated = await this.updateOpportunityInvitation(invitationId, {
            status: CONFIG.INVITATION_STATUS.DECLINED,
            respondedAt: new Date().toISOString(),
            declineReason: reason || null
        });

        const ownerId = invitation.invitedByUserId
            || (await this.getOpportunityById(invitation.opportunityId))?.creatorId;
        if (ownerId && ownerId !== actorId) {
            try {
                await this.createLifecycleNotification({
                    userId: ownerId,
                    type: 'invitation_declined',
                    entityType: 'invitation',
                    entityId: invitationId,
                    title: 'Invitation declined',
                    message: reason || 'The invited party declined your invitation.',
                    link: invitation.matchId
                        ? '/matches/' + invitation.matchId
                        : '/opportunities/' + invitation.opportunityId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorId,
                action: 'opportunity_invitation_declined',
                entityType: 'invitation',
                entityId: invitationId,
                details: buildLifecycleAuditDetails({
                    summary: 'Invitation declined',
                    invitationId,
                    matchId: invitation.matchId,
                    opportunityId: invitation.opportunityId,
                    reason: reason || null
                }, { actorRole: await this._getActorRole(actorId) })
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async cancelOpportunityInvitation(invitationId, actorId, reason) {
        const invitation = await this.getOpportunityInvitationById(invitationId);
        if (!invitation) throw new Error('Invitation not found.');
        const status = (invitation.status || '').toLowerCase();
        if (status === CONFIG.INVITATION_STATUS.CANCELLED) return invitation;
        if (isTerminalInvitationStatus(status)) {
            throw new Error('Cannot cancel this invitation.');
        }
        if (!isActiveInvitation(invitation)) {
            throw new Error('Cannot cancel this invitation.');
        }

        const actorRole = await this._getActorRole(actorId);
        assertNotReadOnlyAdmin(actorRole);
        const opp = await this.getOpportunityById(invitation.opportunityId);
        const isOwner = !!(opp && opp.creatorId === actorId);
        const isInviter = invitation.invitedByUserId === actorId;
        if (!isOwner && !isInviter && actorRole !== 'admin') {
            throw new Error('Only the inviter, opportunity owner, or admin can cancel this invitation.');
        }

        const updated = await this.updateOpportunityInvitation(invitationId, {
            status: CONFIG.INVITATION_STATUS.CANCELLED,
            cancelledAt: new Date().toISOString(),
            cancelReason: reason || null
        });

        if (invitation.invitedUserId && invitation.invitedUserId !== actorId) {
            try {
                await this.createLifecycleNotification({
                    userId: invitation.invitedUserId,
                    type: 'invitation_cancelled',
                    entityType: 'invitation',
                    entityId: invitationId,
                    title: 'Invitation cancelled',
                    message: reason || 'An invitation to apply was cancelled.',
                    link: invitation.opportunityId
                        ? '/opportunities/' + invitation.opportunityId
                        : null,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorId,
                action: 'opportunity_invitation_cancelled',
                entityType: 'invitation',
                entityId: invitationId,
                details: buildLifecycleAuditDetails({
                    summary: 'Invitation cancelled',
                    invitationId,
                    matchId: invitation.matchId,
                    opportunityId: invitation.opportunityId,
                    reason: reason || null
                }, { actorRole })
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    /**
     * Mark sent invitations past expiresAt as expired. Skips accepted and other terminal states.
     * @param {string|Date} [now]
     * @returns {Promise<object[]>}
     */
    async expireOpportunityInvitations(now) {
        const nowMs = now ? new Date(now).getTime() : Date.now();
        const list = this.storage.get(CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS) || [];
        const expired = [];
        for (const inv of list) {
            if (!shouldExpireInvitation(inv, nowMs)) continue;
            const status = (inv.status || '').toLowerCase();
            if (status === CONFIG.INVITATION_STATUS.EXPIRED) continue;

            const updated = await this.updateOpportunityInvitation(inv.id, {
                status: CONFIG.INVITATION_STATUS.EXPIRED,
                expiredAt: new Date(nowMs).toISOString()
            });
            expired.push(updated);

            const notifyIds = new Set();
            if (inv.invitedUserId) notifyIds.add(inv.invitedUserId);
            const opp = await this.getOpportunityById(inv.opportunityId);
            if (opp?.creatorId) notifyIds.add(opp.creatorId);
            for (const uid of notifyIds) {
                try {
                    await this.createLifecycleNotification({
                        userId: uid,
                        type: 'invitation_expired',
                        entityType: 'invitation',
                        entityId: inv.id,
                        title: 'Invitation expired',
                        message: 'An invitation to apply has expired.',
                        link: inv.matchId
                            ? '/matches/' + inv.matchId
                            : '/opportunities/' + (inv.opportunityId || ''),
                        read: false
                    });
                } catch (e) {
                    void e;
                }
            }

            try {
                await this.createAuditLog({
                    userId: 'system',
                    action: 'opportunity_invitation_expired',
                    entityType: 'invitation',
                    entityId: inv.id,
                    details: {
                        invitationId: inv.id,
                        matchId: inv.matchId,
                        opportunityId: inv.opportunityId,
                        expiresAt: inv.expiresAt
                    }
                });
            } catch (e) {
                void e;
            }
        }
        return expired;
    }

    // Replacement request operations (Phase 6 — consortium / circular)
    async getReplacementRequests() {
        return this.storage.get(CONFIG.STORAGE_KEYS.REPLACEMENT_REQUESTS) || [];
    }

    async getReplacementRequestById(id) {
        const list = await this.getReplacementRequests();
        return list.find(r => r.id === id) || null;
    }

    async getReplacementRequestsByMatchId(matchId) {
        const list = await this.getReplacementRequests();
        return list.filter(r => r.matchId === matchId);
    }

    async createReplacementRequest(data) {
        const list = await this.getReplacementRequests();
        const record = {
            id: this.generateId(),
            matchId: data.matchId,
            opportunityId: data.opportunityId || null,
            dealId: data.dealId || null,
            contractId: data.contractId || null,
            requestedByUserId: data.requestedByUserId || null,
            roleToFill: data.roleToFill || 'General',
            blockedParticipantId: data.blockedParticipantId || null,
            blockedOpportunityId: data.blockedOpportunityId || null,
            suggestedUserId: data.suggestedUserId || null,
            suggestedCompanyId: data.suggestedCompanyId || null,
            invitedUserId: data.invitedUserId || null,
            invitedCompanyId: data.invitedCompanyId || null,
            invitationId: data.invitationId || null,
            message: data.message || null,
            status: data.status || CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_OWNER_REVIEW,
            slotKey: data.slotKey || buildReplacementSlotKey(
                data.blockedParticipantId,
                data.roleToFill,
                data.blockedOpportunityId
            ),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.REPLACEMENT_REQUESTS, list);
        return record;
    }

    async updateReplacementRequest(id, updates) {
        const list = await this.getReplacementRequests();
        const index = list.findIndex(r => r.id === id);
        if (index === -1) return null;
        list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
        this.storage.set(CONFIG.STORAGE_KEYS.REPLACEMENT_REQUESTS, list);
        return list[index];
    }

    async _getPrimaryOpportunityForPostMatch(postMatch) {
        const payload = postMatch.payload || {};
        return payload.leadNeedId || payload.needOpportunityId
            || (postMatch.opportunityIds && postMatch.opportunityIds[0])
            || null;
    }

    async isUserOwnerOfPostMatch(postMatch, userId) {
        if (!postMatch || !userId) return false;
        const oppId = await this._getPrimaryOpportunityForPostMatch(postMatch);
        if (!oppId) return false;
        const opp = await this.getOpportunityById(oppId);
        return !!(opp && opp.creatorId === userId);
    }

    _isUserParticipantOfPostMatch(postMatch, userId) {
        return !!(postMatch?.participants || []).some(p => p.userId === userId);
    }

    getBlockedSlotsForPostMatch(postMatch) {
        if (!postMatch || !isReplacementEligibleMatchType(postMatch.matchType)) return [];
        const slots = [];
        const seen = new Set();
        const add = (entry) => {
            const key = buildReplacementSlotKey(entry.userId, entry.role, entry.opportunityId);
            if (!entry.userId || seen.has(key)) return;
            seen.add(key);
            slots.push({ ...entry, slotKey: key });
        };

        (postMatch.participants || []).forEach(p => {
            const st = (p.participantStatus || 'pending').toLowerCase();
            if (st === 'declined' || p.replacedByUserId) {
                add({
                    userId: p.userId,
                    role: p.role || 'consortium_member',
                    opportunityId: p.opportunityId || null,
                    reason: st === 'declined' ? 'declined' : 'replaced'
                });
            }
        });

        if (postMatch.matchType === 'consortium') {
            (postMatch.payload?.roles || []).forEach(r => {
                if (!r.userId) {
                    add({
                        userId: r.blockedUserId || 'vacant',
                        role: r.role || 'consortium_member',
                        opportunityId: r.opportunityId || null,
                        reason: 'vacant_role'
                    });
                }
            });
        }

        return slots;
    }

    /**
     * Admin clears blocked / replacement-blocked flags on a post_match (POC localStorage).
     * @param {string} matchId
     * @param {string} actorUserId
     */
    async adminResolveBlockedPostMatch(matchId, actorUserId) {
        const actor = await this.getUserById(actorUserId);
        const actorRole = actor?.role || null;
        assertNotReadOnlyAdmin(actorRole);
        const hasResolve = typeof window !== 'undefined' && window.hasAdminCapability
            ? window.hasAdminCapability(actorRole, 'admin.matching.resolve_blocked')
            : actorRole === 'admin';
        const hasPersist = typeof window !== 'undefined' && window.hasAdminCapability
            ? window.hasAdminCapability(actorRole, 'admin.matching.persist')
            : actorRole === 'admin';
        if (!hasResolve && !hasPersist) {
            throw new Error(PERMISSION_ERRORS.DENIED);
        }
        const list = await this.getPostMatches();
        const idx = list.findIndex(m => m.id === matchId);
        if (idx < 0) throw new Error('Match not found.');
        const match = list[idx];
        const updated = {
            ...match,
            blocked: false,
            replacementBlocked: false,
            updatedAt: new Date().toISOString(),
            metadata: { ...(match.metadata || {}), blocked: false, adminResolvedAt: new Date().toISOString() }
        };
        list[idx] = updated;
        this.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, list);
        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'post_match_blocked_resolved',
                entityType: 'post_match',
                entityId: matchId,
                details: buildLifecycleAuditDetails({ summary: 'Admin resolved blocked match flags' }, { actorRole, matchId })
            });
        } catch (e) {
            void e;
        }
        return updated;
    }

    async _notifyReplacementStakeholders(matchId, notification, excludeUserId) {
        const match = await this.getPostMatchById(matchId);
        if (!match) return;
        const ids = new Set((match.participants || []).map(p => p.userId).filter(Boolean));
        const oppId = await this._getPrimaryOpportunityForPostMatch(match);
        if (oppId) {
            const opp = await this.getOpportunityById(oppId);
            if (opp?.creatorId) ids.add(opp.creatorId);
        }
        for (const uid of ids) {
            if (uid === excludeUserId) continue;
            try {
                await this.createNotification({ userId: uid, read: false, ...notification });
            } catch (e) {
                void e;
            }
        }
    }

    async _createReplacementInvitationForRequest(request, senderUserId, invitee) {
        const invitedUserId = invitee.invitedUserId || invitee.suggestedUserId || null;
        const invitedCompanyId = invitee.invitedCompanyId || invitee.suggestedCompanyId || null;
        if (!invitedUserId && !invitedCompanyId) {
            throw new Error('An invited user or company is required.');
        }

        const invitation = await this.createOpportunityInvitation({
            opportunityId: request.opportunityId,
            matchId: request.matchId,
            dealId: request.dealId,
            invitedUserId,
            invitedCompanyId,
            invitedByUserId: senderUserId,
            invitationKind: CONFIG.INVITATION_KIND.REPLACEMENT,
            replacementRequestId: request.id,
            roleToFill: request.roleToFill,
            blockedParticipantId: request.blockedParticipantId,
            blockedOpportunityId: request.blockedOpportunityId,
            status: 'invitation_sent',
            message: request.message || null
        });

        await this.updateReplacementRequest(request.id, {
            invitationId: invitation.id,
            invitedUserId,
            invitedCompanyId,
            status: CONFIG.REPLACEMENT_REQUEST_STATUS.INVITATION_SENT
        });

        const link = '/matches/' + request.matchId;
        if (invitedUserId) {
            try {
                await this.createNotification({
                    userId: invitedUserId,
                    type: 'opportunity_invitation',
                    title: 'Invitation to join collaboration',
                    message: 'You have been invited as a replacement provider for a consortium or circular match.',
                    link,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: senderUserId,
                action: 'replacement_invitation_sent',
                entityType: 'invitation',
                entityId: invitation.id,
                details: {
                    replacementRequestId: request.id,
                    matchId: request.matchId,
                    invitedUserId,
                    invitedCompanyId
                }
            });
        } catch (e) {
            void e;
        }

        return invitation;
    }

    async suggestReplacementForMatch(matchId, actorUserId, data) {
        const match = await this.getPostMatchById(matchId);
        if (!match) throw new Error('Match not found.');
        if (!isReplacementEligibleMatchType(match.matchType)) {
            throw new Error('Replacement is only available for Consortium and Circular matches.');
        }
        assertMatchParticipant(match, actorUserId);
        if (await this.isUserOwnerOfPostMatch(match, actorUserId)) {
            throw new Error('Use Invite Replacement as the opportunity owner.');
        }
        const actorRole = await this._getActorRole(actorUserId);
        assertNotReadOnlyAdmin(actorRole);
        if (!data.blockedParticipantId) {
            throw new Error('Select the participant or role to replace.');
        }

        const opportunityId = await this._getPrimaryOpportunityForPostMatch(match);
        const request = await this.createReplacementRequest({
            matchId,
            opportunityId,
            dealId: match.dealId || null,
            requestedByUserId: actorUserId,
            roleToFill: data.roleToFill || 'General',
            blockedParticipantId: data.blockedParticipantId,
            blockedOpportunityId: data.blockedOpportunityId || null,
            suggestedUserId: data.suggestedUserId || null,
            suggestedCompanyId: data.suggestedCompanyId || null,
            message: data.message || null,
            status: CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_OWNER_REVIEW
        });

        const opp = opportunityId ? await this.getOpportunityById(opportunityId) : null;
        if (opp?.creatorId) {
            try {
                await this.createNotification({
                    userId: opp.creatorId,
                    type: 'replacement_suggestion_submitted',
                    title: 'Replacement suggestion received',
                    message: 'A participant suggested a replacement for your match.',
                    link: '/matches/' + matchId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'replacement_suggested',
                entityType: 'replacement_request',
                entityId: request.id,
                details: { matchId, blockedParticipantId: data.blockedParticipantId }
            });
        } catch (e) {
            void e;
        }

        return request;
    }

    async approveReplacementSuggestion(requestId, actorUserId) {
        const request = await this.getReplacementRequestById(requestId);
        if (!request) throw new Error('Replacement request not found.');
        const match = await this.getPostMatchById(request.matchId);
        if (!match) throw new Error('Match not found.');
        const isOwner = await this.isUserOwnerOfPostMatch(match, actorUserId);
        const actorRole = await this._getActorRole(actorUserId);
        assertNotReadOnlyAdmin(actorRole);
        assertReplacementOwnerOrAdmin(isOwner, actorRole);

        await this._createReplacementInvitationForRequest(request, actorUserId, {
            suggestedUserId: request.suggestedUserId,
            suggestedCompanyId: request.suggestedCompanyId
        });

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'replacement_suggestion_approved',
                entityType: 'replacement_request',
                entityId: requestId,
                details: { matchId: request.matchId }
            });
        } catch (e) {
            void e;
        }

        if (request.requestedByUserId) {
            try {
                await this.createNotification({
                    userId: request.requestedByUserId,
                    type: 'replacement_invitation_sent',
                    title: 'Replacement invitation sent',
                    message: 'Your replacement suggestion was approved and an invitation was sent.',
                    link: '/matches/' + request.matchId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        return await this.getReplacementRequestById(requestId);
    }

    async rejectReplacementSuggestion(requestId, actorUserId, reason) {
        const request = await this.getReplacementRequestById(requestId);
        if (!request) throw new Error('Replacement request not found.');
        const match = await this.getPostMatchById(request.matchId);
        if (!match) throw new Error('Match not found.');
        const isOwner = await this.isUserOwnerOfPostMatch(match, actorUserId);
        const actorRole = await this._getActorRole(actorUserId);
        assertNotReadOnlyAdmin(actorRole);
        assertReplacementOwnerOrAdmin(isOwner, actorRole);

        await this.updateReplacementRequest(requestId, {
            status: CONFIG.REPLACEMENT_REQUEST_STATUS.REJECTED,
            rejectReason: reason || null
        });

        if (request.requestedByUserId) {
            try {
                await this.createNotification({
                    userId: request.requestedByUserId,
                    type: 'replacement_suggestion_rejected',
                    title: 'Replacement suggestion rejected',
                    message: reason || 'Your replacement suggestion was not approved.',
                    link: '/matches/' + request.matchId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'replacement_suggestion_rejected',
                entityType: 'replacement_request',
                entityId: requestId,
                details: { matchId: request.matchId }
            });
        } catch (e) {
            void e;
        }

        return await this.getReplacementRequestById(requestId);
    }

    async ownerInviteReplacementDirect(matchId, actorUserId, data) {
        const match = await this.getPostMatchById(matchId);
        if (!match) throw new Error('Match not found.');
        if (!isReplacementEligibleMatchType(match.matchType)) {
            throw new Error('Replacement is only available for Consortium and Circular matches.');
        }
        const isOwner = await this.isUserOwnerOfPostMatch(match, actorUserId);
        const actorRole = await this._getActorRole(actorUserId);
        assertNotReadOnlyAdmin(actorRole);
        assertMatchOwner(isOwner);
        if (!data.blockedParticipantId) throw new Error('Select who is being replaced.');
        if (!data.invitedUserId && !data.invitedCompanyId) {
            throw new Error('Select a provider to invite.');
        }

        const opportunityId = await this._getPrimaryOpportunityForPostMatch(match);
        let request = await this.createReplacementRequest({
            matchId,
            opportunityId,
            dealId: match.dealId || null,
            requestedByUserId: actorUserId,
            roleToFill: data.roleToFill || 'General',
            blockedParticipantId: data.blockedParticipantId,
            blockedOpportunityId: data.blockedOpportunityId || null,
            invitedUserId: data.invitedUserId || null,
            invitedCompanyId: data.invitedCompanyId || null,
            message: data.message || null,
            status: CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_INVITATION
        });

        await this._createReplacementInvitationForRequest(request, actorUserId, data);
        return await this.getReplacementRequestById(request.id);
    }

    async acceptReplacementInvitation(invitationId, actorUserId) {
        const invitation = await this.getOpportunityInvitationById(invitationId);
        if (!invitation || invitation.invitationKind !== CONFIG.INVITATION_KIND.REPLACEMENT) {
            throw new Error('Replacement invitation not found.');
        }

        const user = await this.getUserById(actorUserId);
        const companyId = user?.companyId || null;
        if (!invitationAcceptsActor(invitation, actorUserId, companyId)) {
            throw new Error('This invitation is not addressed to you.');
        }

        const activeStatuses = ['sent', 'invitation_sent'];
        if (!activeStatuses.includes((invitation.status || '').toLowerCase())) {
            throw new Error('This invitation is no longer active.');
        }

        await this.updateOpportunityInvitation(invitationId, {
            status: CONFIG.INVITATION_STATUS.ACCEPTED,
            respondedAt: new Date().toISOString()
        });

        if (invitation.replacementRequestId) {
            await this.updateReplacementRequest(invitation.replacementRequestId, {
                status: CONFIG.REPLACEMENT_REQUEST_STATUS.REPLACEMENT_ACCEPTED
            });
            const request = await this.getReplacementRequestById(invitation.replacementRequestId);
            if (request?.matchId) {
                await this._notifyReplacementStakeholders(request.matchId, {
                    type: 'replacement_invitation_accepted',
                    title: 'Replacement invitation accepted',
                    message: 'An invited replacement provider accepted the invitation.',
                    link: '/matches/' + request.matchId
                }, actorUserId);
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'replacement_invitation_accepted',
                entityType: 'invitation',
                entityId: invitationId,
                details: { matchId: invitation.matchId, replacementRequestId: invitation.replacementRequestId }
            });
        } catch (e) {
            void e;
        }

        return await this.getOpportunityInvitationById(invitationId);
    }

    _swapUserInPostMatchPayload(match, oldUserId, newUserId, newOpportunityId) {
        const payload = { ...(match.payload || {}) };
        if (match.matchType === 'consortium' && Array.isArray(payload.roles)) {
            payload.roles = payload.roles.map(r =>
                (r.userId === oldUserId)
                    ? { ...r, userId: newUserId, opportunityId: newOpportunityId || r.opportunityId }
                    : r
            );
        }
        if (match.matchType === 'circular') {
            if (Array.isArray(payload.cycle)) {
                payload.cycle = payload.cycle.map(uid => (uid === oldUserId ? newUserId : uid));
            }
            if (Array.isArray(payload.links)) {
                payload.links = payload.links.map(l => ({
                    ...l,
                    fromCreatorId: l.fromCreatorId === oldUserId ? newUserId : l.fromCreatorId,
                    toCreatorId: l.toCreatorId === oldUserId ? newUserId : l.toCreatorId
                }));
            }
        }
        return payload;
    }

    async _supersedeCompetingReplacementRequests(matchId, slotKey, keepRequestId, context = {}) {
        const list = await this.getReplacementRequestsByMatchId(matchId);
        for (const r of list) {
            if (r.id === keepRequestId) continue;
            if (r.slotKey !== slotKey) continue;
            if ([CONFIG.REPLACEMENT_REQUEST_STATUS.COMPLETED, CONFIG.REPLACEMENT_REQUEST_STATUS.SUPERSEDED].includes(r.status)) {
                continue;
            }
            const prevStatus = r.status;
            await this.updateReplacementRequest(r.id, { status: CONFIG.REPLACEMENT_REQUEST_STATUS.SUPERSEDED });
            if (prevStatus === CONFIG.REPLACEMENT_REQUEST_STATUS.SUPERSEDED) continue;

            try {
                await this.createAuditLog({
                    userId: context.actorUserId || 'system',
                    action: 'replacement_superseded',
                    entityType: 'replacement_request',
                    entityId: r.id,
                    details: {
                        replacementRequestId: r.id,
                        supersededBy: context.actorUserId || null,
                        selectedReplacementRequestId: keepRequestId,
                        matchId,
                        dealId: r.dealId || context.dealId || null,
                        role: r.roleToFill || null,
                        roleSlotId: r.slotKey || slotKey
                    }
                });
            } catch (e) {
                void e;
            }
        }
    }

    async finalizeParticipantReplacement(requestId, actorUserId) {
        const request = await this.getReplacementRequestById(requestId);
        if (!request) throw new Error('Replacement request not found.');
        const match = await this.getPostMatchById(request.matchId);
        if (!match) throw new Error('Match not found.');
        const isOwner = await this.isUserOwnerOfPostMatch(match, actorUserId);
        const actorRole = await this._getActorRole(actorUserId);
        assertNotReadOnlyAdmin(actorRole);
        assertReplacementOwnerOrAdmin(isOwner, actorRole);
        if (request.status !== CONFIG.REPLACEMENT_REQUEST_STATUS.REPLACEMENT_ACCEPTED) {
            throw new Error('The replacement must be accepted before finalizing.');
        }

        const newUserId = request.invitedUserId || request.suggestedUserId;
        if (!newUserId) throw new Error('No replacement participant to add.');
        const oldUserId = request.blockedParticipantId;
        if (!oldUserId) throw new Error('Blocked participant is missing.');

        const dealId = request.dealId || match.dealId;
        if (dealId) {
            const deal = await this.getDealById(dealId);
            if (deal?.contractId) {
                const contract = await this.getContractById(deal.contractId);
                if (contract && (contract.status || '') === CONFIG.CONTRACT_STATUS.ACTIVE) {
                    throw new Error('This contract is already active. Use contract amendment or termination flow.');
                }
            }
            if (deal) {
                const participants = (deal.participants || []).map(p =>
                    p.userId === oldUserId && !p.replacedByUserId
                        ? { ...p, status: 'dropped', replacedByUserId: newUserId }
                        : p
                );
                if (!participants.some(p => p.userId === newUserId)) {
                    participants.push({
                        userId: newUserId,
                        role: request.roleToFill || 'consortium_member',
                        opportunityId: request.blockedOpportunityId || null,
                        approvalStatus: 'pending',
                        signedAt: null,
                        status: 'active'
                    });
                }
                await this.updateDeal(dealId, { participants });
                if (deal.contractId) {
                    await this.amendContractAddParty(deal.contractId, {
                        userId: newUserId,
                        role: request.roleToFill || 'consortium_member'
                    });
                }
            }
        }

        const participants = (match.participants || []).map(p => {
            if (p.userId === oldUserId) {
                return {
                    ...p,
                    participantStatus: 'declined',
                    replacedByUserId: newUserId
                };
            }
            return p;
        });
        if (!participants.some(p => p.userId === newUserId)) {
            participants.push({
                userId: newUserId,
                role: request.roleToFill || 'consortium_member',
                opportunityId: request.blockedOpportunityId || null,
                participantStatus: 'pending',
                respondedAt: null
            });
        }

        const payload = this._swapUserInPostMatchPayload(
            match,
            oldUserId,
            newUserId,
            request.blockedOpportunityId
        );

        await this.updatePostMatch(match.id, { participants, payload, replacementRequestId: request.id });

        await this.updateReplacementRequest(requestId, { status: CONFIG.REPLACEMENT_REQUEST_STATUS.COMPLETED });
        await this._supersedeCompetingReplacementRequests(match.id, request.slotKey, requestId, {
            actorUserId,
            dealId: request.dealId || match.dealId
        });

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'participant_replaced',
                entityType: 'match',
                entityId: match.id,
                details: {
                    replacementRequestId: requestId,
                    droppedUserId: oldUserId,
                    newUserId
                }
            });
        } catch (e) {
            void e;
        }

        await this._notifyReplacementStakeholders(match.id, {
            type: 'replacement_completed',
            title: 'Participant replaced',
            message: 'The match participants were updated after a replacement.',
            link: '/matches/' + match.id
        }, actorUserId);

        return await this.getPostMatchById(match.id);
    }

    async getReplacementMatchingAnalytics() {
        const requests = await this.getReplacementRequests();
        const postMatches = await this.getPostMatches();
        const blockedMatches = postMatches.filter(m =>
            isReplacementEligibleMatchType(m.matchType)
            && (m.participants || []).some(p => (p.participantStatus || '') === 'declined')
        ).length;
        const pendingReview = requests.filter(r => r.status === CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_OWNER_REVIEW).length;
        const invitationsSent = requests.filter(r =>
            [CONFIG.REPLACEMENT_REQUEST_STATUS.INVITATION_SENT, CONFIG.REPLACEMENT_REQUEST_STATUS.PENDING_INVITATION].includes(r.status)
        ).length;
        const accepted = requests.filter(r => r.status === CONFIG.REPLACEMENT_REQUEST_STATUS.REPLACEMENT_ACCEPTED).length;
        const completed = requests.filter(r => r.status === CONFIG.REPLACEMENT_REQUEST_STATUS.COMPLETED).length;
        const conversionRate = invitationsSent > 0
            ? Math.round((completed / invitationsSent) * 100) + '%'
            : '—';
        return { blockedMatches, pendingReview, invitationsSent, accepted, completed, conversionRate };
    }

    async getDealFlowMatchingAnalytics() {
        const deals = await this.getDeals();
        const fromMatches = deals.filter(d => d.matchId && !d.applicationId).length;
        const fromApplications = deals.filter(d => d.applicationId).length;
        const fromNegotiations = deals.filter(d => d.negotiationId).length;
        const draftDeals = deals.filter(d =>
            (d.status || '') === CONFIG.DEAL_STATUS.DRAFT || (d.status || '') === 'draft'
        ).length;
        const activeDeals = deals.filter(d => (d.status || '') === CONFIG.DEAL_STATUS.ACTIVE).length;
        const withContracts = deals.filter(d => d.contractId).length;
        return {
            dealsFromMatches: fromMatches,
            dealsFromApplications: fromApplications,
            dealsFromNegotiations: fromNegotiations,
            draftDeals,
            activeDeals,
            dealsWithContracts: withContracts
        };
    }

    async updateApplication(id, updates) {
        const applications = await this.getApplications();
        const index = applications.findIndex(a => a.id === id);
        if (index === -1) return null;

        if (updates) {
            const merged = { ...applications[index], ...updates };
            const appValue = merged.application_value || {};
            _runWindowValidator('validateApplication', {
                proposal: merged.proposal,
                estimatedDurationDays: merged.estimatedDurationDays,
                offeredValue: appValue.offered_value ?? appValue.requested_value,
                bidAmount: merged.responses?.taskBidAmount,
                availabilityDate: merged.availabilityDate
            }, { requireProposal: false });
        }

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
     * @param {Object} [options] - { ownerId } to enforce owner check; { allowStaff: true } for admin/moderator viewing any application on the opportunity
     * @returns {Promise<Object|null>}
     */
    async getApplicationDetail(applicationId, options = {}) {
        const application = await this.getApplicationById(applicationId);
        if (!application) return null;

        const opportunity = await this.getOpportunityById(application.opportunityId);
        if (
            options.ownerId &&
            opportunity &&
            opportunity.creatorId !== options.ownerId &&
            !options.allowStaff
        ) {
            return null;
        }

        const applicant = await this.getUserById(application.applicantId) || await this.getCompanyById(application.applicantId);
        const requirementsMatch = await this.getApplicationRequirements(applicationId);
        const paymentTerms = await this.getApplicationPaymentTerms(applicationId);
        const deliverables = await this.getApplicationDeliverables(applicationId);
        const files = await this.getApplicationFiles(applicationId);

        // Match record for AI breakdown (Section 2) — post_matches first, legacy only when enabled
        const candidateId = application.applicantId;
        const postMatches = await this.getPostMatchesByOpportunityId(application.opportunityId);
        let match = postMatches.find(pm =>
            pm.applicationId === applicationId
            || (pm.participants || []).some(p => p.userId === candidateId)
        ) || null;
        if (!match && this._isLegacyPersonOpportunityEnabled()) {
            const matches = await this.getMatches();
            match = matches.find(m =>
                m.opportunityId === application.opportunityId
                && (m.candidateId === candidateId || m.userId === candidateId)
            ) || null;
        }
        let matchScore = application.matchScore != null ? application.matchScore : (match && match.matchScore != null ? match.matchScore : null);
        let matchBreakdown = application.matchBreakdown || null;
        const matchCriteria = match && (match.criteria || (match.payload && match.payload.criteria));
        if (!matchBreakdown && matchCriteria) {
            const c = matchCriteria;
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
        if (matchScore != null && matchBreakdown && typeof matchBreakdown.skillMatch !== 'number' && matchCriteria && typeof matchCriteria === 'object') {
            const cr = matchCriteria;
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
            matchType: application.matchType || (match && (match.matchType || match.model)) || null
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

    allContractPartiesSigned(contract) {
        const parties = this.getContractParties(contract);
        if (!parties.length) return false;
        return parties.every(p => !!p && !!p.userId && !!p.signedAt);
    }

    /**
     * Build payload for a pending contract from an in-flight deal (signing or repair).
     */
    async _buildPendingContractPayloadFromDeal(deal) {
        const activeParts = (deal.participants || []).filter(p => (p.status || 'active') !== 'dropped');
        const parties = activeParts.map(p => ({
            userId: p.userId,
            role: p.role || 'participant',
            signedAt: p.signedAt || null
        }));
        const oppId = deal.opportunityId || (deal.opportunityIds && deal.opportunityIds[0]) || null;
        const opportunityIds = Array.isArray(deal.opportunityIds) && deal.opportunityIds.length
            ? [...deal.opportunityIds]
            : (oppId ? [oppId] : []);
        let matchId = deal.matchId || null;
        let negotiationId = deal.negotiationId || null;
        let invitationId = null;
        if (deal.applicationId) {
            const app = await this.getApplicationById(deal.applicationId);
            if (app) {
                invitationId = app.invitationId || null;
                matchId = matchId || app.matchId || null;
            }
        }
        if (matchId && !invitationId) {
            const postMatch = await this.getPostMatchById(matchId);
            if (postMatch?.invitationId) invitationId = postMatch.invitationId;
        }
        const duration =
            deal.timeline && (deal.timeline.start || deal.timeline.end)
                ? (deal.timeline.start || '') + ' to ' + (deal.timeline.end || '')
                : '';
        let milestonesSnapshot = null;
        if (Array.isArray(deal.milestones) && deal.milestones.length) {
            try {
                milestonesSnapshot = JSON.parse(JSON.stringify(deal.milestones));
            } catch {
                milestonesSnapshot = deal.milestones;
            }
        }
        return {
            dealId: deal.id,
            opportunityId: oppId,
            opportunityIds,
            matchId,
            applicationId: deal.applicationId || null,
            negotiationId,
            invitationId,
            parties,
            scope: deal.scope || '',
            paymentMode: deal.exchangeMode || 'cash',
            agreedValue: deal.valueTerms && deal.valueTerms.agreedValue != null ? deal.valueTerms.agreedValue : null,
            duration,
            paymentSchedule: deal.valueTerms && deal.valueTerms.paymentSchedule != null ? deal.valueTerms.paymentSchedule : null,
            milestonesSnapshot,
            status: CONFIG.CONTRACT_STATUS.PENDING,
            signedAt: null
        };
    }

    async createPendingContractFromDeal(deal) {
        if (deal?.id) {
            const existing = await this.getContractByDealId(deal.id);
            if (existing) return existing;
        }
        const payload = await this._buildPendingContractPayloadFromDeal(deal);
        return this.createContract(payload);
    }

    /**
     * Legacy repair: deal already in signing without contractId (pre–pending-contract behavior).
     */
    async repairSigningDealMissingContract(dealId) {
        const deal = await this.getDealById(dealId);
        if (!deal || deal.status !== CONFIG.DEAL_STATUS.SIGNING || deal.contractId) return deal;
        const contract = await this.createPendingContractFromDeal(deal);
        await this.updateDeal(dealId, { contractId: contract.id });
        try {
            await this.createAuditLog({
                userId: 'system',
                action: 'contract_created',
                entityType: 'contract',
                entityId: contract.id,
                details: { dealId, repairSigningGap: true }
            });
        } catch (e) {
            void e;
        }
        const parts = (deal.participants || []).filter(p => (p.status || 'active') !== 'dropped');
        for (const p of parts) {
            if (!p.userId) continue;
            try {
                await this.createNotification({
                    userId: p.userId,
                    type: 'contract_ready_for_signature',
                    title: 'Contract ready for signature',
                    message: 'A Contract Agreement is now attached to your deal. Please review and sign.',
                    link: '/deals/' + dealId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
        return this.getDealById(dealId);
    }

    /**
     * After all participants approved in review: move to signing and attach a pending contract.
     */
    async transitionDealToSigningWithContract(dealId, actorUserId) {
        let deal = await this.getDealById(dealId);
        if (!deal) return null;
        const activeParts = (deal.participants || []).filter(p => (p.status || 'active') !== 'dropped');
        const allApproved = activeParts.length > 0 && activeParts.every(p => p.approvalStatus === 'approved');
        if (!allApproved) return deal;

        let contract = null;
        if (deal.contractId) {
            contract = await this.getContractById(deal.contractId);
        }
        const createdNew = !contract;
        if (!contract) {
            contract = await this.createPendingContractFromDeal(deal);
        }
        await this.updateDeal(dealId, { status: CONFIG.DEAL_STATUS.SIGNING, contractId: contract.id });
        const actor = actorUserId || 'system';
        if (createdNew) {
            try {
                await this.createAuditLog({
                    userId: actor,
                    action: 'contract_created',
                    entityType: 'contract',
                    entityId: contract.id,
                    details: { dealId }
                });
            } catch (e) {
                void e;
            }
        }
        try {
            await this.createAuditLog({
                userId: actor,
                action: 'deal_approved_for_signing',
                entityType: 'deal',
                entityId: dealId,
                details: { contractId: contract.id }
            });
        } catch (e) {
            void e;
        }
        for (const p of activeParts) {
            if (!p.userId) continue;
            try {
                await this.createNotification({
                    userId: p.userId,
                    type: 'contract_ready_for_signature',
                    title: 'Contract ready for signature',
                    message: 'Review the Contract Agreement and sign when you are ready.',
                    link: '/deals/' + dealId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
        return this.getDealById(dealId);
    }

    async getContractsByUserId(userId) {
        const contracts = await this.getContracts();
        return contracts.filter(c => this.getContractParties(c).some(p => p.userId === userId));
    }

    async createContract(contractData) {
        if (contractData?.dealId) {
            const existing = await this.getContractByDealId(contractData.dealId);
            if (existing) return existing;
        }
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
        const oppIds = Array.isArray(contractData.opportunityIds) && contractData.opportunityIds.length
            ? contractData.opportunityIds
            : (contractData.opportunityId ? [contractData.opportunityId] : []);
        const newContract = {
            id: this.generateId(),
            dealId: contractData.dealId || null,
            opportunityId: contractData.opportunityId || oppIds[0] || null,
            opportunityIds: oppIds,
            matchId: contractData.matchId || null,
            applicationId: contractData.applicationId || null,
            negotiationId: contractData.negotiationId || null,
            invitationId: contractData.invitationId || null,
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

        const current = contracts[index];

        if (updates && updates.status != null && updates.status !== current.status) {
            enforceTransition('contract', current, updates.status);
        }

        if (updates) {
            _runWindowValidator('validateContract', updates, { requireScope: false });
        }

        let updated = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        contracts[index] = updated;
        this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);

        // When all parties have signed while contract is still pending, activate contract + deal together.
        const nowFullySigned = this.allContractPartiesSigned(updated);
        if (nowFullySigned && updated.status === CONFIG.CONTRACT_STATUS.PENDING) {
            const activationTime = new Date().toISOString();
            enforceTransition('contract', current, CONFIG.CONTRACT_STATUS.ACTIVE);
            const activated = {
                ...updated,
                status: CONFIG.CONTRACT_STATUS.ACTIVE,
                signedAt: updated.signedAt || activationTime,
                updatedAt: activationTime
            };
            contracts[index] = activated;
            updated = activated;
            this.storage.set(CONFIG.STORAGE_KEYS.CONTRACTS, contracts);

            if (updated.dealId) {
                const deal = await this.getDealById(updated.dealId);
                if (deal) {
                    const parties = this.getContractParties(updated);
                    const mergedParticipants = (deal.participants || []).map(dp => {
                        const cp = parties.find(p => p.userId === dp.userId);
                        if (cp && cp.signedAt) return { ...dp, signedAt: cp.signedAt };
                        return dp;
                    });
                    await this.updateDeal(updated.dealId, {
                        status: CONFIG.DEAL_STATUS.ACTIVE,
                        participants: mergedParticipants
                    });
                }
            }
            try {
                await this.createAuditLog({
                    userId: 'system',
                    action: 'contract_activated',
                    entityType: 'contract',
                    entityId: id,
                    details: { dealId: updated.dealId }
                });
            } catch (e) {
                void e;
            }
            if (updated.dealId) {
                try {
                    await this.createAuditLog({
                        userId: 'system',
                        action: 'deal_activated',
                        entityType: 'deal',
                        entityId: updated.dealId,
                        details: { contractId: id }
                    });
                } catch (e) {
                    void e;
                }
                const d2 = await this.getDealById(updated.dealId);
                const notifyParts = (d2 && d2.participants) || [];
                for (const p of notifyParts) {
                    if (!p.userId) continue;
                    try {
                        await this.createLifecycleNotification({
                            userId: p.userId,
                            type: 'contract_fully_signed',
                            entityType: 'contract',
                            entityId: id,
                            title: 'Contract fully signed',
                            message: 'All required parties signed the Contract Agreement. Your deal is now active.',
                            link: '/deals/' + updated.dealId,
                            read: false
                        });
                        await this.createLifecycleNotification({
                            userId: p.userId,
                            type: 'deal_activated',
                            entityType: 'deal',
                            entityId: updated.dealId,
                            title: 'Deal activated',
                            message: 'Your deal workspace is now active. You can start execution when ready.',
                            link: '/deals/' + updated.dealId,
                            read: false
                        });
                    } catch (e) {
                        void e;
                    }
                }
            }
        }

        emitDataChange(PMTWIN_EVENTS.CONTRACTS_UPDATED, { contractId: id });
        return updated;
    }

    /**
     * Record one party signature; no-op if that party already signed.
     */
    async signContractParty(contractId, userId, options = {}) {
        this._assertPortalCanMutate(options);
        const contract = await this.getContractById(contractId);
        if (!contract) throw new Error('Contract not found.');
        if ((contract.status || '') !== CONFIG.CONTRACT_STATUS.PENDING) {
            throw new Error(PERMISSION_ERRORS.ALREADY_COMPLETED);
        }
        const parties = this.getContractParties(contract);
        const mine = parties.find(p => p.userId === userId);
        if (!mine) throw new Error('You are not a party to this contract.');
        if (mine.signedAt) return contract;

        const signedAt = new Date().toISOString();
        const nextParties = parties.map(p =>
            p.userId === userId ? { ...p, signedAt } : p
        );
        const updated = await this.updateContract(contractId, { parties: nextParties });
        await this._emitContractPartySigned(updated, userId, signedAt);
        return updated;
    }

    /**
     * Central audit/notification when one party signs (UI should not duplicate).
     */
    async _emitContractPartySigned(contract, userId, signedAt) {
        if (!contract || !userId) return;
        const dealId = contract.dealId || null;
        try {
            await this.createAuditLog({
                userId,
                action: 'contract_signed',
                entityType: 'contract',
                entityId: contract.id,
                details: { dealId, signedAt: signedAt || new Date().toISOString() }
            });
        } catch (e) {
            void e;
        }

        const parties = this.getContractParties(contract);
        const link = dealId ? '/deals/' + dealId : '/contracts/' + contract.id;
        for (const p of parties) {
            if (!p.userId || p.userId === userId) continue;
            try {
                await this.createLifecycleNotification({
                    userId: p.userId,
                    type: 'contract_signed',
                    entityType: 'contract',
                    entityId: contract.id,
                    title: 'A party signed the contract',
                    message: 'Another participant signed the Contract Agreement.',
                    link,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
    }

    /**
     * When a deal is cancelled or rejected, terminate the linked contract (pending or active).
     * Skips completed/terminated contracts. Writes audit `contract_terminated` and notifies other parties.
     * @param {string} dealId
     * @param {string} contractId
     * @param {string} [actorUserId]
     * @param {string} [reason] — e.g. 'deal_cancelled' | 'deal_rejected'
     */
    async terminateLinkedContractForCancelledDeal(dealId, contractId, actorUserId, reason) {
        if (!contractId) return;
        const contract = await this.getContractById(contractId);
        if (!contract) return;
        const st = contract.status;
        if (st === CONFIG.CONTRACT_STATUS.TERMINATED || st === CONFIG.CONTRACT_STATUS.COMPLETED) return;
        if (st !== CONFIG.CONTRACT_STATUS.PENDING && st !== CONFIG.CONTRACT_STATUS.ACTIVE) return;

        await this.updateContract(contractId, { status: CONFIG.CONTRACT_STATUS.TERMINATED });

        const uid = actorUserId || 'system';
        try {
            await this.createAuditLog({
                userId: uid,
                action: 'contract_terminated',
                entityType: 'contract',
                entityId: contractId,
                details: { dealId, reason: reason || 'deal_cancelled' }
            });
        } catch (e) {
            void e;
        }

        const after = await this.getContractById(contractId);
        const parties = after ? this.getContractParties(after) : [];
        const msg =
            reason === 'deal_rejected'
                ? 'The Contract Agreement was terminated because the deal was rejected.'
                : 'The Contract Agreement was terminated because the deal was cancelled.';
        for (const p of parties) {
            if (!p.userId || p.userId === actorUserId) continue;
            try {
                await this.createNotification({
                    userId: p.userId,
                    type: 'contract_terminated',
                    title: 'Contract terminated',
                    message: msg,
                    link: '/contracts/' + contractId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
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

    async assertDealCreationSource(dealData) {
        const matchId = dealData && dealData.matchId;
        const applicationId = dealData && dealData.applicationId;
        const negotiationId = dealData && dealData.negotiationId;

        if (!matchId && !applicationId && !negotiationId) {
            throw new Error('A deal requires a confirmed match, accepted application, or agreed negotiation.');
        }

        if (matchId) {
            const sourcePostMatch = dealData && dealData.sourcePostMatch && dealData.sourcePostMatch.id === matchId
                ? dealData.sourcePostMatch
                : null;
            const postMatch = sourcePostMatch || await this.getPostMatchById(matchId);
            if (!postMatch || (postMatch.status || '') !== CONFIG.POST_MATCH_STATUS.CONFIRMED) {
                throw new Error('A deal can only be created from a confirmed match.');
            }
        }

        if (applicationId) {
            const application = await this.getApplicationById(applicationId);
            if (!application || (application.status || '') !== CONFIG.APPLICATION_STATUS.ACCEPTED) {
                throw new Error('A deal can only be created from an accepted application.');
            }
        }

        if (negotiationId) {
            const negotiation = await this.getNegotiationById(negotiationId);
            if (!negotiation || (negotiation.status || '') !== 'agreed') {
                throw new Error('A deal can only be created from agreed negotiation terms.');
            }
        }
    }

    async linkEntitiesAfterDealCreated(deal, options = {}) {
        if (!deal || !deal.id) return deal;
        const actorUserId = options.actorUserId || 'system';

        let matchId = deal.matchId || null;
        if (!matchId && deal.applicationId) {
            const app = await this.getApplicationById(deal.applicationId);
            matchId = app?.matchId || null;
        }
        if (!matchId && deal.negotiationId) {
            const neg = await this.getNegotiationById(deal.negotiationId);
            matchId = neg?.matchId || null;
        }

        if (matchId) {
            await this.updatePostMatch(matchId, { dealId: deal.id }).catch(() => null);
        }
        if (deal.applicationId) {
            await this.updateApplication(deal.applicationId, { dealId: deal.id }).catch(() => null);
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'deal_linked_to_sources',
                entityType: 'deal',
                entityId: deal.id,
                details: {
                    matchId,
                    applicationId: deal.applicationId || null,
                    negotiationId: deal.negotiationId || null
                }
            });
        } catch (e) {
            void e;
        }

        return deal;
    }

    async createDealFromApplication(applicationId, actorUserId, options = {}) {
        this._assertPortalCanMutate(options);
        const application = await this.getApplicationById(applicationId);
        if (!application) throw new Error('Application not found.');
        if (!canCreateDealFromApplication(application)) {
            throw new Error('A deal can only be created from an accepted application.');
        }

        const existing = await this.getDealByApplicationId(applicationId);
        if (existing) {
            await this.linkEntitiesAfterDealCreated(existing, { actorUserId });
            return existing;
        }

        const opp = await this.getOpportunityById(application.opportunityId);
        if (!opp) throw new Error('Opportunity not found.');
        if (opp.creatorId !== actorUserId) {
            throw new Error('Only the opportunity owner can create a deal from this application.');
        }

        const built = buildDealPayloadFromApplication(application, opp);
        const agreedStatus = CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED;
        let negotiationId = built.negotiationId || null;
        if (negotiationId) {
            const linkedNeg = await this.getNegotiationById(negotiationId);
            if (!linkedNeg || (linkedNeg.status || '').toLowerCase() !== agreedStatus) {
                negotiationId = null;
            }
        }
        if (!negotiationId) {
            const negs = await this.getNegotiationsByApplicationId(applicationId);
            const agreed = (negs || []).find(n =>
                (n.status || '').toLowerCase() === agreedStatus
            );
            negotiationId = agreed?.id || null;
        }

        const deal = await this.createDeal({
            applicationId: built.applicationId,
            matchId: built.matchId,
            negotiationId,
            opportunityId: built.opportunityId,
            opportunityIds: built.opportunityIds,
            status: CONFIG.DEAL_STATUS.DRAFT,
            title: 'Deal – ' + (opp.title || application.id),
            participants: built.participants.map(p => ({
                ...p,
                approvalStatus: 'pending',
                signedAt: null
            })),
            scope: built.scope,
            exchangeMode: built.exchangeMode,
            valueTerms: { agreedValue: null, paymentSchedule: '' },
            timeline: { start: null, end: null },
            deliverables: '',
            milestones: []
        });

        await this.linkEntitiesAfterDealCreated(deal, { actorUserId });

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'deal_created_from_application',
                entityType: 'deal',
                entityId: deal.id,
                details: {
                    applicationId,
                    opportunityId: opp.id,
                    matchId: built.matchId
                }
            });
        } catch (e) {
            void e;
        }

        if (application.applicantId) {
            try {
                await this.createLifecycleNotification({
                    userId: application.applicantId,
                    type: 'deal_created_from_application',
                    entityType: 'deal',
                    entityId: deal.id,
                    title: 'Deal workspace created',
                    message: 'A draft Deal Workspace was created for your accepted application.',
                    link: '/deals/' + deal.id,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        return deal;
    }

    async createDealFromMatch(postMatch, actorUserId = null, options = {}) {
        this._assertPortalCanMutate(options);
        const payload = buildDealPayloadFromMatch(postMatch, CONFIG.POST_MATCH_STATUS.CONFIRMED);

        const { matchId, matchType, participants, opportunityIds, primaryOpportunityId, payload: consortiumPayload, roleSlots } = payload;
        const actor = actorUserId || participants[0]?.userId;
        if (actor) {
            assertMatchParticipant(postMatch, actor);
        }
        const existing = await this.getDealByMatchId(matchId);
        if (existing) {
            await this.linkEntitiesAfterDealCreated(existing, { actorUserId: actor });
            return existing;
        }

        const dealParticipants = participants.map(p => ({
            userId: p.userId,
            role: p.role || 'participant',
            approvalStatus: 'pending',
            signedAt: null
        }));

        const deal = await this.createDeal({
            matchId,
            matchType,
            status: CONFIG.DEAL_STATUS.DRAFT,
            title: 'Deal – ' + matchId,
            participants: dealParticipants,
            opportunityIds,
            opportunityId: primaryOpportunityId,
            payload: consortiumPayload,
            roleSlots,
            sourcePostMatch: postMatch,
            negotiationId: null,
            scope: '',
            timeline: { start: null, end: null },
            exchangeMode: 'cash',
            valueTerms: { agreedValue: null, paymentSchedule: '' },
            deliverables: '',
            milestones: []
        });

        try {
            const auditCtx = {
                matchId,
                opportunityId: primaryOpportunityId,
                sourceOpportunityId: primaryOpportunityId,
                dealId: deal.id,
                actorRole: actor ? await this._getActorRole(actor) : null
            };
            await this.createAuditLog({
                userId: actor || 'system',
                action: 'deal_created_from_match',
                entityType: 'deal',
                entityId: deal.id,
                details: buildLifecycleAuditDetails({ summary: 'Deal created from confirmed match', opportunityIds }, auditCtx)
            });
            await this.createAuditLog({
                userId: actor || 'system',
                action: 'match_converted_to_deal',
                entityType: 'match',
                entityId: matchId,
                details: buildLifecycleAuditDetails({ summary: 'Match converted to deal' }, auditCtx)
            });
        } catch (e) {
            void e;
        }

        const seen = new Set();
        for (const p of participants) {
            if (!p.userId || seen.has(p.userId)) continue;
            seen.add(p.userId);
            try {
                await this.createLifecycleNotification({
                    userId: p.userId,
                    type: 'deal_created_from_match',
                    entityType: 'deal',
                    entityId: deal.id,
                    title: 'Deal workspace created',
                    message: 'A draft Deal Workspace is ready from your confirmed match.',
                    link: '/deals/' + deal.id,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        await this.linkEntitiesAfterDealCreated(deal, { actorUserId: actor });

        return deal;
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

    async createDeal(dealData, options = {}) {
        this._assertPortalCanMutate(options);
        await this.assertDealCreationSource(dealData || {});
        if (dealData && dealData.matchId) {
            const existingByMatch = await this.getDealByMatchId(dealData.matchId);
            if (existingByMatch) return existingByMatch;
        }
        if (dealData && dealData.applicationId) {
            const existingByApplication = await this.getDealByApplicationId(dealData.applicationId);
            if (existingByApplication) return existingByApplication;
        }
        if (dealData && dealData.negotiationId) {
            const existingByNegotiation = (await this.getDeals()).find(d => d.negotiationId === dealData.negotiationId) || null;
            if (existingByNegotiation) return existingByNegotiation;
        }

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

        if (updates) {
            _runWindowValidator('validateDealUpdate', updates);
        }

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
        emitDataChange(PMTWIN_EVENTS.DEALS_UPDATED, { dealId: id });
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
    getDefaultNegotiationExpiresAt(status) {
        const s = (status || 'open').toLowerCase();
        const active = ['open', 'counter_offered'];
        if (!active.includes(s)) return null;
        const configured = CONFIG.MATCHING && CONFIG.MATCHING.NEGOTIATION && CONFIG.MATCHING.NEGOTIATION.EXPIRE_DAYS;
        const parsed = Number(configured);
        const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    async expireStaleNegotiations() {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.NEGOTIATIONS) || [];
        let changed = false;
        const now = Date.now();
        const nowIso = new Date().toISOString();
        const expiredStatus = CONFIG.MATCHING.NEGOTIATION.STATUS.EXPIRED;
        for (let i = 0; i < list.length; i++) {
            const n = list[i];
            if (!n || !isActiveNegotiation(n)) continue;
            if (!n.expiresAt) continue;
            const t = new Date(n.expiresAt).getTime();
            if (Number.isNaN(t) || t >= now) continue;
            list[i] = {
                ...n,
                status: expiredStatus,
                updatedAt: nowIso
            };
            changed = true;
        }
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.NEGOTIATIONS, list);
        }
        return list;
    }

    async getNegotiations() {
        return this.expireStaleNegotiations();
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
        const status = negotiationData.status || 'open';
        const newNegotiation = {
            id: this.generateId(),
            opportunityId: negotiationData.opportunityId,
            matchId: negotiationData.matchId || null,
            applicationId: negotiationData.applicationId,
            parties: negotiationData.parties || [],
            status,
            initialTerms: negotiationData.initialTerms || null,
            currentTerms: negotiationData.currentTerms != null
                ? negotiationData.currentTerms
                : (negotiationData.initialTerms || null),
            discussionThread: negotiationData.discussionThread || [],
            adminNotes: negotiationData.adminNotes || [],
            rounds: negotiationData.rounds || [],
            agreedTerms: negotiationData.agreedTerms || null,
            expiresAt: (negotiationData.expiresAt != null && negotiationData.expiresAt !== '')
                ? negotiationData.expiresAt
                : this.getDefaultNegotiationExpiresAt(status),
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

    getActiveNegotiationForMatch(matchId) {
        return this.getNegotiationsByMatchId(matchId).then(list =>
            (list || []).find(n => isActiveNegotiation(n)) || null
        );
    }

    async assertNegotiationParticipant(negotiation, userId) {
        if (!negotiation || !userId) {
            throw new Error('Negotiation participant required.');
        }
        const parties = negotiation.parties || [];
        if (!parties.some(p => p.userId === userId)) {
            throw new Error('You are not a participant in this negotiation.');
        }
    }

    _negotiationWorkspaceLink(negotiation) {
        if (!negotiation || !negotiation.id) return '/pipeline/matches';
        return '/negotiations/' + negotiation.id;
    }

    _proposalHasTermChanges(proposal) {
        if (!proposal || typeof proposal !== 'object') return false;
        return Object.keys(proposal).some((key) => {
            if (key === 'exchangeMode') return false;
            const val = proposal[key];
            return val !== undefined && val !== null && val !== '';
        });
    }

    _buildInitialTermsFromApplication(application) {
        if (!application) return null;
        const av = application.application_value || {};
        const value = av.requestedValue != null ? av.requestedValue : av.offeredValue;
        if (value == null && !application.proposal) return null;
        return {
            value: value != null ? value : undefined,
            currency: av.requestedCurrency || av.currency || 'SAR',
            message: (application.proposal || application.coverLetter || '').slice(0, 500) || undefined
        };
    }

    async _linkNegotiationToRecords(negotiation) {
        if (negotiation.matchId) {
            const postMatch = await this.getPostMatchById(negotiation.matchId);
            if (postMatch) {
                await this.updatePostMatch(negotiation.matchId, { negotiationId: negotiation.id });
            } else if (this._isLegacyPersonOpportunityEnabled()) {
                await this.updateMatch(negotiation.matchId, { negotiationId: negotiation.id });
            }
        }
        if (negotiation.applicationId) {
            await this.updateApplication(negotiation.applicationId, { negotiationId: negotiation.id });
        }
    }

    /**
     * Resolve which opportunity anchors a match negotiation for the acting user.
     * Prefers the viewer's own post (Need or Offer) so both sides can start negotiations.
     */
    _resolveNegotiationOpportunityId(matchRecord, actorUserId, options = {}) {
        if (options.opportunityId) return options.opportunityId;
        const payload = matchRecord?.payload || {};
        const matchType = matchRecord?.matchType || 'one_way';
        const myParts = (matchRecord?.participants || []).filter(p => p.userId === actorUserId);
        const myOppId = myParts.map(p => p.opportunityId).find(Boolean);
        if (myOppId) return myOppId;

        if (matchType === 'one_way') {
            const needOwner = (matchRecord.participants || []).find(p => p.role === 'need_owner');
            const offerProvider = (matchRecord.participants || []).find(p => p.role === 'offer_provider');
            if (needOwner?.userId === actorUserId) return payload.needOpportunityId || null;
            if (offerProvider?.userId === actorUserId) return payload.offerOpportunityId || null;
            return payload.needOpportunityId || payload.offerOpportunityId || null;
        }
        if (matchType === 'two_way') {
            const sideA = payload.sideA || {};
            const sideB = payload.sideB || {};
            if (sideA.userId === actorUserId) return sideA.needId || sideA.offerId || null;
            if (sideB.userId === actorUserId) return sideB.needId || sideB.offerId || null;
        }
        if (matchType === 'consortium') {
            const lead = (matchRecord.participants || []).find(p => p.role === 'consortium_lead');
            if (lead?.userId === actorUserId) return payload.leadNeedId || null;
            const member = (matchRecord.participants || []).find(p => p.userId === actorUserId);
            if (member?.opportunityId) return member.opportunityId;
            const roleEntry = (payload.roles || []).find(r => r.userId === actorUserId);
            if (roleEntry?.opportunityId) return roleEntry.opportunityId;
            return payload.leadNeedId || null;
        }
        if (matchType === 'circular') {
            const links = payload.links || [];
            for (const link of links) {
                const from = link.fromCreatorId || link.from;
                if (from === actorUserId) return link.needId || link.offerId || null;
            }
            const first = links[0];
            return first?.needId || first?.offerId || null;
        }
        return payload.needOpportunityId || payload.leadNeedId || matchRecord.opportunityId || null;
    }

    async startNegotiationFromMatch(matchId, actorUserId, options = {}) {
        this._assertPortalCanMutate(options);
        const postMatch = await this.getPostMatchById(matchId);
        let matchRecord = postMatch;
        if (!matchRecord && this._isLegacyPersonOpportunityEnabled()) {
            const legacy = await this.getMatches();
            matchRecord = legacy.find(m => m.id === matchId) || null;
        }
        if (!matchRecord) throw new Error('Match not found.');

        assertMatchParticipant(matchRecord, actorUserId);
        const participants = matchRecord.participants || [];

        const existing = await this.getActiveNegotiationForMatch(matchId);
        if (existing) return existing;

        const opportunityId = this._resolveNegotiationOpportunityId(matchRecord, actorUserId, options);
        if (!opportunityId) throw new Error('Could not resolve opportunity for this negotiation.');

        const applicationId = matchRecord.applicationId || options.applicationId || null;
        let application = null;
        if (applicationId) application = await this.getApplicationById(applicationId);

        const parties = participants
            .filter(p => p.userId)
            .map(p => ({ userId: p.userId, role: p.role || 'participant' }));

        const initialTerms = options.initialTerms
            || this._buildInitialTermsFromApplication(application)
            || { message: 'Negotiation opened from opportunity match.' };

        const negotiation = await this.createNegotiation({
            opportunityId,
            matchId,
            applicationId,
            parties,
            status: CONFIG.MATCHING.NEGOTIATION.STATUS.OPEN,
            initialTerms,
            rounds: []
        });

        await this._linkNegotiationToRecords(negotiation);

        const opp = await this.getOpportunityById(opportunityId);
        if (opp && (opp.status || '') === CONFIG.OPPORTUNITY_STATUS.PUBLISHED) {
            await this.updateOpportunity(opportunityId, { status: CONFIG.OPPORTUNITY_STATUS.IN_NEGOTIATION });
        }

        const otherIds = parties.map(p => p.userId).filter(id => id !== actorUserId);
        for (const uid of otherIds) {
            try {
                await this.createNotification({
                    userId: uid,
                    type: 'negotiation_started',
                    title: 'Negotiation started',
                    message: 'A participant started negotiating terms on your opportunity match.',
                    link: this._negotiationWorkspaceLink(negotiation),
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'negotiation_started',
                entityType: 'negotiation',
                entityId: negotiation.id,
                details: { matchId, opportunityId, applicationId }
            });
        } catch (e) {
            void e;
        }

        return negotiation;
    }

    async startNegotiationFromApplication(applicationId, actorUserId, options = {}) {
        this._assertPortalCanMutate(options);
        const application = await this.getApplicationById(applicationId);
        if (!application) throw new Error('Application not found.');

        const opp = await this.getOpportunityById(application.opportunityId);
        const isOwner = opp && opp.creatorId === actorUserId;
        const isApplicant = application.applicantId === actorUserId;
        if (!isOwner && !isApplicant) {
            throw new Error('Only the opportunity owner or applicant can start negotiation.');
        }

        const existingList = await this.getNegotiationsByApplicationId(applicationId);
        const existing = (existingList || []).find(n => isActiveNegotiation(n));
        if (existing) return existing;

        if (application.matchId) {
            return this.startNegotiationFromMatch(application.matchId, actorUserId, {
                applicationId,
                opportunityId: application.opportunityId
            });
        }

        const parties = [];
        if (opp?.creatorId) parties.push({ userId: opp.creatorId, role: 'need_owner' });
        if (application.applicantId && !parties.some(p => p.userId === application.applicantId)) {
            parties.push({ userId: application.applicantId, role: 'offer_provider' });
        }

        const negotiation = await this.createNegotiation({
            opportunityId: application.opportunityId,
            matchId: null,
            applicationId,
            parties,
            status: CONFIG.MATCHING.NEGOTIATION.STATUS.OPEN,
            initialTerms: this._buildInitialTermsFromApplication(application),
            rounds: []
        });

        await this.updateApplication(applicationId, { negotiationId: negotiation.id });

        if (opp && (opp.status || '') === CONFIG.OPPORTUNITY_STATUS.PUBLISHED) {
            await this.updateOpportunity(application.opportunityId, { status: CONFIG.OPPORTUNITY_STATUS.IN_NEGOTIATION });
        }

        const notifyIds = parties.map(p => p.userId).filter(id => id !== actorUserId);
        for (const uid of notifyIds) {
            try {
                await this.createNotification({
                    userId: uid,
                    type: 'negotiation_started',
                    title: 'Negotiation started',
                    message: 'Negotiation has started on an application for your opportunity.',
                    link: this._negotiationWorkspaceLink(negotiation),
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'negotiation_started',
                entityType: 'negotiation',
                entityId: negotiation.id,
                details: { applicationId, opportunityId: application.opportunityId }
            });
        } catch (e) {
            void e;
        }

        return negotiation;
    }

    async addNegotiationProposal(negotiationId, actorUserId, { proposal, message } = {}) {
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
        await this.assertNegotiationParticipant(negotiation, actorUserId);
        if (!isActiveNegotiation(negotiation)) {
            throw new Error('This negotiation is no longer active.');
        }
        await this._assertNegotiationFormalActionsAllowed(negotiation);

        const proposalPayload = proposal || {};
        const hasTermChanges = this._proposalHasTermChanges(proposalPayload);
        const msg = (message || '').trim();

        if (!hasTermChanges && msg) {
            const discussionThread = [...(negotiation.discussionThread || [])];
            discussionThread.push({
                id: this.generateId(),
                by: actorUserId,
                at: new Date().toISOString(),
                body: msg,
                type: 'message'
            });
            const updated = await this.updateNegotiation(negotiationId, { discussionThread });
            const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
            for (const uid of otherIds) {
                try {
                    await this.createNotification({
                        userId: uid,
                        type: 'negotiation_message',
                        title: 'New negotiation message',
                        message: msg.slice(0, 120),
                        link: this._negotiationWorkspaceLink(negotiation),
                        read: false
                    });
                } catch (e) {
                    void e;
                }
            }
            return updated;
        }

        const maxRounds = CONFIG.MATCHING.NEGOTIATION.MAX_ROUNDS || 10;
        const rounds = [...(negotiation.rounds || [])];
        if (rounds.length >= maxRounds) {
            throw new Error('Maximum negotiation rounds reached.');
        }

        await this._assertNegotiationFormalActionsAllowed(negotiation);

        if (hasTermChanges) {
            _runWindowValidator('validateNegotiationProposal', proposalPayload);
        }

        rounds.push({
            by: actorUserId,
            at: new Date().toISOString(),
            proposal: proposalPayload,
            message: msg
        });

        const baseTerms = getEffectiveTerms(negotiation);
        const currentTerms = hasTermChanges
            ? mergeProposalTerms(baseTerms, proposalPayload)
            : baseTerms;

        const updated = await this.updateNegotiation(negotiationId, {
            rounds,
            currentTerms,
            status: CONFIG.MATCHING.NEGOTIATION.STATUS.COUNTER_OFFERED
        });

        const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
        for (const uid of otherIds) {
            try {
                await this.createNotification({
                    userId: uid,
                    type: 'negotiation_countered',
                    title: 'New negotiation proposal',
                    message: msg || 'A counter-proposal was submitted.',
                    link: this._negotiationWorkspaceLink(negotiation),
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: normalizeAuditAction('negotiation_counter_offer'),
                entityType: 'negotiation',
                entityId: negotiationId,
                details: { roundIndex: rounds.length - 1, legacyAction: 'negotiation_counter_offer' }
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async agreeNegotiation(negotiationId, actorUserId, agreedTerms, options = {}) {
        this._assertPortalCanMutate(options);
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
        await this.assertNegotiationParticipant(negotiation, actorUserId);

        const agreedStatus = CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED;
        if ((negotiation.status || '') === agreedStatus) {
            return negotiation;
        }
        if (!isActiveNegotiation(negotiation)) {
            throw new Error('This negotiation is no longer active.');
        }
        await this._assertNegotiationFormalActionsAllowed(negotiation);
        if (hasParticipantAgreed(negotiation, actorUserId)) {
            return negotiation;
        }

        const lastRound = (negotiation.rounds || [])[negotiation.rounds.length - 1];
        const terms = agreedTerms
            || (lastRound && lastRound.proposal)
            || negotiation.initialTerms
            || {};

        const agreedAt = new Date().toISOString();
        const participantAgreements = [
            ...(negotiation.participantAgreements || []),
            { userId: actorUserId, agreedAt }
        ];
        const agreedBy = participantAgreements.map(a => ({
            userId: a.userId,
            agreedAt: a.agreedAt
        }));

        const allAgreed = allRequiredParticipantsAgreed(negotiation, participantAgreements);
        if (!allAgreed) {
            return this.updateNegotiation(negotiationId, {
                participantAgreements,
                agreedBy
            });
        }

        const match = negotiation.matchId
            ? await this.getPostMatchById(negotiation.matchId)
            : null;
        const requiredCount = getNegotiationRequiredParticipantIds(negotiation).length;
        const finalAgreedSnapshot = buildFinalAgreedSnapshot({
            negotiation,
            match,
            terms,
            actorUserId,
            agreedAt,
            agreedBy,
            multiParty: requiredCount > 1
        });

        const updated = await this.updateNegotiation(negotiationId, {
            status: agreedStatus,
            agreedTerms: terms,
            currentTerms: terms,
            finalAgreedSnapshot,
            agreedBy,
            participantAgreements,
            agreedAt
        });

        const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
        for (const uid of otherIds) {
            try {
                await this.createLifecycleNotification({
                    userId: uid,
                    type: 'negotiation_agreed',
                    entityType: 'negotiation',
                    entityId: negotiationId,
                    title: 'Terms agreed',
                    message: 'Negotiation terms have been agreed. You can create a deal workspace next.',
                    link: this._negotiationWorkspaceLink(negotiation),
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'negotiation_agreed',
                entityType: 'negotiation',
                entityId: negotiationId,
                details: {
                    matchId: negotiation.matchId,
                    applicationId: negotiation.applicationId,
                    agreementMode: finalAgreedSnapshot.agreementMode
                }
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async cancelNegotiation(negotiationId, actorUserId, reason) {
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
        await this.assertNegotiationParticipant(negotiation, actorUserId);
        if (isTerminalNegotiation(negotiation)) {
            throw new Error('This negotiation has already ended.');
        }
        await this._assertNegotiationFormalActionsAllowed(negotiation);

        const updated = await this.updateNegotiation(negotiationId, {
            status: CONFIG.MATCHING.NEGOTIATION.STATUS.CANCELLED,
            cancelReason: reason || 'cancelled_by_participant',
            cancelledByUserId: actorUserId,
            cancelledAt: new Date().toISOString()
        });

        const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
        for (const uid of otherIds) {
            try {
                await this.createNotification({
                    userId: uid,
                    type: 'negotiation_cancelled',
                    title: 'Negotiation cancelled',
                    message: 'The negotiation was cancelled. You can start a new negotiation when ready.',
                    link: this._negotiationWorkspaceLink(negotiation),
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'negotiation_cancelled',
                entityType: 'negotiation',
                entityId: negotiationId,
                details: { reason: reason || 'cancelled_by_participant' }
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async createDealFromNegotiation(negotiationId, actorUserId, options = {}) {
        this._assertPortalCanMutate(options);
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        await this.assertNegotiationParticipant(negotiation, actorUserId);
        if ((negotiation.status || '') !== CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED) {
            throw new Error('Agree to terms before creating a deal.');
        }

        const matchId = negotiation.matchId || negotiation.finalAgreedSnapshot?.matchId || null;
        if (matchId) {
            const postMatch = await this.getPostMatchById(matchId);
            if (postMatch) {
                assertMatchParticipant(postMatch, actorUserId);
            }
        } else {
            const opp = negotiation.opportunityId
                ? await this.getOpportunityById(negotiation.opportunityId)
                : null;
            const isOwner = !!(opp && opp.creatorId === actorUserId);
            let isApplicant = false;
            if (negotiation.applicationId) {
                const application = await this.getApplicationById(negotiation.applicationId);
                isApplicant = application?.applicantId === actorUserId;
            }
            if (!isOwner && !isApplicant) {
                throw new Error('Only the opportunity owner or applicant can create a deal from agreed negotiation terms.');
            }
        }

        const existing = (await this.getDeals()).find(d => d.negotiationId === negotiationId);
        if (existing) {
            await this.linkEntitiesAfterDealCreated(existing, { actorUserId });
            return existing;
        }

        const snapshot = negotiation.finalAgreedSnapshot || {};
        const agreed = negotiation.agreedTerms || snapshot.valueTerms || {};
        const participants = (snapshot.participants || (negotiation.parties || [])).map(p => ({
            userId: p.userId,
            role: p.role || 'participant',
            approvalStatus: 'pending',
            signedAt: null
        }));

        const valueFromSnapshot = snapshot.valueTerms || {};
        const agreedValue = valueFromSnapshot.agreedValue
            || (agreed.value != null ? { amount: agreed.value, currency: agreed.currency || 'SAR' } : null);

        const deal = await this.createDeal({
            negotiationId,
            matchId: negotiation.matchId || snapshot.matchId || null,
            applicationId: negotiation.applicationId || snapshot.applicationId || null,
            opportunityId: negotiation.opportunityId,
            opportunityIds: snapshot.opportunityIds?.length
                ? snapshot.opportunityIds
                : (negotiation.opportunityId ? [negotiation.opportunityId] : []),
            status: CONFIG.DEAL_STATUS.NEGOTIATING,
            title: 'Deal – negotiation ' + negotiationId.slice(-6),
            participants,
            valueTerms: {
                agreedValue,
                paymentSchedule: valueFromSnapshot.paymentSchedule || agreed.paymentSchedule || ''
            },
            scope: snapshot.scope || agreed.scope || agreed.message || '',
            timeline: snapshot.timeline || { start: agreed.startDate || null, end: agreed.endDate || null },
            exchangeMode: 'cash',
            deliverables: '',
            milestones: []
        });

        await this.linkEntitiesAfterDealCreated(deal, { actorUserId });

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'deal_created_from_negotiation',
                entityType: 'deal',
                entityId: deal.id,
                details: buildLifecycleAuditDetails({
                    summary: 'Deal created from agreed negotiation',
                    negotiationId,
                    matchId: negotiation.matchId,
                    opportunityId: negotiation.opportunityId,
                    applicationId: negotiation.applicationId
                }, { actorRole: await this._getActorRole(actorUserId), dealId: deal.id })
            });
        } catch (e) {
            void e;
        }

        const notifyIds = (negotiation.parties || []).map(p => p.userId).filter(Boolean);
        for (const uid of notifyIds) {
            if (uid === actorUserId) continue;
            try {
                await this.createLifecycleNotification({
                    userId: uid,
                    type: 'deal_created_from_negotiation',
                    entityType: 'deal',
                    entityId: deal.id,
                    title: 'Deal workspace created',
                    message: 'A deal workspace was created from your agreed negotiation terms.',
                    link: '/deals/' + deal.id,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }

        return deal;
    }

    async getNegotiationMatchingAnalytics() {
        const negotiations = await this.getNegotiations();
        const deals = await this.getDeals();
        const openNegotiations = negotiations.filter(n => isActiveNegotiation(n)).length;
        const agreedNegotiations = negotiations.filter(n =>
            (n.status || '').toLowerCase() === CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED
        ).length;
        const cancelledNegotiations = negotiations.filter(n =>
            (n.status || '').toLowerCase() === CONFIG.MATCHING.NEGOTIATION.STATUS.CANCELLED
        ).length;
        const dealsFromNegotiations = deals.filter(d => d.negotiationId).length;
        return { openNegotiations, agreedNegotiations, cancelledNegotiations, dealsFromNegotiations };
    }

    async getAdminNegotiationAnalytics() {
        const negotiations = await this.getNegotiations();
        const deals = await this.getDeals();
        const disputes = await this.getDisputes();
        const cc = typeof window !== 'undefined' ? window.AdminNegotiationCommandCenter : null;
        if (cc && typeof cc.buildAdminNegotiationAnalytics === 'function') {
            const stallDays = CONFIG.MATCHING.NEGOTIATION.STALL_DAYS || 5;
            const expiringHours = CONFIG.MATCHING.NEGOTIATION.EXPIRING_SOON_HOURS || 48;
            return cc.buildAdminNegotiationAnalytics(negotiations, deals, { stallDays, expiringHours, disputes });
        }
        return this.getNegotiationMatchingAnalytics();
    }

    async adminExtendNegotiationExpiry(negotiationId, actorUserId, extraDays = 7) {
        const actor = await this.getUserById(actorUserId);
        assertNotReadOnlyAdmin(actor?.role || null);
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (!auth || !auth.canAccessAdmin()) {
            throw new Error('Admin access required.');
        }
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        if (!isActiveNegotiation(negotiation)) {
            throw new Error('Only active negotiations can be extended.');
        }
        const days = Number(extraDays);
        if (!Number.isFinite(days) || days < 1 || days > 30) {
            throw new Error('Extension must be between 1 and 30 days.');
        }
        const baseMs = negotiation.expiresAt
            ? new Date(negotiation.expiresAt).getTime()
            : Date.now();
        const newExpiry = new Date(baseMs + days * 86400000).toISOString();
        const updated = await this.updateNegotiation(negotiationId, { expiresAt: newExpiry });
        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'admin_negotiation_extended',
                entityType: 'negotiation',
                entityId: negotiationId,
                details: { extraDays: days, expiresAt: newExpiry }
            });
        } catch (e) {
            void e;
        }
        return updated;
    }

    async adminAddNegotiationNote(negotiationId, actorUserId, note) {
        const actor = await this.getUserById(actorUserId);
        assertNotReadOnlyAdmin(actor?.role || null);
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (!auth || !auth.canAccessAdmin()) {
            throw new Error('Admin access required.');
        }
        const text = (note || '').trim();
        if (!text) throw new Error('Note cannot be empty.');
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        const adminNotes = [
            ...(negotiation.adminNotes || []),
            { by: actorUserId, at: new Date().toISOString(), note: text }
        ];
        return this.updateNegotiation(negotiationId, { adminNotes });
    }

    // Dispute operations (negotiation value disputes — Phase 3)
    async getDisputes() {
        return this.storage.get(CONFIG.STORAGE_KEYS.DISPUTES) || [];
    }

    async getDisputeById(id) {
        const list = await this.getDisputes();
        return list.find(d => d.id === id) || null;
    }

    async getDisputesByNegotiationId(negotiationId) {
        const list = await this.getDisputes();
        return list.filter(d => d.negotiationId === negotiationId);
    }

    async updateDispute(id, updates) {
        const list = await this.getDisputes();
        const index = list.findIndex(d => d.id === id);
        if (index === -1) return null;
        list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.DISPUTES, list);
        return list[index];
    }

    async _getActiveDisputeForNegotiation(negotiation) {
        if (!negotiation) return null;
        if (negotiation.disputeId) {
            const linked = await this.getDisputeById(negotiation.disputeId);
            if (linked && isActiveDispute(linked)) return linked;
        }
        const list = await this.getDisputesByNegotiationId(negotiation.id);
        return list.find(d => isActiveDispute(d)) || null;
    }

    async _assertNegotiationFormalActionsAllowed(negotiation) {
        const freeze = CONFIG.MATCHING.NEGOTIATION.DISPUTE_FREEZE_FORMAL_OFFERS !== false;
        if (!freeze) return;
        const dispute = await this._getActiveDisputeForNegotiation(negotiation);
        if (dispute && negotiationFormalActionsFrozen(dispute)) {
            throw new Error('Formal negotiation actions are frozen while a dispute is active. Discussion messages are still allowed.');
        }
    }

    async raiseNegotiationDispute(negotiationId, actorUserId, { category, description } = {}) {
        this._assertPortalCanMutate();
        const negotiation = await this.getNegotiationById(negotiationId);
        if (!negotiation) throw new Error('Negotiation not found.');
        assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
        await this.assertNegotiationParticipant(negotiation, actorUserId);

        const status = (negotiation.status || '').toLowerCase();
        const allowedStatuses = ['open', 'counter_offered', 'agreed'];
        if (!allowedStatuses.includes(status)) {
            throw new Error('Disputes can only be raised during active or agreed negotiations.');
        }

        const existing = await this._getActiveDisputeForNegotiation(negotiation);
        if (existing) throw new Error('An active dispute already exists for this negotiation.');

        _runWindowValidator('validateRaiseDispute', { category, description });

        const now = new Date().toISOString();
        const dispute = {
            id: this.generateId(),
            negotiationId,
            opportunityId: negotiation.opportunityId || null,
            raisedBy: actorUserId,
            raisedAt: now,
            category: (category || 'other').toLowerCase(),
            description: String(description || '').trim(),
            status: DISPUTE_STATUS.RAISED,
            assignedAdminId: null,
            resolution: null,
            thread: [{
                id: this.generateId(),
                by: actorUserId,
                at: now,
                body: String(description || '').trim(),
                visibleToParties: true
            }],
            createdAt: now,
            updatedAt: now
        };

        const list = await this.getDisputes();
        list.push(dispute);
        this.storage.set(CONFIG.STORAGE_KEYS.DISPUTES, list);

        await this.updateNegotiation(negotiationId, { disputeId: dispute.id });

        const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
        const workspaceLink = this._negotiationWorkspaceLink(negotiation);
        for (const uid of otherIds) {
            try {
                await this.notifyUser(uid, {
                    type: 'negotiation_dispute_raised',
                    title: 'Dispute raised',
                    message: 'A party raised a dispute on your negotiation. Formal proposals are paused until resolved.',
                    link: workspaceLink
                });
            } catch (e) {
                void e;
            }
        }

        try {
            await this._notifyAdminUsers({
                type: 'negotiation_dispute_raised',
                title: 'New negotiation dispute',
                message: 'A dispute was raised and needs admin review.',
                link: (CONFIG.ROUTES.ADMIN_NEGOTIATION_DETAIL || '/admin/negotiations/:id').replace(':id', negotiationId)
            });
        } catch (e) {
            void e;
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'dispute_raised',
                entityType: 'dispute',
                entityId: dispute.id,
                details: { negotiationId, category: dispute.category }
            });
        } catch (e) {
            void e;
        }

        return dispute;
    }

    async withdrawNegotiationDispute(disputeId, actorUserId) {
        this._assertPortalCanMutate();
        const dispute = await this.getDisputeById(disputeId);
        if (!dispute) throw new Error('Dispute not found.');
        if (!isActiveDispute(dispute)) throw new Error('This dispute is no longer active.');
        if (dispute.raisedBy !== actorUserId) {
            throw new Error('Only the party who raised the dispute can withdraw it.');
        }

        const updated = await this.updateDispute(disputeId, {
            status: DISPUTE_STATUS.WITHDRAWN,
            resolution: {
                outcome: 'withdrawn',
                notes: 'Withdrawn by raising party.',
                resolvedAt: new Date().toISOString(),
                resolvedBy: actorUserId
            }
        });

        const negotiation = await this.getNegotiationById(dispute.negotiationId);
        if (negotiation && negotiation.disputeId === disputeId) {
            await this.updateNegotiation(negotiation.id, { disputeId: null });
        }

        if (negotiation) {
            const otherIds = (negotiation.parties || []).map(p => p.userId).filter(id => id !== actorUserId);
            for (const uid of otherIds) {
                try {
                    await this.notifyUser(uid, {
                        type: 'dispute_withdrawn',
                        title: 'Dispute withdrawn',
                        message: 'The dispute on your negotiation was withdrawn. Formal proposals can resume.',
                        link: this._negotiationWorkspaceLink(negotiation)
                    });
                } catch (e) {
                    void e;
                }
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'dispute_withdrawn',
                entityType: 'dispute',
                entityId: disputeId,
                details: { negotiationId: dispute.negotiationId }
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async addDisputeMessage(disputeId, actorUserId, body, options = {}) {
        const dispute = await this.getDisputeById(disputeId);
        if (!dispute) throw new Error('Dispute not found.');
        if (!isActiveDispute(dispute)) throw new Error('This dispute is no longer active.');

        const text = (body || '').trim();
        if (!text) throw new Error('Message cannot be empty.');

        const negotiation = await this.getNegotiationById(dispute.negotiationId);
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        const isAdmin = auth && auth.canAccessAdmin && auth.canAccessAdmin();
        const isParticipant = negotiation
            && (negotiation.parties || []).some(p => p.userId === actorUserId);

        if (!isAdmin && !isParticipant) {
            throw new Error('You cannot post to this dispute thread.');
        }
        if (!isAdmin) {
            assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
            this._assertPortalCanMutate(options);
        } else {
            assertNotReadOnlyAdmin(await this._getActorRole(actorUserId));
        }

        const thread = [...(dispute.thread || [])];
        thread.push({
            id: this.generateId(),
            by: actorUserId,
            at: new Date().toISOString(),
            body: text,
            visibleToParties: options.adminOnly ? false : true
        });

        return this.updateDispute(disputeId, { thread });
    }

    async adminAssignDisputeReview(disputeId, actorUserId, status) {
        const actor = await this.getUserById(actorUserId);
        assertNotReadOnlyAdmin(actor?.role || null);
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (!auth || !auth.canAccessAdmin()) throw new Error('Admin access required.');

        const dispute = await this.getDisputeById(disputeId);
        if (!dispute) throw new Error('Dispute not found.');
        if (!isActiveDispute(dispute)) throw new Error('Dispute is not active.');

        const next = (status || DISPUTE_STATUS.UNDER_REVIEW).toLowerCase();
        if (![DISPUTE_STATUS.UNDER_REVIEW, DISPUTE_STATUS.MEDIATION].includes(next)) {
            throw new Error('Invalid review status.');
        }

        const updated = await this.updateDispute(disputeId, {
            status: next,
            assignedAdminId: actorUserId
        });

        const negotiation = await this.getNegotiationById(dispute.negotiationId);
        if (negotiation) {
            const label = next === DISPUTE_STATUS.MEDIATION ? 'moved to mediation' : 'under admin review';
            for (const p of (negotiation.parties || [])) {
                try {
                    await this.notifyUser(p.userId, {
                        type: 'dispute_assigned',
                        title: 'Dispute update',
                        message: 'Your negotiation dispute is now ' + label + '.',
                        link: this._negotiationWorkspaceLink(negotiation)
                    });
                } catch (e) {
                    void e;
                }
            }
        }

        return updated;
    }

    async adminResolveDispute(disputeId, actorUserId, { outcome, notes, amendedTerms, extraDays } = {}) {
        const actor = await this.getUserById(actorUserId);
        assertNotReadOnlyAdmin(actor?.role || null);
        const auth = (typeof window !== 'undefined' && window.authService) ? window.authService : null;
        if (!auth || !auth.canAccessAdmin()) throw new Error('Admin access required.');

        const dispute = await this.getDisputeById(disputeId);
        if (!dispute) throw new Error('Dispute not found.');
        if (!isActiveDispute(dispute)) throw new Error('Dispute is not active.');

        _runWindowValidator('validateResolveDispute', { outcome, notes });

        const resolvedAt = new Date().toISOString();
        const resolution = {
            outcome: (outcome || '').toLowerCase(),
            notes: (notes || '').trim(),
            resolvedAt,
            resolvedBy: actorUserId,
            amendedTerms: amendedTerms || null,
            extraDays: extraDays != null ? Number(extraDays) : null
        };

        const negotiation = await this.getNegotiationById(dispute.negotiationId);
        let terminalStatus = DISPUTE_STATUS.RESOLVED;

        if (resolution.outcome === RESOLUTION_OUTCOMES.ESCALATE_EXTERNAL) {
            terminalStatus = DISPUTE_STATUS.ESCALATED;
        } else if (resolution.outcome === RESOLUTION_OUTCOMES.FORCE_CLOSE && negotiation) {
            await this.updateNegotiation(negotiation.id, {
                status: CONFIG.MATCHING.NEGOTIATION.STATUS.FAILED,
                disputeId: null
            });
        } else if (resolution.outcome === RESOLUTION_OUTCOMES.AMEND_TERMS && negotiation && amendedTerms) {
            const merged = mergeProposalTerms(getEffectiveTerms(negotiation), amendedTerms);
            await this.updateNegotiation(negotiation.id, {
                currentTerms: merged,
                status: CONFIG.MATCHING.NEGOTIATION.STATUS.COUNTER_OFFERED,
                participantAgreements: [],
                agreedBy: [],
                disputeId: null
            });
        } else if (resolution.outcome === RESOLUTION_OUTCOMES.EXTEND_DEADLINE && negotiation) {
            const days = Number(extraDays) || 7;
            const baseMs = negotiation.expiresAt
                ? new Date(negotiation.expiresAt).getTime()
                : Date.now();
            await this.updateNegotiation(negotiation.id, {
                expiresAt: new Date(baseMs + days * 86400000).toISOString(),
                disputeId: null
            });
        } else if (negotiation) {
            await this.updateNegotiation(negotiation.id, { disputeId: null });
        }

        const updated = await this.updateDispute(disputeId, {
            status: terminalStatus,
            resolution
        });

        if (negotiation) {
            const partyIds = (negotiation.parties || []).map(p => p.userId);
            for (const uid of partyIds) {
                try {
                    await this.notifyUser(uid, {
                        type: 'dispute_resolved',
                        title: 'Dispute resolved',
                        message: (notes || 'An admin resolved the negotiation dispute.').slice(0, 120),
                        link: this._negotiationWorkspaceLink(negotiation)
                    });
                } catch (e) {
                    void e;
                }
            }
        }

        try {
            await this.createAuditLog({
                userId: actorUserId,
                action: 'dispute_resolved',
                entityType: 'dispute',
                entityId: disputeId,
                details: { outcome: resolution.outcome, negotiationId: dispute.negotiationId }
            });
        } catch (e) {
            void e;
        }

        return updated;
    }

    async getAdminDisputeAnalytics() {
        const disputes = await this.getDisputes();
        const active = disputes.filter(d => isActiveDispute(d));
        return {
            total: disputes.length,
            active: active.length,
            raised: disputes.filter(d => (d.status || '') === DISPUTE_STATUS.RAISED).length,
            underReview: disputes.filter(d => (d.status || '') === DISPUTE_STATUS.UNDER_REVIEW).length,
            mediation: disputes.filter(d => (d.status || '') === DISPUTE_STATUS.MEDIATION).length,
            resolved: disputes.filter(d => (d.status || '') === DISPUTE_STATUS.RESOLVED).length,
            escalated: disputes.filter(d => (d.status || '') === DISPUTE_STATUS.ESCALATED).length
        };
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

    _isLegacyPersonOpportunityEnabled() {
        return !!(CONFIG && CONFIG.MATCHING && CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED === true);
    }

    // --- Legacy match operations (pmtwin_matches / CONFIG.STORAGE_KEYS.MATCHES) ---
    // UI and publish flows must use post_match helpers below. Kept for migration and tests.

    /**
     * @deprecated Legacy person-to-opportunity store (`pmtwin_matches`). Use `getPostMatches()`.
     */
    async getMatches() {
        return this.storage.get(CONFIG.STORAGE_KEYS.MATCHES) || [];
    }

    /**
     * @deprecated Legacy `pmtwin_matches`. Use `getPostMatchById(matchId)`.
     */
    async getMatchById(matchId) {
        if (!this._isLegacyPersonOpportunityEnabled()) return null;
        const matches = await this.getMatches();
        return matches.find(m => m.id === matchId) || null;
    }

    /**
     * @deprecated Legacy `pmtwin_matches`. Use `getPostMatchesForUser(userId)`.
     */
    async getMatchesForUser(userId) {
        if (!this._isLegacyPersonOpportunityEnabled()) return [];
        const matches = await this.getMatches();
        return matches.filter(m => m.candidateId === userId || m.userId === userId);
    }

    /**
     * @deprecated Legacy `pmtwin_matches`. Use `getPostMatchesByOpportunityId(opportunityId)`.
     */
    async getMatchesByOpportunityId(opportunityId) {
        if (!this._isLegacyPersonOpportunityEnabled()) return [];
        const matches = await this.getMatches();
        return matches.filter(m => m.opportunityId === opportunityId);
    }

    /**
     * @deprecated Legacy `pmtwin_matches`. Use `updatePostMatch(matchId, updates)`.
     */
    async updateMatch(matchId, updates) {
        if (!this._isLegacyPersonOpportunityEnabled()) return null;
        const matches = await this.getMatches();
        const index = matches.findIndex(m => m.id === matchId);
        if (index === -1) return null;
        matches[index] = {
            ...matches[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, matches);
        return matches[index];
    }

    /**
     * @deprecated Legacy `pmtwin_matches`. Use `createPostMatch` / `persistPostMatches` (post-to-post only).
     */
    async createMatch(matchData) {
        if (!this._isLegacyPersonOpportunityEnabled()) {
            console.warn('[data-service] createMatch is disabled; use post_matches (createPostMatch).');
            return null;
        }
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

    // --- PostMatch operations (canonical: pmtwin_post_matches / CONFIG.STORAGE_KEYS.POST_MATCHES) ---

    // PostMatch Operations (user-facing post-to-post match discovery)
    getDefaultPostMatchExpiresAt(status) {
        const nextStatus = status || CONFIG.POST_MATCH_STATUS.PENDING;
        if (nextStatus !== CONFIG.POST_MATCH_STATUS.PENDING) return null;
        const configured = CONFIG.MATCHING && CONFIG.MATCHING.DEFAULT_MATCH_EXPIRY_DAYS;
        const parsed = Number(configured);
        const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    async expirePendingPostMatches() {
        const list = this.storage.get(CONFIG.STORAGE_KEYS.POST_MATCHES) || [];
        let changed = false;
        const now = Date.now();
        const nowIso = new Date().toISOString();
        const expired = [];
        for (let i = 0; i < list.length; i++) {
            const m = list[i];
            if (!m || (m.status || '') !== CONFIG.POST_MATCH_STATUS.PENDING) continue;
            // Fast path: if no expiresAt, nothing to do.
            if (!m.expiresAt) continue;
            const t = new Date(m.expiresAt).getTime();
            if (Number.isNaN(t) || t >= now) continue;
            // PENDING and past expiresAt -> transition to EXPIRED and persist.
            enforceTransition('post_match', m, CONFIG.POST_MATCH_STATUS.EXPIRED);
            list[i] = {
                ...m,
                status: CONFIG.POST_MATCH_STATUS.EXPIRED,
                updatedAt: nowIso
            };
            expired.push(list[i]);
            changed = true;
        }
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, list);
            for (const m of expired) {
                try {
                    await this.createAuditLog({
                        userId: 'system',
                        action: 'match_expired',
                        entityType: 'match',
                        entityId: m.id,
                        details: buildLifecycleAuditDetails({
                            summary: 'Match expired',
                            matchId: m.id,
                            matchType: m.matchType,
                            expiresAt: m.expiresAt
                        })
                    });
                } catch (e) {
                    void e;
                }
                const seen = new Set();
                for (const p of m.participants || []) {
                    if (!p.userId || seen.has(p.userId)) continue;
                    seen.add(p.userId);
                    try {
                        await this.createLifecycleNotification({
                            userId: p.userId,
                            type: 'match_expired',
                            entityType: 'match',
                            entityId: m.id,
                            title: 'Match expired',
                            message: 'This match expired before all participants responded. You can explore other opportunities.',
                            link: '/matches/' + m.id,
                            read: false
                        });
                    } catch (e) {
                        void e;
                    }
                }
            }
        }
        return list;
    }

    /** All post_match records (expires pending rows first). */
    async getPostMatches() {
        return this.expirePendingPostMatches();
    }

    /** Single post_match by id. */
    async getPostMatchById(matchId) {
        const list = await this.getPostMatches();
        const match = list.find(m => m.id === matchId) || null;
        if (!match) return null;
        return this.expirePostMatchIfNeeded(match);
    }

    /** Post matches where `userId` is a participant. */
    async getPostMatchesForUser(userId) {
        const list = await this.getPostMatches();
        return list.filter(m =>
            (m.participants || []).some(p => p.userId === userId)
        );
    }

    /**
     * Filter post_matches by type. With one argument, returns all matches of that type globally.
     * With two arguments, filters the given user's matches by type.
     * @param {string} userIdOrType
     * @param {string} [matchType]
     */
    async getPostMatchesByType(userIdOrType, matchType) {
        if (matchType === undefined || matchType === null || matchType === '') {
            const list = await this.getPostMatches();
            return list.filter(m => m.matchType === userIdOrType);
        }
        const list = await this.getPostMatchesForUser(userIdOrType);
        return list.filter(m => m.matchType === matchType);
    }

    /**
     * Post matches linked to an opportunity (need, offer, lead need, or two-way side).
     * @param {string} opportunityId
     */
    async getPostMatchesByOpportunityId(opportunityId) {
        const list = await this.getPostMatches();
        return list.filter(pm => this._postMatchReferencesOpportunity(pm, opportunityId));
    }

    _postMatchReferencesOpportunity(postMatch, opportunityId) {
        if (!postMatch || !opportunityId) return false;
        const p = postMatch.payload || {};
        if (p.needOpportunityId === opportunityId || p.offerOpportunityId === opportunityId) return true;
        if (p.leadNeedId === opportunityId) return true;
        const sideA = p.sideA || {};
        const sideB = p.sideB || {};
        if (sideA.needId === opportunityId || sideA.offerId === opportunityId) return true;
        if (sideB.needId === opportunityId || sideB.offerId === opportunityId) return true;
        const links = p.links || [];
        return links.some(l => l.needId === opportunityId || l.offerId === opportunityId);
    }

    /**
     * If a post_match is expired, enforce a transition to EXPIRED and persist it.
     * Rules:
     * - Missing postMatch -> returned unchanged
     * - Not expired by status/time -> returned unchanged
     * - Already EXPIRED -> returned unchanged
     * - PENDING + expired -> enforceTransition + updatePostMatch to EXPIRED
     * - Other statuses + expired -> returned unchanged (no implicit state change)
     * @param {object} postMatch
     * @returns {Promise<object|null>} updated postMatch (or original if no change / not found)
     */
    async expirePostMatchIfNeeded(postMatch) {
        if (!postMatch || !postMatch.id) return postMatch || null;
        if (!this.isExpired(postMatch)) return postMatch;

        const currentStatus = (postMatch.status || '');
        if (currentStatus === CONFIG.POST_MATCH_STATUS.EXPIRED) return postMatch;

        if (currentStatus === CONFIG.POST_MATCH_STATUS.PENDING) {
            enforceTransition('post_match', postMatch, CONFIG.POST_MATCH_STATUS.EXPIRED);
            return this.updatePostMatch(postMatch.id, { status: CONFIG.POST_MATCH_STATUS.EXPIRED });
        }

        // For non-pending matches that happen to be past expiresAt, leave as-is.
        return postMatch;
    }

    /**
     * Returns true if the entity is considered expired (status === expired or expiresAt in the past).
     * Used so expired post_matches do not behave like active pending matches.
     * @param {object} entity - e.g. a post_match with status and/or expiresAt
     * @returns {boolean}
     */
    isExpired(entity) {
        if (entity == null) return false;
        if ((entity.status || '') === CONFIG.POST_MATCH_STATUS.EXPIRED) return true;
        if (entity.expiresAt) {
            const t = new Date(entity.expiresAt).getTime();
            if (!Number.isNaN(t) && t < Date.now()) return true;
        }
        return false;
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
            modelsRun: Array.isArray(data && data.modelsRun) ? data.modelsRun.slice() : (data && data.model ? [data.model] : []),
            source: (data && data.source) || null,
            actorId: (data && data.actorId) || null,
            threshold: data && data.threshold != null ? data.threshold : null,
            weightsProfile: (data && data.weightsProfile) || null,
            candidateCount: data && data.candidateCount != null ? data.candidateCount : null,
            resultCount: data && data.resultCount != null ? data.resultCount : null,
            createdCount: data && data.createdCount != null ? data.createdCount : null,
            skippedDuplicateCount: data && data.skippedDuplicateCount != null ? data.skippedDuplicateCount : null,
            topScores: Array.isArray(data && data.topScores) ? data.topScores.slice() : [],
            durationMs: data && data.durationMs != null ? data.durationMs : null,
            createdAt: new Date().toISOString()
        };
        list.push(record);
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHING_RUNS, list);
        return record;
    }

    async updateMatchingRun(runId, updates) {
        if (!runId) return null;
        const list = await this.getMatchingRuns();
        const index = list.findIndex(r => r.id === runId);
        if (index === -1) return null;
        list[index] = { ...list[index], ...updates };
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHING_RUNS, list);
        return list[index];
    }

    /** Admin preview runs (in-memory report snapshots; not persisted matches). */
    async getMatchingPreviewRuns() {
        return this.storage.get(CONFIG.STORAGE_KEYS.MATCHING_PREVIEW_RUNS) || [];
    }

    async createMatchingPreviewRun(data) {
        const inputActorId = data && data.actorId;
        if (inputActorId) {
            const actor = await this.getUserById(inputActorId);
            const role = actor?.role;
            if (role) assertAdminMatchingRead(role);
        }
        const list = await this.getMatchingPreviewRuns();
        const record = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            actorId: (data && data.actorId) || null,
            totalPostsAnalyzed: (data && data.totalPostsAnalyzed) != null ? data.totalPostsAnalyzed : 0,
            totalMatchesFound: (data && data.totalMatchesFound) != null ? data.totalMatchesFound : 0,
            oneWayMatches: (data && data.oneWayMatches) != null ? data.oneWayMatches : 0,
            twoWayMatches: (data && data.twoWayMatches) != null ? data.twoWayMatches : 0,
            groupFormations: (data && data.groupFormations) != null ? data.groupFormations : 0,
            circularExchanges: (data && data.circularExchanges) != null ? data.circularExchanges : 0,
            selectableRowCount: (data && data.selectableRowCount) != null ? data.selectableRowCount : 0
        };
        list.unshift(record);
        const trimmed = list.slice(0, 30);
        this.storage.set(CONFIG.STORAGE_KEYS.MATCHING_PREVIEW_RUNS, trimmed);
        const actorId = record.actorId;
        try {
            await this.createAuditLog({
                userId: actorId || 'system',
                action: 'matching_preview_run_created',
                entityType: 'matching_preview_run',
                entityId: record.id,
                details: buildLifecycleAuditDetails({
                    summary: 'Admin matching preview run',
                    previewRunId: record.id,
                    totalMatchesFound: record.totalMatchesFound,
                    selectableRowCount: record.selectableRowCount
                }, { actorRole: actorId ? await this._getActorRole(actorId) : null })
            });
        } catch (e) {
            void e;
        }
        return record;
    }

    /**
     * Admin command center: audit selected-opportunity persist batch.
     * @param {'started'|'completed'} phase
     */
    async auditMatchingSelectedPersist(phase, { actorId, actorRole, previewRunId, opportunityIds, createdCount, errorCount }) {
        const action = phase === 'started'
            ? 'matching_selected_persist_started'
            : 'matching_selected_persist_completed';
        try {
            await this.createAuditLog({
                userId: actorId || 'system',
                action,
                entityType: 'matching_run',
                entityId: previewRunId || 'bulk',
                details: buildLifecycleAuditDetails({
                    summary: phase === 'started' ? 'Bulk persist started' : 'Bulk persist completed',
                    previewRunId,
                    opportunityIds: opportunityIds || [],
                    createdCount: createdCount != null ? createdCount : undefined,
                    errorCount: errorCount != null ? errorCount : undefined
                }, { actorRole: actorRole || null, matchingRunId: previewRunId })
            });
        } catch (e) {
            void e;
        }
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

    /** Strong dedupe key for post_match create / persist-run checks (public for matching-service). */
    getPostMatchStrongKey(record) {
        return this._postMatchStrongKey(record);
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
        const status = data.status || CONFIG.POST_MATCH_STATUS.PENDING;
        const newRecord = {
            id: this.generateId(),
            matchType: data.matchType || 'one_way',
            status,
            matchScore: data.matchScore != null ? data.matchScore : 0,
            runId: data.runId || null,
            participants: Array.isArray(data.participants) ? data.participants : [],
            payload: data.payload != null ? data.payload : {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: (data.expiresAt != null && data.expiresAt !== '')
                ? data.expiresAt
                : this.getDefaultPostMatchExpiresAt(status),
            isReplacement: isReplacement || false,
            replacementDealId: data.replacementDealId || null,
            replacementRole: data.replacementRole || null,
            replacementPayload: data.replacementPayload || null
        };
        if (newRecord.matchType === 'two_way') {
            const sideA = newRecord.payload.sideA || {};
            const sideB = newRecord.payload.sideB || {};
            if (!sideA.userId || !sideA.needId || !sideA.offerId || !sideB.userId || !sideB.needId || !sideB.offerId) return null;
        }
        if (newRecord.matchType === 'circular') {
            const links = Array.isArray(newRecord.payload.links) ? newRecord.payload.links : [];
            if (!links.length || links.some(l => !l.fromCreatorId || !l.toCreatorId || !l.needId || !l.offerId || l.score == null)) return null;
        }
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
        const flatOppIds = [
            newRecord.payload && newRecord.payload.leadNeedId,
            newRecord.payload && newRecord.payload.needOpportunityId,
            newRecord.payload && newRecord.payload.offerOpportunityId,
            newRecord.payload && newRecord.payload.sideA && newRecord.payload.sideA.needId,
            newRecord.payload && newRecord.payload.sideA && newRecord.payload.sideA.offerId,
            newRecord.payload && newRecord.payload.sideB && newRecord.payload.sideB.needId,
            newRecord.payload && newRecord.payload.sideB && newRecord.payload.sideB.offerId
        ]
            .concat((newRecord.payload && newRecord.payload.roles) ? newRecord.payload.roles.map(r => r.opportunityId) : [])
            .concat((newRecord.payload && newRecord.payload.links) ? newRecord.payload.links.flatMap(l => [l.needId, l.offerId]) : [])
            .filter(Boolean);
        try {
            await this.createAuditLog({
                userId: (newRecord.participants && newRecord.participants[0] && newRecord.participants[0].userId) || 'system',
                action: 'match_created',
                entityType: 'match',
                entityId: newRecord.id,
                details: { matchType: newRecord.matchType, opportunityIds: flatOppIds.length ? flatOppIds : undefined }
            });
        } catch (e) { /* non-fatal */ }
        emitDataChange(PMTWIN_EVENTS.POST_MATCHES_UPDATED, {
            matchId: newRecord.id,
            matchType: newRecord.matchType
        });
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
        emitDataChange(PMTWIN_EVENTS.POST_MATCHES_UPDATED, { matchId });
        return list[index];
    }

    /** Update participant status on a post_match (accept/decline); may confirm or decline the match. */
    async updatePostMatchStatus(matchId, userId, newStatus, options = {}) {
        this._assertPortalCanMutate(options);
        const match = await this.getPostMatchById(matchId);
        if (!match || !match.participants) return null;
        if ((match.status || '') === CONFIG.POST_MATCH_STATUS.EXPIRED) return match;
        if ((match.status || '') !== CONFIG.POST_MATCH_STATUS.PENDING) return match;

        assertMatchParticipant(match, userId);

        const targetParticipants = match.participants.filter(p => p.userId === userId);
        if (!targetParticipants.length) return match;
        const alreadySet = targetParticipants.every(p => (p.participantStatus || '').toLowerCase() === String(newStatus || '').toLowerCase());

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
        if (!updated) return updated;

        if (!alreadySet) {
            const action = newStatus === CONFIG.POST_MATCH_PARTICIPANT_STATUS.DECLINED ? 'match_declined' : 'match_accepted';
            const title = action === 'match_declined' ? 'Match declined' : 'Match accepted';
            const message = action === 'match_declined'
                ? 'A participant declined the match.'
                : 'A participant accepted the match.';
            try {
                await this.createAuditLog({
                    userId,
                    action,
                    entityType: 'match',
                    entityId: matchId,
                    details: { matchType: match.matchType, status }
                });
            } catch (e) {
                void e;
            }

            const seen = new Set();
            for (const p of participants) {
                if (!p.userId || p.userId === userId || seen.has(p.userId)) continue;
                seen.add(p.userId);
                try {
                    await this.createLifecycleNotification({
                        userId: p.userId,
                        type: action,
                        entityType: 'match',
                        entityId: matchId,
                        title,
                        message,
                        link: '/matches/' + matchId,
                        read: false
                    });
                } catch (e) {
                    void e;
                }
            }
        }

        if (updated.status === CONFIG.POST_MATCH_STATUS.CONFIRMED && match.status !== CONFIG.POST_MATCH_STATUS.CONFIRMED) {
            try {
                await this.createAuditLog({
                    userId,
                    action: 'match_confirmed',
                    entityType: 'match',
                    entityId: matchId,
                    details: { matchType: match.matchType }
                });
            } catch (e) {
                void e;
            }

            const seen = new Set();
            for (const p of participants) {
                if (!p.userId || seen.has(p.userId)) continue;
                seen.add(p.userId);
                try {
                    await this.createLifecycleNotification({
                        userId: p.userId,
                        type: 'match_confirmed',
                        entityType: 'match',
                        entityId: matchId,
                        title: 'Match confirmed',
                        message: 'All participants accepted. A Deal Workspace can now be created.',
                        link: '/matches/' + matchId,
                        read: false
                    });
                } catch (e) {
                    void e;
                }
            }
        }
        emitDataChange(PMTWIN_EVENTS.POST_MATCHES_UPDATED, { matchId, status: updated.status });
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
            const ms = typeof window !== 'undefined' ? window.matchingService : null;
            if (ms && typeof ms.notifyPostMatch === 'function') {
                try {
                    await ms.notifyPostMatch(postMatch);
                } catch (e) {
                    void e;
                }
            }
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
    async getNotificationDeliveryLog() {
        return this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATION_DELIVERY_LOG) || [];
    }

    async _trySimulatedEmail(userId, { type, title, message, link, notificationId } = {}) {
        const prefs = getNotificationPrefs(this.storage, CONFIG.STORAGE_KEYS.SYSTEM_SETTINGS);
        if (!shouldDeliverEmail(prefs, type)) return null;

        const entity = await this.getUserOrCompanyById(userId);
        const email = entity?.email;
        if (!email || !String(email).includes('@')) return null;

        return appendDeliveryLog(this.storage, CONFIG.STORAGE_KEYS.NOTIFICATION_DELIVERY_LOG, {
            id: this.generateId(),
            channel: 'email',
            status: 'simulated',
            to: email,
            userId,
            type: type || 'notification',
            title: title || '',
            message: message || '',
            link: link || null,
            notificationId: notificationId || null,
            sentAt: new Date().toISOString()
        });
    }

    /**
     * In-app notification plus simulated email when admin settings allow it.
     */
    async notifyUser(userId, { type, title, message, link } = {}) {
        if (!userId) return null;
        const notification = await this.createNotification({
            userId,
            type: type || 'notification',
            title: title || 'Notification',
            message: message || '',
            link: link || null,
            read: false
        });
        try {
            await this._trySimulatedEmail(userId, {
                type: type || 'notification',
                title,
                message,
                link,
                notificationId: notification.id
            });
        } catch (e) {
            void e;
        }
        return notification;
    }

    async _notifyAdminUsers(spec) {
        const users = await this.getUsers();
        const adminRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR];
        const adminIds = (users || [])
            .filter(u => u && adminRoles.includes(u.role))
            .map(u => u.id);
        for (const uid of adminIds) {
            try {
                await this.notifyUser(uid, spec);
            } catch (e) {
                void e;
            }
        }
    }

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
        emitDataChange(PMTWIN_EVENTS.NOTIFICATIONS_UPDATED, { notificationId: newNotification.id });
        return newNotification;
    }
    
    async markNotificationRead(id) {
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].read = true;
            this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, notifications);
            emitDataChange(PMTWIN_EVENTS.NOTIFICATIONS_UPDATED, { notificationId: id });
        }
    }

    /** Mark all unread notifications for a user whose link matches the visited route. */
    async markNotificationsReadForRoute(userId, route) {
        if (!userId || !route) return;
        const routePath = String(route).split('?')[0].replace(/\/$/, '') || '/';
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        let changed = false;
        for (const n of notifications) {
            if (!n || n.userId !== userId || n.read === true || !n.link) continue;
            const linkPath = String(n.link).split('?')[0].replace(/\/$/, '') || '/';
            if (linkPath === routePath) {
                n.read = true;
                changed = true;
            }
        }
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, notifications);
            emitDataChange(PMTWIN_EVENTS.NOTIFICATIONS_UPDATED, { route: routePath });
        }
    }

    // Connection Operations (user-to-user connections)
    async getConnections() {
        return this.storage.get(CONFIG.STORAGE_KEYS.CONNECTIONS) || [];
    }

    async getConnectionBetweenUsers(userIdA, userIdB) {
        const connections = await this.getConnections();
        const matches = connections.filter(
            c =>
                (c.fromUserId === userIdA && c.toUserId === userIdB) ||
                (c.fromUserId === userIdB && c.toUserId === userIdA)
        );
        if (matches.length === 0) return null;
        const sortRecent = (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        const accepted = matches.filter(c => c.status === CONFIG.CONNECTION_STATUS.ACCEPTED).sort(sortRecent);
        if (accepted.length) return accepted[0];
        const pending = matches.filter(c => c.status === CONFIG.CONNECTION_STATUS.PENDING).sort(sortRecent);
        if (pending.length) return pending[0];
        return matches.sort(sortRecent)[0];
    }

    /** Returns connection status for current user viewing another user: 'none' | 'pending_sent' | 'pending_received' | 'accepted' */
    async getConnectionStatus(currentUserId, otherUserId) {
        if (currentUserId === otherUserId) return 'self';
        const conn = await this.getConnectionBetweenUsers(currentUserId, otherUserId);
        if (!conn) return 'none';
        if (conn.status === CONFIG.CONNECTION_STATUS.ACCEPTED) return 'accepted';
        if (conn.status === CONFIG.CONNECTION_STATUS.REJECTED) return 'none';
        if (conn.fromUserId === currentUserId) return 'pending_sent';
        return 'pending_received';
    }

    async getConnectionsForUser(userId, status = CONFIG.CONNECTION_STATUS.ACCEPTED) {
        const connections = await this.getConnections();
        return connections.filter(c =>
            (c.fromUserId === userId || c.toUserId === userId) && c.status === status
        );
    }

    async createConnection(fromUserId, toUserId, options = {}) {
        this._assertPortalCanMutate(options);
        const connections = await this.getConnections();
        const sameDirection = connections.find(
            c => c.fromUserId === fromUserId && c.toUserId === toUserId
        );
        if (sameDirection) {
            if (
                sameDirection.status === CONFIG.CONNECTION_STATUS.PENDING ||
                sameDirection.status === CONFIG.CONNECTION_STATUS.ACCEPTED
            ) {
                return sameDirection;
            }
            if (sameDirection.status === CONFIG.CONNECTION_STATUS.REJECTED) {
                return this.updateConnection(sameDirection.id, { status: CONFIG.CONNECTION_STATUS.PENDING });
            }
        }
        const existing = await this.getConnectionBetweenUsers(fromUserId, toUserId);
        if (
            existing &&
            (existing.status === CONFIG.CONNECTION_STATUS.PENDING ||
                existing.status === CONFIG.CONNECTION_STATUS.ACCEPTED)
        ) {
            return existing;
        }
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
        try {
            const sender = await this.getUserOrCompanyById(fromUserId);
            const senderName = sender?.profile?.name || sender?.email || 'Someone';
            await this.createNotification({
                userId: toUserId,
                type: 'connection_request',
                title: 'Connection request',
                message: senderName + ' sent you a connection request.',
                link: '/people/' + fromUserId,
                read: false
            });
        } catch (e) {
            void e;
        }
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

    /**
     * Accept a connection request. Also accepts any duplicate pending rows for the same
     * from→to pair so the sender does not stay stuck on "Pending" after one row was updated.
     */
    async acceptConnection(connectionId, options = {}) {
        this._assertPortalCanMutate(options);
        const connections = await this.getConnections();
        const index = connections.findIndex(c => c.id === connectionId);
        if (index === -1) return null;
        const anchor = connections[index];
        const { fromUserId, toUserId } = anchor;
        const now = new Date().toISOString();
        const next = connections.map(c => {
            const sameDirectedPending =
                c.fromUserId === fromUserId &&
                c.toUserId === toUserId &&
                c.status === CONFIG.CONNECTION_STATUS.PENDING;
            if (c.id === connectionId || sameDirectedPending) {
                return { ...c, status: CONFIG.CONNECTION_STATUS.ACCEPTED, updatedAt: now };
            }
            return c;
        });
        this.storage.set(CONFIG.STORAGE_KEYS.CONNECTIONS, next);
        const accepted = next.find(c => c.id === connectionId) || null;
        if (accepted && fromUserId) {
            try {
                const accepter = await this.getUserOrCompanyById(toUserId);
                const accepterName = accepter?.profile?.name || accepter?.email || 'Someone';
                await this.createNotification({
                    userId: fromUserId,
                    type: 'connection_accepted',
                    title: 'Connection accepted',
                    message: accepterName + ' accepted your connection request.',
                    link: '/people/' + toUserId,
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
        return accepted;
    }

    async rejectConnection(connectionId, options = {}) {
        this._assertPortalCanMutate(options);
        const connections = await this.getConnections();
        const existing = connections.find(c => c.id === connectionId);
        const rejected = await this.updateConnection(connectionId, { status: CONFIG.CONNECTION_STATUS.REJECTED });
        if (existing && existing.fromUserId) {
            try {
                await this.createNotification({
                    userId: existing.fromUserId,
                    type: 'connection_rejected',
                    title: 'Connection declined',
                    message: 'Your connection request was declined.',
                    link: '/people',
                    read: false
                });
            } catch (e) {
                void e;
            }
        }
        return rejected;
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

    async createMessage(senderId, receiverId, text, options = {}) {
        this._assertPortalCanMutate(options);
        const messages = await this.getMessages();
        const trimmed = (text || '').trim();
        const newMessage = {
            id: this.generateId(),
            senderId,
            receiverId,
            text: trimmed,
            read: false,
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        this.storage.set(CONFIG.STORAGE_KEYS.MESSAGES, messages);
        emitDataChange(PMTWIN_EVENTS.MESSAGES_UPDATED, { senderId, receiverId });

        try {
            const sender = await this.getUserOrCompanyById(senderId);
            const senderName =
                sender?.profile?.name ||
                sender?.profile?.companyName ||
                sender?.email ||
                'Someone';
            const preview =
                trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed || 'Sent you a message.';
            const threadLink = `${CONFIG.ROUTES.MESSAGES}/${senderId}`;
            await this.createNotification({
                userId: receiverId,
                type: 'message',
                title: `New message from ${senderName}`,
                message: preview,
                link: threadLink
            });
        } catch (e) {
            console.warn('createMessage: could not add in-app notification', e);
        }

        return newMessage;
    }

    /** Mark in-app notifications for a message thread as read when the recipient opens the conversation. */
    async markMessageNotificationsReadForPartner(viewerId, partnerId) {
        if (!viewerId || !partnerId) return;
        const notifications = this.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
        const threadLink = `${CONFIG.ROUTES.MESSAGES}/${partnerId}`;
        const messagesRoot = CONFIG.ROUTES.MESSAGES || '/messages';
        let changed = false;
        for (const n of notifications) {
            if (n.userId !== viewerId || n.type !== 'message' || n.read) continue;
            const link = n.link || '';
            if (link === threadLink || link === messagesRoot) {
                n.read = true;
                changed = true;
            }
        }
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, notifications);
            emitDataChange(PMTWIN_EVENTS.NOTIFICATIONS_UPDATED, { partnerId });
        }
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
        if (changed) {
            this.storage.set(CONFIG.STORAGE_KEYS.MESSAGES, messages);
            emitDataChange(PMTWIN_EVENTS.MESSAGES_UPDATED, { senderId, receiverId });
        }
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
        const payload = logData && typeof logData === 'object' ? { ...logData } : {};
        if (payload.details && typeof payload.details === 'object' && !payload.details.summary && payload.action) {
            payload.details = { ...payload.details, summary: String(payload.action).replace(/_/g, ' ') };
        }
        const userId = payload.userId;
        let userName = payload.userName;
        if (userName == null || String(userName).trim() === '') {
            if (userId) {
                const entity = await this.getUserOrCompanyById(userId);
                if (entity) {
                    userName =
                        (entity.profile && entity.profile.name && String(entity.profile.name).trim()) ||
                        entity.email ||
                        userId;
                }
            }
        } else {
            userName = String(userName).trim();
        }

        let ipAddress = payload.ipAddress;
        if (ipAddress == null || String(ipAddress).trim() === '') {
            try {
                if (typeof sessionStorage !== 'undefined') {
                    ipAddress = sessionStorage.getItem('pmtwin_client_ip') || undefined;
                }
            } catch {
                ipAddress = undefined;
            }
        } else {
            ipAddress = String(ipAddress).trim();
        }

        const logs = this.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
        const newLog = {
            ...payload,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userName: userName || undefined,
            ipAddress: ipAddress || undefined
        };
        logs.push(newLog);
        const cap = (typeof CONFIG.AUDIT_MAX_ENTRIES === 'number' && CONFIG.AUDIT_MAX_ENTRIES > 0)
            ? CONFIG.AUDIT_MAX_ENTRIES
            : 1000;
        while (logs.length > cap) {
            logs.shift();
        }
        this.storage.set(CONFIG.STORAGE_KEYS.AUDIT, logs);
        return newLog;
    }
    
    async getAuditLogs(filters = {}) {
        let logs = this.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
        const dealScope = filters.dealScope || null;
        const hasDealOppScope =
            dealScope ||
            filters.dealId ||
            filters.opportunityId ||
            filters.matchId ||
            filters.contractId ||
            filters.applicationId ||
            filters.negotiationId ||
            (Array.isArray(filters.opportunityIds) && filters.opportunityIds.length);

        if (filters.userId) {
            logs = logs.filter(l => l.userId === filters.userId);
        }
        if (hasDealOppScope) {
            const scope = dealScope || {
                dealId: filters.dealId,
                opportunityId: filters.opportunityId,
                opportunityIds: filters.opportunityIds,
                matchId: filters.matchId,
                contractId: filters.contractId,
                applicationId: filters.applicationId,
                negotiationId: filters.negotiationId
            };
            logs = logs.filter(l => auditLogMatchesDealOrOpportunity(l, scope));
        } else {
            if (filters.entityType) {
                logs = logs.filter(l => l.entityType === filters.entityType);
            }
            if (filters.entityId) {
                logs = logs.filter(l => l.entityId === filters.entityId);
            }
        }
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            logs = logs.filter(l => new Date(l.timestamp) >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(l => new Date(l.timestamp) <= end);
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

    async createPlan(planData, options = {}) {
        this._assertNotAuditorWrite(options);
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

    async updatePlan(id, updates, options = {}) {
        this._assertNotAuditorWrite(options);
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

    async deletePlan(id, options = {}) {
        this._assertNotAuditorWrite(options);
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
        this._assertNotAuditorWrite(options);
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

    async updateSubscription(id, updates, options = {}) {
        this._assertNotAuditorWrite(options);
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

    async removeSubscription(id, options = {}) {
        this._assertNotAuditorWrite(options);
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
export { DataService };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = dataService;
} else {
    window.dataService = dataService;
}
