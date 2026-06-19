/**
 * Minimal CONFIG for data-service integration tests.
 */
export function createTestConfig() {
    return {
        DEFAULT_INVITATION_EXPIRY_DAYS: 14,
        INVITATION_STATUS: {
            SENT: 'sent',
            ACCEPTED: 'accepted',
            DECLINED: 'declined',
            CANCELLED: 'cancelled',
            EXPIRED: 'expired'
        },
        INVITATION_KIND: {
            APPLY: 'apply',
            REPLACEMENT: 'replacement'
        },
        APPLICATION_STATUS: {
            PENDING: 'pending',
            IN_NEGOTIATION: 'in_negotiation',
            ACCEPTED: 'accepted'
        },
        OPPORTUNITY_STATUS: {
            PUBLISHED: 'published',
            IN_NEGOTIATION: 'in_negotiation',
            CONTRACTED: 'contracted',
            IN_EXECUTION: 'in_execution',
            COMPLETED: 'completed',
            CLOSED: 'closed',
            CANCELLED: 'cancelled'
        },
        DEAL_STATUS: {
            NEGOTIATING: 'negotiating',
            DRAFT: 'draft',
            REVIEW: 'review',
            SIGNING: 'signing',
            ACTIVE: 'active',
            EXECUTION: 'execution',
            COMPLETED: 'completed',
            CLOSED: 'closed'
        },
        POST_MATCH_STATUS: {
            CONFIRMED: 'confirmed',
            PENDING: 'pending',
            EXPIRED: 'expired',
            DECLINED: 'declined'
        },
        MATCHING: {
            DEFAULT_MATCH_EXPIRY_DAYS: 14,
            NEGOTIATION: {
                STATUS: {
                    OPEN: 'open',
                    COUNTER_OFFERED: 'counter_offered',
                    AGREED: 'agreed',
                    CANCELLED: 'cancelled'
                }
            }
        },
        STORAGE_KEYS: {
            USERS: 'test_users',
            COMPANIES: 'test_companies',
            OPPORTUNITIES: 'test_opportunities',
            APPLICATIONS: 'test_applications',
            OPPORTUNITY_INVITATIONS: 'test_opportunity_invitations',
            MATCHES: 'test_matches',
            POST_MATCHES: 'test_post_matches',
            NEGOTIATIONS: 'test_negotiations',
            DEALS: 'test_deals',
            NOTIFICATIONS: 'test_notifications',
            AUDIT: 'test_audit'
        }
    };
}

export function createMemoryStorage() {
    const data = {};
    return {
        get(key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        set(key, value) {
            data[key] = value;
            return true;
        },
        remove(key) {
            delete data[key];
            return true;
        },
        initialize(defaults) {
            Object.assign(data, defaults);
        }
    };
}
