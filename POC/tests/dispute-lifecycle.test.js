import { describe, expect, it } from 'vitest';
import {
    isActiveDispute,
    isTerminalDispute,
    negotiationFormalActionsFrozen,
    getDisputeStatusLabel,
    getDisputeCategoryLabel,
    getResolutionOutcomeLabel
} from '../src/services/matching/dispute-lifecycle.js';

describe('dispute-lifecycle', () => {
    it('detects active disputes', () => {
        expect(isActiveDispute({ status: 'raised' })).toBe(true);
        expect(isActiveDispute({ status: 'under_review' })).toBe(true);
        expect(isActiveDispute({ status: 'mediation' })).toBe(true);
        expect(isActiveDispute({ status: 'resolved' })).toBe(false);
    });

    it('detects terminal disputes', () => {
        expect(isTerminalDispute({ status: 'resolved' })).toBe(true);
        expect(isTerminalDispute({ status: 'withdrawn' })).toBe(true);
        expect(isTerminalDispute({ status: 'raised' })).toBe(false);
    });

    it('freezes formal actions for active disputes', () => {
        expect(negotiationFormalActionsFrozen({ status: 'under_review' })).toBe(true);
        expect(negotiationFormalActionsFrozen({ status: 'resolved' })).toBe(false);
    });

    it('formats labels', () => {
        expect(getDisputeStatusLabel('under_review')).toBe('Under admin review');
        expect(getDisputeCategoryLabel('value_mismatch')).toBe('Value mismatch');
        expect(getResolutionOutcomeLabel('extend_deadline')).toBe('Deadline extended');
    });
});
