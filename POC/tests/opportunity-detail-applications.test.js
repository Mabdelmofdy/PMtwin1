import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const utils = require(path.join(__dirname, '..', 'src', 'utils', 'opportunity-applications.js'));
const demoApplications = require(path.join(__dirname, '..', 'data', 'demo-applications.json')).data;

const featureSource = fs.readFileSync(
    path.join(__dirname, '..', 'features', 'opportunity-detail', 'opportunity-detail.js'),
    'utf8'
);

describe('opportunity-applications helpers — normalizeApplicationValue', () => {
    it('reads wizard snake_case shape', () => {
        const n = utils.normalizeApplicationValue({
            offered_value: 'Structural engineering',
            requested_value: 180000,
            currency: 'SAR',
            exchange_mode: 'cash',
            value_score: 0.82,
            lowValueMatch: true
        });
        expect(n.requestedNumber).toBe(180000);
        expect(n.offeredValue).toBe('Structural engineering');
        expect(n.currency).toBe('SAR');
        expect(n.exchangeMode).toBe('cash');
        expect(n.valueScorePct).toBe(82);
        expect(n.lowValueMatch).toBe(true);
    });

    it('reads legacy camelCase shape', () => {
        const n = utils.normalizeApplicationValue({
            offeredValue: 'BIM delivery',
            requestedValue: 150000,
            requestedCurrency: 'USD'
        });
        expect(n.requestedNumber).toBe(150000);
        expect(n.offeredValue).toBe('BIM delivery');
        expect(n.currency).toBe('USD');
    });

    it('reads seed amount shape', () => {
        const n = utils.normalizeApplicationValue({ amount: 250000, currency: 'SAR' });
        expect(n.requestedNumber).toBe(250000);
        expect(n.currency).toBe('SAR');
    });

    it('reads seed barter shape', () => {
        const n = utils.normalizeApplicationValue({ exchangeMode: 'barter', barterValue: 90000, currency: 'SAR' });
        expect(n.requestedNumber).toBe(90000);
        expect(n.exchangeMode).toBe('barter');
    });

    it('parses string amounts with commas', () => {
        const n = utils.normalizeApplicationValue({ requested_value: '1,200,000' });
        expect(n.requestedNumber).toBe(1200000);
    });

    it('defaults currency to SAR and tolerates empty input', () => {
        expect(utils.normalizeApplicationValue(null).currency).toBe('SAR');
        expect(utils.normalizeApplicationValue(undefined).requestedNumber).toBeNull();
        expect(utils.normalizeApplicationValue({}).valueScorePct).toBeNull();
    });
});

describe('opportunity-applications helpers — formatApplicationValueAmount', () => {
    it('formats numeric amount with currency', () => {
        expect(utils.formatApplicationValueAmount({ amount: 250000, currency: 'SAR' })).toBe('250,000 SAR');
    });

    it('formats barter seed value', () => {
        expect(utils.formatApplicationValueAmount({ exchangeMode: 'barter', barterValue: 90000, currency: 'SAR' }))
            .toBe('90,000 SAR');
    });

    it('falls back to profit split when no amount', () => {
        expect(utils.formatApplicationValueAmount({ exchangeMode: 'profit_sharing', profitSplit: '70-30', currency: 'SAR' }))
            .toBe('Profit split 70-30');
    });

    it('returns null when nothing to show', () => {
        expect(utils.formatApplicationValueAmount({})).toBeNull();
        expect(utils.formatApplicationValueAmount(null)).toBeNull();
    });
});

describe('opportunity-applications helpers — filter & sort', () => {
    it('filters applications to a single opportunity', () => {
        const result = utils.filterApplicationsForOpportunity(demoApplications, 'seed-opp-001');
        expect(result).toHaveLength(0);
    });

    it('returns empty array for unknown opportunity or bad input', () => {
        expect(utils.filterApplicationsForOpportunity(demoApplications, 'nope')).toEqual([]);
        expect(utils.filterApplicationsForOpportunity(null, 'seed-opp-007')).toEqual([]);
    });

    it('sorts by value score descending, missing scores last, without mutating input', () => {
        const input = [
            { id: 'a', application_value: { value_score: 0.3 } },
            { id: 'b', application_value: {} },
            { id: 'c', application_value: { value_score: 0.9 } }
        ];
        const snapshot = JSON.stringify(input);
        const sorted = utils.sortApplicationsByValueScore(input);
        expect(sorted.map((x) => x.id)).toEqual(['c', 'a', 'b']);
        expect(JSON.stringify(input)).toBe(snapshot);
    });
});

