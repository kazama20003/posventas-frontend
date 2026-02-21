import { SidebarTrigger } from "@/components/ui/sidebar"
import { requireActiveTenant } from "./tenant-resolver"
import { TenantLiveSummary } from "./tenant-live-summary"

type TenantPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { slug } = await params
  const tenant = await requireActiveTenant(slug)

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card">
        <div className="flex items-start gap-3 p-6">
          <SidebarTrigger className="mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">/{tenant.slug}</p>
            <p className="text-sm text-muted-foreground">
              Informacion real del tenant y su suscripcion.
            </p>
          </div>
        </div>
      </header>

      <TenantLiveSummary />
    </main>
  )
}
