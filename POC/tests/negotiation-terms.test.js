import { describe, expect, it } from 'vitest';
import {
    getEffectiveTerms,
    mergeProposalTerms,
    detectExchangeMode,
    computeTermDeltas,
    buildProposalFromForm
} from '../src/services/matching/negotiation-terms.js';

describe('negotiation-terms', () => {
    it('getEffectiveTerms prefers agreedTerms', () => {
        const terms = getEffectiveTerms({
            initialTerms: { value: 100 },
            agreedTerms: { value: 200 },
            rounds: [{ proposal: { value: 150 } }]
        });
        expect(terms.value).toBe(200);
    });

    it('getEffectiveTerms uses last round proposal', () => {
        const terms = getEffectiveTerms({
            initialTerms: { value: 100 },
            rounds: [
                { proposal: { value: 120 } },
                { proposal: { value: 140, currency: 'SAR' } }
            ]
        });
        expect(terms.value).toBe(140);
        expect(terms.currency).toBe('SAR');
    });

    it('mergeProposalTerms overlays non-empty fields', () => {
        const merged = mergeProposalTerms({ value: 100, currency: 'SAR' }, { value: 90 });
        expect(merged).toEqual({ value: 90, currency: 'SAR' });
    });

    it('detectExchangeMode from equity fields', () => {
        expect(detectExchangeMode({ equityPercentage: 25 }, null)).toBe('equity');
    });

    it('computeTermDeltas lists changed keys', () => {
        const deltas = computeTermDeltas({ value: 100 }, { value: 90, duration: '3 months' });
        expect(deltas.some(d => d.key === 'value')).toBe(true);
        expect(deltas.some(d => d.key === 'duration')).toBe(true);
    });

    it('buildProposalFromForm maps cash fields', () => {
        const { proposal, message } = buildProposalFromForm({
            value: '50000',
            currency: 'SAR',
            paymentSchedule: '50/50',
            message: 'Counter offer'
        }, 'cash');
        expect(proposal.value).toBe(50000);
        expect(proposal.currency).toBe('SAR');
        expect(message).toBe('Counter offer');
    });
});
