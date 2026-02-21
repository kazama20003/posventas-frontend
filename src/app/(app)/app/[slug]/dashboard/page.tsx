import { DashboardLayout } from "@/components/app/dashboard/dashboard-layout"

type DashboardPageProps = {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
  }).format(new Date())

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Panel de control
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard de operaciones
            </h1>
            <p className="text-sm text-muted-foreground">
              Vista general de ventas, conversiones y actividad para{" "}
              <span className="font-semibold text-foreground">{slug}</span>.
            </p>
          </div>

          <div className="space-y-1 text-sm md:text-right">
            <p className="font-medium text-foreground">Periodo: Ultimos 30 dias</p>
            <p className="text-muted-foreground">Actualizado: {formattedDate}</p>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-background">
        <DashboardLayout />
      </section>
    </main>
  )
}
