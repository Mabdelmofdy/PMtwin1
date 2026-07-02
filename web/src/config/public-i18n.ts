/**
 * Public i18n foundation — Arabic/RTL labels prepared for future release.
 * Do not wire a functional language toggle until translations ship.
 */

import type { DocumentDirection } from '@/components/layout/pm-direction-bridge'

export type PublicLocaleCode = 'en' | 'ar'

export const PUBLIC_LOCALE_DEFAULT: PublicLocaleCode = 'en'

/** Future Arabic nav labels — not shown until bilingual launch. */
export const PUBLIC_NAV_LABELS_AR: Record<string, string> = {
  '/features': 'الميزات',
  '/find': 'بحث',
  '/pricing': 'الأسعار',
  '/workflow': 'كيف يعمل',
  '/knowledge-base': 'قاعدة المعرفة',
  '/collaboration-models': 'نماذج التعاون',
  '/about': 'من نحن',
  '/contact': 'تواصل',
}

/** Map document direction to locale — pairs with PmDirectionProvider. */
export function resolvePublicLocale(direction: DocumentDirection): PublicLocaleCode {
  return direction === 'rtl' ? 'ar' : 'en'
}
