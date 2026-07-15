import type { OpportunityPost } from './opportunity.ts';
export declare const PROFILE_FIT_SNAPSHOT_KIND: "profile-fit-snapshot";
export type ProfileFitWorkMode = 'remote' | 'hybrid' | 'onsite';
export interface ProfileFitGeography {
    readonly countries: readonly string[];
    readonly regions: readonly string[];
    readonly cities: readonly string[];
}
export interface ProfileFitAvailability {
    /** Inclusive ISO calendar date (YYYY-MM-DD). */
    readonly start: string;
    /** Inclusive ISO calendar date (YYYY-MM-DD). */
    readonly end: string;
}
export interface ProfileFitCounterpartPreference {
    readonly capabilities: readonly string[];
    readonly services: readonly string[];
    readonly sectors: readonly string[];
    readonly geography: ProfileFitGeography;
    readonly workModes: readonly ProfileFitWorkMode[];
    /**
     * Credential taxonomy labels only. Credential numbers, documents, and
     * issuing-person details are deliberately outside this schema.
     */
    readonly verifiedCredentials: readonly string[];
}
/**
 * A deliberately closed, non-PII projection used by pure matching code.
 *
 * It contains no identity, contact, biography, free-text, document, URL, or
 * account fields. Call `isProfileFitSnapshot` at untyped boundaries; scoring
 * functions reject snapshots containing unknown fields.
 */
export interface ProfileFitSnapshot {
    readonly kind: typeof PROFILE_FIT_SNAPSHOT_KIND;
    readonly capabilities: readonly string[];
    readonly services: readonly string[];
    readonly sectors: readonly string[];
    readonly geography: ProfileFitGeography;
    readonly workModes: readonly ProfileFitWorkMode[];
    readonly availability: ProfileFitAvailability | null;
    /**
     * Verified credential taxonomy labels only, never credential identifiers.
     */
    readonly verifiedCredentials: readonly string[];
    readonly counterpartPreference: ProfileFitCounterpartPreference;
}
export type ProfileFitFactorName = 'capabilities' | 'services' | 'sectors' | 'geography' | 'workMode' | 'availability' | 'verifiedCredentials' | 'counterpartPreference';
export interface ProfileFitFactorExplanation {
    readonly factor: ProfileFitFactorName;
    readonly score: number;
    readonly weight: number;
    readonly applicable: boolean;
    readonly matched: readonly string[];
    readonly missing: readonly string[];
    readonly explanation: string;
}
export interface ProfileFitScore {
    readonly score: number;
    readonly targetType: 'opportunity' | 'profile';
    readonly factors: readonly ProfileFitFactorExplanation[];
}
export type ProfileFitTarget = OpportunityPost | ProfileFitSnapshot;
//# sourceMappingURL=profile-fit.d.ts.map