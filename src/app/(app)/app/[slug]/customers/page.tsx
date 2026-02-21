import {
  ArrowUpRight,
  Download,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Star,
  Users,
  Wallet,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type CustomersPageProps = {
  params: Promise<{ slug: string }>
}

type CustomerStatus = "Activo" | "Riesgo" | "Inactivo"
type CustomerTier = "Oro" | "Plata" | "Bronce"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  visits: number
  avgTicket: number
  lifetimeValue: number
  lastPurchase: string
  status: CustomerStatus
  tier: CustomerTier
}

const customers: Customer[] = [
  {
    id: "C-001",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@correo.com",
    phone: "+52 55 2211 0834",
    visits: 26,
    avgTicket: 348,
    lifetimeValue: 9050,
    lastPurchase: "18 Feb 2026",
    status: "Activo",
    tier: "Oro",
  },
  {
    id: "C-002",
    name: "Mariana Ortiz",
    email: "mariana.ortiz@correo.com",
    phone: "+52 81 3302 9041",
    visits: 19,
    avgTicket: 275,
    lifetimeValue: 6110,
    lastPurchase: "17 Feb 2026",
    status: "Activo",
    tier: "Plata",
  },
  {
    id: "C-003",
    name: "Lucia Herrera",
    email: "lucia.herrera@correo.com",
    phone: "+52 33 8092 1002",
    visits: 12,
    avgTicket: 214,
    lifetimeValue: 3290,
    lastPurchase: "12 Feb 2026",
    status: "Riesgo",
    tier: "Plata",
  },
  {
    id: "C-004",
    name: "Diego Paredes",
    email: "diego.paredes@correo.com",
    phone: "+52 55 1176 4429",
    visits: 8,
    avgTicket: 190,
    lifetimeValue: 1680,
    lastPurchase: "04 Feb 2026",
    status: "Riesgo",
    tier: "Bronce",
  },
  {
    id: "C-005",
    name: "Fernanda Rojas",
    email: "fernanda.rojas@correo.com",
    phone: "+52 22 1028 3309",
    visits: 4,
    avgTicket: 156,
    lifetimeValue: 650,
    lastPurchase: "20 Ene 2026",
    status: "Inactivo",
    tier: "Bronce",
  },
  {
    id: "C-006",
    name: "Jorge Alvarez",
    email: "jorge.alvarez@correo.com",
    phone: "+52 99 1770 2910",
    visits: 15,
    avgTicket: 302,
    lifetimeValue: 4575,
    lastPurchase: "15 Feb 2026",
    status: "Activo",
    tier: "Oro",
  },
]

const tierClass: Record<CustomerTier, string> = {
  Oro: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  Plata:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  Bronce:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300",
}

const statusClass: Record<CustomerStatus, string> = {
  Activo:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  Riesgo:
    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300",
  Inactivo:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { slug } = await params

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((customer) => customer.status === "Activo").length
  const averageTicket =
    customers.reduce((sum, customer) => sum + customer.avgTicket, 0) / customers.length
  const totalLtv = customers.reduce((sum, customer) => sum + customer.lifetimeValue, 0)

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de clientes
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Clientes y fidelizacion
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Segmenta compradores frecuentes, detecta riesgo de fuga y accede al historial
                comercial de cada cliente en <span className="font-semibold text-foreground">{slug}</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Clientes totales
                </p>
                <p className="text-3xl font-bold text-foreground">{totalCustomers}</p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  +9.4% vs mes anterior
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Clientes activos
                </p>
                <p className="text-3xl font-bold text-foreground">{activeCustomers}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {Math.round((activeCustomers / totalCustomers) * 100)}% de base activa
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950/30">
                <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ticket promedio
                </p>
                <p className="text-3xl font-bold text-foreground">{mxn.format(averageTicket)}</p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  +3.1% en ultima semana
                </p>
              </div>
              <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-950/30">
                <Wallet className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Valor acumulado
                </p>
                <p className="text-3xl font-bold text-foreground">{mxn.format(totalLtv)}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  Lifetime value total
                </p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-950/30">
                <ArrowUpRight className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de clientes</CardTitle>
                <CardDescription>
                  Datos de prueba para control comercial, retencion y seguimiento.
                </CardDescription>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="relative min-w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por nombre, correo o telefono"
                    className="pl-9"
                  />
                </div>
                <select
                  defaultValue="todos"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  name="status-filter"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activos</option>
                  <option value="riesgo">En riesgo</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
            </div>
            <Separator />
          </CardHeader>

          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-3 font-medium">Cliente</th>
                    <th className="px-2 py-3 font-medium">Frecuencia</th>
                    <th className="px-2 py-3 font-medium">Ticket prom.</th>
                    <th className="px-2 py-3 font-medium">LTV</th>
                    <th className="px-2 py-3 font-medium">Ultima compra</th>
                    <th className="px-2 py-3 font-medium">Segmento</th>
                    <th className="px-2 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-4">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback className="font-semibold">
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{customer.name}</p>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <p className="inline-flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email}
                              </p>
                              <p className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 font-medium">{customer.visits} compras</td>
                      <td className="px-2 py-4">{mxn.format(customer.avgTicket)}</td>
                      <td className="px-2 py-4">{mxn.format(customer.lifetimeValue)}</td>
                      <td className="px-2 py-4 text-muted-foreground">{customer.lastPurchase}</td>
                      <td className="px-2 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tierClass[customer.tier]}`}
                        >
                          {customer.tier}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[customer.status]}`}
                        >
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segmentacion rapida</CardTitle>
              <CardDescription>Distribucion para campanas y promociones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Top fidelizados</p>
                  <span className="text-sm font-semibold text-foreground">2</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Clientes Oro con alta recurrencia.</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">En riesgo</p>
                  <span className="text-sm font-semibold text-foreground">2</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Mas de 10 dias sin compra.</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Reactivacion</p>
                  <span className="text-sm font-semibold text-foreground">1</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Inactivos para cupon de retorno.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones sugeridas</CardTitle>
              <CardDescription>Prioriza impacto comercial esta semana.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Campana VIP
                </p>
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  Ofrece 10% extra en segunda compra del dia para Oro.
                </p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/70 p-3 dark:border-yellow-900 dark:bg-yellow-950/20">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  Recuperacion de riesgo
                </p>
                <p className="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80">
                  Mensaje automatico con incentivo de regreso en 48h.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Validacion de datos
                </p>
                <p className="mt-1 text-xs text-slate-700/80 dark:text-slate-300/80">
                  Completa telefono y correo faltante al cobrar.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes destacados</CardTitle>
              <CardDescription>Mayor valor acumulado en el mes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customers.slice(0, 3).map((customer) => (
                <div
                  key={`featured-${customer.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3"
                >
                  <div className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium text-foreground">{customer.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {mxn.format(customer.lifetimeValue)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
