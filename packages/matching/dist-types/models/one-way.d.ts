import type { CanonicalData } from '../types/canonical.ts';
import type { MatchingConfig } from '../types/matching-config.ts';
import type { OneWayMatchResult, ModelRunnerOptions } from '../types/model-results.ts';
import type { OpportunityPost } from '../types/opportunity.ts';
export declare function findOffersForNeedPure(needPost: OpportunityPost, offerPosts: readonly OpportunityPost[], config: MatchingConfig, canonical?: CanonicalData, options?: ModelRunnerOptions): OneWayMatchResult;
export declare function findNeedsForOfferPure(offerPost: OpportunityPost, needPosts: readonly OpportunityPost[], config: MatchingConfig, canonical?: CanonicalData, options?: ModelRunnerOptions): OneWayMatchResult;
//# sourceMappingURL=one-way.d.ts.map