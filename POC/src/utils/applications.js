/**
 * Application status helpers shared across pipeline, dashboard, and data layer.
 */
import { isActiveNegotiation } from '../services/matching/negotiation-lifecycle.js';

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
        isApplicationInNegotiation
    };
}
