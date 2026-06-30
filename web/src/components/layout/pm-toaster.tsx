import type { ToasterProps } from 'sonner'
import { resolveToastPosition } from '@/components/layout/pm-direction-bridge'
import { usePmDirection } from '@/components/layout/pm-direction-provider'
import { Toaster } from '@/components/ui/sonner'

/** Direction-aware Sonner host — presentation only. */
export function PmToaster(props: ToasterProps) {
  const { direction } = usePmDirection()
  const position = resolveToastPosition(direction)

  return <Toaster {...props} position={position} />
}
