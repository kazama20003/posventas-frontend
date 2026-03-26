"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Eye, ReceiptText, RefreshCcw, Search, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomers } from "@/lib/api/customers"
import { useOrders, type Order } from "@/lib/api/orders"
import { useProducts } from "@/lib/api/products"
import { useStores } from "@/lib/api/stores"

type OrdersPageClientProps = {
  slug: string
}

type VariantLookup = {
  label: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getOrderCode(order: Order) {
  return order.code?.trim() ? order.code : `OV-${String(order.id).slice(0, 8)}`
}

function getOrderStatus(order: Order) {
  const explicitStatus = String(order.status ?? "").trim().toUpperCase()

  if (explicitStatus === "CANCELED") {
    return explicitStatus
  }

  if (order.fulfilledAt) {
    return "FULFILLED"
  }

  return explicitStatus || "PENDING"
}

function getOrderStatusClass(order: Order) {
  const status = getOrderStatus(order)

  if (status === "FULFILLED" || status === "CONFIRMED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
  }

  if (status === "CANCELED") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
  }

  if (status === "DRAFT") {
    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300"
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
}

function getOrderTotal(order: Order) {
  if (typeof order.total === "number" && Number.isFinite(order.total)) {
    return order.total
  }

  const subtotal = (order.lines ?? []).reduce((sum, line) => {
    const quantity = Number(line.quantity ?? 0)
    const unitPrice = Number(line.unitPrice ?? 0)
    return sum + quantity * unitPrice
  }, 0)

  return Math.max(0, subtotal - Number(order.discountAmount ?? 0))
}

function getPaidAmount(order: Order) {
  return (order.payments ?? []).reduce((sum, payment) => {
    if (String(payment.status ?? "PENDING").trim().toUpperCase() === "FAILED") {
      return sum
    }

    return sum + Number(payment.amount ?? 0)
  }, 0)
}

function buildVariantLookup(products: Array<Record<string, unknown>>) {
  return new Map<string, VariantLookup>(
    products.flatMap((product) => {
      const variants = Array.isArray(product.variants) ? product.variants : []

      return variants
        .filter((variant) => typeof variant?.id === "string" && variant.id.length > 0)
        .map((variant) => [
          String(variant.id),
          {
            label: [product.name, variant.sku, variant.unitOfMeasure]
              .filter(Boolean)
              .map((value) => String(value))
              .join(" - "),
          },
        ] as const)
    })
  )
}

export function OrdersPageClient({ slug }: OrdersPageClientProps) {
  const [search, setSearch] = useState("")

  const ordersQuery = useOrders()
  const customersQuery = useCustomers()
  const storesQuery = useStores()
  const productsQuery = useProducts()

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data])
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data])
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [String(customer.id), customer])),
    [customers]
  )
  const storesById = useMemo(
    () => new Map(stores.map((store) => [String(store.id), store])),
    [stores]
  )
  const variantsById = useMemo(
    () => buildVariantLookup(products as Array<Record<string, unknown>>),
    [products]
  )

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return orders

    return orders.filter((order) => {
      const customer = customersById.get(String(order.customerId ?? ""))
      const store = storesById.get(String(order.storeId ?? ""))
      const lines = (order.lines ?? []).map((line) => variantsById.get(String(line.variantId))?.label)

      return [
        getOrderCode(order),
        getOrderStatus(order),
        customer?.name,
        customer?.email,
        customer?.phone,
        store?.name,
        store?.code,
        ...lines,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [customersById, orders, search, storesById, variantsById])

  const paidRevenue = orders.reduce((sum, order) => sum + getPaidAmount(order), 0)
  const salesRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0)
  const fulfilledOrders = orders.filter((order) => Boolean(order.fulfilledAt)).length
  const averageTicket = orders.length > 0 ? salesRevenue / orders.length : 0

  const recentOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 12),
    [filteredOrders]
  )

  const isLoading =
    ordersQuery.isLoading ||
    customersQuery.isLoading ||
    storesQuery.isLoading ||
    productsQuery.isLoading

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span>Tenant {slug}</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Ventas registradas
              </h1>
              <p className="text-sm text-muted-foreground">
                Historial completo de pedidos vendidos, pagos y estado de despacho.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
            >
              <RefreshCcw className={`h-4 w-4 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button asChild className="gap-2">
              <Link href={`/app/${slug}/pos`}>
                <ShoppingCart className="h-4 w-4" />
                Ir al POS
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ventas
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Facturado
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(salesRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cobrado
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(paidRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ticket promedio
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {formatCurrency(averageTicket)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Consulta de ventas</CardTitle>
              <CardDescription>
                Busca por cliente, sucursal, codigo de venta o productos vendidos.
              </CardDescription>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar ventas"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-border/60">
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : recentOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
              <ReceiptText className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay ventas registradas</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El POS es el flujo operativo para crear nuevas ventas.
              </p>
            </div>
          ) : (
            recentOrders.map((order) => {
              const customer = customersById.get(String(order.customerId ?? "")) ?? order.customer
              const store = storesById.get(String(order.storeId ?? "")) ?? order.store
              const total = getOrderTotal(order)
              const paidAmount = getPaidAmount(order)

              return (
                <div
                  key={String(order.id)}
                  className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {getOrderCode(order)}
                        </h3>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getOrderStatusClass(order)}`}
                        >
                          {getOrderStatus(order)}
                        </span>
                        {paidAmount >= total && total > 0 ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Pago completo
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Cliente
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {customer?.name ?? "Cliente de mostrador"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Sucursal
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {store?.name ?? String(order.storeId)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatCurrency(total)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Cobrado
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatCurrency(paidAmount)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Actualizado
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatDate(order.updatedAt ?? order.createdAt)}
                          </p>
                        </div>
                      </div>

                      {order.lines?.length ? (
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="mb-2 text-sm font-medium text-foreground">
                            Productos vendidos
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.lines.slice(0, 5).map((line, index) => {
                              const variant = variantsById.get(String(line.variantId))

                              return (
                                <span
                                  key={`${String(order.id)}-line-${String(line.id ?? index)}`}
                                  className="inline-flex rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                                >
                                  {variant?.label ?? String(line.variantId)}
                                </span>
                              )
                            })}
                            {order.lines.length > 5 ? (
                              <span className="inline-flex rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                +{order.lines.length - 5} mas
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/app/${slug}/pos`}>
                          <Eye className="h-4 w-4" />
                          Nueva venta
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Despacho</CardTitle>
            <CardDescription>Ventas ya completadas o entregadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{fulfilledOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pendientes de cobro</CardTitle>
            <CardDescription>Ventas con saldo aun no cubierto.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {
                orders.filter((order) => {
                  const total = getOrderTotal(order)
                  return getPaidAmount(order) < total
                }).length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes atendidos</CardTitle>
            <CardDescription>Clientes unicos con ventas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {new Set(orders.map((order) => String(order.customerId ?? ""))).size}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
