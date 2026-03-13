/**
 * PMTwin Configuration
 * Central configuration for the application
 */

const CONFIG = {
    // Application Info
    APP_NAME: 'PMTwin',
    APP_VERSION: '1.2.0',
    APP_DESCRIPTION: 'Construction Collaboration Platform',
    
    // Base path for loading resources
    // This is set by app-init.js during initialization
    BASE_PATH: '',

    // Auth options (POC: social login is placeholder; set SOCIAL_LOGIN_ENABLED when backend/OAuth is ready)
    AUTH: {
        SOCIAL_LOGIN_ENABLED: false
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        USERS: 'pmtwin_users',
        COMPANIES: 'pmtwin_companies',
        SESSIONS: 'pmtwin_sessions',
        OPPORTUNITIES: 'pmtwin_opportunities',
        APPLICATIONS: 'pmtwin_applications',
        APPLICATION_REQUIREMENTS: 'pmtwin_application_requirements',
        APPLICATION_DELIVERABLES: 'pmtwin_application_deliverables',
        APPLICATION_FILES: 'pmtwin_application_files',
        APPLICATION_PAYMENT_TERMS: 'pmtwin_application_payment_terms',
        MATCHES: 'pmtwin_matches',
        POST_MATCHES: 'pmtwin_post_matches',
        AUDIT: 'pmtwin_audit',
        NOTIFICATIONS: 'pmtwin_notifications',
        CONNECTIONS: 'pmtwin_connections',
        MESSAGES: 'pmtwin_messages',
        CONTRACTS: 'pmtwin_contracts',
        DEALS: 'pmtwin_deals',
        NEGOTIATIONS: 'pmtwin_negotiations',
        REVIEWS: 'pmtwin_reviews',
        SYSTEM_SETTINGS: 'pmtwin_system_settings',
        LOOKUPS_OVERRIDE: 'pmtwin_lookups_override',
        SKILL_CANONICAL_OVERRIDE: 'pmtwin_skill_canonical_override',
        SUBSCRIPTION_PLANS: 'pmtwin_subscription_plans',
        SUBSCRIPTIONS: 'pmtwin_subscriptions',
        RESET_TOKENS: 'pmtwin_reset_tokens'
    },
    
    // Session Management
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Roles
    ROLES: {
        // Company Roles
        COMPANY_OWNER: 'company_owner',
        COMPANY_ADMIN: 'company_admin',
        COMPANY_MEMBER: 'company_member',
        
        // Professional Roles
        PROFESSIONAL: 'professional',
        CONSULTANT: 'consultant',
        
        // Admin Roles
        ADMIN: 'admin',
        MODERATOR: 'moderator',
        AUDITOR: 'auditor'
    },
    
    // Business Models
    MODELS: {
        PROJECT_BASED: 'project_based',
        STRATEGIC_PARTNERSHIP: 'strategic_partnership',
        RESOURCE_POOLING: 'resource_pooling',
        HIRING: 'hiring',
        COMPETITION: 'competition'
    },
    
    // Sub-Models
    SUB_MODELS: {
        TASK_BASED: 'task_based',
        CONSORTIUM: 'consortium',
        PROJECT_JV: 'project_jv',
        SPV: 'spv',
        STRATEGIC_JV: 'strategic_jv',
        STRATEGIC_ALLIANCE: 'strategic_alliance',
        MENTORSHIP: 'mentorship',
        BULK_PURCHASING: 'bulk_purchasing',
        EQUIPMENT_SHARING: 'equipment_sharing',
        RESOURCE_SHARING: 'resource_sharing',
        PROFESSIONAL_HIRING: 'professional_hiring',
        CONSULTANT_HIRING: 'consultant_hiring',
        COMPETITION_RFP: 'competition_rfp'
    },

    // Entity-type eligibility rules for sub-models
    MODEL_ELIGIBILITY: {
        spv: {
            allowedEntityTypes: ['company'],
            reason: 'SPV is a corporate structure available to companies only'
        },
        strategic_jv: {
            allowedEntityTypes: ['company'],
            reason: 'Strategic Joint Venture requires a company entity'
        },
        project_jv: {
            allowedEntityTypes: ['company'],
            reason: 'Project-Specific Joint Venture requires a company entity'
        }
    },
    
    // Opportunity Status (unified lifecycle)
    OPPORTUNITY_STATUS: {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        IN_NEGOTIATION: 'in_negotiation',
        CONTRACTED: 'contracted',
        IN_EXECUTION: 'in_execution',
        COMPLETED: 'completed',
        CLOSED: 'closed',
        CANCELLED: 'cancelled'
    },

    // Opportunity Intent (label-driven)
    OPPORTUNITY_INTENT: {
        REQUEST: 'request',
        OFFER: 'offer',
        HYBRID: 'hybrid'
    },

    // Collaboration Model (wizard step 4)
    COLLABORATION_MODEL: {
        PROJECT: 'project',
        SERVICE: 'service',
        ADVISORY: 'advisory',
        CONSORTIUM: 'consortium'
    },

    // Payment Modes (multi-select)
    PAYMENT_MODES: {
        CASH: 'cash',
        BARTER: 'barter',
        EQUITY: 'equity',
        PROFIT_SHARING: 'profit_sharing',
        HYBRID: 'hybrid'
    },

    // Contract status
    CONTRACT_STATUS: {
        PENDING: 'pending',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        TERMINATED: 'terminated'
    },

    // Deal status (post-matching collaboration workflow)
    DEAL_STATUS: {
        NEGOTIATING: 'negotiating',
        DRAFT: 'draft',
        REVIEW: 'review',
        SIGNING: 'signing',
        ACTIVE: 'active',
        EXECUTION: 'execution',
        DELIVERY: 'delivery',
        COMPLETED: 'completed',
        CLOSED: 'closed'
    },

    // PostMatch status (user-facing match discovery)
    POST_MATCH_STATUS: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        DECLINED: 'declined',
        CONFIRMED: 'confirmed',
        EXPIRED: 'expired'
    },

    POST_MATCH_PARTICIPANT_STATUS: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        DECLINED: 'declined'
    },

    POST_MATCH_TYPE: {
        ONE_WAY: 'one_way',
        TWO_WAY: 'two_way',
        CONSORTIUM: 'consortium',
        CIRCULAR: 'circular'
    },

    POST_MATCH_ROLE: {
        NEED_OWNER: 'need_owner',
        OFFER_PROVIDER: 'offer_provider',
        CONSORTIUM_LEAD: 'consortium_lead',
        CONSORTIUM_MEMBER: 'consortium_member',
        CHAIN_PARTICIPANT: 'chain_participant'
    },

    // Review rating scale (1-5)
    REVIEW_RATING_MIN: 1,
    REVIEW_RATING_MAX: 5,
    
    // Application Status
    APPLICATION_STATUS: {
        PENDING: 'pending',
        REVIEWING: 'reviewing',
        SHORTLISTED: 'shortlisted',
        IN_NEGOTIATION: 'in_negotiation',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        WITHDRAWN: 'withdrawn'
    },
    
    // Connection request status
    CONNECTION_STATUS: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected'
    },

    // User/Company account status (registration and admin)
    USER_STATUS: {
        PENDING: 'pending',
        ACTIVE: 'active',
        SUSPENDED: 'suspended',
        REJECTED: 'rejected',
        CLARIFICATION_REQUESTED: 'clarification_requested'
    },

    // Expertise verification status (professional/consultant/company)
    VERIFICATION_STATUS: {
        UNVERIFIED: 'unverified',
        PROFESSIONAL_VERIFIED: 'professional_verified',
        CONSULTANT_VERIFIED: 'consultant_verified',
        COMPANY_VERIFIED: 'company_verified'
    },

    // Optional verification tier for display (e.g. Top Expert)
    VERIFICATION_TIER: {
        NONE: '',
        TOP_EXPERT: 'top_expert'
    },

    // Matching
    MATCHING: {
        MIN_THRESHOLD: 0.70, // 70% minimum match score
        AUTO_NOTIFY_THRESHOLD: 0.80, // 80% for auto-notification
        // Post-to-post matching
        CANDIDATE_MAX: 200,
        POST_TO_POST_THRESHOLD: 0.50,
        WEIGHTS: {
            SKILL_MATCH: 0.25,
            EXCHANGE_COMPATIBILITY: 0.20,
            VALUE_COMPATIBILITY: 0.20,
            BUDGET_FIT: 0.10,
            TIMELINE: 0.10,
            LOCATION: 0.10,
            REPUTATION: 0.05,
            // Legacy aliases
            ATTRIBUTE_OVERLAP: 0.25,
            BUDGET_FIT_LEGACY: 0.10
        },
        // Optional product-spec weight profile (Skills 40%, Budget 30%, Timeline 15%, Location 10%, Reputation 5%).
        // To use: uncomment WEIGHTS_DESIGN below. Exchange/value set to 0 so total = 1.0.
        // WEIGHTS_DESIGN: { ATTRIBUTE_OVERLAP: 0.40, BUDGET_FIT: 0.30, TIMELINE: 0.15, LOCATION: 0.10, REPUTATION: 0.05, EXCHANGE_COMPATIBILITY: 0, VALUE_COMPATIBILITY: 0 },
        // Value normalization risk factors (used by value-normalizer)
        VALUE_RISK_FACTORS: {
            cash: 1.0,
            equity: 0.6,
            profit_share: 0.5,
            service: 0.85,
            equipment: 0.9,
            resource: 0.85,
            knowledge: 0.7,
            barter: 0.75,
            hybrid: 0.8
        },
        // Negotiation
        NEGOTIATION: {
            MAX_ROUNDS: 10,
            EXPIRE_DAYS: 14,
            STATUS: { OPEN: 'open', COUNTER_OFFERED: 'counter_offered', AGREED: 'agreed', FAILED: 'failed', EXPIRED: 'expired' }
        },
        // Opportunity–candidate matching: extra weight for value compatibility (budget + exchange mode)
        VALUE_COMPATIBILITY_MAX_POINTS: 15,
        LABEL_THRESHOLDS: { MATCH: 1, PARTIAL: 0.25 },
        // Consortium participant replacement
        CONSORTIUM_MIN_PARTICIPANTS: 2,
        CONSORTIUM_REPLACEMENT_ALLOWED_STAGES: ['negotiating', 'draft', 'review', 'signing', 'active', 'execution'],
        MAX_REPLACEMENT_ATTEMPTS: 5
    },
    
    // Routes
    ROUTES: {
        HOME: '/',
        LOGIN: '/login',
        REGISTER: '/register',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
        DASHBOARD: '/dashboard',
        COMPANY_DASHBOARD: '/company-dashboard',
        OPPORTUNITIES: '/opportunities',
        CONTRACTS: '/contracts',
        OPPORTUNITY_CREATE: '/opportunities/create',
        OPPORTUNITY_DETAIL: '/opportunities/:id',
        PEOPLE: '/people',
        PERSON_PROFILE: '/people/:id',
        MESSAGES: '/messages',
        MESSAGE_THREAD: '/messages/:id',
        PROFILE: '/profile',
        SETTINGS: '/settings',
        ADMIN: '/admin',
        ADMIN_USERS: '/admin/users',
        ADMIN_VETTING: '/admin/vetting',
        ADMIN_OPPORTUNITIES: '/admin/opportunities',
        ADMIN_AUDIT: '/admin/audit',
        ADMIN_SETTINGS: '/admin/settings',
        ADMIN_REPORTS: '/admin/reports',
        ADMIN_MATCHING: '/admin/matching',
        ADMIN_PEOPLE: '/admin/people',
        ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
        ADMIN_COLLABORATION_MODELS: '/admin/collaboration-models',
        ADMIN_SKILLS: '/admin/skills',
        ADMIN_DEALS: '/admin/deals',
        ADMIN_DEAL_DETAIL: '/admin/deals/:id',
        ADMIN_CONTRACTS: '/admin/contracts',
        ADMIN_CONSORTIUM: '/admin/consortium',
        ADMIN_HEALTH: '/admin/health',
        NOTIFICATIONS: '/notifications',
        MATCHES: '/matches',
        MATCH_DETAIL: '/matches/:id',
        DEALS: '/deals',
        DEAL_DETAIL: '/deals/:id',
        COLLABORATION_WIZARD: '/collaboration-wizard',
        KNOWLEDGE_BASE: '/knowledge-base',
        COLLABORATION_MODELS: '/collaboration-models',
        FIND: '/find',
        WORKFLOW: '/workflow',
        CONTRACT_DETAIL: '/contracts/:id'
    },
    
    // API Endpoints (for future backend integration)
    API: {
        BASE_URL: '/api/v1',
        ENDPOINTS: {
            AUTH: '/auth',
            USERS: '/users',
            OPPORTUNITIES: '/opportunities',
            APPLICATIONS: '/applications',
            MATCHES: '/matches',
            ADMIN_OPPORTUNITIES: '/admin/opportunities',
            ADMIN_OPPORTUNITIES_BY_ID: '/admin/opportunities/:id',
            ADMIN_USERS: '/admin/users',
            ADMIN_USERS_BY_ID: '/admin/users/:id',
            ADMIN_APPLICATIONS: '/admin/applications',
            ADMIN_APPLICATIONS_BY_OPPORTUNITY: '/admin/opportunities/:id/applications',
            ADMIN_REPORTS_OFFERS_BY_SITE: '/admin/reports/offers-by-site',
            ADMIN_REPORTS_OFFERS_BY_OPPORTUNITY: '/admin/reports/offers-by-opportunity',
            ADMIN_SETTINGS: '/admin/settings',
            ADMIN_SUBSCRIPTION_PLANS: '/admin/subscription-plans',
            ADMIN_SUBSCRIPTIONS: '/admin/subscriptions'
        }
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
