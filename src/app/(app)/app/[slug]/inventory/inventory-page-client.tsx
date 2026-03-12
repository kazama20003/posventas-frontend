"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  Boxes,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  Warehouse,
} from "lucide-react"

import { useProducts } from "@/lib/api/products"
import {
  getApiErrorMessage,
  useCreateInventory,
  useDeleteInventory,
  useInventories,
  useUpdateInventory,
} from "@/lib/api/inventories"
import type {
  CreateInventoryInput,
  Inventory,
  UpdateInventoryInput,
} from "@/lib/api/inventories"
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
import {
  formatDate,
  getInitials,
  getVariantOptions,
  getWarehouseLabel,
  uuidV4Pattern,
} from "./inventory-shared"

type InventoryPageClientProps = {
  slug: string
}

type InventoryFormValues = {
  variantId: string
  warehouseId: string
  quantity: string
  reserved: string
  reason: string
  referenceId: string
}

type InventoryFormErrors = Partial<Record<keyof InventoryFormValues, string>>

const integerPattern = /^\d+$/

const defaultFormValues: InventoryFormValues = {
  variantId: "",
  warehouseId: "",
  quantity: "",
  reserved: "",
  reason: "",
  referenceId: "",
}

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function validateInventory(values: InventoryFormValues) {
  const errors: InventoryFormErrors = {}
  const variantId = values.variantId.trim()
  const warehouseId = values.warehouseId.trim()
  const quantity = values.quantity.trim()
  const reserved = values.reserved.trim()
  const reason = values.reason.trim()
  const referenceId = values.referenceId.trim()

  if (!uuidV4Pattern.test(variantId)) {
    errors.variantId = "Selecciona una variante valida."
  }

  if (!uuidV4Pattern.test(warehouseId)) {
    errors.warehouseId = "Selecciona un almacen valido."
  }

  if (quantity.length > 0 && !integerPattern.test(quantity)) {
    errors.quantity = "La cantidad debe ser un entero mayor o igual a 0."
  }

  if (reserved.length > 0 && !integerPattern.test(reserved)) {
    errors.reserved = "La reserva debe ser un entero mayor o igual a 0."
  }

  if (reason.length > 200) {
    errors.reason = "El motivo no puede superar 200 caracteres."
  }

  if (referenceId.length > 120) {
    errors.referenceId = "La referencia no puede superar 120 caracteres."
  }

  if (!errors.quantity && !errors.reserved && quantity.length > 0 && reserved.length > 0) {
    if (Number(reserved) > Number(quantity)) {
      errors.reserved = "La reserva no puede superar la cantidad disponible."
    }
  }

  return errors
}

function toCreatePayload(values: InventoryFormValues): CreateInventoryInput {
  return {
    variantId: values.variantId.trim(),
    warehouseId: values.warehouseId.trim(),
    quantity: normalizeOptional(values.quantity) ? Number(values.quantity) : undefined,
    reserved: normalizeOptional(values.reserved) ? Number(values.reserved) : undefined,
    reason: normalizeOptional(values.reason),
    referenceId: normalizeOptional(values.referenceId),
  }
}

function toUpdatePayload(values: InventoryFormValues): UpdateInventoryInput {
  return {
    variantId: values.variantId.trim(),
    warehouseId: values.warehouseId.trim(),
    quantity: normalizeOptional(values.quantity) ? Number(values.quantity) : undefined,
    reserved: normalizeOptional(values.reserved) ? Number(values.reserved) : undefined,
    reason: normalizeOptional(values.reason),
    referenceId: normalizeOptional(values.referenceId),
  }
}

function getInventoryFormValues(inventory: Inventory): InventoryFormValues {
  return {
    variantId: String(inventory.variantId ?? inventory.variant?.id ?? ""),
    warehouseId: String(inventory.warehouseId ?? inventory.warehouse?.id ?? ""),
    quantity:
      typeof inventory.quantity === "number" && Number.isFinite(inventory.quantity)
        ? String(inventory.quantity)
        : "",
    reserved:
      typeof inventory.reserved === "number" && Number.isFinite(inventory.reserved)
        ? String(inventory.reserved)
        : "",
    reason: String(inventory.reason ?? ""),
    referenceId: String(inventory.referenceId ?? ""),
  }
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
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
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
      <Warehouse className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer inventario
        </Button>
      ) : null}
    </div>
  )
}

