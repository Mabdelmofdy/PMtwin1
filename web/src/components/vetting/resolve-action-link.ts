export function resolveActionLink(action: string): { readonly label: string; readonly href: string } {
  const normalized = action.toLowerCase()
  if (normalized.includes('resubmit')) {
    return { label: 'Resubmit for review', href: '/party-documents' }
  }
  if (
    normalized.includes('upload')
    || normalized.includes('replace expired')
    || normalized.includes('document')
    || normalized.includes('vat')
    || normalized.includes('cr')
  ) {
    if (normalized.includes('vat')) {
      return { label: 'Upload VAT', href: '/party-documents' }
    }
    if (normalized.includes('cr') || normalized.includes('commercial registration')) {
      return { label: 'Upload CR', href: '/party-documents' }
    }
    return { label: 'Upload documents', href: '/party-documents' }
  }
  if (normalized.includes('waiting for admin review')) {
    return { label: 'View status', href: '/dashboard#vetting-review' }
  }
  if (normalized.includes('complete') || normalized.includes('profile') || normalized.includes('skill')) {
    return { label: 'Continue profile', href: '/profile' }
  }
  return { label: 'Open profile', href: '/profile' }
}
