import { type ProfileFitScore, type ProfileFitSnapshot, type ProfileFitTarget } from '../types/profile-fit.ts';
/**
 * Runtime boundary guard for the closed snapshot schema. Unknown fields are
 * rejected at every object level so PII-bearing properties cannot hitchhike.
 */
export declare function isProfileFitSnapshot(value: unknown): value is ProfileFitSnapshot;
/**
 * Scores a non-PII profile projection against an opportunity or another
 * projection. The operation is deterministic, directional, and has no I/O.
 */
export declare function scoreProfileFit(profile: ProfileFitSnapshot, target: ProfileFitTarget): ProfileFitScore;
//# sourceMappingURL=profile-fit-scoring.d.ts.map