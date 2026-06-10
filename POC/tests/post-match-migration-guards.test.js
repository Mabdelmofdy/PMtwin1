import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let DataService;
let matchingService;

function createMemoryStorage() {
    const data = {};
    return {
        get(key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        set(key, value) {
            data[key] = value;
            return true;
        },
        remove(key) {
            delete data[key];
            return true;
        },
        initialize(defaults) {
            Object.assign(data, defaults);
        }
    };
}

function buildConfig() {
    return {
        ROUTES: { MESSAGES: '/messages' },
        STORAGE_KEYS: {
            USERS: 'test_users',
            COMPANIES: 'test_companies',
            OPPORTUNITIES: 'test_opportunities',
            APPLICATIONS: 'test_applications',
            MATCHES: 'test_matches',
            POST_MATCHES: 'test_post_matches',
            DEALS: 'test_deals',
            CONTRACTS: 'test_contracts',
            NEGOTIATIONS: 'test_negotiations',
            OPPORTUNITY_INVITATIONS: 'test_opportunity_invitations',
            CONNECTIONS: 'test_connections',
            MESSAGES: 'test_messages',
            NOTIFICATIONS: 'test_notifications',
            AUDIT: 'test_audit'
        },
        APPLICATION_STATUS: { ACCEPTED: 'accepted' },
        POST_MATCH_STATUS: {
            PENDING: 'pending',
            CONFIRMED: 'confirmed',
            DECLINED: 'declined',
            EXPIRED: 'expired'
        },
        POST_MATCH_PARTICIPANT_STATUS: {
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            DECLINED: 'declined'
        },
        MATCHING: {
            LEGACY_PERSON_OPPORTUNITY_ENABLED: false,
            DEFAULT_MATCH_EXPIRY_DAYS: 14,
            MIN_THRESHOLD: 0.7,
            AUTO_NOTIFY_THRESHOLD: 0.8,
            POST_TO_POST_THRESHOLD: 0.5,
            NEGOTIATION: { STATUS: { OPEN: 'open', COUNTER_OFFERED: 'counter_offered', AGREED: 'agreed', CANCELLED: 'cancelled' } }
        }
    };
}

beforeAll(async () => {
    global.window = global;
    global.CONFIG = buildConfig();
    global.storageService = createMemoryStorage();
    global.window.storageService = global.storageService;
    global.dataService = {
        getPostMatches: async () => [],
        getMatches: async () => []
    };
    global.window.dataService = global.dataService;
    ({ DataService } = await import('../src/core/data/data-service.js'));
    matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));
});

const LEGACY_MATCHING_CALLS = [
    'findMatchesForOpportunity(',
    'findOpportunitiesForCandidate(',
    'calculateMatchScore('
];

const LEGACY_DATA_SERVICE_CALLS = [
    '.getMatches(',
    '.getMatchById(',
    '.createMatch(',
    '.updateMatch(',
    '.getMatchesForUser(',
    '.getMatchesByOpportunityId('
];

const LEGACY_MATCHING_ALLOWLIST = [
    'src/services/matching/matching-service.js',
    'tests/post-match-migration-guards.test.js'
];

const LEGACY_DATA_SERVICE_ALLOWLIST = [
    'src/core/data/data-service.js',
    'src/services/matching/matching-service.js',
    'tests/post-match-migration-guards.test.js',
    'tests/persist-post-matches.test.js',
    'tests/notify-post-match.test.js'
];

function collectJsFiles(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name !== 'node_modules') {
            collectJsFiles(p, acc);
        } else if (ent.isFile() && ent.name.endsWith('.js')) {
            acc.push(p);
        }
    }
    return acc;
}

function relativePocPath(absPath) {
    return path.relative(path.join(__dirname, '..'), absPath).replace(/\\/g, '/');
}

function isLegacyMatchingAllowlisted(relPath) {
    return LEGACY_MATCHING_ALLOWLIST.some(allowed => relPath === allowed || relPath.endsWith('/' + allowed));
}

