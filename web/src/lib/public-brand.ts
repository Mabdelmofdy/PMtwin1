/** User-facing public brand string — do not use for code identifiers. */
export const PUBLIC_BRAND_NAME = 'PM-Twin'

/** Normalize legacy POC copy to the public brand name. */
export function normalizePublicBrandCopy(text: string): string {
  return text.replace(/\bPMTwin\b/g, PUBLIC_BRAND_NAME)
}
