import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { requireActiveTenant } from "./tenant-resolver"

type TenantPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { slug } = await params
  const tenant = await requireActiveTenant(slug)

  return (
    <div className="m-4 rounded-lg bg-card">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-full items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Panel de Control</h1>
              <p className="text-sm text-muted-foreground">
                Resumen del tenant {tenant.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                name="period"
                defaultValue="7d"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="24h">Ultimas 24 horas</option>
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
              </select>

              <Button variant="outline" size="icon" type="button" aria-label="Mas opciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-medium">Nombre</p>
            <p className="text-muted-foreground">{tenant.name}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-medium">Slug</p>
            <p className="text-muted-foreground">{tenant.slug}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-medium">Plan</p>
            <p className="text-muted-foreground">{tenant.plan}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-medium">Estado</p>
            <p className="text-muted-foreground">{tenant.status}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm sm:col-span-2">
            <p className="font-medium">Ciudad</p>
            <p className="text-muted-foreground">{tenant.city}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
