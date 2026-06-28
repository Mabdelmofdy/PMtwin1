import type { CanonicalData } from '../types/canonical.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
import type { SemanticProfile } from '../types/semantic-profile.ts';
export declare function expandTerm(term: string | null | undefined, categoryExpansion?: CanonicalData['categoryExpansion']): string[];
export declare function buildSemanticProfile(normalizedPost: NormalizedPost, opportunity?: OpportunityPost | null, canonical?: CanonicalData): SemanticProfile;
//# sourceMappingURL=semantic-profile.d.ts.map