function isLegacyDataServiceAllowlisted(relPath) {
    return LEGACY_DATA_SERVICE_ALLOWLIST.some(allowed => relPath === allowed || relPath.endsWith('/' + allowed));
}

describe('legacy matching safeguards', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = new DataService();
        ds.storage = createMemoryStorage();
        ds.storage.initialize({
            [CONFIG.STORAGE_KEYS.MATCHES]: [],
            [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
            [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
            [CONFIG.STORAGE_KEYS.AUDIT]: [],
            [CONFIG.STORAGE_KEYS.USERS]: [],
            [CONFIG.STORAGE_KEYS.COMPANIES]: [],
            [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [],
            [CONFIG.STORAGE_KEYS.DEALS]: [],
            [CONFIG.STORAGE_KEYS.CONTRACTS]: [],
            [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
            [CONFIG.STORAGE_KEYS.APPLICATIONS]: [],
            [CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS]: [],
            [CONFIG.STORAGE_KEYS.CONNECTIONS]: [],
            [CONFIG.STORAGE_KEYS.MESSAGES]: []
        });
    });

    it('blocks createMatch when legacy matching is disabled', async () => {
        const created = await ds.createMatch({
            opportunityId: 'opp-1',
            candidateId: 'user-1',
            matchScore: 0.9
        });
        expect(created).toBeNull();
        expect(await ds.getMatches()).toHaveLength(0);
    });

    it('legacy read helpers return empty when flag is off', async () => {
        expect(await ds.getMatchById('m1')).toBeNull();
        expect(await ds.getMatchesForUser('u1')).toEqual([]);
        expect(await ds.getMatchesByOpportunityId('opp-1')).toEqual([]);
        expect(await ds.updateMatch('m1', { notified: true })).toBeNull();
    });

    it('legacy matching functions return safe no-op values when flag is off', async () => {
        matchingService.dataService = {
            async getOpportunityById() {
                throw new Error('should not be called');
            }
        };
        expect(await matchingService.findMatchesForOpportunity('opp-1')).toEqual([]);
        expect(await matchingService.findOpportunitiesForCandidate('user-1')).toEqual([]);
        expect(await matchingService.calculateMatchScore({}, {})).toBe(0);
    });

    it('updateOpportunity publish runs persistPostMatches only on transition to published', async () => {
        const persistSpy = vi.fn().mockResolvedValue([]);
        const legacySpy = vi.fn().mockResolvedValue([]);
        global.matchingService = {
            persistPostMatches: persistSpy,
            findMatchesForOpportunity: legacySpy
        };
        global.window.matchingService = global.matchingService;

        ds.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, [
            { id: 'opp-draft', creatorId: 'owner-1', title: 'Draft', status: 'draft' },
            { id: 'opp-live', creatorId: 'owner-1', title: 'Live', status: 'published' }
        ]);

        await ds.updateOpportunity('opp-draft', { status: 'published' });
        expect(persistSpy).toHaveBeenCalledTimes(1);
        expect(persistSpy).toHaveBeenCalledWith('opp-draft', { source: 'publish' });
        expect(legacySpy).not.toHaveBeenCalled();

        persistSpy.mockClear();
        await ds.updateOpportunity('opp-live', { status: 'published', title: 'Live (edited)' });
        expect(persistSpy).not.toHaveBeenCalled();
        expect(await ds.getMatches()).toHaveLength(0);
    });
});

