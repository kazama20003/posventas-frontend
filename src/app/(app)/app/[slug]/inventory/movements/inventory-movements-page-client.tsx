"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react"

import { useProducts } from "@/lib/api/products"
import {
  getApiErrorMessage,
  useCreateInventoryMovement,
  useInventoryMovements,
} from "@/lib/api/inventories"
import type { CreateInventoryMovementInput } from "@/lib/api/inventories"
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
  getVariantOptions,
  getWarehouseLabel,
  uuidV4Pattern,
} from "../inventory-shared"

type InventoryMovementsPageClientProps = {
  slug: string
}

type MovementFormValues = {
  variantId: string
  warehouseId: string
  delta: string
  reason: string
  referenceId: string
}

type MovementFormErrors = Partial<Record<keyof MovementFormValues, string>>

const signedIntegerPattern = /^-?\d+$/

const defaultFormValues: MovementFormValues = {
  variantId: "",
  warehouseId: "",
  delta: "",
  reason: "",
  referenceId: "",
}

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function validateMovement(values: MovementFormValues) {
  const errors: MovementFormErrors = {}
  const variantId = values.variantId.trim()
  const warehouseId = values.warehouseId.trim()
  const delta = values.delta.trim()
  const reason = values.reason.trim()
  const referenceId = values.referenceId.trim()

  if (!uuidV4Pattern.test(variantId)) {
    errors.variantId = "Selecciona una variante valida."
  }

  if (!uuidV4Pattern.test(warehouseId)) {
    errors.warehouseId = "Selecciona un almacen valido."
  }

  if (!signedIntegerPattern.test(delta)) {
    errors.delta = "El delta debe ser un entero positivo o negativo."
  } else if (Number(delta) === 0) {
    errors.delta = "El delta no puede ser 0."
  }

  if (reason.length < 2) {
    errors.reason = "El motivo debe tener al menos 2 caracteres."
  } else if (reason.length > 200) {
    errors.reason = "El motivo no puede superar 200 caracteres."
  }

  if (referenceId.length > 120) {
    errors.referenceId = "La referencia no puede superar 120 caracteres."
  }

  return errors
}

function toCreatePayload(values: MovementFormValues): CreateInventoryMovementInput {
  return {
    variantId: values.variantId.trim(),
    warehouseId: values.warehouseId.trim(),
    delta: Number(values.delta),
    reason: values.reason.trim(),
    referenceId: normalizeOptional(values.referenceId),
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
      <History className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Registrar primer movimiento
        </Button>
      ) : null}
    </div>
  )
}

