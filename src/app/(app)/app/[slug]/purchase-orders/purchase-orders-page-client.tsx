"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ClipboardList,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  Truck,
  Trash2,
} from "lucide-react"

import { useProducts } from "@/lib/api/products"
import {
  getApiErrorMessage,
  PURCHASE_ORDER_UNIT_OF_MEASURE_VALUES,
  useCreatePurchaseOrder,
  useDeletePurchaseOrder,
  usePurchaseOrders,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrder,
  type CreatePurchaseOrderInput,
  type PurchaseOrder,
  type PurchaseOrderUnitOfMeasureValue,
  type UpdatePurchaseOrderInput,
} from "@/lib/api/purchase-orders"
import { useStores } from "@/lib/api/stores"
import { useSuppliers } from "@/lib/api/suppliers"
import { useWarehouses } from "@/lib/api/warehouses"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

type PurchaseOrdersPageClientProps = {
  slug: string
}

type VariantOption = {
  variantId: string
  productName: string
  sku: string
  unitOfMeasure?: string | null
  label: string
}

type PurchaseOrderFormLineValues = {
  variantId: string
  quantity: string
  unitCost: string
  unitOfMeasure: string
}

type PurchaseOrderFormValues = {
  supplierId: string
  storeId: string
  code: string
  lines: PurchaseOrderFormLineValues[]
}

type PurchaseOrderFormLineErrors = Partial<Record<keyof PurchaseOrderFormLineValues, string>>

type PurchaseOrderFormErrors = {
  supplierId?: string
  storeId?: string
  code?: string
  lines?: PurchaseOrderFormLineErrors[]
}

type ReceiveFormValues = {
  warehouseId: string
}

type ReceiveFormErrors = Partial<Record<keyof ReceiveFormValues, string>>

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const integerPattern = /^\d+$/
const decimalPattern = /^\d+(?:\.\d{1,2})?$/

const defaultLineValues: PurchaseOrderFormLineValues = {
  variantId: "",
  quantity: "1",
  unitCost: "",
  unitOfMeasure: "",
}

const defaultFormValues: PurchaseOrderFormValues = {
  supplierId: "",
  storeId: "",
  code: "",
  lines: [{ ...defaultLineValues }],
}

const defaultReceiveFormValues: ReceiveFormValues = {
  warehouseId: "",
}

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function getStoreLabel(store?: { name?: string; code?: string | null } | null, fallbackId?: string | null) {
  if (!store) {
    return fallbackId ? `Sucursal ${fallbackId}` : "Sin sucursal"
  }

  const code = typeof store.code === "string" && store.code.trim().length > 0 ? store.code.trim() : null
  return code ? `${store.name} (${code})` : String(store.name ?? "Sucursal sin nombre")
}

function getWarehouseLabel(
  warehouse?: { name?: string; code?: string | null } | null,
  fallbackId?: string | null
) {
  if (!warehouse) {
    return fallbackId ? `Almacen ${fallbackId}` : "Almacen no resuelto"
  }

  const code = typeof warehouse.code === "string" && warehouse.code.trim().length > 0 ? warehouse.code.trim() : null
  return code ? `${warehouse.name} (${code})` : String(warehouse.name ?? "Almacen sin nombre")
}

function buildVariantOptions(products: Array<Record<string, unknown>>): VariantOption[] {
  return products.flatMap((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : []

    return variants
      .filter((variant) => typeof variant?.id === "string" && variant.id.length > 0)
      .map((variant) => {
        const productName = String(product.name ?? "Producto sin nombre")
        const sku = String(variant.sku ?? "")
        const unitOfMeasure =
          typeof variant.unitOfMeasure === "string" ? variant.unitOfMeasure : null
        const labelParts = [productName, sku]

        if (unitOfMeasure) {
          labelParts.push(unitOfMeasure)
        }

        return {
          variantId: String(variant.id),
          productName,
          sku,
          unitOfMeasure,
          label: labelParts.filter(Boolean).join(" - "),
        }
      })
  })
}