describe('deprecated legacy matching compatibility', () => {
    it('does not write pmtwin_matches when legacy flag is off', async () => {
        const createMatchSpy = vi.fn();
        matchingService.dataService = {
            async getOpportunityById() {
                return { id: 'opp-1', creatorId: 'owner-1', title: 'Opp' };
            },
            async getUsers() {
                return [{ id: 'u2', status: 'active' }];
            },
            createMatch: createMatchSpy,
            async getUserById() {
                return { id: 'u2' };
            }
        };
        await matchingService.findMatchesForOpportunity('opp-1');
        expect(createMatchSpy).not.toHaveBeenCalled();
    });

    it('does not notify from findMatchesForOpportunity even when legacy flag is on', async () => {
        const notifySpy = vi.spyOn(matchingService, 'notifyMatch');
        matchingService.dataService = {
            async getOpportunityById() {
                return { id: 'opp-1', creatorId: 'owner-1', title: 'Opp' };
            },
            async getUsers() {
                return [{ id: 'u2', status: 'active' }];
            },
            async createMatch() {
                return { id: 'legacy-1' };
            },
            async getUserById() {
                return { id: 'u2' };
            }
        };
        const prev = CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED;
        CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED = true;
        matchingService.minThreshold = 0;
        matchingService.autoNotifyThreshold = 0;
        vi.spyOn(matchingService, 'calculateMatchScore').mockResolvedValue(0.9);

        await matchingService.findMatchesForOpportunity('opp-1');

        CONFIG.MATCHING.LEGACY_PERSON_OPPORTUNITY_ENABLED = prev;
        expect(notifySpy).not.toHaveBeenCalled();
        notifySpy.mockRestore();
    });
});

describe('post_match payload and expiry safeguards', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = new DataService();
        ds.storage = createMemoryStorage();
        ds.storage.initialize({
            [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
            [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
            [CONFIG.STORAGE_KEYS.AUDIT]: [],
            [CONFIG.STORAGE_KEYS.DEALS]: [],
            [CONFIG.STORAGE_KEYS.CONTRACTS]: [],
            [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
            [CONFIG.STORAGE_KEYS.APPLICATIONS]: [],
            [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [],
            [CONFIG.STORAGE_KEYS.USERS]: [],
            [CONFIG.STORAGE_KEYS.COMPANIES]: []
        });
    });

    it('adds default expiry to new pending post_matches', async () => {
        const before = Date.now();
        const created = await ds.createPostMatch({
            matchType: 'one_way',
            status: CONFIG.POST_MATCH_STATUS.PENDING,
            participants: [
                { userId: 'u1', participantStatus: 'pending' },
                { userId: 'u2', participantStatus: 'pending' }
            ],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' }
        });
        expect(created).toBeTruthy();
        expect(created.expiresAt).toBeTruthy();
        const expiryMs = new Date(created.expiresAt).getTime();
        const days = (expiryMs - before) / 86400000;
        expect(days).toBeCloseTo(14, 0);
    });

    it('uses 14-day default when DEFAULT_MATCH_EXPIRY_DAYS is not configured', () => {
        const prev = CONFIG.MATCHING.DEFAULT_MATCH_EXPIRY_DAYS;
        delete CONFIG.MATCHING.DEFAULT_MATCH_EXPIRY_DAYS;
        const iso = ds.getDefaultPostMatchExpiresAt(CONFIG.POST_MATCH_STATUS.PENDING);
        CONFIG.MATCHING.DEFAULT_MATCH_EXPIRY_DAYS = prev;
        expect(iso).toBeTruthy();
        const days = (new Date(iso).getTime() - Date.now()) / 86400000;
        expect(days).toBeCloseTo(14, 0);
    });

    it('does not set expiresAt on non-pending post_matches', () => {
        expect(ds.getDefaultPostMatchExpiresAt(CONFIG.POST_MATCH_STATUS.CONFIRMED)).toBeNull();
    });

    it('expires pending post_match on read when expiresAt is in the past', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-expired',
            matchType: 'one_way',
            status: 'pending',
            participants: [{ userId: 'u1', participantStatus: 'pending' }],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' },
            expiresAt: '2020-01-01T00:00:00.000Z',
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-01T00:00:00.000Z'
        }]);

        const match = await ds.getPostMatchById('pm-expired');
        expect(match.status).toBe('expired');
    });

    it('expires pending post_matches via getPostMatchesForUser on read', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-user-exp',
            matchType: 'one_way',
            status: 'pending',
            participants: [
                { userId: 'u1', participantStatus: 'pending' },
                { userId: 'u2', participantStatus: 'pending' }
            ],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' },
            expiresAt: '2019-06-01T00:00:00.000Z'
        }]);

        const rows = await ds.getPostMatchesForUser('u1');
        const match = rows.find(m => m.id === 'pm-user-exp');
        expect(match).toBeTruthy();
        expect(match.status).toBe('expired');
    });

    it('requires hydrated two-way payload with needId/offerId on both sides', async () => {
        const invalid = await ds.createPostMatch({
            matchType: 'two_way',
            status: 'pending',
            participants: [],
            payload: {
                sideA: { userId: 'u1', needId: 'need-1', offerId: null },
                sideB: { userId: 'u2', needId: 'need-2', offerId: 'offer-2' }
            }
        });
        expect(invalid).toBeNull();

        const valid = await ds.createPostMatch({
            matchType: 'two_way',
            status: 'pending',
            participants: [],
            payload: {
                sideA: { userId: 'u1', needId: 'need-1', offerId: 'offer-1' },
                sideB: { userId: 'u2', needId: 'need-2', offerId: 'offer-2' }
            }
        });
        expect(valid).toBeTruthy();
    });

    it('requires circular links with from/to creator and need/offer ids', async () => {
        const invalid = await ds.createPostMatch({
            matchType: 'circular',
            status: 'pending',
            participants: [],
            payload: {
                cycle: ['u1', 'u2', 'u3'],
                links: [{ fromCreatorId: 'u1', toCreatorId: 'u2', needId: 'n1', offerId: null, score: 0.8 }]
            }
        });
        expect(invalid).toBeNull();

        const valid = await ds.createPostMatch({
            matchType: 'circular',
            status: 'pending',
            participants: [],
            payload: {
                cycle: ['u1', 'u2', 'u3'],
                links: [{ fromCreatorId: 'u1', toCreatorId: 'u2', needId: 'n1', offerId: 'o1', score: 0.8 }]
            }
        });
        expect(valid).toBeTruthy();
    });

    it('allows deal creation only from confirmed post_match', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [
            {
                id: 'pm-pending',
                matchType: 'one_way',
                status: 'pending',
                participants: [{ userId: 'u1', role: 'need_owner', participantStatus: 'pending' }],
                payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' }
            },
            {
                id: 'pm-confirmed',
                matchType: 'one_way',
                status: 'confirmed',
                participants: [{ userId: 'u1', role: 'need_owner', participantStatus: 'accepted' }],
                payload: { needOpportunityId: 'need-2', offerOpportunityId: 'offer-2' }
            }
        ]);

        await expect(ds.assertDealCreationSource({ matchId: 'pm-pending' }))
            .rejects.toThrow(/confirmed match/i);
        await expect(ds.assertDealCreationSource({ matchId: 'pm-confirmed' }))
            .resolves.toBeUndefined();
    });
});

