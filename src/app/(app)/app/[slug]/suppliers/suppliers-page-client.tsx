"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BadgeCheck,
  ContactRound,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
  Users2,
} from "lucide-react"

import {
  getApiErrorMessage,
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/lib/api/suppliers"
import type {
  CreateSupplierInput,
  Supplier,
  UpdateSupplierInput,
} from "@/lib/api/suppliers"
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

type SuppliersPageClientProps = {
  slug: string
}

type SupplierFormValues = {
  name: string
  contact: string
}

type SupplierFormErrors = Partial<Record<keyof SupplierFormValues, string>>

const defaultFormValues: SupplierFormValues = {
  name: "",
  contact: "",
}

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function validateSupplier(values: SupplierFormValues) {
  const errors: SupplierFormErrors = {}
  const name = values.name.trim()
  const contact = values.contact.trim()

  if (name.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres."
  }

  if (contact.length > 255) {
    errors.contact = "El contacto no puede superar 255 caracteres."
  }

  return errors
}

function toCreatePayload(values: SupplierFormValues): CreateSupplierInput {
  return {
    name: values.name.trim(),
    contact: normalizeOptional(values.contact),
  }
}

function toUpdatePayload(values: SupplierFormValues): UpdateSupplierInput {
  return {
    name: values.name.trim(),
    contact: normalizeOptional(values.contact),
  }
}

export function SuppliersPageClient({ slug }: SuppliersPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formValues, setFormValues] = useState<SupplierFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<SupplierFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const suppliersQuery = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const suppliers = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data])
  const filteredSuppliers = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return suppliers
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.contact].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized)
      )
    )
  }, [search, suppliers])

  const suppliersWithContact = suppliers.filter((supplier) => Boolean(String(supplier.contact ?? "").trim())).length
  const recentSuppliers = useMemo(
    () =>
      [...suppliers]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [suppliers]
  )

  function resetForm() {
    setEditingSupplier(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  function openCreateSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function openEditSheet(supplier: Supplier) {
    setEditingSupplier(supplier)
    setFormValues({
      name: String(supplier.name ?? ""),
      contact: String(supplier.contact ?? ""),
    })
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange<K extends keyof SupplierFormValues>(
    field: K,
    value: SupplierFormValues[K]
  ) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateSupplier(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createSupplier.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el proveedor."))
    }
  }

  async function handleDelete(supplier: Supplier) {
    if (!window.confirm(`Eliminar el proveedor "${supplier.name}"?`)) return

    try {
      await deleteSupplier.mutateAsync(supplier.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar el proveedor."))
    }
  }

  const isSubmitting = createSupplier.isPending || updateSupplier.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de proveedores
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Proveedores y contactos comerciales
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Administra la red de abastecimiento de <span className="font-semibold text-foreground">{slug}</span>, centraliza contactos y mantiene limpio el maestro de compras.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void suppliersQuery.refetch()}
              disabled={suppliersQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Truck className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
          label="Proveedores registrados"
          value={String(suppliers.length)}
          hint={`${filteredSuppliers.length} visibles con el filtro actual`}
        />
        <MetricCard
          icon={<ContactRound className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          label="Con contacto"
          value={String(suppliersWithContact)}
          hint={`${suppliers.length > 0 ? Math.round((suppliersWithContact / suppliers.length) * 100) : 0}% del padron`}
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          icon={<Users2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
          label="Sin contacto"
          value={String(suppliers.length - suppliersWithContact)}
          hint="Registros por completar"
        />
        <MetricCard
          icon={<BadgeCheck className="h-5 w-5 text-violet-700 dark:text-violet-300" />}
          iconClass="bg-violet-100 dark:bg-violet-950/30"
          label="Cobertura de contacto"
          value={`${suppliers.length > 0 ? Math.round((suppliersWithContact / suppliers.length) * 100) : 0}%`}
          hint="Calidad del directorio comercial"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de proveedores</CardTitle>
                <CardDescription>
                  Alta, edicion y seguimiento de contactos para abastecimiento.
                </CardDescription>
              </div>
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o contacto"
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

            {suppliersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : suppliersQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(suppliersQuery.error, "No se pudo cargar la lista de proveedores.")}
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <EmptyState
                title="No hay proveedores para mostrar"
                description={
                  suppliers.length === 0
                    ? "Crea el primer proveedor para comenzar a registrar compras."
                    : "Ajusta la busqueda para encontrar un proveedor existente."
                }
                onCreate={suppliers.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Proveedor</th>
                      <th className="px-2 py-3 font-medium">Contacto</th>
                      <th className="px-2 py-3 font-medium">Actualizacion</th>
                      <th className="px-2 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={String(supplier.id)} className="border-b border-border/50 last:border-0">
                        <td className="px-2 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {getInitials(supplier.name)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground">ID {String(supplier.id)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {supplier.contact ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {supplier.contact}
                            </span>
                          ) : (
                            "Sin contacto registrado"
                          )}
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {formatDate(supplier.updatedAt ?? supplier.createdAt)}
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditSheet(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => void handleDelete(supplier)}
                              disabled={deleteSupplier.isPending}
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
          <SummaryCard
            title="Con contacto"
            value={String(suppliersWithContact)}
            description="Proveedores listos para contacto rapido en compras."
          />
          <SummaryCard
            title="Sin contacto"
            value={String(suppliers.length - suppliersWithContact)}
            description="Registros pendientes de completar por el equipo."
          />
          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimos proveedores creados o actualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSuppliers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen proveedores registrados.
                </div>
              ) : (
                recentSuppliers.map((supplier) => (
                  <div
                    key={`recent-${String(supplier.id)}`}
                    className="rounded-lg border border-border/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{supplier.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {supplier.contact ? "Con contacto" : "Sin contacto"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(supplier.updatedAt ?? supplier.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}</SheetTitle>
            <SheetDescription>
              {editingSupplier
                ? "Actualiza nombre y contacto del proveedor seleccionado."
                : "Registra un nuevo proveedor dentro del tenant actual."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <Field label="Nombre" htmlFor="supplier-name" error={formErrors.name}>
              <Input
                id="supplier-name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Ej. Distribuidora Central"
                maxLength={120}
                aria-invalid={Boolean(formErrors.name)}
              />
            </Field>

            <Field
              label="Contacto"
              htmlFor="supplier-contact"
              error={formErrors.contact}
              hint="Opcional. Puede incluir nombre, telefono o correo del contacto comercial."
            >
              <Input
                id="supplier-contact"
                value={formValues.contact}
                onChange={(event) => handleFieldChange("contact", event.target.value)}
                placeholder="Ej. Carlos - 999888777"
                maxLength={255}
                aria-invalid={Boolean(formErrors.contact)}
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
                {isSubmitting ? "Guardando..." : editingSupplier ? "Guardar cambios" : "Crear proveedor"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
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

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </div>
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
      <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer proveedor
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
