import { describe, expect, it } from 'vitest';
import {
    findBlockingApplication,
    isApplicationInNegotiation,
    opportunityAcceptsApplications,
    canUserApplyToOpportunity
} from '../src/utils/applications.js';

describe('applications utils', () => {
    it('findBlockingApplication returns active application for same opportunity', () => {
        const apps = [
            { id: 'a1', opportunityId: 'opp-1', applicantId: 'user-1', status: 'pending' },
            { id: 'a2', opportunityId: 'opp-1', applicantId: 'user-2', status: 'pending' }
        ];
        expect(findBlockingApplication(apps, 'opp-1', 'user-1')?.id).toBe('a1');
        expect(findBlockingApplication(apps, 'opp-1', 'user-2')?.id).toBe('a2');
        expect(findBlockingApplication(apps, 'opp-2', 'user-1')).toBeNull();
    });

    it('findBlockingApplication ignores rejected and withdrawn applications', () => {
        const apps = [
            { id: 'a1', opportunityId: 'opp-1', applicantId: 'user-1', status: 'rejected' }
        ];
        expect(findBlockingApplication(apps, 'opp-1', 'user-1')).toBeNull();
    });

    it('returns true when status is in_negotiation', () => {
        expect(isApplicationInNegotiation({ status: 'in_negotiation' })).toBe(true);
    });

    it('returns true when negotiationId links to an active negotiation', () => {
        expect(isApplicationInNegotiation(
            { status: 'reviewing', negotiationId: 'neg-1' },
            { id: 'neg-1', status: 'open' }
        )).toBe(true);
    });

    it('returns false when negotiation is terminal', () => {
        expect(isApplicationInNegotiation(
            { status: 'reviewing', negotiationId: 'neg-1' },
            { id: 'neg-1', status: 'agreed' }
        )).toBe(false);
    });

    it('opportunityAcceptsApplications allows needs and hybrid only', () => {
        expect(opportunityAcceptsApplications({ intent: 'request' })).toBe(true);
        expect(opportunityAcceptsApplications({ intent: 'hybrid' })).toBe(true);
        expect(opportunityAcceptsApplications({ intent: 'offer' })).toBe(false);
        expect(opportunityAcceptsApplications(null)).toBe(false);
    });

    it('canUserApplyToOpportunity rejects pure offers such as seed-opp-004', () => {
        const offer = {
            id: 'seed-opp-004',
            intent: 'offer',
            status: 'published',
            creatorId: 'seed-user-002'
        };
        const user = { id: 'seed-user-001' };
        expect(canUserApplyToOpportunity(offer, user)).toBe(false);
        expect(canUserApplyToOpportunity(
            { ...offer, intent: 'request' },
            user
        )).toBe(true);
    });
});
