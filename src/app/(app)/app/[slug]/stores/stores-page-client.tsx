"use client"

import { useMemo, useState, type FormEvent } from "react"
import {
  Building2,
  Hash,
  MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store as StoreIcon,
  Trash2,
} from "lucide-react"

import { getApiErrorMessage, useCreateStore, useDeleteStore, useStores, useUpdateStore } from "@/lib/api/stores"
import type { CreateStoreInput, Store, UpdateStoreInput } from "@/lib/api/stores"
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

type StoresPageClientProps = {
  slug: string
}

type StoreFormValues = {
  name: string
  code: string
  address: string
}

type StoreFormErrors = Partial<Record<keyof StoreFormValues, string>>

const defaultFormValues: StoreFormValues = {
  name: "",
  code: "",
  address: "",
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha"
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function normalizeOptionalValue(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function validateStore(values: StoreFormValues) {
  const errors: StoreFormErrors = {}
  const normalizedName = values.name.trim()
  const normalizedCode = values.code.trim()
  const normalizedAddress = values.address.trim()

  if (normalizedName.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (normalizedName.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres."
  }

  if (normalizedCode.length > 40) {
    errors.code = "El codigo no puede superar 40 caracteres."
  }

  if (normalizedAddress.length > 255) {
    errors.address = "La direccion no puede superar 255 caracteres."
  }

  return errors
}

function toCreatePayload(values: StoreFormValues): CreateStoreInput {
  return {
    name: values.name.trim(),
    code: normalizeOptionalValue(values.code),
    address: normalizeOptionalValue(values.address),
  }
}

function toUpdatePayload(values: StoreFormValues): UpdateStoreInput {
  return {
    name: values.name.trim(),
    code: normalizeOptionalValue(values.code),
    address: normalizeOptionalValue(values.address),
  }
}

export function StoresPageClient({ slug }: StoresPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formValues, setFormValues] = useState<StoreFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<StoreFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const storesQuery = useStores()
  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const deleteStore = useDeleteStore()

  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data])
  const normalizedSearch = search.trim().toLowerCase()

  const filteredStores = useMemo(() => {
    if (!normalizedSearch) {
      return stores
    }

    return stores.filter((store) => {
      const searchableValues = [store.name, store.code, store.address]
      return searchableValues.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
    })
  }, [normalizedSearch, stores])

  const storesWithCode = stores.filter((store) => Boolean(String(store.code ?? "").trim())).length
  const storesWithAddress = stores.filter((store) => Boolean(String(store.address ?? "").trim())).length
  const coverage =
    stores.length > 0 ? Math.round((storesWithAddress / stores.length) * 100) : 0
  const lastUpdatedStore = useMemo(() => {
    return [...stores]
      .filter((store) => Boolean(store.updatedAt || store.createdAt))
      .sort((left, right) => {
        const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime()
        return rightTime - leftTime
      })[0]
  }, [stores])
  const recentStores = useMemo(() => {
    return [...stores]
      .sort((left, right) => {
        const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime()
        return rightTime - leftTime
      })
      .slice(0, 3)
  }, [stores])

  const isSubmitting = createStore.isPending || updateStore.isPending

  function resetFormState() {
    setEditingStore(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)

    if (!nextOpen) {
      resetFormState()
    }
  }

  function openCreateSheet() {
    resetFormState()
    setSheetOpen(true)
  }

  function openEditSheet(store: Store) {
    setEditingStore(store)
    setFormValues({
      name: String(store.name ?? ""),
      code: String(store.code ?? ""),
      address: String(store.address ?? ""),
    })
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange(field: keyof StoreFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateStore(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setActionError(null)

    try {
      if (editingStore) {
        await updateStore.mutateAsync({
          id: editingStore.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createStore.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar la tienda."))
    }
  }

  async function handleDelete(store: Store) {
    const confirmed = window.confirm(`Eliminar la tienda "${store.name}"?`)

    if (!confirmed) {
      return
    }

    setActionError(null)

    try {
      await deleteStore.mutateAsync(store.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar la tienda."))
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
                Modulo de tiendas
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sedes y puntos de venta
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Administra la red operativa de <span className="font-semibold text-foreground">{slug}</span>,
                controla codigos internos y mantiene direcciones listas para despacho,
                caja y reportes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void storesQuery.refetch()}
              disabled={storesQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nueva tienda
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
                  Tiendas registradas
                </p>
                <p className="text-3xl font-bold text-foreground">{stores.length}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {filteredStores.length} visibles con el filtro actual
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <StoreIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Con codigo
                </p>
                <p className="text-3xl font-bold text-foreground">{storesWithCode}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {stores.length > 0 ? Math.round((storesWithCode / stores.length) * 100) : 0}% de cobertura
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950/30">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Con direccion
                </p>
                <p className="text-3xl font-bold text-foreground">{storesWithAddress}</p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {coverage}% listas para operacion
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950/30">
                <MapPin className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ultima actualizacion
                </p>
                <p className="text-lg font-bold text-foreground">
                  {lastUpdatedStore ? formatDate(lastUpdatedStore.updatedAt ?? lastUpdatedStore.createdAt) : "Sin datos"}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {lastUpdatedStore ? lastUpdatedStore.name : "Aun no hay actividad"}
                </p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-950/30">
                <ShieldCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />
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
                <CardTitle>Catalogo de tiendas</CardTitle>
                <CardDescription>
                  Alta, edicion y control de sedes conectadas al tenant actual.
                </CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, codigo o direccion"
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

            {storesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : storesQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(storesQuery.error, "No se pudo cargar la lista de tiendas.")}
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No hay tiendas para mostrar</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stores.length === 0
                    ? "Crea la primera sede para comenzar a operar con este tenant."
                    : "Ajusta la busqueda para encontrar una tienda existente."}
                </p>
                {stores.length === 0 ? (
                  <Button className="mt-4 gap-2" onClick={openCreateSheet}>
                    <Plus className="h-4 w-4" />
                    Crear primera tienda
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Tienda</th>
                      <th className="px-2 py-3 font-medium">Codigo</th>
                      <th className="px-2 py-3 font-medium">Direccion</th>
                      <th className="px-2 py-3 font-medium">Actualizacion</th>
                      <th className="px-2 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr key={String(store.id)} className="border-b border-border/50 last:border-0">
                        <td className="px-2 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {getInitials(store.name)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{store.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID {String(store.id)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          {store.code ? (
                            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                              {store.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sin codigo</span>
                          )}
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {store.address || "Sin direccion registrada"}
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {formatDate(store.updatedAt ?? store.createdAt)}
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditSheet(store)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => void handleDelete(store)}
                              disabled={deleteStore.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen operativo</CardTitle>
              <CardDescription>Indicadores rapidos de calidad del catalogo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Cobertura de direccion</p>
                  <span className="text-sm font-semibold text-foreground">{coverage}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {storesWithAddress} de {stores.length} sedes tienen direccion utilizable.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Tiendas sin codigo</p>
                  <span className="text-sm font-semibold text-foreground">
                    {stores.length - storesWithCode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conviene completar este dato para reportes y conciliacion.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Resultado de busqueda</p>
                  <span className="text-sm font-semibold text-foreground">{filteredStores.length}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se actualiza en tiempo real con nombre, codigo o direccion.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones sugeridas</CardTitle>
              <CardDescription>Prioriza orden y calidad del maestro de tiendas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Alta controlada
                </p>
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  Usa codigo unico por tienda para integracion con caja y reportes.
                </p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/70 p-3 dark:border-yellow-900 dark:bg-yellow-950/20">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  Direcciones pendientes
                </p>
                <p className="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80">
                  Completa direccion en sedes sin ubicacion antes de activar despacho.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Revision periodica
                </p>
                <p className="mt-1 text-xs text-slate-700/80 dark:text-slate-300/80">
                  Depura tiendas obsoletas para mantener analitica limpia.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ultimas tiendas</CardTitle>
              <CardDescription>Actividad reciente dentro del tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stores.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen tiendas registradas.
                </div>
              ) : (
                recentStores.map((store) => (
                    <div
                      key={`recent-${String(store.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{store.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {store.code || "Sin codigo"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(store.updatedAt ?? store.createdAt)}
                      </p>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingStore ? "Editar tienda" : "Nueva tienda"}</SheetTitle>
            <SheetDescription>
              {editingStore
                ? "Actualiza nombre, codigo y direccion de la sede seleccionada."
                : "Registra una nueva sede dentro del tenant actual."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="store-name" className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <Input
                id="store-name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Ej. Sede Miraflores"
                maxLength={120}
                aria-invalid={Boolean(formErrors.name)}
              />
              {formErrors.name ? (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="store-code" className="text-sm font-medium text-foreground">
                Codigo
              </label>
              <Input
                id="store-code"
                value={formValues.code}
                onChange={(event) => handleFieldChange("code", event.target.value)}
                placeholder="Ej. LIMA-001"
                maxLength={40}
                aria-invalid={Boolean(formErrors.code)}
              />
              {formErrors.code ? (
                <p className="text-xs text-destructive">{formErrors.code}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Opcional. Recomendado para conciliacion y reportes internos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="store-address" className="text-sm font-medium text-foreground">
                Direccion
              </label>
              <Input
                id="store-address"
                value={formValues.address}
                onChange={(event) => handleFieldChange("address", event.target.value)}
                placeholder="Ej. Av. Larco 123, Miraflores"
                maxLength={255}
                aria-invalid={Boolean(formErrors.address)}
              />
              {formErrors.address ? (
                <p className="text-xs text-destructive">{formErrors.address}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Opcional. Util para despacho, facturacion y operacion en campo.
                </p>
              )}
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
                {isSubmitting ? "Guardando..." : editingStore ? "Guardar cambios" : "Crear tienda"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
