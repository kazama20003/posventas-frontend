"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Banknote,
  CreditCard,
  Minus,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Smartphone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomers } from "@/lib/api/customers"
import {
  getApiErrorMessage,
  useCreateOrder,
  useOrders,
  type Order,
  type OrderPaymentProviderValue,
  type OrderUnitOfMeasureValue,
} from "@/lib/api/orders"
import { useProducts } from "@/lib/api/products"
import { useActiveStore } from "@/lib/app/active-store-context"

type PosPageClientProps = {
  slug: string
}

type PosItem = {
  variantId: string
  productName: string
  category: string
  sku: string
  unitOfMeasure?: string | null
  price: number
  imageUrl?: string | null
}

type CartItem = {
  variantId: string
  productName: string
  sku: string
  unitOfMeasure?: string | null
  price: number
  quantity: number
}

const paymentOptions: Array<{
  value: OrderPaymentProviderValue
  label: string
  icon: typeof CreditCard
}> = [
  { value: "CARD", label: "Tarjeta", icon: CreditCard },
  { value: "CASH", label: "Efectivo", icon: Banknote },
  { value: "OTHER", label: "Transferencia", icon: Smartphone },
]

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

function getPrimaryImageUrl(images: unknown) {
  if (!Array.isArray(images)) return null

  const image = images.find(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "url" in entry &&
      typeof entry.url === "string" &&
      entry.url.trim().length > 0
  ) as { url?: string } | undefined

  return image?.url ?? null
}

function buildPosItems(products: Array<Record<string, unknown>>) {
  return products.flatMap((product) => {
    const categoryValue =
      typeof product.category === "object" &&
      product.category !== null &&
      "name" in product.category &&
      typeof product.category.name === "string"
        ? product.category.name
        : "General"
    const price =
      typeof product.salePrice === "number" && Number.isFinite(product.salePrice)
        ? product.salePrice
        : 0
    const variants = Array.isArray(product.variants) ? product.variants : []

    return variants
      .filter((variant) => typeof variant?.id === "string" && variant.id.length > 0)
      .map((variant) => ({
        variantId: String(variant.id),
        productName: String(product.name ?? "Producto sin nombre"),
        category: categoryValue,
        sku: String(variant.sku ?? "SIN-SKU"),
        unitOfMeasure:
          typeof variant.unitOfMeasure === "string" ? variant.unitOfMeasure : null,
        price,
        imageUrl: getPrimaryImageUrl(product.images),
      }))
  })
}

