import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument } from '@/types/party-document.ts'

export type ProfileCompletionItem = {
  key: string
  label: string
  complete: boolean
}

export type ProfileCompletionResult = {
  score: number
  completeCount: number
  totalCount: number
  missingItems: string[]
  items: ProfileCompletionItem[]
}

function hasDocumentType(
  documents: readonly PartyDocument[],
  requiredType: string,
): boolean {
  return documents.some(
    (document) => document.documentType.trim().toLowerCase() === requiredType.toLowerCase(),
  )
}

export function calculateProfileCompletion(
  user: PlatformUser | null | undefined,
  documents: readonly PartyDocument[],
  isCompanyUser: boolean,
): ProfileCompletionResult {
  const profile = user?.profile ?? {}
  const skills = profile.skills ?? []

  const items: ProfileCompletionItem[] = [
    { key: 'phone', label: 'Phone', complete: Boolean(profile.phone?.trim()) },
    { key: 'address', label: 'Address', complete: Boolean(profile.location?.trim()) },
    { key: 'website', label: 'Website', complete: Boolean(profile.website?.trim()) },
    { key: 'skills', label: 'Skills', complete: skills.length >= 3 },
    {
      key: 'certificates',
      label: 'Certificates',
      complete: hasDocumentType(documents, 'certificate')
        || hasDocumentType(documents, 'certification'),
    },
  ]

  if (isCompanyUser) {
    items.push(
      { key: 'companyLogo', label: 'Company logo', complete: hasDocumentType(documents, 'company_logo') },
      { key: 'cr', label: 'CR', complete: hasDocumentType(documents, 'commercial_registration') || hasDocumentType(documents, 'cr') },
      { key: 'vat', label: 'VAT', complete: hasDocumentType(documents, 'vat_certificate') || hasDocumentType(documents, 'vat') },
      {
        key: 'teamSize',
        label: 'Team size',
        complete: Boolean(profile.teamSize?.trim()),
      },
    )
  }

  const completeCount = items.filter((item) => item.complete).length
  const totalCount = items.length
  const score = totalCount === 0 ? 0 : Math.round((completeCount / totalCount) * 100)
  const missingItems = items.filter((item) => !item.complete).map((item) => item.label)

  return {
    score,
    completeCount,
    totalCount,
    missingItems,
    items,
  }
}
