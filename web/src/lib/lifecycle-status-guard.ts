export const LIFECYCLE_STATUS_BYPASS_ERROR =
  'Lifecycle status updates must use CommandGateway or LifecycleOrchestrator.'

export function rejectLifecycleStatusBypass(): never {
  throw new Error(LIFECYCLE_STATUS_BYPASS_ERROR)
}

export function assertNoLifecycleStatusInPatch(
  patch: Partial<{ status?: unknown }>,
): void {
  if (patch.status !== undefined && patch.status !== null) {
    rejectLifecycleStatusBypass()
  }
}
