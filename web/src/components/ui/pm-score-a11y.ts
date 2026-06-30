/**
 * Accessibility helpers for score components — labels only, no calculations.
 */

/** Build a screen-reader / aria-label string from explanation lines. */
export function buildScoreAriaLabel(lines: readonly string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join('. ')
}

/** Region label for hero score surfaces. */
export function buildScoreRegionLabel(
  scoreKind: 'readiness' | 'match',
  lines: readonly string[],
): string {
  const prefix = scoreKind === 'readiness' ? 'Opportunity readiness' : 'Match compatibility'
  const body = buildScoreAriaLabel(lines)
  return body ? `${prefix}. ${body}` : prefix
}