export function InventoryPageClient({ slug }: InventoryPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const [formValues, setFormValues] = useState<InventoryFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<InventoryFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const inventoriesQuery = useInventories()
  const productsQuery = useProducts()
  const warehousesQuery = useWarehouses()
  const createInventory = useCreateInventory()
  const updateInventory = useUpdateInventory()
  const deleteInventory = useDeleteInventory()

  const inventories = useMemo(() => inventoriesQuery.data ?? [], [inventoriesQuery.data])
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data])
  const variantOptions = useMemo(() => getVariantOptions(products), [products])
  const variantsById = useMemo(
    () => new Map(variantOptions.map((variant) => [variant.variantId, variant])),
    [variantOptions]
  )
  const warehousesById = useMemo(
    () => new Map(warehouses.map((warehouse) => [String(warehouse.id), warehouse])),
    [warehouses]
  )

  const filteredInventories = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return inventories

    return inventories.filter((inventory) => {
      const variant = variantsById.get(String(inventory.variantId))
      const warehouse = warehousesById.get(String(inventory.warehouseId))
      return [
        variant?.productName,
        variant?.sku,
        variant?.barcode,
        warehouse?.name,
        warehouse?.code,
        inventory.reason,
        inventory.referenceId,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [inventories, search, variantsById, warehousesById])

  const totalQuantity = inventories.reduce((sum, inventory) => sum + Number(inventory.quantity ?? 0), 0)
  const totalReserved = inventories.reduce((sum, inventory) => sum + Number(inventory.reserved ?? 0), 0)
  const totalAvailable = totalQuantity - totalReserved
  const coveredWarehouses = new Set(inventories.map((inventory) => String(inventory.warehouseId))).size
  const recentInventories = useMemo(
    () =>
      [...inventories]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [inventories]
  )

  const isSubmitting = createInventory.isPending || updateInventory.isPending

  function resetFormState() {
    setEditingInventory(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)
    if (!nextOpen) resetFormState()
  }

  function openCreateSheet() {
    resetFormState()
    setSheetOpen(true)
  }

  function openEditSheet(inventory: Inventory) {
    setEditingInventory(inventory)
    setFormValues(getInventoryFormValues(inventory))
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange(field: keyof InventoryFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateInventory(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setActionError(null)

    try {
      if (editingInventory) {
        await updateInventory.mutateAsync({
          id: editingInventory.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createInventory.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el inventario."))
    }
  }

  async function handleDelete(inventory: Inventory) {
    const variant = variantsById.get(String(inventory.variantId))
    if (!window.confirm(`Eliminar el registro de inventario para "${variant?.label ?? inventory.variantId}"?`)) return

    setActionError(null)

    try {
      await deleteInventory.mutateAsync(inventory.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar el inventario."))
    }
  }

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de inventario
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Stock por variante y almacen</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Gestiona el inventario de <span className="font-semibold text-foreground">{slug}</span>,
                vinculando variantes de producto con almacenes y niveles reservados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void inventoriesQuery.refetch()}
              disabled={inventoriesQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo inventario
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Registros activos"
          value={String(inventories.length)}
          hint={`${filteredInventories.length} visibles con el filtro actual`}
          icon={<Boxes className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
        />
        <MetricCard
          label="Stock total"
          value={String(totalQuantity)}
          hint={`${coveredWarehouses} almacenes con inventario`}
          icon={<PackageCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Reservado"
          value={String(totalReserved)}
          hint="Unidades comprometidas o bloqueadas"
          icon={<ShieldCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
          iconClass="bg-amber-100 dark:bg-amber-950/30"
        />
        <MetricCard
          label="Disponible"
          value={String(totalAvailable)}
          hint="Cantidad total utilizable hoy"
          icon={<Warehouse className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Inventario operativo</CardTitle>
                <CardDescription>Control por variante, almacen, cantidad y reserva.</CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por producto, SKU, almacen o referencia"
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

            {inventoriesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : inventoriesQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(inventoriesQuery.error, "No se pudo cargar el inventario.")}
              </div>
            ) : filteredInventories.length === 0 ? (
              <EmptyState
                title="No hay inventario para mostrar"
                description={
                  inventories.length === 0
                    ? "Crea el primer registro de inventario para comenzar a controlar stock."
                    : "Ajusta la busqueda para encontrar un registro existente."
                }
                onCreate={inventories.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredInventories.map((inventory) => {
                  const variant = variantsById.get(String(inventory.variantId))
                  const warehouse =
                    warehousesById.get(String(inventory.warehouseId)) ?? inventory.warehouse ?? undefined
                  const quantity = Number(inventory.quantity ?? 0)
                  const reserved = Number(inventory.reserved ?? 0)
                  const available = quantity - reserved

                  return (
                    <article
                      key={String(inventory.id)}
                      className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                            {getInitials(variant?.productName ?? "INV")}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <p className="text-base font-semibold text-foreground">
                              {variant?.productName ?? "Variante no resuelta"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {variant?.sku ?? inventory.variantId} - {getWarehouseLabel(warehouse)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {variant?.barcode ? (
                                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                  {variant.barcode}
                                </span>
                              ) : null}
                              {variant?.unitOfMeasure ? (
                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  {variant.unitOfMeasure}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditSheet(inventory)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => void handleDelete(inventory)}
                            disabled={deleteInventory.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Cantidad
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">{quantity}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Stock fisico o logico registrado.</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Reservado
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">{reserved}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Unidades retenidas para operaciones.</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Disponible
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">{available}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Cantidad libre para nuevas salidas.</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Seguimiento
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {inventory.reason || "Sin motivo inicial"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ref {inventory.referenceId || "Sin referencia"} - {formatDate(inventory.updatedAt ?? inventory.createdAt)}
                          </p>
                        </div>
                      </div>
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
              <CardDescription>Lectura rapida del estado del stock.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Variantes cubiertas</p>
                  <span className="text-sm font-semibold text-foreground">
                    {new Set(inventories.map((inventory) => String(inventory.variantId))).size}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registros unicos por variante dentro del tenant actual.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Almacenes cubiertos</p>
                  <span className="text-sm font-semibold text-foreground">{coveredWarehouses}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Almacenes con al menos un registro de inventario.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Resultado de busqueda</p>
                  <span className="text-sm font-semibold text-foreground">{filteredInventories.length}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se actualiza por producto, SKU, almacen, motivo o referencia.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimos inventarios creados o actualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentInventories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen registros de inventario.
                </div>
              ) : (
                recentInventories.map((inventory) => {
                  const variant = variantsById.get(String(inventory.variantId))
                  const warehouse =
                    warehousesById.get(String(inventory.warehouseId)) ?? inventory.warehouse ?? undefined

                  return (
                    <div
                      key={`recent-${String(inventory.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {variant?.productName ?? variant?.sku ?? inventory.variantId}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {variant?.sku ?? "SKU sin resolver"} - {getWarehouseLabel(warehouse)}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {Number(inventory.quantity ?? 0) - Number(inventory.reserved ?? 0)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(inventory.updatedAt ?? inventory.createdAt)}
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingInventory ? "Editar inventario" : "Nuevo inventario"}</SheetTitle>
            <SheetDescription>
              {editingInventory
                ? "Actualiza variante, almacen, cantidades y datos de seguimiento."
                : "Registra una nueva relacion de stock entre variante y almacen."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="inventory-variant" className="text-sm font-medium text-foreground">
                Variante
              </label>
              <select
                id="inventory-variant"
                value={formValues.variantId}
                onChange={(event) => handleFieldChange("variantId", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                aria-invalid={Boolean(formErrors.variantId)}
              >
                <option value="">Selecciona una variante</option>
                {variantOptions.map((variant) => (
                  <option key={variant.variantId} value={variant.variantId}>
                    {variant.label}
                  </option>
                ))}
              </select>
              {formErrors.variantId ? (
                <p className="text-xs text-destructive">{formErrors.variantId}</p>
              ) : productsQuery.isError ? (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(productsQuery.error, "No se pudieron cargar las variantes.")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Se obtiene desde las variantes configuradas en productos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="inventory-warehouse" className="text-sm font-medium text-foreground">
                Almacen
              </label>
              <select
                id="inventory-warehouse"
                value={formValues.warehouseId}
                onChange={(event) => handleFieldChange("warehouseId", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                aria-invalid={Boolean(formErrors.warehouseId)}
              >
                <option value="">Selecciona un almacen</option>
                {warehouses.map((warehouse) => (
                  <option key={String(warehouse.id)} value={String(warehouse.id)}>
                    {getWarehouseLabel(warehouse)}
                  </option>
                ))}
              </select>
              {formErrors.warehouseId ? (
                <p className="text-xs text-destructive">{formErrors.warehouseId}</p>
              ) : warehousesQuery.isError ? (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(warehousesQuery.error, "No se pudieron cargar los almacenes.")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Usa el almacen donde realmente existe o se controlara este stock.
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Cantidad"
                htmlFor="inventory-quantity"
                error={formErrors.quantity}
                hint="Opcional. Entero mayor o igual a 0."
              >
                <Input
                  id="inventory-quantity"
                  inputMode="numeric"
                  value={formValues.quantity}
                  onChange={(event) => handleFieldChange("quantity", event.target.value)}
                  placeholder="0"
                />
              </Field>

              <Field
                label="Reservado"
                htmlFor="inventory-reserved"
                error={formErrors.reserved}
                hint="Opcional. Entero mayor o igual a 0."
              >
                <Input
                  id="inventory-reserved"
                  inputMode="numeric"
                  value={formValues.reserved}
                  onChange={(event) => handleFieldChange("reserved", event.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field
              label="Motivo"
              htmlFor="inventory-reason"
              error={formErrors.reason}
              hint="Opcional. Hasta 200 caracteres."
            >
              <Input
                id="inventory-reason"
                value={formValues.reason}
                onChange={(event) => handleFieldChange("reason", event.target.value)}
                placeholder="Ej. Stock inicial del almacen"
                maxLength={200}
              />
            </Field>

            <Field
              label="Referencia"
              htmlFor="inventory-reference"
              error={formErrors.referenceId}
              hint="Opcional. Hasta 120 caracteres."
            >
              <Input
                id="inventory-reference"
                value={formValues.referenceId}
                onChange={(event) => handleFieldChange("referenceId", event.target.value)}
                placeholder="Ej. CARGA-INICIAL-001"
                maxLength={120}
              />
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
                onClick={() => handleSheetOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingInventory ? "Guardar cambios" : "Crear inventario"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
