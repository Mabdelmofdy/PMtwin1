import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

export const DEMO_ENVIRONMENT_BANNER_MESSAGE =
  'Demo Mode — sample data. You can reset or restore scenarios anytime.'

export const UAT_ENVIRONMENT_BANNER_MESSAGE =
  'UAT Mode — data is stored in this browser using LocalStorage. Export your data before clearing browser storage.'

export type EnvironmentBannerContent = {
  runtimeMode: 'demo' | 'uat'
  storageType: string
  message: string
}

export function shouldShowEnvironmentBanner(runtimeMode: string): boolean {
  return runtimeMode === 'demo' || runtimeMode === 'uat'
}

export function resolveEnvironmentBannerContent(
  runtimeMode: string,
  storageType: string,
): EnvironmentBannerContent | null {
  if (!shouldShowEnvironmentBanner(runtimeMode)) {
    return null
  }

  if (runtimeMode === 'demo') {
    return {
      runtimeMode: 'demo',
      storageType,
      message: DEMO_ENVIRONMENT_BANNER_MESSAGE,
    }
  }

  return {
    runtimeMode: 'uat',
    storageType,
    message: UAT_ENVIRONMENT_BANNER_MESSAGE,
  }
}

export function EnvironmentBanner() {
  const content = resolveEnvironmentBannerContent(
    environmentContext.runtimeMode,
    environmentContext.storageType,
  )

  if (!content) {
    return null
  }

  return (
    <div
      data-testid="environment-banner"
      role="status"
      aria-live="polite"
      className={cn(
        'border-b border-warning/30 bg-warning/10 px-3 py-2.5 md:px-4',
        'text-warning',
      )}
    >
      <p className={cn(pmTypography.bodySm, 'font-medium text-warning')}>{content.message}</p>
      <p className={cn(pmTypography.caption, 'mt-1 text-warning/80')}>
        Runtime: {content.runtimeMode.toUpperCase()} · Storage: {content.storageType}
      </p>
    </div>
  )
}
