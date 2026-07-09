import { Link } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider.tsx'
import { PmButton } from '@/components/ui/pm-index'

export function VettingBanner() {
  const { user, isVettingRestricted } = useAuth()

  if (!user || !isVettingRestricted) return null

  const isClarificationRequested = user.status === 'clarification_requested'
  const requestedItems = user.profile?.vetting?.requestedItems ?? []
  const reason = user.profile?.vetting?.reason

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      {isClarificationRequested ? (
        <div className="space-y-2">
          <p className="font-medium">Changes requested before approval.</p>
          {reason ? <p>{reason}</p> : null}
          {requestedItems.length > 0 ? (
            <ul className="list-disc ps-5">
              {requestedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/profile">Update profile and resubmit</Link>
          </PmButton>
        </div>
      ) : (
        <p>
          Your account is pending review. You can browse the marketplace but cannot create or
          accept opportunities yet.
        </p>
      )}
    </div>
  )
}
