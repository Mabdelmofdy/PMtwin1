/**
 * Phase 10 — matching readiness before publish
 */
import { describe, expect, it } from 'vitest';
import {
    buildMatchingReadinessReport,
    getOpportunityMatchingReadiness
} from '../src/services/matching/matching-readiness.js';

describe('matching-readiness', () => {
    it('reports ready for well-formed opportunity', () => {
        const report = buildMatchingReadinessReport({
            intent: 'request',
            title: 'Steel supply for tower',
            description: 'We need a reliable supplier for structural steel with delivery across Riyadh region.',
            exchangeMode: 'cash',
            exchangeData: { cashAmount: 100000, budgetRange: { min: 50000, max: 150000 } },
            scope: { requiredSkills: ['Steel'], sectors: ['Construction'] },
            attributes: { locationRequirement: 'remote', startDate: '2026-06-01' },
            locationCountry: 'SA'
        });
        expect(report.canPublish).toBe(true);
        expect(['ready', 'warning']).toContain(report.status);
        expect(report.score).toBeGreaterThan(50);
    });

    it('blocks publish when title or intent missing', () => {
        const report = buildMatchingReadinessReport({ title: '', intent: '' });
        expect(report.canPublish).toBe(false);
        expect(report.status).toBe('incomplete');
        expect(report.missingFields.length).toBeGreaterThan(0);
    });

    it('warns but allows publish when skills missing', () => {
        const report = buildMatchingReadinessReport({
            intent: 'offer',
            title: 'Consulting services',
            description: 'Professional advisory services for construction projects in the GCC.',
            exchangeMode: 'cash',
            exchangeData: { budgetRange: { min: 1, max: 2 } },
            location: 'Riyadh'
        });
        expect(report.canPublish).toBe(true);
        expect(report.status).toBe('warning');
        expect(report.warnings.length).toBeGreaterThan(0);
    });

    it('getOpportunityMatchingReadiness aliases buildMatchingReadinessReport', () => {
        const opp = { intent: 'hybrid', title: 'Test', description: 'x'.repeat(50) };
        expect(getOpportunityMatchingReadiness(opp).status).toBe(buildMatchingReadinessReport(opp).status);
    });

    it('flags consortium roles when sub-model is consortium', () => {
        const report = buildMatchingReadinessReport({
            intent: 'request',
            title: 'JV opportunity',
            description: 'Large infrastructure package seeking consortium partners with defined roles.',
            exchangeMode: 'cash',
            exchangeData: { budgetRange: { min: 1, max: 2 } },
            subModelType: 'consortium',
            location: 'Remote'
        });
        expect(report.warnings.some(w => w.toLowerCase().includes('consortium'))).toBe(true);
    });

    it('caps readiness when explicit candidate matches are zero', () => {
        const report = buildMatchingReadinessReport({
            intent: 'request',
            title: 'Well filled post with no candidates yet',
            description: 'x'.repeat(120),
            exchangeMode: 'cash',
            exchangeData: { cashAmount: 1000, budgetRange: { min: 1000, max: 2000 } },
            scope: { requiredSkills: ['Engineering'], sectors: ['Construction'] },
            attributes: { startDate: '2026-07-01' },
            location: 'Remote',
            matchPreviewCandidates: []
        });
        expect(report.score).toBeLessThanOrEqual(35);
        expect(report.warnings.some(w => w.toLowerCase().includes('no candidate matches'))).toBe(true);
    });
});
