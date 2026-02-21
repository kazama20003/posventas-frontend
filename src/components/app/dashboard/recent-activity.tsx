import { type LucideIcon } from "lucide-react"

interface Activity {
  id: string
  icon: LucideIcon
  title: string
  description: string
  timestamp: string
  status: "success" | "pending" | "warning"
}

interface RecentActivityProps {
  activities: Activity[]
}

const statusColors = {
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  pending: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-5 dark:from-card/80 dark:to-card">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Actividad Reciente</h3>
      <div className="mt-5 space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          const statusColor = statusColors[activity.status]
          
          return (
            <div key={activity.id} className="flex items-start gap-3 border-b border-border/40 pb-4 last:border-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${statusColor} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground/70">{activity.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
