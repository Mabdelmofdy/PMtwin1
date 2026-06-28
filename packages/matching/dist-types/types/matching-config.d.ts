export interface MatchingWeights {
    readonly SKILL_MATCH?: number;
    readonly EXCHANGE_COMPATIBILITY?: number;
    readonly VALUE_COMPATIBILITY?: number;
    readonly BUDGET_FIT?: number;
    readonly TIMELINE?: number;
    readonly LOCATION?: number;
    readonly REPUTATION?: number;
    readonly ATTRIBUTE_OVERLAP?: number;
    readonly BUDGET_FIT_LEGACY?: number;
}
export interface MatchingConfig {
    readonly CANDIDATE_MAX?: number;
    readonly POST_TO_POST_THRESHOLD?: number;
    readonly HARD_CONSTRAINTS_ENABLED?: boolean;
    readonly STRICT_ROLE_REQUIRED?: boolean;
    readonly STRICT_ROLE_EXACT_MATCH?: boolean;
    readonly MIN_REQUIRED_SERVICE_OVERLAP?: number;
    readonly MIN_SKILL_SCORE_FOR_MATCH?: number;
    readonly WEIGHTS?: MatchingWeights;
    readonly WEIGHTS_DESIGN?: MatchingWeights;
    readonly DEBUG?: boolean;
}
//# sourceMappingURL=matching-config.d.ts.map