describe('screen wiring uses post_matches helpers', () => {
    it('pipeline match loader uses getPostMatchesForUser and not legacy getMatches', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'pipeline', 'pipeline.js'), 'utf8');
        expect(src.includes('getPostMatchesForUser')).toBe(true);
        expect(src.includes('getMatches(')).toBe(false);
    });

    it('matches list uses getPostMatchesForUser only', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'matches', 'matches.js'), 'utf8');
        expect(src.includes('getPostMatchesForUser')).toBe(true);
        expect(src.includes('getMatches(')).toBe(false);
    });

    it('match detail uses getPostMatchById only', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'match-detail', 'match-detail.js'), 'utf8');
        expect(src.includes('getPostMatchById')).toBe(true);
        expect(src.includes('getMatchById(')).toBe(false);
    });

    it('match detail does not create deals on accept; Start Deal requires confirmed status', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'match-detail', 'match-detail.js'), 'utf8');
        const acceptHandler = src.slice(
            src.indexOf('updatePostMatchStatus(matchId, userId, CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED)'),
            src.indexOf('} else if (declineBtn)')
        );
        expect(acceptHandler.includes('createDealFromMatch')).toBe(false);
        const startDealHandler = src.slice(src.indexOf('if (createDealMatchBtn)'), src.indexOf('const suggestReplBtn'));
        expect(startDealHandler.includes('createDealFromMatch')).toBe(true);
        expect(startDealHandler.includes('CONFIG.POST_MATCH_STATUS.CONFIRMED')).toBe(true);
        expect(src.includes('Waiting for all participants to accept')).toBe(true);
        expect(src.includes('This match was declined')).toBe(true);
    });

    it('opportunity detail uses post-match helpers and persistPostMatches', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'opportunity-detail', 'opportunity-detail.js'), 'utf8');
        expect(src.includes('getPostMatchesByOpportunityId')).toBe(true);
        expect(src.includes('persistPostMatches')).toBe(true);
        expect(src.includes('findMatchesForOpportunity(')).toBe(false);
        expect(src.includes('findOpportunitiesForCandidate(')).toBe(false);
    });

    it('publish flow delegates matching to dataService.updateOpportunity hook', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'opportunities', 'opportunity-service.js'), 'utf8');
        const statusFn = src.slice(src.indexOf('async updateOpportunityStatus'), src.indexOf('async normalizeAllOpportunities'));
        expect(statusFn.includes('updateOpportunity')).toBe(true);
        expect(statusFn.includes('findMatchesForOpportunity(')).toBe(false);
        expect(statusFn.includes('createMatch(')).toBe(false);
        expect(statusFn.match(/persistPostMatches/g)?.length || 0).toBe(0);
    });

    it('data-service publish hook uses persistPostMatches only', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'core', 'data', 'data-service.js'), 'utf8');
        const publishBlock = src.slice(src.indexOf('isNewlyPublished'), src.indexOf('return updated;', src.indexOf('isNewlyPublished')));
        expect(publishBlock.includes('persistPostMatches')).toBe(true);
        expect(publishBlock.includes('findMatchesForOpportunity(')).toBe(false);
        expect(publishBlock.includes('createMatch(')).toBe(false);
    });

    it('admin matching preview run does not persist or notify', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'admin-matching', 'admin-matching.js'), 'utf8');
        const previewFn = src.slice(src.indexOf('async function runMatchingOnCurrentData'), src.indexOf('function isConfirmedLikeMatch'));
        expect(previewFn.includes('findMatchesForPost')).toBe(true);
        expect(previewFn.includes('persistPostMatches')).toBe(false);
        expect(previewFn.includes('createPostMatch')).toBe(false);
        expect(previewFn.includes('createNotification')).toBe(false);
    });

    it('admin matching bulk save uses opportunities only and persistPreviewOpportunities', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'admin-matching', 'admin-matching.js'), 'utf8');
        expect(src.includes('persistPreviewOpportunities')).toBe(true);
        expect(src.includes('matching-opp-select')).toBe(true);
        expect(src.includes('filterPublishedOpportunityIds')).toBe(true);
        const bulkFn = src.slice(src.indexOf('async function persistSelectedOpportunities'), src.indexOf('function renderLifecycleQueueList'));
        expect(bulkFn.includes('matching-row-select')).toBe(false);
        expect(bulkFn.includes('filterPublishedOpportunityIds')).toBe(true);
        const html = fs.readFileSync(path.join(__dirname, '..', 'pages', 'admin-matching', 'index.html'), 'utf8');
        expect(html.includes('Save selected opportunities')).toBe(true);
        expect(html.includes('page-context-header-mount')).toBe(true);
        const headerPreset = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'page-context-header.js'), 'utf8');
        expect(headerPreset.includes('Run preview report')).toBe(true);
        expect(src.includes('adminMatching')).toBe(true);
    });
});

