/**
 * Phase 9 — lifecycle permission helpers
 */
import { describe, expect, it } from 'vitest';
import {
    PERMISSION_ERRORS,
    assertAdminMatchingPersist,
    assertMatchParticipant,
    assertMatchOwner,
    assertNotReadOnlyAdmin,
    assertReplacementOwnerOrAdmin,
    buildLifecycleAuditDetails,
    hasRecentDuplicateNotification,
    isAuditorRole,
    notificationDedupeKey
} from '../src/services/matching/matching-lifecycle-permissions.js';

const allowPersist = (role, cap) =>
    role === 'admin' || (role === 'moderator' && cap === 'admin.matching.read');

describe('matching-lifecycle-permissions', () => {
    it('blocks auditor from admin mutations', () => {
        expect(() => assertNotReadOnlyAdmin('auditor')).toThrow(PERMISSION_ERRORS.READ_ONLY_AUDITOR);
        expect(assertNotReadOnlyAdmin('admin')).toBeUndefined();
    });

    it('requires admin.matching.persist for bulk persist', () => {
        expect(() => assertAdminMatchingPersist('auditor', allowPersist)).toThrow(PERMISSION_ERRORS.DENIED);
        expect(() => assertAdminMatchingPersist('moderator', allowPersist)).toThrow(PERMISSION_ERRORS.DENIED);
        expect(assertAdminMatchingPersist('admin', allowPersist)).toBeUndefined();
    });

    it('allows replacement owner or admin with resolve_blocked', () => {
        const hasCap = (role, cap) =>
            role === 'admin' || cap === 'admin.matching.resolve_blocked' && role === 'moderator';
        expect(() => assertReplacementOwnerOrAdmin(false, 'auditor', hasCap)).toThrow(PERMISSION_ERRORS.DENIED);
        expect(assertReplacementOwnerOrAdmin(true, 'company_owner', hasCap)).toBeUndefined();
        expect(assertReplacementOwnerOrAdmin(false, 'moderator', hasCap)).toBeUndefined();
    });

    it('assertMatchParticipant requires membership', () => {
        const match = { participants: [{ userId: 'u1' }, { userId: 'u2' }] };
        expect(assertMatchParticipant(match, 'u1')).toBeUndefined();
        expect(() => assertMatchParticipant(match, 'u9')).toThrow(PERMISSION_ERRORS.DENIED);
    });

    it('assertMatchOwner requires ownership', () => {
        expect(assertMatchOwner(true)).toBeUndefined();
        expect(() => assertMatchOwner(false)).toThrow(PERMISSION_ERRORS.DENIED);
    });

    it('buildLifecycleAuditDetails merges context ids', () => {
        const d = buildLifecycleAuditDetails({ summary: 'test' }, {
            matchId: 'm1',
            opportunityId: 'o1',
            actorRole: 'admin'
        });
        expect(d.matchId).toBe('m1');
        expect(d.opportunityId).toBe('o1');
        expect(d.actorRole).toBe('admin');
        expect(d.summary).toBe('test');
    });

    it('detects duplicate notifications by dedupeKey', () => {
        const key = notificationDedupeKey('deal_created_from_match', 'deal', 'd1');
        const list = [{ type: 'deal_created_from_match', dedupeKey: key, read: false }];
        expect(hasRecentDuplicateNotification(list, {
            type: 'deal_created_from_match',
            dedupeKey: key
        })).toBe(true);
        expect(hasRecentDuplicateNotification(list, {
            type: 'match_accepted',
            dedupeKey: notificationDedupeKey('match_accepted', 'match', 'm1')
        })).toBe(false);
    });

    it('isAuditorRole identifies auditor', () => {
        expect(isAuditorRole('auditor')).toBe(true);
        expect(isAuditorRole('admin')).toBe(false);
    });
});