function getOrderStatusValue(order: PurchaseOrder) {
  const explicitStatus = String(order.status ?? "").trim().toUpperCase()
  if (explicitStatus) return explicitStatus
  return order.receivedAt ? "RECEIVED" : "PENDING"
}

function isOrderReceived(order: PurchaseOrder) {
  const status = getOrderStatusValue(order)
  return status === "RECEIVED" || status === "COMPLETED" || status === "CLOSED" || Boolean(order.receivedAt)
}

function getOrderStatusLabel(order: PurchaseOrder) {
  return getOrderStatusValue(order)
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ")
}

function getStatusBadgeClass(order: PurchaseOrder) {
  const status = getOrderStatusValue(order)

  if (status === "RECEIVED" || status === "COMPLETED" || status === "CLOSED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
  }

  if (status === "CANCELLED" || status === "VOID") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
}

function getOrderCode(order: PurchaseOrder) {
  return order.code?.trim() ? order.code : `OC-${String(order.id).slice(0, 8)}`
}

function getOrderTotal(order: PurchaseOrder) {
  if (typeof order.total === "number" && Number.isFinite(order.total)) {
    return order.total
  }

  if (typeof order.subtotal === "number" && Number.isFinite(order.subtotal)) {
    return order.subtotal
  }

  return (order.lines ?? []).reduce((sum, line) => {
    const quantity = Number(line.quantity ?? 0)
    const unitCost = Number(line.unitCost ?? 0)
    return sum + quantity * unitCost
  }, 0)
}

function getPurchaseOrderFormValues(order: PurchaseOrder): PurchaseOrderFormValues {
  return {
    supplierId: String(order.supplierId ?? order.supplier?.id ?? ""),
    storeId: String(order.storeId ?? order.store?.id ?? ""),
    code: String(order.code ?? ""),
    lines:
      Array.isArray(order.lines) && order.lines.length > 0
        ? order.lines.map((line) => ({
            variantId: String(line.variantId ?? line.variant?.id ?? ""),
            quantity:
              typeof line.quantity === "number" && Number.isFinite(line.quantity)
                ? String(line.quantity)
                : "1",
            unitCost:
              typeof line.unitCost === "number" && Number.isFinite(line.unitCost)
                ? line.unitCost.toFixed(2)
                : "",
            unitOfMeasure: String(line.unitOfMeasure ?? ""),
          }))
        : [{ ...defaultLineValues }],
  }
}

function validatePurchaseOrder(values: PurchaseOrderFormValues) {
  const errors: PurchaseOrderFormErrors = {}

  if (!uuidV4Pattern.test(values.supplierId.trim())) {
    errors.supplierId = "Selecciona un proveedor valido."
  }

  if (values.storeId.trim().length > 0 && !uuidV4Pattern.test(values.storeId.trim())) {
    errors.storeId = "Selecciona una sucursal valida."
  }

  if (values.code.trim().length > 40) {
    errors.code = "El codigo no puede superar 40 caracteres."
  }

  if (!Array.isArray(values.lines) || values.lines.length === 0) {
    errors.lines = [{ variantId: "Agrega al menos una linea." }]
    return errors
  }

  if (values.lines.length > 500) {
    errors.lines = [{ variantId: "No puedes registrar mas de 500 lineas." }]
    return errors
  }

  const lineErrors = values.lines.map((line) => {
    const currentErrors: PurchaseOrderFormLineErrors = {}
    const quantity = line.quantity.trim()
    const unitCost = line.unitCost.trim()
    const unitOfMeasure = line.unitOfMeasure.trim()

    if (!uuidV4Pattern.test(line.variantId.trim())) {
      currentErrors.variantId = "Selecciona una variante valida."
    }

    if (!integerPattern.test(quantity) || Number(quantity) < 1) {
      currentErrors.quantity = "La cantidad debe ser un entero mayor o igual a 1."
    }

    if (!decimalPattern.test(unitCost) || Number(unitCost) < 0) {
      currentErrors.unitCost = "El costo debe ser un numero con hasta 2 decimales."
    }

    if (
      unitOfMeasure.length > 0 &&
      !PURCHASE_ORDER_UNIT_OF_MEASURE_VALUES.includes(
        unitOfMeasure as PurchaseOrderUnitOfMeasureValue
      )
    ) {
      currentErrors.unitOfMeasure = "Selecciona una unidad de medida valida."
    }

    return currentErrors
  })

  if (lineErrors.some((lineError) => Object.keys(lineError).length > 0)) {
    errors.lines = lineErrors
  }

  return errors
}

