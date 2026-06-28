import type { MatchingConfig } from '../types/matching-config.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export interface CandidateGeneratorOptions {
    readonly maxCandidates?: number;
    readonly needNormalized?: NormalizedPost;
    readonly offerNormalized?: NormalizedPost;
}
export declare function budgetCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function locationCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function timelineOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function categoryOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean;
export declare function getCandidates(needPost: OpportunityPost, offerPosts: readonly OpportunityPost[], config: MatchingConfig, options?: CandidateGeneratorOptions): OpportunityPost[];
export declare function getCandidatesForOffer(offerPost: OpportunityPost, needPosts: readonly OpportunityPost[], config: MatchingConfig, options?: CandidateGeneratorOptions): OpportunityPost[];
//# sourceMappingURL=candidate-generator.d.ts.map