import { useTheme } from '@/providers/theme-provider'
import { pmToast, pmLoading } from '@/tokens'
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system', resolvedTheme } = useTheme()
  const sonnerTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <Sonner
      theme={sonnerTheme as ToasterProps['theme']}
      className={`toaster group ${pmToast.root}`}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className={`size-4 ${pmLoading.inline}`} />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: `cn-toast ${pmToast.enter}`,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