function toPurchaseOrderPayload(values: PurchaseOrderFormValues): CreatePurchaseOrderInput {
  return {
    supplierId: values.supplierId.trim(),
    storeId: normalizeOptional(values.storeId),
    code: normalizeOptional(values.code),
    lines: values.lines.map((line) => ({
      variantId: line.variantId.trim(),
      quantity: Number(line.quantity),
      unitCost: Number(line.unitCost),
      unitOfMeasure:
        normalizeOptional(line.unitOfMeasure) as PurchaseOrderUnitOfMeasureValue | undefined,
    })),
  }
}

function toPurchaseOrderUpdatePayload(values: PurchaseOrderFormValues): UpdatePurchaseOrderInput {
  return toPurchaseOrderPayload(values)
}

function validateReceive(values: ReceiveFormValues) {
  const errors: ReceiveFormErrors = {}

  if (!uuidV4Pattern.test(values.warehouseId.trim())) {
    errors.warehouseId = "Selecciona un almacen valido."
  }

  return errors
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  iconClass,
  hintClass,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  iconClass: string
  hintClass?: string
}) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className={`text-xs font-medium ${hintClass ?? "text-muted-foreground"}`}>{hint}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function EmptyState({
  title,
  description,
  onCreate,
}: {
  title: string
  description: string
  onCreate?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primera orden
        </Button>
      ) : null}
    </div>
  )
}