export function PosPageClient({ slug }: PosPageClientProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [customerId, setCustomerId] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [paymentProvider, setPaymentProvider] =
    useState<OrderPaymentProviderValue>("CARD")
  const [cart, setCart] = useState<CartItem[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const productsQuery = useProducts()
  const customersQuery = useCustomers()
  const ordersQuery = useOrders()
  const createOrder = useCreateOrder()
  const { selectedStore, selectedStoreId, isLoading: isLoadingStores } = useActiveStore()

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data])
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const posItems = useMemo(
    () => buildPosItems(products as Array<Record<string, unknown>>),
    [products]
  )

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(posItems.map((item) => item.category)))],
    [posItems]
  )

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return posItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todos" || item.category === selectedCategory
      const matchesSearch =
        normalized.length === 0 ||
        [item.productName, item.sku, item.category]
          .some((value) => value.toLowerCase().includes(normalized))

      return matchesCategory && matchesSearch
    })
  }, [posItems, search, selectedCategory])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = discountAmount.trim().length > 0 ? Number(discountAmount) : 0
  const total = Math.max(0, subtotal - (Number.isFinite(discount) ? discount : 0))

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 5),
    [orders]
  )

  const isLoading = productsQuery.isLoading || customersQuery.isLoading || isLoadingStores

  function addToCart(item: PosItem) {
    setCart((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId)

      if (existing) {
        return current.map((entry) =>
          entry.variantId === item.variantId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        )
      }

      return [
        ...current,
        {
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          unitOfMeasure: item.unitOfMeasure,
          price: item.price,
          quantity: 1,
        },
      ]
    })
    setActionError(null)
    setSuccessMessage(null)
  }

  function changeQuantity(variantId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function resetSale() {
    setCart([])
    setDiscountAmount("")
    setCustomerId("")
    setActionError(null)
  }

  async function submitSale(mode: "charge" | "pending") {
    setActionError(null)
    setSuccessMessage(null)

    if (!selectedStoreId) {
      setActionError("Selecciona una sucursal para registrar la venta.")
      return
    }

    if (cart.length === 0) {
      setActionError("Agrega al menos un producto al carrito.")
      return
    }

    if (discountAmount.trim().length > 0) {
      const parsedDiscount = Number(discountAmount)
      if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
        setActionError("El descuento debe ser un numero valido.")
        return
      }
    }

    try {
      const order = await createOrder.mutateAsync({
        storeId: selectedStoreId,
        customerId: customerId || undefined,
        status: mode === "charge" ? "CONFIRMED" : "PENDING",
        discountAmount: discount > 0 ? discount : undefined,
        lines: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
          unitOfMeasure: item.unitOfMeasure as OrderUnitOfMeasureValue | undefined,
        })),
        payments:
          mode === "charge"
            ? [
                {
                  amount: total,
                  provider: paymentProvider,
                  status: "COMPLETED",
                  paidAt: new Date().toISOString(),
                },
              ]
            : undefined,
      })

      resetSale()
      setSuccessMessage(
        `Venta ${getOrderCode(order)} registrada${mode === "charge" ? " y cobrada" : " como pendiente"}.`
      )
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo registrar la venta."))
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 bg-background p-2 sm:p-3 lg:p-4">
      <header className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-1 size-9 shrink-0 rounded-md border border-border bg-background text-muted-foreground shadow-none" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Gestion comercial
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Punto de venta
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-9 gap-2"
              onClick={() => {
                void productsQuery.refetch()
                void ordersQuery.refetch()
              }}
              disabled={productsQuery.isFetching || ordersQuery.isFetching}
            >
              <RefreshCcw
                className={`h-4 w-4 ${productsQuery.isFetching || ordersQuery.isFetching ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            <Button asChild variant="outline" className="h-9 gap-2">
              <Link href={`/app/${slug}/orders`}>
                <ShoppingCart className="h-4 w-4" />
                Ver ventas
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_420px]">
        <Card className="overflow-hidden border-border bg-card shadow-none">
          <CardHeader className="space-y-3 border-b border-border">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Catalogo para venta</CardTitle>
                <CardDescription>
                  Selecciona variantes vendibles y agrégalas al carrito.
                </CardDescription>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por producto, SKU o categoria"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    category === selectedCategory
                      ? "rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-xs"
                      : "rounded-md border border-transparent bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="border-border bg-background shadow-none">
                    <CardContent className="space-y-3 p-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No hay productos para esta busqueda
                </h3>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.variantId}
                    className="overflow-hidden rounded-md border border-border bg-background p-3 shadow-none transition-colors hover:bg-muted/20"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted/30">
                        {item.imageUrl ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url("${item.imageUrl}")` }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {item.category}
                        </div>
                        <h3 className="line-clamp-2 min-h-[2.5rem] font-semibold text-foreground">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          SKU {item.sku}
                          {item.unitOfMeasure ? ` | ${item.unitOfMeasure}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Precio unitario</p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-md"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Venta actual
              </CardTitle>
              <CardDescription>Configura la venta y confirma el cobro.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sucursal activa
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedStore?.name ?? "Sin sucursal seleccionada"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cambiala desde el sidebar para aplicarla globalmente al POS.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="pos-customer">
                    Cliente
                  </label>
                  <select
                    id="pos-customer"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  >
                    <option value="">Cliente de mostrador</option>
                    {customers.map((customer) => (
                      <option key={String(customer.id)} value={String(customer.id)}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="pos-discount">
                    Descuento
                  </label>
                  <Input
                    id="pos-discount"
                    inputMode="decimal"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {cart.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                    El carrito esta vacio. Agrega productos desde el catalogo.
                  </div>
                ) : (
                  cart.map((item) => (
                      <div key={item.variantId} className="rounded-md border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku}
                            {item.unitOfMeasure ? ` · ${item.unitOfMeasure}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-2 inline-flex items-center rounded-md border border-border">
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                          type="button"
                          onClick={() => changeQuantity(item.variantId, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="inline-flex h-8 min-w-8 items-center justify-center border-x border-border px-2 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                          type="button"
                          onClick={() => changeQuantity(item.variantId, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-medium text-foreground">
                    -{formatCurrency(Number.isFinite(discount) ? discount : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Metodo de pago
                </p>
                <div className="grid gap-2">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon
                    const active = paymentProvider === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentProvider(option.value)}
                        className={
                          active
                            ? "inline-flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                            : "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </span>
                        {active ? "Seleccionado" : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              {actionError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {successMessage}
                </div>
              ) : null}

              <Button
                className="w-full rounded-md"
                disabled={createOrder.isPending}
                onClick={() => void submitSale("charge")}
              >
                Cobrar {formatCurrency(total)}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-md"
                disabled={createOrder.isPending}
                onClick={() => void submitSale("pending")}
              >
                Guardar como venta pendiente
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Ventas recientes</CardTitle>
              <CardDescription>Ultimas ventas registradas desde el sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordersQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2 rounded-md border border-border bg-background p-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))
              ) : recentOrders.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no hay ventas registradas.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={String(order.id)}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {getOrderCode(order)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(order.updatedAt ?? order.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(
                          typeof order.total === "number"
                            ? order.total
                            : (order.lines ?? []).reduce((sum, line) => {
                                const quantity = Number(line.quantity ?? 0)
                                const unitPrice = Number(line.unitPrice ?? 0)
                                return sum + quantity * unitPrice
                              }, 0)
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

