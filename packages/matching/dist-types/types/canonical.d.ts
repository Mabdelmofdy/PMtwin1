export type SkillSynonymsMap = Readonly<Record<string, string>>;
export type LocationCanonicalMap = Readonly<Record<string, string>>;
export type CategoryExpansionTerm = readonly string[] | string;
export type CategoryExpansionMap = Readonly<Record<string, CategoryExpansionTerm>>;
/** Keyword → expanded semantic terms (same source as categoryExpansion in skill-canonical.json). */
export type SemanticTermsMap = CategoryExpansionMap;
export interface CanonicalData {
    readonly skillSynonyms?: SkillSynonymsMap;
    readonly locationCanonical?: LocationCanonicalMap;
    readonly categoryExpansion?: CategoryExpansionMap;
    readonly semanticTerms?: SemanticTermsMap;
}
export declare const EMPTY_CANONICAL_DATA: CanonicalData;
//# sourceMappingURL=canonical.d.ts.map