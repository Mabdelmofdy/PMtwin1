import type { MatchingConfig, MatchingWeights } from '../types/matching-config.ts';
export declare const DEFAULT_WEIGHTS: MatchingWeights;
export declare const DEFAULT_MATCHING_CONFIG: MatchingConfig;
export declare function resolveWeights(config: MatchingConfig): MatchingWeights;
export declare function withMatchingDefaults(config?: Partial<MatchingConfig>): MatchingConfig;
//# sourceMappingURL=defaults.d.ts.map