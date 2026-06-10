/**
 * Profile publish gate (GAP-P05)
 */
import { describe, expect, it } from 'vitest';

// profile-completion.js is IIFE on global — import via module.exports in vitest
import profileCompletion from '../src/utils/profile-completion.js';

describe('assertProfileReadyForPublish', () => {
    it('blocks when profile is below threshold', () => {
        const result = profileCompletion.assertProfileReadyForPublish({
            role: 'professional',
            profile: { name: 'Test' }
        });
        expect(result.ok).toBe(false);
        expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('allows when company profile is sufficiently complete', () => {
        const result = profileCompletion.assertProfileReadyForPublish({
            role: 'company_owner',
            profile: {
                type: 'company',
                name: 'Acme Build Co',
                crNumber: 'CR-12345',
                sectors: ['Construction'],
                financialCapacity: 5000000,
                companyRole: 'contractor',
                preferredPaymentModes: ['cash'],
                preferredCollaborationModels: ['project'],
                caseStudies: [{ title: 'Tower A' }],
                references: [{ name: 'Client' }],
                primaryDomain: 'Construction'
            }
        });
        expect(result.ok).toBe(true);
        expect(result.percent).toBeGreaterThanOrEqual(70);
    });
});
