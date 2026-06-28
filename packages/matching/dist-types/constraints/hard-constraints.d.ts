import type { MatchingConfig } from '../types/matching-config.ts';
import type { HardConstraintContext, HardConstraintResult } from '../types/match-result.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export declare function normalizeRoleLabel(role: string | null | undefined): string;
export declare function getNeedRole(needPost: OpportunityPost, needNorm: NormalizedPost): string;
export declare function getOfferRole(offerPost: OpportunityPost, offerNorm: NormalizedPost): string;
export declare function rolesCompatible(needRole: string, offerRole: string, config: MatchingConfig): boolean;
export declare function serviceOverlapScore(needServices: readonly string[] | undefined, offerServices: readonly string[] | undefined): number;
export declare function passesCoreSkills(needNorm: NormalizedPost, offerNorm: NormalizedPost): HardConstraintResult;
export declare function passesServiceOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost, config: MatchingConfig): HardConstraintResult;
export declare function passesPair(needPost: OpportunityPost, offerPost: OpportunityPost, config: MatchingConfig, ctx?: HardConstraintContext): HardConstraintResult;
//# sourceMappingURL=hard-constraints.d.ts.map