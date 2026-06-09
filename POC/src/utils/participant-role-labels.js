/**
 * Human-readable labels for post-match / deal / contract participant roles.
 */

const PARTICIPANT_ROLE_LABELS = {
    need_owner: 'Need Owner',
    offer_provider: 'Offer Provider',
    consortium_lead: 'Consortium Lead',
    consortium_member: 'Consortium Member',
    chain_participant: 'Chain Participant',
    creator: 'Need Owner',
    contractor: 'Offer Provider',
    participant: 'Participant'
};

function normalizeRoleKey(role) {
    return String(role || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function formatParticipantRole(role, fallback = 'Participant') {
    const key = normalizeRoleKey(role);
    if (!key) return fallback;
    if (PARTICIPANT_ROLE_LABELS[key]) return PARTICIPANT_ROLE_LABELS[key];
    return key
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

if (typeof window !== 'undefined') {
    window.formatParticipantRole = formatParticipantRole;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatParticipantRole, PARTICIPANT_ROLE_LABELS };
}
