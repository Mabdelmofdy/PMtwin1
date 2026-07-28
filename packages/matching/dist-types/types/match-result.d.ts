export type MatchingModelName = 'one_way' | 'two_way' | 'consortium' | 'circular';
export interface HardConstraintContext {
    readonly needNorm?: import('./opportunity.ts').NormalizedPost;
    readonly offerNorm?: import('./opportunity.ts').NormalizedPost;
}
export interface HardConstraintResult {
    readonly ok: boolean;
    readonly reason?: string;
    readonly side?: 'need' | 'offer';
    readonly needRole?: string;
    readonly offerRole?: string;
    readonly overlap?: number;
    readonly minOverlap?: number;
    readonly missing?: readonly string[];
}
export type ScoreLabel = 'Match' | 'Partial' | 'No Match';
export interface ScoreFactorResult {
    readonly score: number;
    readonly label: ScoreLabel;
    readonly matched?: number;
    readonly total?: number;
    /** Location coverage tier when factor is locationFit. */
    readonly tier?: string;
    /** Human-readable location coverage detail (e.g. Same Country). */
    readonly detail?: string;
}
export interface ScoreBreakdown {
    readonly skillMatch: number;
    readonly attributeOverlap: number;
    readonly serviceOverlapPct: number;
    readonly exchangeCompatibility: number;
    readonly valueCompatibility: number;
    readonly budgetFit: number;
    readonly timelineFit: number;
    readonly locationFit: number;
    readonly reputation: number;
    readonly rejected?: string;
    readonly locationTier?: string;
    readonly locationDetail?: string;
}
export type ScoreLabels = {
    readonly skillMatch: ScoreLabel;
    readonly attributeOverlap: ScoreLabel;
    readonly exchangeCompatibility: ScoreLabel;
    readonly valueCompatibility: ScoreLabel;
    readonly budgetFit: ScoreLabel;
    readonly timelineFit: ScoreLabel;
    readonly locationFit: ScoreLabel;
    readonly reputation: ScoreLabel;
};
export interface ScorePairResult {
    readonly score: number;
    readonly breakdown: ScoreBreakdown;
    readonly labels: ScoreLabels;
}
export interface MatchRecommendation {
    readonly tier: 'top' | 'good' | 'possible';
    readonly reason: string;
    readonly actionRequired: string;
}
export interface RankedMatch {
    readonly matchScore?: number;
    readonly breakdown?: Partial<ScoreBreakdown>;
    readonly labels?: Partial<ScoreLabels>;
    readonly valueAnalysis?: Readonly<Record<string, unknown>>;
    readonly compositeRank?: number;
    readonly recommendation?: MatchRecommendation;
    readonly scoreBreakdown?: Partial<ScoreBreakdown>;
}
//# sourceMappingURL=match-result.d.ts.map