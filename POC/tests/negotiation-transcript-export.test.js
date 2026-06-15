import { describe, expect, it } from 'vitest';
import { buildNegotiationTranscript, transcriptTimelineToCsv } from '../src/services/matching/negotiation-transcript-export.js';

describe('negotiation-transcript-export', () => {
    it('builds unified timeline with discussion and formal rounds', async () => {
        const transcript = await buildNegotiationTranscript({
            negotiation: {
                id: 'neg-1',
                status: 'counter_offered',
                createdAt: '2026-01-01T00:00:00.000Z',
                parties: [{ userId: 'u1', role: 'need_owner' }],
                initialTerms: { value: 100000 },
                discussionThread: [{ by: 'u1', at: '2026-01-02T00:00:00.000Z', body: 'Can we discuss scope?' }],
                rounds: [{ by: 'u2', at: '2026-01-03T00:00:00.000Z', message: 'Counter', proposal: { value: 90000 } }]
            },
            opportunityTitle: 'Test project',
            resolveName: async (id) => id
        });
        expect(transcript.negotiationId).toBe('neg-1');
        expect(transcript.timeline.length).toBeGreaterThanOrEqual(3);
        expect(transcript.timeline.some(t => t.kind === 'discussion')).toBe(true);
        expect(transcript.timeline.some(t => t.kind === 'formal_proposal')).toBe(true);
    });

    it('includes dispute events when provided', async () => {
        const transcript = await buildNegotiationTranscript({
            negotiation: { id: 'neg-2', status: 'open', createdAt: '2026-01-01T00:00:00.000Z', parties: [] },
            dispute: {
                id: 'd1',
                raisedBy: 'u1',
                raisedAt: '2026-01-05T00:00:00.000Z',
                category: 'value_mismatch',
                description: 'Value mismatch',
                thread: []
            },
            resolveName: async () => 'Party'
        });
        expect(transcript.disputeId).toBe('d1');
        expect(transcript.timeline.some(t => t.kind === 'dispute')).toBe(true);
    });

    it('exports timeline csv', async () => {
        const transcript = await buildNegotiationTranscript({
            negotiation: { id: 'n', status: 'open', createdAt: '2026-01-01T00:00:00.000Z', parties: [] },
            resolveName: async () => 'X'
        });
        const csv = transcriptTimelineToCsv(transcript);
        expect(csv.split('\n').length).toBeGreaterThan(1);
        expect(csv).toContain('kind');
    });
});
