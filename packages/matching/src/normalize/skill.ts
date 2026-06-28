import type { SkillSynonymsMap } from '../types/canonical.ts'

export function toSkillString(skill: unknown): string {
  if (!skill) return ''
  if (typeof skill === 'string') return skill.trim()
  if (typeof skill === 'object' && skill !== null) {
    const record = skill as { label?: string; name?: string }
    return String(record.label ?? record.name ?? skill).trim()
  }
  return String(skill).trim()
}

export function normalizeSkill(
  skill: string | null | undefined,
  synonyms: SkillSynonymsMap = {},
): string {
  if (!skill || typeof skill !== 'string') return ''
  const trimmed = skill.trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  return synonyms[key] ?? trimmed
}
