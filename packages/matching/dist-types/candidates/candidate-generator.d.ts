import type { MatchingConfig } from '../types/matching-config.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export interface CandidateGeneratorOptions {
    readonly maxCandidates?: number;
    readonly needNormalized?: NormalizedPost;
    readonly offerNormalized?: NormalizedPost;
}
export declare function budgetCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function locationCompatible(_needNorm: NormalizedPost, _offerNorm: NormalizedPost): boolean;
export declare function timelineOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
/** Sector / profession categories only — never modelType or subModelType. */
export declare function sectorCategoryTokens(norm: NormalizedPost): string[];
/**
 * Hard eligibility for collaboration model / sub-model.
 * Empty on either side is not a reject. Shared modelType or subModelType is enough.
 * Category / sector tokens are intentionally excluded.
 */
export declare function collaborationModelCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
/**
 * Soft sector overlap. Empty categories are compatible.
 * Does not consider modelType / subModelType.
 */
export declare function categoryOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function getCandidates(needPost: OpportunityPost, offerPosts: readonly OpportunityPost[], config: MatchingConfig, options?: CandidateGeneratorOptions): OpportunityPost[];
export declare function getCandidatesForOffer(offerPost: OpportunityPost, needPosts: readonly OpportunityPost[], config: MatchingConfig, options?: CandidateGeneratorOptions): OpportunityPost[];
//# sourceMappingURL=candidate-generator.d.ts.map