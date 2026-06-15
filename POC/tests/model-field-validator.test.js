import { describe, expect, it } from 'vitest';
import { loadValidationSandbox } from './validation-test-helper.js';

describe('model-field-validator', () => {
    const g = loadValidationSandbox();

    it('enforces SPV project value minimum', () => {
        const result = g.validateModelAttributes(
            { projectValue: 1000000 },
            'project_based',
            'spv'
        );
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.projectValue).toBeTruthy();
    });

    it('enforces strategic alliance duration minimum', () => {
        const result = g.validateModelAttributes(
            { duration: 1 },
            'strategic_partnership',
            'strategic_alliance'
        );
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.duration).toBeTruthy();
    });

    it('blocks past start date in task-based model', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        const result = g.validateModelAttributes(
            { startDate: `${y}-${m}-${d}` },
            'project_based',
            'task_based',
            { disallowPastDates: true }
        );
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.startDate).toBeTruthy();
    });

    it('accepts currency-range from min/max suffix fields', () => {
        const result = g.validateModelAttributes(
            { budget_min: '25000.01', budget_max: '49117.01', startDate: '2026-08-18' },
            'hiring',
            'consultant_hiring'
        );
        expect(result.fieldErrors.budget).toBeFalsy();
    });

    it('requires currency-range when min/max suffix fields are empty', () => {
        const result = g.validateModelAttributes(
            { budget_min: '', budget_max: '', startDate: '2026-08-18' },
            'hiring',
            'consultant_hiring'
        );
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.budget).toMatch(/required/i);
    });

    it('skips payment fields deferred to value-exchange step', () => {
        const result = g.validateModelAttributes(
            {
                taskTitle: 'Design review',
                taskType: 'Design',
                detailedScope: 'Scope text',
                duration: 14,
                requiredSkills: ['BIM'],
                experienceLevel: 'Senior',
                startDate: '2026-08-18',
                deliverableFormat: 'PDF report'
            },
            'project_based',
            'task_based',
            { excludeKeys: g.EXCHANGE_DEFERRED_ATTRIBUTE_KEYS }
        );
        expect(result.fieldErrors.paymentTerms).toBeFalsy();
        expect(result.fieldErrors.exchangeType).toBeFalsy();
    });
});