describe('runtime flows exclude legacy person-to-opportunity matching', () => {
    it('features and src modules do not call legacy data-service match APIs', () => {
        const pocRoot = path.join(__dirname, '..');
        const roots = [
            path.join(pocRoot, 'features'),
            path.join(pocRoot, 'src')
        ];
        const offenders = [];
        for (const root of roots) {
            for (const file of collectJsFiles(root)) {
                const rel = relativePocPath(file);
                if (isLegacyDataServiceAllowlisted(rel)) continue;
                const src = fs.readFileSync(file, 'utf8');
                for (const call of LEGACY_DATA_SERVICE_CALLS) {
                    if (src.includes(call)) offenders.push(`${rel} → ${call}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('features and src modules do not call legacy matching APIs', () => {
        const pocRoot = path.join(__dirname, '..');
        const roots = [
            path.join(pocRoot, 'features'),
            path.join(pocRoot, 'src')
        ];
        const offenders = [];
        for (const root of roots) {
            for (const file of collectJsFiles(root)) {
                const rel = relativePocPath(file);
                if (isLegacyMatchingAllowlisted(rel)) continue;
                const src = fs.readFileSync(file, 'utf8');
                for (const call of LEGACY_MATCHING_CALLS) {
                    if (src.includes(call)) offenders.push(`${rel} → ${call}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('initializeFromJSON and mergeDemoData skip legacy match seed when flag is off', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'src', 'core', 'data', 'data-service.js'),
            'utf8'
        );
        expect(src).toMatch(/domains\.splice\(4,\s*0,\s*'matches'\)/);
        expect(src).toMatch(/_isLegacyPersonOpportunityEnabled\(\)[\s\S]*?demo-matches\.json/);
        const mergeBlock = src.slice(src.indexOf('async mergeDemoData'), src.indexOf('async reseedFromJSON'));
        expect(mergeBlock).toMatch(/_isLegacyPersonOpportunityEnabled\(\)[\s\S]*?demo-matches\.json/);
        expect(mergeBlock).toContain("this.storage.set(CONFIG.STORAGE_KEYS.MATCHES, []);");
    });

    it('legacy data-service match methods are marked deprecated', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'src', 'core', 'data', 'data-service.js'),
            'utf8'
        );
        expect(src.includes('@deprecated Legacy person-to-opportunity store')).toBe(true);
        expect(src.includes('@deprecated Legacy `pmtwin_matches`. Use `getPostMatchById')).toBe(true);
        expect(src.includes('@deprecated Legacy `pmtwin_matches`. Use `getPostMatchesForUser')).toBe(true);
        expect(src.includes('@deprecated Legacy `pmtwin_matches`. Use `createPostMatch')).toBe(true);
    });

    it('deprecated functions are documented in matching-service', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'),
            'utf8'
        );
        expect(src.includes('Do not call this from UI or publish flows.')).toBe(true);
        expect(src.includes('async findMatchesForOpportunity')).toBe(true);
        expect(src.includes('async findOpportunitiesForCandidate')).toBe(true);
        expect(src.includes('async calculateMatchScore')).toBe(true);
    });
});

