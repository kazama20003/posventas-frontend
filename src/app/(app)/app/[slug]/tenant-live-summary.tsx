"use client"

import { useActiveTenant } from "@/lib/app/active-tenant-context"

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha"
  }

  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function TenantLiveSummary() {
  const { tenant, isLoading, isError } = useActiveTenant()

  if (isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Cargando tenant...</p>
      </section>
    )
  }

  if (isError || !tenant) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la informacion del tenant desde `GET /tenants/me`.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Empresa</p>
          <p className="font-semibold text-foreground">{tenant.name}</p>
          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="font-semibold text-foreground">{tenant.subscription?.plan ?? "Sin plan"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado</p>
          <p className="font-semibold text-foreground">{tenant.subscription?.status ?? "Sin estado"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Renovacion/Trial</p>
          <p className="font-semibold text-foreground">
            {formatDate(
              tenant.subscription?.currentPeriodEnd ?? tenant.subscription?.trialEndsAt ?? null
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