export function InventoryMovementsPageClient({ slug }: InventoryMovementsPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formValues, setFormValues] = useState<MovementFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<MovementFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const movementsQuery = useInventoryMovements()
  const productsQuery = useProducts()
  const warehousesQuery = useWarehouses()
  const createMovement = useCreateInventoryMovement()

  const movements = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data])
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

  const filteredMovements = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return movements

    return movements.filter((movement) => {
      const variant = variantsById.get(String(movement.variantId))
      const warehouse = warehousesById.get(String(movement.warehouseId))
      return [
        variant?.productName,
        variant?.sku,
        variant?.barcode,
        warehouse?.name,
        warehouse?.code,
        movement.reason,
        movement.referenceId,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [movements, search, variantsById, warehousesById])

  const entriesCount = movements.filter((movement) => Number(movement.delta) > 0).length
  const exitsCount = movements.filter((movement) => Number(movement.delta) < 0).length
  const netDelta = movements.reduce((sum, movement) => sum + Number(movement.delta ?? 0), 0)
  const recentMovements = useMemo(
    () =>
      [...movements]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [movements]
  )

  function resetFormState() {
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

  function handleFieldChange(field: keyof MovementFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateMovement(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setActionError(null)

    try {
      await createMovement.mutateAsync(toCreatePayload(formValues))
      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo registrar el movimiento."))
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
                Movimientos de inventario
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Historial de entradas y salidas</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Registra y revisa movimientos de <span className="font-semibold text-foreground">{slug}</span>
                , controlando delta por variante, almacen, motivo y referencia.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void movementsQuery.refetch()}
              disabled={movementsQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo movimiento
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Movimientos"
          value={String(movements.length)}
          hint={`${filteredMovements.length} visibles con el filtro actual`}
          icon={<History className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
        />
        <MetricCard
          label="Entradas"
          value={String(entriesCount)}
          hint="Movimientos con delta positivo"
          icon={<ArrowDownLeft className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Salidas"
          value={String(exitsCount)}
          hint="Movimientos con delta negativo"
          icon={<ArrowUpRight className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
          iconClass="bg-amber-100 dark:bg-amber-950/30"
        />
        <MetricCard
          label="Delta neto"
          value={String(netDelta)}
          hint="Suma total de los cambios registrados"
          icon={<PackagePlus className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Libro de movimientos</CardTitle>
                <CardDescription>Entradas, salidas y ajustes por variante y almacen.</CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por producto, SKU, almacen o motivo"
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

            {movementsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : movementsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(movementsQuery.error, "No se pudieron cargar los movimientos.")}
              </div>
            ) : filteredMovements.length === 0 ? (
              <EmptyState
                title="No hay movimientos para mostrar"
                description={
                  movements.length === 0
                    ? "Registra el primer movimiento para empezar a auditar entradas y salidas."
                    : "Ajusta la busqueda para encontrar un movimiento existente."
                }
                onCreate={movements.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredMovements.map((movement) => {
                  const variant = variantsById.get(String(movement.variantId))
                  const warehouse =
                    warehousesById.get(String(movement.warehouseId)) ?? movement.warehouse ?? undefined
                  const delta = Number(movement.delta ?? 0)
                  const isEntry = delta > 0

                  return (
                    <article
                      key={String(movement.id)}
                      className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">
                              {variant?.productName ?? variant?.sku ?? movement.variantId}
                            </p>
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                                isEntry
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                              }`}
                            >
                              {isEntry ? `+${delta}` : delta}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {variant?.sku ?? "SKU sin resolver"} - {getWarehouseLabel(warehouse)}
                          </p>
                          <p className="text-sm text-foreground">{movement.reason}</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background px-3 py-2 xl:shrink-0">
                          <p className="text-xs text-muted-foreground">Referencia</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {movement.referenceId || "Sin referencia"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(movement.updatedAt ?? movement.createdAt)}
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
              <CardDescription>Lectura rapida de la actividad reciente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Variantes impactadas</p>
                  <span className="text-sm font-semibold text-foreground">
                    {new Set(movements.map((movement) => String(movement.variantId))).size}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Variantes distintas con movimiento registrado.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Almacenes impactados</p>
                  <span className="text-sm font-semibold text-foreground">
                    {new Set(movements.map((movement) => String(movement.warehouseId))).size}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Almacenes con entradas, salidas o ajustes registrados.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Resultado de busqueda</p>
                  <span className="text-sm font-semibold text-foreground">{filteredMovements.length}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se filtra por producto, SKU, almacen, motivo o referencia.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimos movimientos del tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMovements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen movimientos registrados.
                </div>
              ) : (
                recentMovements.map((movement) => {
                  const variant = variantsById.get(String(movement.variantId))
                  const delta = Number(movement.delta ?? 0)

                  return (
                    <div
                      key={`recent-${String(movement.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {variant?.sku ?? movement.variantId}
                        </p>
                        <span className="text-xs font-semibold text-foreground">
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{movement.reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(movement.updatedAt ?? movement.createdAt)}
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
            <SheetTitle>Nuevo movimiento</SheetTitle>
            <SheetDescription>
              Registra una entrada, salida o ajuste usando un delta entero por variante y almacen.
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="movement-variant" className="text-sm font-medium text-foreground">
                Variante
              </label>
              <select
                id="movement-variant"
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
                  La variante debe existir dentro del catalogo de productos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="movement-warehouse" className="text-sm font-medium text-foreground">
                Almacen
              </label>
              <select
                id="movement-warehouse"
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
                  El movimiento se aplicara sobre este almacen.
                </p>
              )}
            </div>

            <Field
              label="Delta"
              htmlFor="movement-delta"
              error={formErrors.delta}
              hint="Usa positivo para entrada y negativo para salida."
            >
              <Input
                id="movement-delta"
                inputMode="numeric"
                value={formValues.delta}
                onChange={(event) => handleFieldChange("delta", event.target.value)}
                placeholder="Ej. 10 o -3"
              />
            </Field>

            <Field label="Motivo" htmlFor="movement-reason" error={formErrors.reason}>
              <Input
                id="movement-reason"
                value={formValues.reason}
                onChange={(event) => handleFieldChange("reason", event.target.value)}
                placeholder="Ej. Ajuste por conteo ciclico"
                maxLength={200}
              />
            </Field>

            <Field
              label="Referencia"
              htmlFor="movement-reference"
              error={formErrors.referenceId}
              hint="Opcional. Orden, documento o correlativo interno."
            >
              <Input
                id="movement-reference"
                value={formValues.referenceId}
                onChange={(event) => handleFieldChange("referenceId", event.target.value)}
                placeholder="Ej. OC-2045"
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
                disabled={createMovement.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? "Guardando..." : "Registrar movimiento"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
