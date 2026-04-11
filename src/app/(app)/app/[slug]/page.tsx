import { SidebarTrigger } from "@/components/ui/sidebar"
import { requireActiveTenant } from "./tenant-resolver"
import { TenantLiveSummary } from "./tenant-live-summary"

type TenantPageProps = {
  params: Promise<{ slug: string }>
}

function getStatusLabel(status: "active" | "inactive" | "trial") {
  switch (status) {
    case "active":
      return "Activo"
    case "trial":
      return "Trial"
    default:
      return "Inactivo"
  }
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { slug } = await params
  const tenant = await requireActiveTenant(slug)

  return (
    <main className="min-w-0 space-y-4 p-4">
      <header className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="size-8 shrink-0 rounded-md border border-border bg-background text-muted-foreground shadow-none" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {tenant.name}
                </h1>
                <span className="font-mono text-[11px] text-muted-foreground">
                  /{tenant.slug}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {getStatusLabel(tenant.status)}
          </span>
        </div>
      </header>

      <TenantLiveSummary />
    </main>
  )
}
