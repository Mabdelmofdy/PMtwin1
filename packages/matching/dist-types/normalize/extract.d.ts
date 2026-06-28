import type { CanonicalData } from '../types/canonical.ts';
import type { CreatorProfile } from '../types/creator.ts';
import type { MatchingConfig } from '../types/matching-config.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export interface ExtractNormalizeOptions {
    readonly config?: MatchingConfig;
    readonly creator?: CreatorProfile | null;
}
export declare function extractAndNormalize(opportunity: OpportunityPost, canonical?: CanonicalData, options?: ExtractNormalizeOptions): NormalizedPost;
//# sourceMappingURL=extract.d.ts.map