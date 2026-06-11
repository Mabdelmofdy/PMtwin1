/**
 * Hard constraints — role matrix, coreSkills, and service overlap gates.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const POC_ROOT = path.join(__dirname, '..');

let hardConstraints;
let postPreprocessor;

function buildConfig() {
    return {
        MATCHING: {
            HARD_CONSTRAINTS_ENABLED: true,
            STRICT_ROLE_REQUIRED: true,
            STRICT_ROLE_EXACT_MATCH: true,
            MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
            MIN_SKILL_SCORE_FOR_MATCH: 0.50
        }
    };
}

function needPost(overrides = {}) {
    return {
        id: 'need-1',
        intent: 'request',
        attributes: { targetRole: 'Architect' },
        scope: { requiredSkills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'] },
        normalized: {
            role: 'Architect',
            requiredServices: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'],
            offeredServices: [],
            coreSkills: [],
            skills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification']
        },
        ...overrides
    };
}

function offerPost(overrides = {}) {
    return {
        id: 'offer-1',
        intent: 'offer',
        attributes: { targetRole: 'Civil Engineer' },
        scope: { offeredSkills: ['Structural Analysis', 'SAP2000'] },
        normalized: {
            role: 'Civil Engineer',
            requiredServices: [],
            offeredServices: ['Structural Analysis', 'SAP2000'],
            coreSkills: [],
            skills: ['Structural Analysis', 'SAP2000']
        },
        ...overrides
    };
}

beforeAll(() => {
    global.CONFIG = buildConfig();
    postPreprocessor = require(path.join(POC_ROOT, 'src', 'services', 'matching', 'post-preprocessor.js'));
    hardConstraints = require(path.join(POC_ROOT, 'src', 'services', 'matching', 'hard-constraints.js'));
});

describe('hard-constraints role gate', () => {
    it('rejects Architect Need with Civil Engineer Offer', () => {
        const result = hardConstraints.passesPair(needPost(), offerPost());
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('role_incompatible');
        expect(result.needRole).toBe('Architect');
        expect(result.offerRole).toBe('Civil Engineer');
    });

    it('rejects Architect Need with Interior Designer Offer under exact-role mode', () => {
        const offer = offerPost({
            attributes: { targetRole: 'Interior Designer' },
            normalized: {
                role: 'Interior Designer',
                offeredServices: ['BIM', '3D Visualization'],
                skills: ['BIM', '3D Visualization']
            }
        });
        const result = hardConstraints.passesPair(needPost(), offer);
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('role_incompatible');
        expect(result.needRole).toBe('Architect');
        expect(result.offerRole).toBe('Interior Designer');
    });

    it('rejects Structural Engineer Need with Civil Engineer Offer under exact-role mode', () => {
        const need = needPost({
            attributes: { targetRole: 'Structural Engineer' },
            normalized: {
                role: 'Structural Engineer',
                requiredServices: ['Structural Analysis', 'SAP2000'],
                offeredServices: [],
                coreSkills: [],
                skills: ['Structural Analysis', 'SAP2000']
            }
        });
        const offer = offerPost({
            attributes: { targetRole: 'Civil Engineer' },
            normalized: {
                role: 'Civil Engineer',
                offeredServices: ['Structural Analysis', 'SAP2000'],
                skills: ['Structural Analysis', 'SAP2000']
            }
        });
        const result = hardConstraints.passesPair(need, offer);
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('role_incompatible');
        expect(result.needRole).toBe('Structural Engineer');
        expect(result.offerRole).toBe('Civil Engineer');
    });

    it('allows exact same role (Architect Need with Architect Offer)', () => {
        const offer = offerPost({
            attributes: { targetRole: 'Architect' },
            normalized: {
                role: 'Architect',
                offeredServices: ['BIM', '3D Visualization'],
                skills: ['BIM', '3D Visualization']
            }
        });
        const result = hardConstraints.passesPair(needPost(), offer);
        expect(result.ok).toBe(true);
        expect(result.needRole).toBe('Architect');
        expect(result.offerRole).toBe('Architect');
    });

    it('rejects when need role is missing', () => {
        const need = needPost({
            attributes: {},
            scope: { requiredSkills: [] },
            normalized: { role: '', requiredServices: [], offeredServices: [] }
        });
        const result = hardConstraints.passesPair(need, offerPost());
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('role_missing');
        expect(result.side).toBe('need');
    });
});

describe('hard-constraints coreSkills gate', () => {
    it('rejects when core skill is missing from offer', () => {
        const need = needPost({
            scope: { requiredSkills: ['BIM', 'Revit'], coreSkills: ['BIM'] },
            normalized: {
                role: 'Architect',
                requiredServices: ['BIM', 'Revit'],
                coreSkills: ['BIM'],
                offeredServices: []
            }
        });
        const offer = offerPost({
            attributes: { targetRole: 'Architect' },
            scope: { offeredSkills: ['Revit'] },
            normalized: {
                role: 'Architect',
                offeredServices: ['Revit'],
                coreSkills: [],
                skills: ['Revit']
            }
        });
        const result = hardConstraints.passesPair(need, offer);
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('core_skill_missing');
        expect(result.missing).toContain('BIM');
    });
});

describe('hard-constraints service overlap gate', () => {
    it('rejects when only 1 of 4 required services match (25%)', () => {
        const need = needPost();
        const offer = offerPost({
            attributes: { targetRole: 'Architect' },
            scope: { offeredSkills: ['BIM'] },
            normalized: {
                role: 'Architect',
                offeredServices: ['BIM'],
                skills: ['BIM']
            }
        });
        const result = hardConstraints.passesPair(need, offer);
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('service_overlap_low');
        expect(result.overlap).toBe(0.25);
    });

    it('passes when 2 of 4 required services match (50%)', () => {
        const need = needPost();
        const offer = offerPost({
            attributes: { targetRole: 'Architect' },
            scope: { offeredSkills: ['BIM', '3D Visualization'] },
            normalized: {
                role: 'Architect',
                offeredServices: ['BIM', '3D Visualization'],
                skills: ['BIM', '3D Visualization']
            }
        });
        const result = hardConstraints.passesPair(need, offer);
        expect(result.ok).toBe(true);
        expect(result.overlap).toBe(0.5);
    });
});

describe('post-preprocessor role and services extraction', () => {
    it('extracts targetRole, requiredServices, offeredServices, and coreSkills', () => {
        const need = {
            intent: 'request',
            attributes: { targetRole: 'Architect', coreSkills: ['BIM'] },
            scope: { requiredSkills: ['BIM', 'Revit'] }
        };
        const offer = {
            intent: 'offer',
            attributes: { targetRole: 'Architect' },
            scope: { offeredSkills: ['BIM', 'SketchUp'] }
        };

        const needNorm = postPreprocessor.extractAndNormalize(need);
        const offerNorm = postPreprocessor.extractAndNormalize(offer);

        expect(needNorm.role).toBe('Architect');
        expect(needNorm.requiredServices).toEqual(['BIM', 'Revit']);
        expect(needNorm.coreSkills).toEqual(['BIM']);
        expect(offerNorm.role).toBe('Architect');
        expect(offerNorm.offeredServices).toEqual(['BIM', 'SketchUp']);
    });

    it('does not fall back to first skill as role under strict role mode', () => {
        const need = {
            intent: 'request',
            attributes: {},
            scope: { requiredSkills: ['General Consulting', 'Advisory'] }
        };
        const needNorm = postPreprocessor.extractAndNormalize(need);
        expect(needNorm.role).toBe('');
    });
});
