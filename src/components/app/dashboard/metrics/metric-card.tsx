import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md dark:from-card/80 dark:to-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-semibold",
                change.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}% vs período anterior
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/8 p-3">
          <Icon className="h-6 w-6 text-primary/70" />
        </div>
      </div>
    </div>
  )
}
