export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const n = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function todayIso(now?: Date): string {
  const d = now ?? new Date()
  return d.toISOString().slice(0, 10)
}

export function parseIsoDate(value: unknown): Date | null {
  if (!hasText(value)) return null
  const s = String(value).trim()
  const d = new Date(s.includes('T') ? s : `${s}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return ms / (1000 * 60 * 60 * 24)
}

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60)
}

export function normalizeIntent(intent?: string): 'need' | 'offer' | 'hybrid' | undefined {
  if (!intent) return undefined
  const v = intent.toLowerCase().trim()
  if (v === 'request' || v === 'need') return 'need'
  if (v === 'offer') return 'offer'
  if (v === 'hybrid') return 'hybrid'
  return undefined
}

export function normalizeExchangeMode(mode?: string): string | undefined {
  if (!mode) return undefined
  return mode.toLowerCase().replace(/-/g, '_').trim()
}

function skillIdentityPart(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase().trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function skillKey(skill: {
  skillId?: string
  name?: string
  role?: string
}): string {
  const id = skillIdentityPart(skill.skillId) || skillIdentityPart(skill.name)
  const role =
    typeof skill.role === 'string' ? skill.role.toLowerCase().trim() : ''
  return `${id}::${role}`
}

export function titleSimilarity(a?: string, b?: string): number {
  const left = (a ?? '').toLowerCase().trim()
  const right = (b ?? '').toLowerCase().trim()
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.includes(right) || right.includes(left)) return 0.9
  const leftTokens = new Set(left.split(/\s+/).filter(Boolean))
  const rightTokens = right.split(/\s+/).filter(Boolean)
  if (rightTokens.length === 0) return 0
  let overlap = 0
  for (const t of rightTokens) {
    if (leftTokens.has(t)) overlap += 1
  }
  return overlap / Math.max(leftTokens.size, rightTokens.length)
}

export function getNestedNumber(
  obj: Readonly<Record<string, unknown>> | undefined,
  keys: readonly string[],
): number | null {
  if (!obj) return null
  for (const key of keys) {
    if (key in obj) {
      const n = toNumber(obj[key])
      if (n !== null) return n
    }
  }
  return null
}

export function getNestedString(
  obj: Readonly<Record<string, unknown>> | undefined,
  keys: readonly string[],
): string | undefined {
  if (!obj) return undefined
  for (const key of keys) {
    const v = obj[key]
    if (hasText(v)) return String(v)
  }
  return undefined
}

export function hasAttachmentNamed(
  attachments: ReadonlyArray<{ readonly name?: string } | string> | undefined,
  needle: string,
): boolean {
  if (!attachments) return false
  const n = needle.toLowerCase()
  return attachments.some((a) => {
    const name = typeof a === 'string' ? a : a.name
    return hasText(name) && String(name).toLowerCase().includes(n)
  })
}

export function complianceIncludes(
  requirements: readonly string[] | undefined,
  needle: string,
): boolean {
  if (!requirements) return false
  const n = needle.toLowerCase()
  return requirements.some((r) => String(r).toLowerCase().includes(n))
}
