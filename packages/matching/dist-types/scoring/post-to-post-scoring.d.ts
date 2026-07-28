import type { MatchingConfig } from '../types/matching-config.ts';
import type { ScoreFactorResult, ScorePairResult } from '../types/match-result.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export { labelFromScore } from './label-from-score.ts';
export declare function attributeOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult;
export declare function exchangeCompatibilityFactor(needPost: OpportunityPost, offerPost: OpportunityPost): ScoreFactorResult;
export declare function valueCompatibilityFactor(needPost: OpportunityPost, offerPost: OpportunityPost): ScoreFactorResult;
export declare function budgetFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult;
export declare function timelineFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult;
export declare function locationFit(needNorm: NormalizedPost, offerNorm: NormalizedPost, needAttributes?: Readonly<Record<string, unknown>>, offerAttributes?: Readonly<Record<string, unknown>>): ScoreFactorResult;
export declare function reputationScore(offerNorm: NormalizedPost): ScoreFactorResult;
export declare function scorePair(needPost: OpportunityPost, offerPost: OpportunityPost, config: MatchingConfig, normalizedNeed?: NormalizedPost, normalizedOffer?: NormalizedPost): ScorePairResult;
//# sourceMappingURL=post-to-post-scoring.d.ts.map