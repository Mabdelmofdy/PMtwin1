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
});