describe('opportunity-applications helpers — section visibility', () => {
    it('shows applications list for owner, hides applicant panels', () => {
        const v = utils.resolveApplicationSectionVisibility({ isOwner: true, canViewApplications: true });
        expect(v.showApplicationsList).toBe(true);
        expect(v.showApplyCta).toBe(false);
        expect(v.showAlreadyApplied).toBe(false);
    });

    it('shows apply CTA for an eligible non-owner', () => {
        const v = utils.resolveApplicationSectionVisibility({ isOwner: false, canApply: true });
        expect(v.showApplyCta).toBe(true);
        expect(v.showApplicationsList).toBe(false);
    });

    it('shows already-applied for non-owner with an application but no apply right', () => {
        const v = utils.resolveApplicationSectionVisibility({
            isOwner: false,
            canApply: false,
            currentApplication: { id: 'app-1', status: 'reviewing' }
        });
        expect(v.showAlreadyApplied).toBe(true);
        expect(v.showApplyCta).toBe(false);
    });

    it('lets admins view the list without being owner', () => {
        const v = utils.resolveApplicationSectionVisibility({ isOwner: false, canViewApplications: true });
        expect(v.showApplicationsList).toBe(true);
    });

    it('hides all application UI for pure offers (e.g. seed-opp-004)', () => {
        const v = utils.resolveApplicationSectionVisibility({
            isOwner: true,
            canViewApplications: true,
            acceptsApplications: false
        });
        expect(v.showApplicationsList).toBe(false);
        expect(v.showApplyCta).toBe(false);
        expect(v.showAlreadyApplied).toBe(false);
    });
});

describe('opportunity-detail feature — static guards', () => {
    it('loads applications by canonical opportunity.id, not a URL param', () => {
        expect(featureSource).toMatch(/loadApplications\(opportunity\.id/);
    });

    it('resolves matching-section providers via getUserOrCompanyById', () => {
        const matchingIdx = featureSource.indexOf('async function loadMatchingSection');
        expect(matchingIdx).toBeGreaterThan(-1);
        const matchingBody = featureSource.slice(matchingIdx, matchingIdx + 2000);
        expect(matchingBody).toMatch(/getUserOrCompanyById/);
    });

    it('has no user-pro-/user-company- prefix gates for provider lookup', () => {
        expect(featureSource).not.toMatch(/startsWith\('user-pro-'\)/);
        expect(featureSource).not.toMatch(/startsWith\('user-company-'\)/);
    });

    it('binds data-refresh listeners exactly once via a window guard', () => {
        expect(featureSource).toMatch(/window\.__oppDetailRefreshBound/);
    });

    it('resets module state at the start of loadOpportunity', () => {
        const loadIdx = featureSource.indexOf('async function loadOpportunity');
        const body = featureSource.slice(loadIdx, loadIdx + 600);
        expect(body).toMatch(/currentApplication = null/);
    });
});

describe('opportunity-detail data — PostMatch-first seed (Phase B)', () => {
    const postMatches = require(path.join(__dirname, '..', 'data', 'demo-post-matches.json')).data;

    it('demo-applications.json is empty (canonical flow via post-matches)', () => {
        expect(demoApplications).toHaveLength(0);
    });

    it('seed-opp-026 is linked to a post-match for barter negotiation demo', () => {
        const linked = postMatches.filter((pm) =>
            (pm.participants || []).some((p) => p.opportunityId === 'seed-opp-026')
            || pm.payload?.needOpportunityId === 'seed-opp-026'
        );
        expect(linked.length).toBeGreaterThan(0);
        expect(linked.some((pm) => pm.id === 'demo-pm-oneway-07')).toBe(true);
    });
});
