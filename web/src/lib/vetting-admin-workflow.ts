import type { PlatformUser } from '@/types/domain.ts'
import type { VettingQueueEntry } from '@/lib/vetting-service.ts'
import { resolveVettingSlaStatus } from '@/lib/vetting-sla-service.ts'

export type VettingWorkflowBucket =
  | 'pending'
  | 'changes_requested'
  | 'resubmitted'
  | 'history'

export type VettingWorkflowEntry = VettingQueueEntry & {
  readonly slaStatus: ReturnType<typeof resolveVettingSlaStatus>
}

export function enrichVettingQueueEntry(entry: VettingQueueEntry): VettingWorkflowEntry {
  return {
    ...entry,
    slaStatus: entry.user.profile?.vetting?.slaStatus ?? resolveVettingSlaStatus(entry.user),
  }
}

export function classifyVettingWorkflowBucket(user: PlatformUser): VettingWorkflowBucket {
  if (user.status === 'active' || user.status === 'rejected') {
    return 'history'
  }

  const reviewProgress = user.profile?.vetting?.reviewProgress
  if (reviewProgress === 'changes_requested') {
    return 'changes_requested'
  }
  if (reviewProgress === 'in_review' && user.profile?.vetting?.lastResubmittedAt) {
    return 'resubmitted'
  }
  return 'pending'
}

export function bucketVettingWorkflow(entries: readonly VettingQueueEntry[]): Record<
  VettingWorkflowBucket,
  readonly VettingWorkflowEntry[]
> {
  const buckets: Record<VettingWorkflowBucket, VettingWorkflowEntry[]> = {
    pending: [],
    changes_requested: [],
    resubmitted: [],
    history: [],
  }

  for (const entry of entries) {
    const enriched = enrichVettingQueueEntry(entry)
    buckets[classifyVettingWorkflowBucket(entry.user)].push(enriched)
  }

  return buckets
}
