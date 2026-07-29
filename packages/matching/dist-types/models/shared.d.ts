import type { CanonicalData } from '../types/canonical.ts';
import type { MatchingConfig } from '../types/matching-config.ts';
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts';
export declare function resolveThreshold(config: MatchingConfig): number;
export declare function resolveMaxCandidates(config: MatchingConfig, override?: number): number;
/**
 * Prefer persisted normalized, but backfill location/coverage when the wizard
 * wrote role+skills without location (top-level opportunity.location still set).
 */
export declare function resolveNormalized(opportunity: OpportunityPost, canonical: CanonicalData, config: MatchingConfig): NormalizedPost;
export declare function passHardGate(needPost: OpportunityPost, offerPost: OpportunityPost, needNorm: NormalizedPost, offerNorm: NormalizedPost, config: MatchingConfig): boolean;
export declare function withRunnerConfig(config?: MatchingConfig): MatchingConfig;
export interface RoleDefinition {
    readonly role: string;
    readonly scope?: string;
}
export declare function parseRoleDefinitions(attributes: Readonly<Record<string, unknown>> | undefined): RoleDefinition[];
export declare function buildRoleServices(roleDef: RoleDefinition): string[];
/**
 * Soft skill hints for consortium role scoring (not hard requiredServices).
 * Extracts technical tokens / short phrases from role scope prose.
 */
export declare function buildRoleSkillHints(roleDef: RoleDefinition): string[];
export declare function buildSyntheticNeedForRole(leadNeed: OpportunityPost, leadNorm: NormalizedPost, roleDef: RoleDefinition): OpportunityPost;
//# sourceMappingURL=shared.d.ts.map