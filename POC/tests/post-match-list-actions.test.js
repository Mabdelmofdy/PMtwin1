import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONFIG = {
    POST_MATCH_STATUS: { EXPIRED: 'expired', DECLINED: 'declined', CONFIRMED: 'confirmed' },
    POST_MATCH_PARTICIPANT_STATUS: { ACCEPTED: 'accepted' },
    ROUTES: { MATCHES: '/matches' }
};

describe('post-match-list-actions', () => {
    let api;
    let dataService;

    beforeEach(async () => {
        global.CONFIG = CONFIG;
        global.confirm = vi.fn(() => true);
        dataService = {
            getPostMatchById: vi.fn(),
            updatePostMatchStatus: vi.fn(),
            declinePostMatch: vi.fn(),
            acceptReplacementPostMatch: vi.fn(),
            inviteNextReplacementCandidate: vi.fn()
        };
        global.dataService = dataService;
        vi.resetModules();
        await import('../src/utils/post-match-list-actions.js');
        api = global.postMatchListActions;
    });

    it('acceptPostMatchFromList returns expired message', async () => {
        dataService.getPostMatchById.mockResolvedValue({
            id: 'm1',
            status: 'pending',
            expiresAt: '2020-01-01T00:00:00.000Z',
            participants: []
        });
        const result = await api.acceptPostMatchFromList('m1', 'u1', dataService);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/expired/i);
    });

    it('acceptPostMatchFromList updates status when valid', async () => {
        dataService.getPostMatchById.mockResolvedValue({
            id: 'm1',
            status: 'pending',
            participants: [{ userId: 'u1', participantStatus: 'pending' }]
        });
        dataService.updatePostMatchStatus.mockResolvedValue({
            id: 'm1',
            status: 'confirmed',
            participants: [{ userId: 'u1', participantStatus: 'accepted' }]
        });
        const result = await api.acceptPostMatchFromList('m1', 'u1', dataService);
        expect(result.ok).toBe(true);
        expect(dataService.updatePostMatchStatus).toHaveBeenCalledWith('m1', 'u1', 'accepted');
    });

    it('declinePostMatchFromList respects cancel', async () => {
        global.confirm = vi.fn(() => false);
        const result = await api.declinePostMatchFromList('m1', 'u1', dataService);
        expect(result.cancelled).toBe(true);
        expect(dataService.declinePostMatch).not.toHaveBeenCalled();
    });
});