export function PurchaseOrdersPageClient({ slug }: PurchaseOrdersPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [receiveSheetOpen, setReceiveSheetOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null)
  const [formValues, setFormValues] = useState<PurchaseOrderFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<PurchaseOrderFormErrors>({})
  const [receiveValues, setReceiveValues] = useState<ReceiveFormValues>(defaultReceiveFormValues)
  const [receiveErrors, setReceiveErrors] = useState<ReceiveFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const purchaseOrdersQuery = usePurchaseOrders()
  const suppliersQuery = useSuppliers()
  const storesQuery = useStores()
  const productsQuery = useProducts()
  const warehousesQuery = useWarehouses()
  const createPurchaseOrder = useCreatePurchaseOrder()
  const updatePurchaseOrder = useUpdatePurchaseOrder()
  const receivePurchaseOrder = useReceivePurchaseOrder()
  const deletePurchaseOrder = useDeletePurchaseOrder()

  const purchaseOrders = useMemo(() => purchaseOrdersQuery.data ?? [], [purchaseOrdersQuery.data])
  const suppliers = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data])
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data])
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data])
  const variantOptions = useMemo(
    () => buildVariantOptions(products as Array<Record<string, unknown>>),
    [products]
  )
  const variantsById = useMemo(
    () => new Map(variantOptions.map((variant) => [variant.variantId, variant])),
    [variantOptions]
  )
  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [String(supplier.id), supplier])),
    [suppliers]
  )
  const storesById = useMemo(
    () => new Map(stores.map((store) => [String(store.id), store])),
    [stores]
  )
  const warehousesById = useMemo(
    () => new Map(warehouses.map((warehouse) => [String(warehouse.id), warehouse])),
    [warehouses]
  )

  const filteredPurchaseOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return purchaseOrders

    return purchaseOrders.filter((order) => {
      const supplier = suppliersById.get(String(order.supplierId))
      const store = storesById.get(String(order.storeId ?? ""))
      const lineSearchables = (order.lines ?? []).flatMap((line) => {
        const variant = variantsById.get(String(line.variantId))
        return [variant?.productName, variant?.sku, line.unitOfMeasure]
      })

      return [
        getOrderCode(order),
        getOrderStatusLabel(order),
        supplier?.name,
        supplier?.contact,
        store?.name,
        store?.code,
        ...lineSearchables,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [purchaseOrders, search, storesById, suppliersById, variantsById])

  const pendingOrders = purchaseOrders.filter((order) => !isOrderReceived(order)).length
  const receivedOrders = purchaseOrders.filter((order) => isOrderReceived(order)).length
  const totalAmount = purchaseOrders.reduce((sum, order) => sum + getOrderTotal(order), 0)
  const recentOrders = useMemo(
    () =>
      [...purchaseOrders]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [purchaseOrders]
  )

  const receiveAvailableWarehouses = useMemo(() => {
    if (!receivingOrder) return []

    const storeId = String(receivingOrder.storeId ?? receivingOrder.store?.id ?? "").trim()
    if (!storeId) return warehouses

    return warehouses.filter((warehouse) => String(warehouse.storeId) === storeId)
  }, [receivingOrder, warehouses])

  const selectedReceiveWarehouseId = useMemo(() => {
    if (receiveValues.warehouseId) {
      if (
        receiveAvailableWarehouses.length === 0 ||
        receiveAvailableWarehouses.some(
          (warehouse) => String(warehouse.id) === receiveValues.warehouseId
        )
      ) {
        return receiveValues.warehouseId
      }
    }

    return receiveAvailableWarehouses.length === 1
      ? String(receiveAvailableWarehouses[0]?.id ?? "")
      : ""
  }, [receiveAvailableWarehouses, receiveValues.warehouseId])

  function resetOrderForm() {
    setEditingOrder(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
  }

  function resetReceiveForm() {
    setReceivingOrder(null)
    setReceiveValues(defaultReceiveFormValues)
    setReceiveErrors({})
    setActionError(null)
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)
    if (!nextOpen) resetOrderForm()
  }

  function handleReceiveSheetOpenChange(nextOpen: boolean) {
    setReceiveSheetOpen(nextOpen)
    if (!nextOpen) resetReceiveForm()
  }

  function openCreateSheet() {
    resetOrderForm()
    setSheetOpen(true)
  }

  function openEditSheet(order: PurchaseOrder) {
    setEditingOrder(order)
    setFormValues(getPurchaseOrderFormValues(order))
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function openReceiveSheet(order: PurchaseOrder) {
    setReceivingOrder(order)
    setReceiveValues(defaultReceiveFormValues)
    setReceiveErrors({})
    setActionError(null)
    setReceiveSheetOpen(true)
  }

  function handleFieldChange(field: keyof PurchaseOrderFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  function handleLineChange(
    index: number,
    field: keyof PurchaseOrderFormLineValues,
    value: string
  ) {
    setFormValues((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => {
        if (lineIndex !== index) return line

        if (field === "variantId") {
          const variant = variantsById.get(value)

          return {
            ...line,
            variantId: value,
            unitOfMeasure:
              line.unitOfMeasure || !variant?.unitOfMeasure
                ? line.unitOfMeasure
                : variant.unitOfMeasure,
          }
        }

        return {
          ...line,
          [field]: value,
        }
      }),
    }))

    setFormErrors((current) => ({
      ...current,
      lines: current.lines?.map((lineError, lineIndex) =>
        lineIndex === index ? { ...lineError, [field]: undefined } : lineError
      ),
    }))
    setActionError(null)
  }

  function addLine() {
    setFormValues((current) => ({
      ...current,
      lines: [...current.lines, { ...defaultLineValues }],
    }))
    setActionError(null)
  }

  function removeLine(index: number) {
    setFormValues((current) => {
      if (current.lines.length === 1) return current

      return {
        ...current,
        lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
      }
    })

    setFormErrors((current) => ({
      ...current,
      lines: current.lines?.filter((_, lineIndex) => lineIndex !== index),
    }))
    setActionError(null)
  }

  function handleReceiveWarehouseChange(warehouseId: string) {
    setReceiveValues({ warehouseId })
    setReceiveErrors({})
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validatePurchaseOrder(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setActionError(null)

    try {
      if (editingOrder) {
        await updatePurchaseOrder.mutateAsync({
          id: editingOrder.id,
          payload: toPurchaseOrderUpdatePayload(formValues),
        })
      } else {
        await createPurchaseOrder.mutateAsync(toPurchaseOrderPayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar la orden de compra."))
    }
  }

  async function handleReceiveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!receivingOrder) return

    const normalizedValues = {
      warehouseId: selectedReceiveWarehouseId,
    }

    const errors = validateReceive(normalizedValues)
    if (Object.keys(errors).length > 0) {
      setReceiveErrors(errors)
      return
    }

    setActionError(null)

    try {
      await receivePurchaseOrder.mutateAsync({
        id: receivingOrder.id,
        payload: normalizedValues,
      })
      handleReceiveSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo recibir la orden de compra."))
    }
  }

  async function handleDelete(order: PurchaseOrder) {
    if (!window.confirm(`Eliminar la orden "${getOrderCode(order)}"?`)) return

    setActionError(null)

    try {
      await deletePurchaseOrder.mutateAsync(order.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar la orden de compra."))
    }
  }

  const isSubmitting = createPurchaseOrder.isPending || updatePurchaseOrder.isPending
  const isReceiving = receivePurchaseOrder.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de compras
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Ordenes de compra
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Registra y controla las ordenes de compra de{" "}
                <span className="font-semibold text-foreground">{slug}</span>, conectando
                proveedor, sucursal, lineas y recepcion en almacen.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void purchaseOrdersQuery.refetch()}
              disabled={purchaseOrdersQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nueva orden
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ordenes"
          value={String(purchaseOrders.length)}
          hint={`${filteredPurchaseOrders.length} visibles con el filtro actual`}
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
        />
        <MetricCard
          label="Pendientes"
          value={String(pendingOrders)}
          hint="Ordenes aun no recibidas"
          icon={<ShoppingBag className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
          iconClass="bg-amber-100 dark:bg-amber-950/30"
        />
        <MetricCard
          label="Recibidas"
          value={String(receivedOrders)}
          hint="Ordenes cerradas o recibidas"
          icon={<PackageCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Monto estimado"
          value={formatCurrency(totalAmount)}
          hint="Suma total de ordenes registradas"
          icon={<Truck className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Ordenes registradas</CardTitle>
                <CardDescription>
                  Seguimiento de proveedor, lineas, monto y recepcion.
                </CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por codigo, proveedor, sucursal, SKU o estado"
                  className="pl-9"
                />
              </div>
            </div>
            <Separator />
          </CardHeader>

          <CardContent className="pt-0">
            {actionError ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            {purchaseOrdersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : purchaseOrdersQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(
                  purchaseOrdersQuery.error,
                  "No se pudieron cargar las ordenes de compra."
                )}
              </div>
            ) : filteredPurchaseOrders.length === 0 ? (
              <EmptyState
                title="No hay ordenes para mostrar"
                description={
                  purchaseOrders.length === 0
                    ? "Crea la primera orden de compra para empezar a registrar abastecimiento."
                    : "Ajusta la busqueda para encontrar una orden existente."
                }
                onCreate={purchaseOrders.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredPurchaseOrders.map((order) => {
                  const supplier =
                    suppliersById.get(String(order.supplierId)) ?? order.supplier ?? undefined
                  const store = storesById.get(String(order.storeId ?? "")) ?? order.store ?? undefined
                  const total = getOrderTotal(order)
                  const received = isOrderReceived(order)

                  return (
                    <article
                      key={String(order.id)}
                      className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                            {getInitials(supplier?.name ?? "OC")}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-foreground">
                                {getOrderCode(order)}
                              </p>
                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(order)}`}
                              >
                                {getOrderStatusLabel(order)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {supplier?.name ?? `Proveedor ${order.supplierId}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getStoreLabel(store, String(order.storeId ?? ""))}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditSheet(order)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openReceiveSheet(order)}
                            disabled={received}
                          >
                            <PackageCheck className="h-4 w-4" />
                            {received ? "Recibida" : "Recibir"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => void handleDelete(order)}
                            disabled={deletePurchaseOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Proveedor
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {supplier?.name ?? "No resuelto"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {supplier?.contact || "Sin contacto"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Lineas
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {order.lines?.length ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Total estimado {formatCurrency(total)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Recepcion
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {order.receivedAt ? formatDate(order.receivedAt) : "Pendiente"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getWarehouseLabel(order.warehouse, String(order.warehouseId ?? ""))}
                          </p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Seguimiento
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {formatDate(order.updatedAt ?? order.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {received ? "Ultima recepcion registrada" : "A la espera de recepcion"}
                          </p>
                        </div>
                      </div>

                      {order.lines?.length ? (
                        <div className="mt-4 rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Vista rapida de lineas
                          </p>
                          <div className="mt-3 space-y-2">
                            {order.lines.slice(0, 3).map((line, index) => {
                              const variant = variantsById.get(String(line.variantId)) ?? line.variant
                              const variantSku =
                                typeof variant?.sku === "string" && variant.sku.trim().length > 0
                                  ? variant.sku
                                  : line.variantId
                              const variantProductName =
                                typeof variant?.productName === "string" &&
                                variant.productName.trim().length > 0
                                  ? variant.productName
                                  : "Variante sin resolver"
                              const variantUnitOfMeasure =
                                typeof variant?.unitOfMeasure === "string" &&
                                variant.unitOfMeasure.trim().length > 0
                                  ? variant.unitOfMeasure
                                  : null

                              return (
                                <div
                                  key={`${String(order.id)}-line-${String(line.id ?? index)}`}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm"
                                >
                                  <div>
                                    <p className="font-medium text-foreground">{variantSku}</p>
                                    <p className="text-xs text-muted-foreground">{variantProductName}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-foreground">
                                      {line.quantity} x {formatCurrency(Number(line.unitCost ?? 0))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {line.unitOfMeasure || variantUnitOfMeasure || "Sin UM"}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                            {order.lines.length > 3 ? (
                              <p className="text-xs text-muted-foreground">
                                +{order.lines.length - 3} lineas adicionales
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen operativo</CardTitle>
              <CardDescription>Lectura rapida del estado de compras.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Proveedores activos</p>
                  <span className="text-sm font-semibold text-foreground">
                    {new Set(purchaseOrders.map((order) => String(order.supplierId))).size}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Proveedores con al menos una orden creada.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Sucursales impactadas</p>
                  <span className="text-sm font-semibold text-foreground">
                    {
                      new Set(
                        purchaseOrders
                          .map((order) => String(order.storeId ?? ""))
                          .filter((storeId) => storeId.length > 0)
                      ).size
                    }
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sucursales con compras asignadas.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Lineas totales</p>
                  <span className="text-sm font-semibold text-foreground">
                    {purchaseOrders.reduce((sum, order) => sum + (order.lines?.length ?? 0), 0)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suma de lineas registradas en todas las ordenes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimas ordenes creadas o actualizadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen ordenes de compra.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const supplier =
                    suppliersById.get(String(order.supplierId)) ?? order.supplier ?? undefined

                  return (
                    <div
                      key={`recent-${String(order.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getOrderCode(order)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {supplier?.name ?? "Proveedor no resuelto"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusBadgeClass(order)}`}
                        >
                          {getOrderStatusLabel(order)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatCurrency(getOrderTotal(order))}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(order.updatedAt ?? order.createdAt)}
                      </p>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>
              {editingOrder ? "Editar orden de compra" : "Nueva orden de compra"}
            </SheetTitle>
            <SheetDescription>
              {editingOrder
                ? "Actualiza proveedor, sucursal, codigo y lineas de la orden."
                : "Registra proveedor, sucursal opcional y lineas para generar una orden de compra."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Flujo recomendado
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  1. Selecciona proveedor
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  2. Asigna sucursal si aplica
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  3. Agrega variantes y costos
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  4. Guarda y recibe en almacen
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Proveedor"
                htmlFor="purchase-order-supplier"
                error={formErrors.supplierId}
                hint="Obligatorio. Selecciona el proveedor que abastece esta compra."
              >
                <select
                  id="purchase-order-supplier"
                  value={formValues.supplierId}
                  onChange={(event) => handleFieldChange("supplierId", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  aria-invalid={Boolean(formErrors.supplierId)}
                >
                  <option value="">Selecciona un proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={String(supplier.id)} value={String(supplier.id)}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {!formErrors.supplierId && suppliersQuery.isError ? (
                  <p className="text-xs text-destructive">
                    {getApiErrorMessage(
                      suppliersQuery.error,
                      "No se pudieron cargar los proveedores."
                    )}
                  </p>
                ) : null}
              </Field>

              <Field
                label="Sucursal"
                htmlFor="purchase-order-store"
                error={formErrors.storeId}
                hint="Opcional. Util si la compra pertenece a una sucursal especifica."
              >
                <select
                  id="purchase-order-store"
                  value={formValues.storeId}
                  onChange={(event) => handleFieldChange("storeId", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  aria-invalid={Boolean(formErrors.storeId)}
                >
                  <option value="">Sin sucursal especifica</option>
                  {stores.map((store) => (
                    <option key={String(store.id)} value={String(store.id)}>
                      {getStoreLabel(store)}
                    </option>
                  ))}
                </select>
                {!formErrors.storeId && storesQuery.isError ? (
                  <p className="text-xs text-destructive">
                    {getApiErrorMessage(storesQuery.error, "No se pudieron cargar las sucursales.")}
                  </p>
                ) : null}
              </Field>
            </div>

            <Field
              label="Codigo"
              htmlFor="purchase-order-code"
              error={formErrors.code}
              hint="Opcional. Ej. OC-2026-001."
            >
              <Input
                id="purchase-order-code"
                value={formValues.code}
                onChange={(event) => handleFieldChange("code", event.target.value)}
                placeholder="OC-2026-001"
                maxLength={40}
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Lineas de compra</p>
                  <p className="text-xs text-muted-foreground">
                    Agrega variantes, cantidad, costo y unidad de medida.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addLine}
                  disabled={formValues.lines.length >= 500}
                >
                  <Plus className="h-4 w-4" />
                  Agregar linea
                </Button>
              </div>

              <div className="space-y-3">
                {formValues.lines.map((line, index) => {
                  const lineErrors = formErrors.lines?.[index] ?? {}
                  const variant = variantsById.get(line.variantId)
                  const lineTotal =
                    decimalPattern.test(line.unitCost.trim()) && integerPattern.test(line.quantity.trim())
                      ? Number(line.unitCost) * Number(line.quantity)
                      : 0

                  return (
                    <div
                      key={`line-${index}`}
                      className="rounded-xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Linea {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {variant?.productName ?? "Selecciona una variante para continuar"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => removeLine(index)}
                          disabled={formValues.lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </Button>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field
                          label="Variante"
                          htmlFor={`purchase-order-line-variant-${index}`}
                          error={lineErrors.variantId}
                        >
                          <select
                            id={`purchase-order-line-variant-${index}`}
                            value={line.variantId}
                            onChange={(event) =>
                              handleLineChange(index, "variantId", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                            aria-invalid={Boolean(lineErrors.variantId)}
                          >
                            <option value="">Selecciona una variante</option>
                            {variantOptions.map((option) => (
                              <option key={option.variantId} value={option.variantId}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {!lineErrors.variantId && productsQuery.isError ? (
                            <p className="text-xs text-destructive">
                              {getApiErrorMessage(
                                productsQuery.error,
                                "No se pudieron cargar las variantes."
                              )}
                            </p>
                          ) : null}
                        </Field>

                        <Field
                          label="Unidad de medida"
                          htmlFor={`purchase-order-line-uom-${index}`}
                          error={lineErrors.unitOfMeasure}
                          hint="Opcional. Si no la eliges, el backend puede usar la de la variante."
                        >
                          <select
                            id={`purchase-order-line-uom-${index}`}
                            value={line.unitOfMeasure}
                            onChange={(event) =>
                              handleLineChange(index, "unitOfMeasure", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                            aria-invalid={Boolean(lineErrors.unitOfMeasure)}
                          >
                            <option value="">Usar configuracion por defecto</option>
                            {PURCHASE_ORDER_UNIT_OF_MEASURE_VALUES.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field
                          label="Cantidad"
                          htmlFor={`purchase-order-line-quantity-${index}`}
                          error={lineErrors.quantity}
                        >
                          <Input
                            id={`purchase-order-line-quantity-${index}`}
                            inputMode="numeric"
                            value={line.quantity}
                            onChange={(event) =>
                              handleLineChange(index, "quantity", event.target.value)
                            }
                            placeholder="1"
                          />
                        </Field>

                        <Field
                          label="Costo unitario"
                          htmlFor={`purchase-order-line-cost-${index}`}
                          error={lineErrors.unitCost}
                          hint={`Subtotal estimado ${formatCurrency(lineTotal)}`}
                        >
                          <Input
                            id={`purchase-order-line-cost-${index}`}
                            inputMode="decimal"
                            value={line.unitCost}
                            onChange={(event) =>
                              handleLineChange(index, "unitCost", event.target.value)
                            }
                            placeholder="0.00"
                          />
                        </Field>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {actionError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            <SheetFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSheetOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : editingOrder
                    ? "Guardar cambios"
                    : "Crear orden"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={receiveSheetOpen} onOpenChange={handleReceiveSheetOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Recibir orden</SheetTitle>
            <SheetDescription>
              Confirma el almacen donde ingresara la mercaderia de esta orden.
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleReceiveSubmit}>
            {receivingOrder ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Orden seleccionada
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {getOrderCode(receivingOrder)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {
                      (suppliersById.get(String(receivingOrder.supplierId)) ?? receivingOrder.supplier)
                        ?.name ?? "Proveedor no resuelto"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getStoreLabel(
                      storesById.get(String(receivingOrder.storeId ?? "")) ?? receivingOrder.store,
                      String(receivingOrder.storeId ?? "")
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            <Field
              label="Almacen de recepcion"
              htmlFor="purchase-order-receive-warehouse"
              error={receiveErrors.warehouseId}
              hint={
                receivingOrder?.storeId
                  ? "Solo se muestran almacenes de la sucursal asignada a la orden."
                  : "Si la orden no tiene sucursal, puedes recibirla en cualquier almacen."
              }
            >
              {receiveAvailableWarehouses.length > 1 ? (
                <select
                  id="purchase-order-receive-warehouse"
                  value={selectedReceiveWarehouseId}
                  onChange={(event) => handleReceiveWarehouseChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  aria-invalid={Boolean(receiveErrors.warehouseId)}
                >
                  <option value="">Selecciona un almacen</option>
                  {receiveAvailableWarehouses.map((warehouse) => (
                    <option key={String(warehouse.id)} value={String(warehouse.id)}>
                      {getWarehouseLabel(warehouse)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground">
                  {selectedReceiveWarehouseId
                    ? getWarehouseLabel(
                        warehousesById.get(selectedReceiveWarehouseId),
                        selectedReceiveWarehouseId
                      )
                    : "No hay almacenes disponibles para esta recepcion"}
                </div>
              )}
              {!receiveErrors.warehouseId && warehousesQuery.isError ? (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(warehousesQuery.error, "No se pudieron cargar los almacenes.")}
                </p>
              ) : null}
            </Field>

            {actionError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            <SheetFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleReceiveSheetOpenChange(false)}
                disabled={isReceiving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isReceiving || !selectedReceiveWarehouseId}>
                {isReceiving ? "Recibiendo..." : "Confirmar recepcion"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
