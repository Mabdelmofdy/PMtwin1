/**
 * ADR-002 PostMatch UI label and filter alignment (Phase 3.1).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const POC_ROOT = path.join(__dirname, '..');

let statusBadgeSystem;
let umv;

beforeAll(() => {
    global.CONFIG = {
        POST_MATCH_STATUS: {
            DISCOVERED: 'discovered',
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            CONFIRMED: 'confirmed',
            DECLINED: 'declined',
            EXPIRED: 'expired'
        }
    };
    global.window = global;
    require(path.join(POC_ROOT, 'src', 'utils', 'status-badge-system.js'));
    statusBadgeSystem = global.statusBadgeSystem;
    umv = require(path.join(POC_ROOT, 'src', 'services', 'matching', 'unified-match-view-model.js'));
});

function readSrc(relativePath) {
    return fs.readFileSync(path.join(POC_ROOT, relativePath), 'utf8');
}

function filterViewModelsLikeMatches(viewModels, tab) {
    const normalize = umv.normalizeAggregateMatchStatus;
    return viewModels.filter((vm) => {
        const vmStatus = normalize(vm.status);
        if (tab === 'discovered' && vmStatus !== 'discovered') return false;
        if (tab === 'accepted' && vmStatus !== 'accepted') return false;
        if (tab === 'confirmed' && vmStatus !== 'confirmed') return false;
        return true;
    });
}

describe('PostMatch aggregate status labels', () => {
    it('pending stored match displays as Discovered', () => {
        expect(umv.normalizeAggregateMatchStatus('pending')).toBe('discovered');
        expect(statusBadgeSystem.getStatusLabel('pending', 'match')).toBe('Discovered');
        expect(umv.getStatusLabel('pending')).toBe('Discovered');
    });

    it('discovered aggregate uses Discovered label', () => {
        expect(statusBadgeSystem.getStatusLabel('discovered', 'match')).toBe('Discovered');
        expect(umv.getStatusLabel('discovered')).toBe('Discovered');
    });

    it('accepted and confirmed aggregate labels', () => {
        expect(statusBadgeSystem.getStatusLabel('accepted', 'match')).toBe('Accepted');
        expect(statusBadgeSystem.getStatusLabel('confirmed', 'match')).toBe('Confirmed');
        expect(umv.getStatusLabel('accepted')).toBe('Accepted');
        expect(umv.getStatusLabel('confirmed')).toBe('Confirmed');
    });

    it('does not expose user-facing Pending label for PostMatch aggregate status', () => {
        const matchLabel = statusBadgeSystem.getStatusLabel('pending', 'match');
        expect(matchLabel).not.toMatch(/pending/i);
        expect(matchLabel).toBe('Discovered');
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-legacy',
            matchType: 'one_way',
            status: 'pending',
            matchScore: 0.8,
            participants: [],
            payload: {}
        });
        expect(vm.status).toBe('discovered');
        expect(vm.statusLabel).toBe('Discovered');
    });
});

describe('PostMatch status filters', () => {
    let fixtures;

    beforeAll(() => {
        fixtures = [
            { id: 'pm-d', status: 'discovered' },
            { id: 'pm-a', status: 'accepted' },
            { id: 'pm-c', status: 'confirmed' },
            { id: 'pm-legacy', status: 'pending' }
        ].map((row) => umv.buildUnifiedMatchViewModel({
            id: row.id,
            matchType: 'one_way',
            status: row.status,
            matchScore: 0.7,
            participants: [],
            payload: {}
        }));
    });

    it('discovered filter includes discovered and legacy pending', () => {
        const rows = filterViewModelsLikeMatches(fixtures, 'discovered');
        expect(rows.map((r) => r.id).sort()).toEqual(['pm-d', 'pm-legacy']);
    });

    it('accepted filter works', () => {
        const rows = filterViewModelsLikeMatches(fixtures, 'accepted');
        expect(rows.map((r) => r.id)).toEqual(['pm-a']);
    });

    it('confirmed filter works', () => {
        const rows = filterViewModelsLikeMatches(fixtures, 'confirmed');
        expect(rows.map((r) => r.id)).toEqual(['pm-c']);
    });
});

describe('PostMatch UI source guards', () => {
    it('matches page tabs use discovered not pending', () => {
        const src = readSrc('features/matches/matches.js');
        expect(src).toContain("{ id: 'discovered', label: 'Discovered' }");
        expect(src).toContain("{ id: 'accepted', label: 'Accepted' }");
        expect(src).not.toMatch(/\{\s*id:\s*'pending',\s*label:\s*'Pending'\s*\}/);
    });

    it('matches filter dropdown uses ADR-002 statuses', () => {
        const html = readSrc('pages/matches/index.html');
        expect(html).toContain('value="discovered">Discovered');
        expect(html).toContain('value="accepted">Accepted');
        expect(html).not.toContain('value="pending">Pending');
    });

    it('pipeline match tabs use discovered not pending', () => {
        const src = readSrc('features/pipeline/pipeline.js');
        const tabsBlock = src.slice(src.indexOf('PIPELINE_MATCHES_TABS'), src.indexOf('PIPELINE_MATCH_TYPE_ORDER'));
        expect(tabsBlock).toContain("{ id: 'discovered', label: 'Discovered' }");
        expect(tabsBlock).not.toMatch(/\{\s*id:\s*'pending',\s*label:\s*'Pending'\s*\}/);
    });

    it('status-badge-system has no Pending Response for match context', () => {
        const src = readSrc('src/utils/status-badge-system.js');
        const matchBlock = src.slice(src.indexOf("if (ctx === 'match')"), src.indexOf("if (ctx === 'negotiation')"));
        expect(matchBlock).toContain("discovered: 'Discovered'");
        expect(matchBlock).not.toContain('Pending Response');
    });
});

describe('PostMatch UI cleanup (Phase 3.2)', () => {
    it('normalizePostMatchTabId maps legacy pending tab to discovered', () => {
        expect(umv.normalizePostMatchTabId('pending')).toBe('discovered');
        expect(umv.normalizePostMatchTabId('discovered')).toBe('discovered');
        expect(umv.normalizePostMatchTabId('confirmed')).toBe('confirmed');
    });

    it('no user-facing Pending matches label in admin reports or profile', () => {
        const adminReports = readSrc('features/admin-reports/admin-reports.js');
        expect(adminReports).not.toMatch(/label:\s*'Pending matches'/i);
        expect(adminReports).not.toMatch(/Pending post matches/i);
        expect(adminReports).toContain("label: 'Discovered matches'");

        const profileJs = readSrc('features/profile/profile.js');
        expect(profileJs).not.toMatch(/Pending \$\{/);
        expect(profileJs).toContain('Discovered ${discoveredMatches}');

        const profileHtml = readSrc('pages/profile/index.html');
        expect(profileHtml).not.toMatch(/Pending 0/);
        expect(profileHtml).toContain('Discovered 0');
    });

    it('pipeline stat shows Discovered label', () => {
        const html = readSrc('pages/pipeline/index.html');
        expect(html).toContain('pipeline-stat-match-pending');
        expect(html).toContain('>Discovered</span>');
        expect(html).not.toMatch(/pipeline-stat-match-pending[\s\S]*?>Pending</);
    });

    it('pipeline session tab pending normalizes to discovered', () => {
        const src = readSrc('features/pipeline/pipeline.js');
        expect(src).toContain('normalizePipelineMatchTabId');
        expect(src).toContain("stored === 'pending' && normalized === 'discovered'");
        expect(src).toContain("sessionStorage.setItem('pipeline-matches-tab', 'discovered')");
    });

    it('matches page normalizes legacy pending tab and filter values', () => {
        const src = readSrc('features/matches/matches.js');
        expect(src).toContain('normalizeMatchFilterTabId');
        expect(src).toContain("sessionStorage.setItem('matches-tab', 'discovered')");
        expect(src).toContain("statusEl?.value === 'pending'");
    });
});
