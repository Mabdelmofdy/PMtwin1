import type { OpportunityPost } from '../types/opportunity.ts';
import type { ValueExchangeNormalized } from '../types/opportunity.ts';
export declare function getNormalized(post: OpportunityPost): ValueExchangeNormalized;
export declare function exchangeCompatibility(postA: OpportunityPost, postB: OpportunityPost): number;
export declare function valueCompatibility(needPost: OpportunityPost, offerPost: OpportunityPost): number;
export interface OneWayValueFit {
    readonly valueFit: 'weak' | 'partial' | 'strong';
    readonly valueGap: number;
    readonly valueGapPercent: number;
    readonly coverageRatio: number;
    readonly riskAdjustedRatio: number;
}
export declare function oneWayValueFit(need: OpportunityPost, offer: OpportunityPost): OneWayValueFit;
export interface BarterValueEquivalence {
    readonly equivalenceScore: number;
    readonly aCoversB: number;
    readonly bCoversA: number;
    readonly symmetry: number;
    readonly gapA: number;
    readonly gapB: number;
    readonly suggestion: string;
}
export declare function barterValueEquivalence(postA: OpportunityPost, postB: OpportunityPost): BarterValueEquivalence;
//# sourceMappingURL=value-compatibility.d.ts.map