describe('post_match notifications', () => {
    it('uses new_match_found and /matches/:id links', async () => {
        const sent = [];
        matchingService.dataService = {
            async getOpportunityById(id) {
                return { id, title: id };
            },
            async createLifecycleNotification(payload) {
                sent.push(payload);
                return payload;
            }
        };

        await matchingService.notifyPostMatch({
            id: 'pm-100',
            matchType: 'one_way',
            matchScore: 0.82,
            participants: [{ userId: 'u1' }, { userId: 'u2' }],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' }
        });

        expect(sent.length).toBe(2);
        sent.forEach(n => {
            expect(n.type).toBe('new_match_found');
            expect(n.link).toBe('/matches/pm-100');
            expect(n.postMatchId).toBe('pm-100');
            expect(n.entityId).toBe('pm-100');
            expect(n.title).toBe('New Need/Offer match');
        });
    });

    it('notifyMatch is a no-op (deprecated)', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await matchingService.notifyMatch({ id: 'x' }, { title: 'T' }, { id: 'u1' });
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});

describe('matching-service notification guards', () => {
    it('findMatchesForOpportunity does not call notifyMatch', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'),
            'utf8'
        );
        const fnBlock = src.slice(src.indexOf('async findMatchesForOpportunity'), src.indexOf('async calculateMatchScore'));
        expect(fnBlock.includes('notifyMatch')).toBe(false);
    });
});
