/**
 * Location coverage hierarchy for soft locationFit scoring.
 * Primary city is a preference; nationwide / regional coverage lifts fit.
 */
export type LocationCountryCode = 'SA' | 'AE' | 'QA' | 'KW' | 'BH' | 'OM' | 'REMOTE' | 'GCC' | 'MENA' | 'GLOBAL' | 'UNKNOWN';
export type LocationCoverageTier = 'remote' | 'nationwide' | 'regional_gcc' | 'same_city' | 'same_country' | 'different_gcc_country' | 'weak';
export type LocationCoverageResult = {
    readonly score: number;
    readonly tier: LocationCoverageTier;
    readonly label: string;
};
export declare function resolveLocationCountry(locationLabel: string | null | undefined): LocationCountryCode;
export type ResolvedCoverage = {
    readonly primaryLocation: string;
    readonly country: LocationCountryCode;
    readonly isRemote: boolean;
    readonly hasNationwide: boolean;
    readonly hasGccRegional: boolean;
    readonly hasMena: boolean;
    readonly hasGlobal: boolean;
    readonly coverageScopes: readonly string[];
};
export declare function resolveCoverage(primaryLocation: string | undefined, coverageScopes: readonly string[] | undefined, attributes?: Readonly<Record<string, unknown>>): ResolvedCoverage;
/**
 * Soft location fit — never hard-rejects. City is a preference under coverage.
 */
export declare function evaluateLocationCoverage(need: ResolvedCoverage, offer: ResolvedCoverage): LocationCoverageResult;
/** Extract coverage scope strings from opportunity attributes for NormalizedPost. */
export declare function extractCoverageScopes(attributes: Readonly<Record<string, unknown>> | undefined): string[];
//# sourceMappingURL=location-coverage.d.ts.map