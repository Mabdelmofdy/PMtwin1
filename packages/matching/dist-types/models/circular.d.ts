import type { CanonicalData } from '../types/canonical.ts';
import type { MatchingConfig } from '../types/matching-config.ts';
import type { CircularLinkScore, CircularMatchResult, ModelRunnerOptions } from '../types/model-results.ts';
import type { OpportunityPost } from '../types/opportunity.ts';
export interface CircularEdgeDetail {
    readonly score: number;
    readonly need: OpportunityPost;
    readonly offer: OpportunityPost;
}
export type CircularEdgeMap = Readonly<Record<string, CircularEdgeDetail>>;
export declare function normalizeCycleRing(cycle: readonly string[]): string[];
export declare function buildCircularLinkScores(ring: readonly string[], edgeDetails: CircularEdgeMap): CircularLinkScore[] | null;
export declare function findCircularExchangesPure(needPosts: readonly OpportunityPost[], offerPosts: readonly OpportunityPost[], config: MatchingConfig, canonical?: CanonicalData, options?: ModelRunnerOptions): CircularMatchResult;
//# sourceMappingURL=circular.d.ts.map