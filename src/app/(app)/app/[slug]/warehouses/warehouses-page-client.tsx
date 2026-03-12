"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  Boxes,
  Hash,
  Link2,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react"

import { getApiErrorMessage, useStores } from "@/lib/api/stores"
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouses,
} from "@/lib/api/warehouses"
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Warehouse,
} from "@/lib/api/warehouses"
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

type WarehousesPageClientProps = {
  slug: string
}

type WarehouseFormValues = {
  storeId: string
  name: string
  code: string
}

type WarehouseFormErrors = Partial<Record<keyof WarehouseFormValues, string>>

const defaultFormValues: WarehouseFormValues = {
  storeId: "",
  name: "",
  code: "",
}

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function normalizeOptionalValue(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function validateWarehouse(values: WarehouseFormValues) {
  const errors: WarehouseFormErrors = {}
  const normalizedStoreId = values.storeId.trim()
  const normalizedName = values.name.trim()
  const normalizedCode = values.code.trim()

  if (!uuidV4Pattern.test(normalizedStoreId)) {
    errors.storeId = "Selecciona una tienda valida."
  }

  if (normalizedName.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (normalizedName.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres."
  }

  if (normalizedCode.length > 40) {
    errors.code = "El codigo no puede superar 40 caracteres."
  }

  return errors
}

function toCreatePayload(values: WarehouseFormValues): CreateWarehouseInput {
  return {
    storeId: values.storeId.trim(),
    name: values.name.trim(),
    code: normalizeOptionalValue(values.code),
  }
}

function toUpdatePayload(values: WarehouseFormValues): UpdateWarehouseInput {
  return {
    storeId: values.storeId.trim(),
    name: values.name.trim(),
    code: normalizeOptionalValue(values.code),
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
      <Boxes className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer almacen
        </Button>
      ) : null}
    </div>
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

export function WarehousesPageClient({ slug }: WarehousesPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formValues, setFormValues] = useState<WarehouseFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<WarehouseFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const warehousesQuery = useWarehouses()
  const storesQuery = useStores()
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data])
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data])
  const storesById = useMemo(
    () => new Map(stores.map((store) => [String(store.id), store])),
    [stores]
  )

  const filteredWarehouses = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return warehouses

    return warehouses.filter((warehouse) => {
      const storeName = storesById.get(String(warehouse.storeId))?.name
      return [warehouse.name, warehouse.code, warehouse.storeId, storeName].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized)
      )
    })
  }, [search, storesById, warehouses])

  const warehousesWithCode = warehouses.filter((warehouse) => Boolean(String(warehouse.code ?? "").trim())).length
  const linkedStores = new Set(warehouses.map((warehouse) => String(warehouse.storeId))).size
  const recentWarehouses = useMemo(
    () =>
      [...warehouses]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [warehouses]
  )
  const lastUpdatedWarehouse = recentWarehouses[0]

  const isSubmitting = createWarehouse.isPending || updateWarehouse.isPending

  function resetFormState() {
    setEditingWarehouse(null)
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

  function openEditSheet(warehouse: Warehouse) {
    setEditingWarehouse(warehouse)
    setFormValues({
      storeId: String(warehouse.storeId ?? ""),
      name: String(warehouse.name ?? ""),
      code: String(warehouse.code ?? ""),
    })
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange(field: keyof WarehouseFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateWarehouse(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setActionError(null)

    try {
      if (editingWarehouse) {
        await updateWarehouse.mutateAsync({
          id: editingWarehouse.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createWarehouse.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el almacen."))
    }
  }

  async function handleDelete(warehouse: Warehouse) {
    if (!window.confirm(`Eliminar el almacen "${warehouse.name}"?`)) return

    setActionError(null)

    try {
      await deleteWarehouse.mutateAsync(warehouse.id)
    } catch (error) {
      setActionError(
        getApiErrorMessage(error, "No se pudo eliminar el almacen. Puede tener inventario activo.")
      )
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
                Modulo de almacenes
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Red de almacenes</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Administra los almacenes de <span className="font-semibold text-foreground">{slug}</span>,
                vinculalos a tiendas y manten codigos internos listos para inventario y reposicion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void warehousesQuery.refetch()}
              disabled={warehousesQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo almacen
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Almacenes activos"
          value={String(warehouses.length)}
          hint={`${filteredWarehouses.length} visibles con el filtro actual`}
          icon={<Boxes className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
        />
        <MetricCard
          label="Con codigo"
          value={String(warehousesWithCode)}
          hint={`${warehouses.length > 0 ? Math.round((warehousesWithCode / warehouses.length) * 100) : 0}% de cobertura`}
          icon={<Hash className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
        />
        <MetricCard
          label="Tiendas vinculadas"
          value={String(linkedStores)}
          hint={`${stores.length} tiendas disponibles para asignacion`}
          icon={<Link2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Ultima actualizacion"
          value={lastUpdatedWarehouse ? formatDate(lastUpdatedWarehouse.updatedAt ?? lastUpdatedWarehouse.createdAt) : "Sin datos"}
          hint={lastUpdatedWarehouse ? lastUpdatedWarehouse.name : "Aun no hay actividad"}
          icon={<PackageCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
          iconClass="bg-amber-100 dark:bg-amber-950/30"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Catalogo de almacenes</CardTitle>
                <CardDescription>Alta, edicion y control de almacenes por tienda.</CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por almacen, codigo o tienda"
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

            {warehousesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : warehousesQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(warehousesQuery.error, "No se pudo cargar la lista de almacenes.")}
              </div>
            ) : filteredWarehouses.length === 0 ? (
              <EmptyState
                title="No hay almacenes para mostrar"
                description={
                  warehouses.length === 0
                    ? "Crea el primer almacen para comenzar a ordenar inventario por tienda."
                    : "Ajusta la busqueda para encontrar un almacen existente."
                }
                onCreate={warehouses.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredWarehouses.map((warehouse) => {
                  const store = storesById.get(String(warehouse.storeId))

                  return (
                    <article
                      key={String(warehouse.id)}
                      className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                            {getInitials(warehouse.name)}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <p className="text-base font-semibold text-foreground">{warehouse.name}</p>
                            <p className="text-sm text-muted-foreground">ID {String(warehouse.id)}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {warehouse.code ? (
                                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                  {warehouse.code}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Sin codigo</span>
                              )}
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                                {store?.name ?? `Tienda ${warehouse.storeId}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditSheet(warehouse)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => void handleDelete(warehouse)}
                            disabled={deleteWarehouse.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Tienda vinculada
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {store?.name ?? "Tienda no resuelta"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{warehouse.storeId}</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Identificacion
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {warehouse.code || "Sin codigo interno"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Usa codigos cortos para picking, recepcion y reportes.
                          </p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Actualizacion
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {formatDate(warehouse.updatedAt ?? warehouse.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ultimo movimiento registrado del almacen.
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
              <CardDescription>Lectura rapida del maestro de almacenes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Cobertura de codigos</p>
                  <span className="text-sm font-semibold text-foreground">
                    {warehouses.length > 0 ? Math.round((warehousesWithCode / warehouses.length) * 100) : 0}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {warehousesWithCode} de {warehouses.length} almacenes tienen codigo interno.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Tiendas con almacen</p>
                  <span className="text-sm font-semibold text-foreground">{linkedStores}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se calcula por `storeId` unico dentro del tenant actual.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Resultado de busqueda</p>
                  <span className="text-sm font-semibold text-foreground">{filteredWarehouses.length}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Busca por almacen, codigo, nombre de tienda o `storeId`.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ultimos almacenes</CardTitle>
              <CardDescription>Actividad reciente dentro del tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentWarehouses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen almacenes registrados.
                </div>
              ) : (
                recentWarehouses.map((warehouse) => {
                  const store = storesById.get(String(warehouse.storeId))

                  return (
                    <div
                      key={`recent-${String(warehouse.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{warehouse.name}</p>
                        <span className="text-xs text-muted-foreground">{warehouse.code || "Sin codigo"}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{store?.name ?? warehouse.storeId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(warehouse.updatedAt ?? warehouse.createdAt)}
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
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingWarehouse ? "Editar almacen" : "Nuevo almacen"}</SheetTitle>
            <SheetDescription>
              {editingWarehouse
                ? "Actualiza tienda, nombre y codigo del almacen seleccionado."
                : "Registra un nuevo almacen dentro del tenant actual."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="warehouse-store" className="text-sm font-medium text-foreground">
                Tienda
              </label>
              <select
                id="warehouse-store"
                value={formValues.storeId}
                onChange={(event) => handleFieldChange("storeId", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                aria-invalid={Boolean(formErrors.storeId)}
              >
                <option value="">Selecciona una tienda</option>
                {stores.map((store) => (
                  <option key={String(store.id)} value={String(store.id)}>
                    {store.name} {store.code ? `(${store.code})` : ""}
                  </option>
                ))}
              </select>
              {formErrors.storeId ? (
                <p className="text-xs text-destructive">{formErrors.storeId}</p>
              ) : storesQuery.isError ? (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(storesQuery.error, "No se pudieron cargar las tiendas.")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Selecciona la tienda a la que pertenece este almacen.
                </p>
              )}
            </div>

            <Field label="Nombre" htmlFor="warehouse-name" error={formErrors.name}>
              <Input
                id="warehouse-name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Ej. Almacen Central"
                maxLength={120}
                aria-invalid={Boolean(formErrors.name)}
              />
            </Field>

            <Field
              label="Codigo"
              htmlFor="warehouse-code"
              error={formErrors.code}
              hint="Opcional. Recomendado para inventario, picking y reportes."
            >
              <Input
                id="warehouse-code"
                value={formValues.code}
                onChange={(event) => handleFieldChange("code", event.target.value)}
                placeholder="Ej. ALM-CEN"
                maxLength={40}
                aria-invalid={Boolean(formErrors.code)}
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
                {isSubmitting ? "Guardando..." : editingWarehouse ? "Guardar cambios" : "Crear almacen"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
