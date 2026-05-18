/**
 * Integration-style tests for invitation + negotiation lifecycle on DataService.
 */
import { describe, expect, it, beforeEach, beforeAll } from 'vitest';
import { createTestConfig, createMemoryStorage } from './helpers/matching-lifecycle-test-config.js';

let DataService;

beforeAll(async () => {
    global.window = global;
    global.CONFIG = createTestConfig();
    global.storageService = createMemoryStorage();
    global.window.storageService = global.storageService;
    ({ DataService } = await import('../src/core/data/data-service.js'));
});

function seedUsers(ds) {
    ds.storage.set(global.CONFIG.STORAGE_KEYS.USERS, [
        { id: 'owner-1', role: 'professional', status: 'active' },
        { id: 'provider-1', role: 'professional', status: 'active' }
    ]);
}

function seedOpportunity(ds, id = 'opp-1', creatorId = 'owner-1') {
    ds.storage.set(global.CONFIG.STORAGE_KEYS.OPPORTUNITIES, [
        { id, creatorId, title: 'Test Opp', status: 'published' }
    ]);
}

describe('DataService invitation lifecycle', () => {
    let ds;

    beforeEach(() => {
        ds = new DataService();
        ds.storage = createMemoryStorage();
        ds.storage.initialize({
            [CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS]: [],
            [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
            [CONFIG.STORAGE_KEYS.AUDIT]: []
        });
        seedUsers(ds);
        seedOpportunity(ds);
    });

    it('sets default expiresAt on new invitation', async () => {
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            invitedByUserId: 'owner-1',
            status: 'sent',
            createdAt: '2026-05-01T00:00:00.000Z'
        });
        expect(inv.expiresAt).toBeTruthy();
        const expiresMs = new Date(inv.expiresAt).getTime();
        const createdMs = new Date('2026-05-01T00:00:00.000Z').getTime();
        const days = (expiresMs - createdMs) / 86400000;
        expect(days).toBeCloseTo(14, 0);
    });

    it('preserves explicitly provided expiresAt', async () => {
        const custom = '2026-12-31T23:59:59.000Z';
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            expiresAt: custom,
            createdAt: '2026-05-01T00:00:00.000Z'
        });
        expect(inv.expiresAt).toBe(custom);
    });

    it('expires sent invitation past expiresAt', async () => {
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            status: 'sent',
            createdAt: '2026-01-01T00:00:00.000Z',
            expiresAt: '2026-05-01T00:00:00.000Z'
        });
        const expired = await ds.expireOpportunityInvitations('2026-05-18T00:00:00.000Z');
        expect(expired).toHaveLength(1);
        expect(expired[0].status).toBe('expired');
        const stored = await ds.getOpportunityInvitationById(inv.id);
        expect(stored.status).toBe('expired');
    });

    it('second sweep does not duplicate audit entries', async () => {
        await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            status: 'sent',
            expiresAt: '2026-05-01T00:00:00.000Z'
        });
        const now = '2026-05-18T00:00:00.000Z';
        await ds.expireOpportunityInvitations(now);
        await ds.expireOpportunityInvitations(now);
        const audit = ds.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || [];
        const expireLogs = audit.filter(a => a.action === 'opportunity_invitation_expired');
        expect(expireLogs).toHaveLength(1);
    });

    it('does not expire accepted invitation', async () => {
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            status: 'accepted',
            expiresAt: '2026-05-01T00:00:00.000Z'
        });
        const expired = await ds.expireOpportunityInvitations('2026-05-18T00:00:00.000Z');
        expect(expired).toHaveLength(0);
        const stored = await ds.getOpportunityInvitationById(inv.id);
        expect(stored.status).toBe('accepted');
    });

    it('declines and cancels invitations', async () => {
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            invitedByUserId: 'owner-1',
            status: 'sent'
        });
        const declined = await ds.declineOpportunityInvitation(inv.id, 'provider-1', 'not interested');
        expect(declined.status).toBe('declined');

        const inv2 = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            invitedByUserId: 'owner-1',
            status: 'sent'
        });
        const cancelled = await ds.cancelOpportunityInvitation(inv2.id, 'owner-1');
        expect(cancelled.status).toBe('cancelled');
    });

    it('links application to invitation as accepted', async () => {
        const inv = await ds.createOpportunityInvitation({
            opportunityId: 'opp-1',
            invitedUserId: 'provider-1',
            matchId: 'match-1',
            status: 'sent'
        });
        ds.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, []);
        const app = await ds.createApplication({
            opportunityId: 'opp-1',
            applicantId: 'provider-1',
            invitationId: inv.id,
            matchId: 'match-1'
        });
        const updated = await ds.getOpportunityInvitationById(inv.id);
        expect(updated.status).toBe('accepted');
        expect(updated.applicationId).toBe(app.id);
    });
});

