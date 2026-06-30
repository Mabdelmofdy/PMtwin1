import { cn } from "@/lib/utils"
import { pmLoading } from "@/tokens"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(pmLoading.skeleton, "rounded-2xl bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
