/**
 * Application status helpers shared across pipeline, dashboard, and data layer.
 */
import { isActiveNegotiation } from '../services/matching/negotiation-lifecycle.js';

const TERMINAL_OPPORTUNITY_STATUSES = new Set([
    'contracted', 'in_execution', 'completed', 'closed', 'cancelled', 'draft'
]);

const BLOCKING_APPLICATION_STATUSES = new Set([
    'pending', 'reviewing', 'shortlisted', 'in_negotiation', 'accepted'
]);

/**
 * Whether an opportunity can receive inbound applications.
 * Needs (and hybrid posts with a need side) accept applications; pure Offers do not.
 * @param {object|null|undefined} opportunity
 */
export function opportunityAcceptsApplications(opportunity) {
    if (!opportunity) return false;
    const intent = (opportunity.intent || 'request').toLowerCase();
    return intent === 'request' || intent === 'hybrid';
}

/**
 * Returns an existing non-terminal application that blocks a new submission.
 * @param {Array} applications
 * @param {string} opportunityId
 * @param {string} applicantId
 */
export function findBlockingApplication(applications, opportunityId, applicantId) {
    return (applications || []).find(
        (app) =>
            app.opportunityId === opportunityId &&
            app.applicantId === applicantId &&
            BLOCKING_APPLICATION_STATUSES.has((app.status || '').toLowerCase())
    ) || null;
}

/**
 * Whether a user can submit a new application to an opportunity.
 * @param {object|null|undefined} opportunity
 * @param {object|null|undefined} user
 * @param {{ application?: object|null, canReapply?: boolean, hasDeal?: boolean }} [context]
 */
export function canUserApplyToOpportunity(opportunity, user, context = {}) {
    if (!user || !opportunity) return false;
    if (!opportunityAcceptsApplications(opportunity)) return false;
    if (opportunity.creatorId === user.id) return false;
    const status = (opportunity.status || '').toLowerCase();
    if (TERMINAL_OPPORTUNITY_STATUSES.has(status)) return false;
    if (!['published', 'in_negotiation'].includes(status)) return false;
    if (context.hasDeal) return false;
    const application = context.application;
    if (application) {
        const appStatus = (application.status || '').toLowerCase();
        if (context.canReapply && ['rejected', 'withdrawn'].includes(appStatus)) return true;
        return false;
    }
    return true;
}

/**
 * Whether an application should appear in the "In negotiation" Applications bucket.
 * @param {object|null|undefined} app
 * @param {object|null|undefined} negotiation — resolved negotiation for app.negotiationId (optional)
 */
export function isApplicationInNegotiation(app, negotiation = null) {
    if (!app) return false;
    if ((app.status || '').toLowerCase() === 'in_negotiation') return true;
    if (negotiation && app.negotiationId && negotiation.id === app.negotiationId) {
        return isActiveNegotiation(negotiation);
    }
    return false;
}

if (typeof window !== 'undefined') {
    window.applicationUtils = {
        isApplicationInNegotiation,
        opportunityAcceptsApplications,
        canUserApplyToOpportunity,
        findBlockingApplication
    };
}