describe('DataService negotiation lifecycle', () => {
    let ds;

    beforeEach(() => {
        ds = new DataService();
        ds.storage = createMemoryStorage();
        ds.storage.initialize({
            [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
            [CONFIG.STORAGE_KEYS.DEALS]: [],
            [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
            [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
            [CONFIG.STORAGE_KEYS.AUDIT]: []
        });
        seedUsers(ds);
        seedOpportunity(ds);
    });

    function seedNegotiation(parties) {
        return ds.createNegotiation({
            opportunityId: 'opp-1',
            matchId: 'match-1',
            applicationId: 'app-1',
            parties,
            status: CONFIG.MATCHING.NEGOTIATION.STATUS.OPEN,
            initialTerms: { scope: 'API work', value: 5000, currency: 'SAR' },
            rounds: []
        });
    }

    it('requires all participants before status becomes agreed', async () => {
        const neg = await seedNegotiation([
            { userId: 'owner-1', role: 'need_owner' },
            { userId: 'provider-1', role: 'offer_provider' }
        ]);

        const afterFirst = await ds.agreeNegotiation(neg.id, 'owner-1');
        expect(afterFirst.status).toBe('open');
        expect(afterFirst.participantAgreements).toHaveLength(1);

        const afterSecond = await ds.agreeNegotiation(neg.id, 'provider-1');
        expect(afterSecond.status).toBe('agreed');
        expect(afterSecond.finalAgreedSnapshot.agreementMode).toBe('multi_party');
        expect(afterSecond.finalAgreedSnapshot.agreedBy).toHaveLength(2);
    });

    it('repeated agree by same user is a no-op', async () => {
        const neg = await seedNegotiation([
            { userId: 'owner-1', role: 'need_owner' },
            { userId: 'provider-1', role: 'offer_provider' }
        ]);
        await ds.agreeNegotiation(neg.id, 'owner-1');
        const auditBefore = (ds.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || []).length;
        const again = await ds.agreeNegotiation(neg.id, 'owner-1');
        expect(again.status).toBe('open');
        const auditAfter = (ds.storage.get(CONFIG.STORAGE_KEYS.AUDIT) || []).length;
        expect(auditAfter).toBe(auditBefore);
    });

    it('createDealFromNegotiation only works after agreed', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'match-1',
            status: CONFIG.POST_MATCH_STATUS.CONFIRMED,
            matchType: 'one_way',
            participants: [{ userId: 'owner-1', role: 'need_owner' }]
        }]);
        ds.storage.set(CONFIG.STORAGE_KEYS.APPLICATIONS, [{
            id: 'app-1',
            opportunityId: 'opp-1',
            applicantId: 'provider-1',
            status: CONFIG.APPLICATION_STATUS.ACCEPTED
        }]);
        const neg = await seedNegotiation([{ userId: 'owner-1', role: 'need_owner' }]);
        await expect(ds.createDealFromNegotiation(neg.id, 'owner-1'))
            .rejects.toThrow(/Agree to terms/);

        await ds.agreeNegotiation(neg.id, 'owner-1');
        const deal = await ds.createDealFromNegotiation(neg.id, 'owner-1');
        expect(deal.negotiationId).toBe(neg.id);
    });

    it('supports proposal counter and finalAgreedSnapshot', async () => {
        const neg = await seedNegotiation([
            { userId: 'owner-1', role: 'need_owner' },
            { userId: 'provider-1', role: 'offer_provider' }
        ]);
        await ds.addNegotiationProposal(neg.id, 'owner-1', {
            proposal: { scope: 'Revised scope', value: 6000, currency: 'SAR' }
        });
        await ds.agreeNegotiation(neg.id, 'owner-1');
        const agreed = await ds.agreeNegotiation(neg.id, 'provider-1');
        expect(agreed.finalAgreedSnapshot.scope).toBeTruthy();
        expect(agreed.finalAgreedSnapshot.agreedBy.map(a => a.userId).sort())
            .toEqual(['owner-1', 'provider-1']);
    });
});
