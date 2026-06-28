import { APP_STAGE_TO_STATUS } from '@/lib/applications.ts'
import { negotiationService } from '@/services/negotiation-service.ts'

export type PipelineApplicationDropResult =
  | { readonly success: true }
  | { readonly success: false; readonly message: string }

export type PipelineApplicationDropDeps = {
  readonly updateApplicationStatus?: (id: string, status: string) => void
}

export function pipelineApplicationDrop(
  applicationId: string,
  stageKey: string,
  deps?: PipelineApplicationDropDeps,
): PipelineApplicationDropResult {
  const status = APP_STAGE_TO_STATUS[stageKey]
  if (!status) {
    return { success: false, message: 'Invalid pipeline stage.' }
  }

  const updateApplicationStatus =
    deps?.updateApplicationStatus ??
    negotiationService.updateApplicationStatus.bind(negotiationService)
  updateApplicationStatus(applicationId, status)
  return { success: true }
}
