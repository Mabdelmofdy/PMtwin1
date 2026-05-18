import { describe, expect, it } from 'vitest';
import * as tracking from '../src/services/matching/opportunity-invitation-tracking.js';

describe('opportunity-invitation-tracking', () => {
    const baseInvitations = [
        {
            id: 'inv-old',
            opportunityId: 'opp-1',
            matchId: 'match-a',
            invitedUserId: 'user-2',
            invitationKind: 'apply',
            status: 'sent',
            createdAt: '2026-01-01T00:00:00.000Z'
        },
        {
            id: 'inv-new',
            opportunityId: 'opp-1',
            matchId: 'match-b',
            invitedUserId: 'user-2',
            invitationKind: 'apply',
            status: 'sent',
            createdAt: '2026-05-01T00:00:00.000Z'
        },
        {
            id: 'inv-repl',
            opportunityId: 'opp-1',
            matchId: 'match-c',
            invitedUserId: 'user-2',
            invitationKind: 'replacement',
            status: 'invitation_sent',
            createdAt: '2026-06-01T00:00:00.000Z'
        }
    ];

    it('prefers exact matchId when provided', () => {
        const picked = tracking.pickActiveInvitation(baseInvitations, {
            opportunityId: 'opp-1',
            userId: 'user-2',
            matchId: 'match-a'
        });
        expect(picked.id).toBe('inv-old');
    });

    it('prefers non-replacement apply invitation over replacement when not a replacement application', () => {
        const picked = tracking.pickActiveInvitation(baseInvitations, {
            opportunityId: 'opp-1',
            userId: 'user-2'
        });
        expect(picked.id).toBe('inv-new');
    });

    it('prefers replacement invitation when applying as replacement', () => {
        const picked = tracking.pickActiveInvitation(baseInvitations, {
            opportunityId: 'opp-1',
            userId: 'user-2',
            isReplacementApplication: true
        });
        expect(picked.id).toBe('inv-repl');
    });

    it('returns friendly lifecycle labels', () => {
        expect(tracking.getInvitationLifecycleLabel({ status: 'sent' })).toBe('Invitation Sent');
        expect(tracking.getInvitationLifecycleLabel({ status: 'accepted', applicationId: 'app-1' })).toBe('Application Submitted');
        expect(tracking.getInvitationLifecycleLabel({ status: 'accepted' }, { dealId: 'deal-1' })).toBe('View Deal');
    });
});
