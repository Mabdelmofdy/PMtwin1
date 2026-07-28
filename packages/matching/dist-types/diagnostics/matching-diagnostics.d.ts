import type { HardConstraintResult } from '../types/match-result.ts';
import type { ScorePairResult } from '../types/match-result.ts';
export type MatchingDiagnosticCheckId = 'published' | 'different_party' | 'target_role' | 'skills' | 'collaboration_model' | 'exchange_mode' | 'sector' | 'budget' | 'timeline' | 'location' | 'threshold';
export type MatchingDiagnosticCheckStatus = 'pass' | 'fail' | 'n/a';
export type MatchingDiagnosticCheck = {
    readonly id: MatchingDiagnosticCheckId;
    readonly status: MatchingDiagnosticCheckStatus;
    readonly detail?: string;
};
export type MatchingCandidateDiagnostic = {
    readonly candidateOpportunityId: string;
    readonly result: 'matched' | 'rejected';
    readonly checks: readonly MatchingDiagnosticCheck[];
    readonly locationTier?: string;
    readonly locationScore?: number;
    readonly finalScore?: number;
    readonly rejectReason?: string;
    readonly postMatchCreated?: boolean;
};
export type MatchingRunDiagnostic = {
    readonly sourceOpportunityId: string;
    readonly scannedCount: number;
    readonly eligibleCount: number;
    readonly rejectedCount: number;
    readonly matchedCount: number;
    readonly candidates: readonly MatchingCandidateDiagnostic[];
};
export declare const MATCHING_REJECT_REASONS: {
    readonly NOT_PUBLISHED: "NOT_PUBLISHED";
    readonly SAME_PARTY: "SAME_PARTY";
    readonly TARGET_ROLE_REQUIRED: "TARGET_ROLE_REQUIRED";
    readonly ROLE_INCOMPATIBLE: "ROLE_INCOMPATIBLE";
    readonly SKILL_MISSING: "SKILL_MISSING";
    readonly SERVICE_OVERLAP_LOW: "SERVICE_OVERLAP_LOW";
    readonly BUDGET_INCOMPATIBLE: "BUDGET_INCOMPATIBLE";
    readonly TIMELINE_INCOMPATIBLE: "TIMELINE_INCOMPATIBLE";
    readonly CATEGORY_INCOMPATIBLE: "CATEGORY_INCOMPATIBLE";
    readonly SKILL_FLOOR: "SKILL_FLOOR";
    readonly BELOW_MATCH_THRESHOLD: "BELOW_MATCH_THRESHOLD";
    readonly SOURCE_INTENT_INVALID: "SOURCE_INTENT_INVALID";
    readonly ROLE_UNFILLED: "ROLE_UNFILLED";
};
export type MatchingRejectReason = (typeof MATCHING_REJECT_REASONS)[keyof typeof MATCHING_REJECT_REASONS];
declare function check(id: MatchingDiagnosticCheckId, status: MatchingDiagnosticCheckStatus, detail?: string): MatchingDiagnosticCheck;
export declare function rejectReasonFromHardGate(gate: HardConstraintResult): MatchingRejectReason;
export declare function buildMatchedDiagnostic(input: {
    readonly candidateOpportunityId: string;
    readonly scored: ScorePairResult;
    readonly locationDetail?: string;
}): MatchingCandidateDiagnostic;
export declare function buildRejectedDiagnostic(input: {
    readonly candidateOpportunityId: string;
    readonly rejectReason: string;
    readonly checks: readonly MatchingDiagnosticCheck[];
    readonly finalScore?: number;
    readonly locationTier?: string;
    readonly locationScore?: number;
}): MatchingCandidateDiagnostic;
/**
 * Shared gate+score diagnostic for two-way / consortium / circular
 * (models that do not use one-way's budget/timeline/category pre-filters).
 */
export declare function diagnoseGateAndScore(input: {
    readonly candidateOpportunityId: string;
    readonly gate: HardConstraintResult;
    readonly scored?: ScorePairResult;
    readonly threshold: number;
}): MatchingCandidateDiagnostic;
export declare function summarizeDiagnostics(sourceOpportunityId: string, candidates: readonly MatchingCandidateDiagnostic[]): MatchingRunDiagnostic;
export { check as diagnosticCheck };
//# sourceMappingURL=matching-diagnostics.d.ts.map