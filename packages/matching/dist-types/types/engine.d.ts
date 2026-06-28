import type { CanonicalData } from './canonical.ts';
import type { MatchingConfig } from './matching-config.ts';
import type { MatchingModelName } from './match-result.ts';
import type { CircularMatchResult, ConsortiumMatchResult, OneWayMatchResult, TwoWayMatchResult } from './model-results.ts';
import type { OpportunityPost } from './opportunity.ts';
export type MatchEngineModelOption = 'auto' | MatchingModelName;
export interface MatchEngineOptions {
    readonly model?: MatchEngineModelOption;
    readonly topN?: number;
    readonly maxCandidates?: number;
    readonly includeIncompleteConsortium?: boolean;
    readonly minCycleLength?: number;
}
export interface MatchEngineInput {
    readonly anchorPost: OpportunityPost;
    readonly opportunities: readonly OpportunityPost[];
    readonly canonical?: CanonicalData;
    readonly config?: MatchingConfig;
    readonly options?: MatchEngineOptions;
}
export type ModelRunResult = OneWayMatchResult | TwoWayMatchResult | ConsortiumMatchResult | CircularMatchResult;
//# sourceMappingURL=engine.d.ts.map