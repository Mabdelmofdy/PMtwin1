import { describe, expect, it } from 'vitest';
import { isApplicationInNegotiation } from '../src/utils/applications.js';

describe('applications utils', () => {
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
});
