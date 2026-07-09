import type { KnowledgeExtension } from './enrichment.ts'

export type ExplainabilityLocale = 'en' | 'ar'

export type LocalizedKnowledgeContent = {
  readonly whatIsIt?: string
  readonly whyUseIt?: string
  readonly advantages?: readonly string[]
  readonly risks?: readonly string[]
}

type KnowledgeExtensionWithArabic = KnowledgeExtension & {
  readonly ar?: LocalizedKnowledgeContent
}

function pickArabicField<T>(
  english: T | undefined,
  arabic: T | undefined,
): T | undefined {
  return arabic ?? english
}

/**
 * Resolves knowledge content for the requested locale.
 * English is passthrough; Arabic prefers `extensions.ar` when present.
 */
export function resolveLocalizedKnowledge(
  content: KnowledgeExtension | undefined,
  locale: ExplainabilityLocale,
): KnowledgeExtension | undefined {
  if (!content) return undefined

  if (locale === 'en') {
    return content
  }

  const withArabic = content as KnowledgeExtensionWithArabic
  const ar = withArabic.ar

  if (!ar) {
    return {
      ...content,
      whatIsIt: content.whatIsIt,
      whyUseIt: content.whyUseIt,
      advantages: content.advantages,
      risks: content.risks,
    }
  }

  return {
    ...content,
    whatIsIt: pickArabicField(content.whatIsIt, ar.whatIsIt),
    whyUseIt: pickArabicField(content.whyUseIt, ar.whyUseIt),
    advantages: pickArabicField(content.advantages, ar.advantages),
    risks: pickArabicField(content.risks, ar.risks),
  }
}

export function normalizeExplainabilityLocale(
  locale?: string,
): ExplainabilityLocale {
  if (!locale) return 'en'
  const normalized = locale.trim().toLowerCase()
  if (normalized.startsWith('ar')) return 'ar'
  return 'en'
}
