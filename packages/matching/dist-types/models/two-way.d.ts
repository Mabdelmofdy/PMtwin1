import type { CanonicalData } from '../types/canonical.ts';
import type { MatchingConfig } from '../types/matching-config.ts';
import type { ModelRunnerOptions, TwoWayMatchResult } from '../types/model-results.ts';
import type { OpportunityPost } from '../types/opportunity.ts';
export { barterSidePost } from './value-estimate.ts';
export declare function findBarterMatchesPure(anchorPost: OpportunityPost, needPosts: readonly OpportunityPost[], offerPosts: readonly OpportunityPost[], config: MatchingConfig, canonical?: CanonicalData, _options?: ModelRunnerOptions): TwoWayMatchResult;
//# sourceMappingURL=two-way.d.ts.map