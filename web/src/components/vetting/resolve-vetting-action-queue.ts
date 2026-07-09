import type { PlatformUser } from '@/types/domain.ts'
import type { ProfileReadinessResult } from '@/domain/profile-readiness/types.ts'
import type { VettingReadinessResult } from '@/domain/vetting-readiness/types.ts'
import type {
  PendingJourneyStep,
  PendingVettingJourneyResult,
} from '@/domain/pending-vetting-journey/types.ts'
import { resolveActionLink } from '@/components/vetting/resolve-action-link.ts'

export type VettingQueueAction = {
  readonly title: string
  readonly link: { readonly label: string; readonly href: string }
}

export type VettingActionQueue = {
  readonly primary: VettingQueueAction & { readonly stepId: string }
  readonly secondary?: VettingQueueAction
  readonly additional: readonly VettingQueueAction[]
  readonly waiting?: { readonly title: string }
}

function dedupeActions(actions: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const action of actions) {
    const key = action.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(action)
  }
  return result
}

function resolveActiveStepId(steps: readonly PendingJourneyStep[]): string {
  const active = steps.find((step) => step.state === 'current' || step.state === 'blocked')
  return active?.id ?? steps[steps.length - 1]?.id ?? 'profile_completion'
}

export function resolveVettingActionQueue(input: {
  readonly user: PlatformUser
  readonly journey: PendingVettingJourneyResult
  readonly profile: ProfileReadinessResult
  readonly vetting: VettingReadinessResult
}): VettingActionQueue {
  const { user, journey, profile, vetting } = input
  const stepId = resolveActiveStepId(journey.steps)
  const primaryTitle = journey.nextBestAction
  const primary = {
    stepId,
    title: primaryTitle,
    link: resolveActionLink(primaryTitle),
  }

  const secondarySource = vetting.missingRequired[0]
  const secondary = secondarySource
    ? {
        title: secondarySource.startsWith('Document: ')
          ? `Upload ${secondarySource.replace('Document: ', '')}`
          : secondarySource,
        link: resolveActionLink(secondarySource),
      }
    : undefined

  const excluded = new Set(
    [primaryTitle, secondary?.title]
      .filter(Boolean)
      .map((value) => value!.toLowerCase()),
  )

  const additional = dedupeActions([
    ...profile.recommendations,
    ...vetting.recommendations,
    ...vetting.missingRequired.slice(1).map((item) =>
      item.startsWith('Document: ') ? `Upload ${item.replace('Document: ', '')}` : item,
    ),
  ])
    .filter((title) => !excluded.has(title.toLowerCase()))
    .map((title) => ({
      title,
      link: resolveActionLink(title),
    }))

  const waiting =
    user.profile?.vetting?.reviewProgress === 'in_review'
    || primaryTitle.toLowerCase().includes('waiting for admin review')
      ? { title: 'Waiting for admin review' }
      : undefined

  return { primary, secondary, additional, waiting }
}
