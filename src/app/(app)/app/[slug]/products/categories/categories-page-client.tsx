"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  FolderGit2,
  FolderTree,
  Layers3,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Shapes,
} from "lucide-react"

import {
  getApiErrorMessage,
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
} from "@/lib/api/categories"
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/api/categories"
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

type CategoriesPageClientProps = {
  slug: string
}

type CategoryFormValues = {
  name: string
  parentId: string
}

type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>

const defaultFormValues: CategoryFormValues = {
  name: "",
  parentId: "",
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

function validateCategory(values: CategoryFormValues) {
  const errors: CategoryFormErrors = {}
  const name = values.name.trim()
  const parentId = values.parentId.trim()

  if (name.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres."
  }

  if (parentId.length > 0 && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parentId)) {
    errors.parentId = "El parentId debe ser un UUID v4 valido."
  }

  return errors
}

function toCreatePayload(values: CategoryFormValues): CreateCategoryInput {
  return {
    name: values.name.trim(),
    parentId: normalizeOptional(values.parentId) ?? null,
  }
}

function toUpdatePayload(values: CategoryFormValues): UpdateCategoryInput {
  return {
    name: values.name.trim(),
    parentId: normalizeOptional(values.parentId) ?? null,
  }
}

function findParentName(category: Category, categories: Category[]) {
  if (!category.parentId) return "Categoria raiz"
  const parent = categories.find((item) => String(item.id) === String(category.parentId))
  return parent?.name ?? "Sin referencia"
}

export function CategoriesPageClient({ slug }: CategoriesPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [formValues, setFormValues] = useState<CategoryFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const categoriesQuery = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const categoryDetailQuery = useCategory(editingId, { enabled: sheetOpen && Boolean(editingId) })

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const normalizedSearch = search.trim().toLowerCase()

  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categories
    return categories.filter((category) => {
      const parentName = findParentName(category, categories)
      return [category.name, category.parentId, parentName].some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedSearch)
      )
    })
  }, [categories, normalizedSearch])

  const rootCategories = categories.filter((category) => !category.parentId).length
  const childCategories = categories.length - rootCategories
  const recentCategories = useMemo(
    () =>
      [...categories]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [categories]
  )

  function resetForm() {
    setEditingId(null)
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

  function openEditSheet(category: Category) {
    setEditingId(category.id)
    setFormValues({
      name: String(category.name ?? ""),
      parentId: String(category.parentId ?? ""),
    })
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange<K extends keyof CategoryFormValues>(
    field: K,
    value: CategoryFormValues[K]
  ) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateCategory(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingId) {
        await updateCategory.mutateAsync({
          id: editingId,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createCategory.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar la categoria."))
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de categorias
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Jerarquia comercial de productos
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Organiza el catalogo de <span className="font-semibold text-foreground">{slug}</span> en
                categorias raiz y subcategorias para mantener inventario, filtros y reportes limpios.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void categoriesQuery.refetch()}
              disabled={categoriesQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nueva categoria
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Shapes className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
          label="Categorias totales"
          value={String(categories.length)}
          hint={`${filteredCategories.length} visibles con el filtro actual`}
        />
        <MetricCard
          icon={<FolderGit2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          label="Categorias raiz"
          value={String(rootCategories)}
          hint="Nodos principales del arbol"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          icon={<FolderTree className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
          label="Subcategorias"
          value={String(childCategories)}
          hint="Categorias con parentId asignado"
        />
        <MetricCard
          icon={<Layers3 className="h-5 w-5 text-violet-700 dark:text-violet-300" />}
          iconClass="bg-violet-100 dark:bg-violet-950/30"
          label="Cobertura jerarquica"
          value={`${categories.length > 0 ? Math.round((childCategories / categories.length) * 100) : 0}%`}
          hint="Peso de categorias hijas"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de categorias</CardTitle>
                <CardDescription>
                  Gestion centralizada de categorias y relaciones padre-hija.
                </CardDescription>
              </div>
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o categoria padre"
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

            {categoriesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : categoriesQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(categoriesQuery.error, "No se pudo cargar la lista de categorias.")}
              </div>
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                title="No hay categorias para mostrar"
                description={
                  categories.length === 0
                    ? "Crea la primera categoria para comenzar a estructurar tu catalogo."
                    : "Ajusta la busqueda para encontrar una categoria existente."
                }
                onCreate={categories.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Categoria</th>
                      <th className="px-2 py-3 font-medium">Jerarquia</th>
                      <th className="px-2 py-3 font-medium">Parent ID</th>
                      <th className="px-2 py-3 font-medium">Actualizacion</th>
                      <th className="px-2 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => {
                      const parentName = findParentName(category, categories)
                      const isRoot = !category.parentId

                      return (
                        <tr key={String(category.id)} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {getInitials(category.name)}
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{category.name}</p>
                                <p className="text-xs text-muted-foreground">ID {String(category.id)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                                isRoot
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                              }`}
                            >
                              {isRoot ? "Raiz" : `Hija de ${parentName}`}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-muted-foreground">
                            {category.parentId || "Sin parentId"}
                          </td>
                          <td className="px-2 py-4 text-muted-foreground">
                            {formatDate(category.updatedAt ?? category.createdAt)}
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openEditSheet(category)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SummaryCard
            title="Categorias raiz"
            value={String(rootCategories)}
            description="Categorias principales listas para estructurar familias de producto."
          />
          <SummaryCard
            title="Subcategorias"
            value={String(childCategories)}
            description="Nodos dependientes de una categoria padre."
          />
          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimas categorias creadas o actualizadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen categorias registradas.
                </div>
              ) : (
                recentCategories.map((category) => (
                  <div
                    key={`recent-${String(category.id)}`}
                    className="rounded-lg border border-border/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{category.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {category.parentId ? "Subcategoria" : "Raiz"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(category.updatedAt ?? category.createdAt)}
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
            <SheetTitle>{editingId ? "Editar categoria" : "Nueva categoria"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Actualiza nombre y parentId de la categoria seleccionada."
                : "Crea una categoria raiz o asignala como subcategoria de otra existente."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <Field label="Nombre" htmlFor="category-name" error={formErrors.name}>
              <Input
                id="category-name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Ej. Bebidas frias"
                maxLength={120}
                aria-invalid={Boolean(formErrors.name)}
              />
            </Field>

            <div className="space-y-2">
              <label htmlFor="category-parent" className="text-sm font-medium text-foreground">
                Categoria padre
              </label>
              <select
                id="category-parent"
                value={formValues.parentId}
                onChange={(event) => handleFieldChange("parentId", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
              >
                <option value="">Sin padre (categoria raiz)</option>
                {categories
                  .filter((category) => String(category.id) !== String(editingId ?? ""))
                  .map((category) => (
                    <option key={String(category.id)} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {formErrors.parentId ? (
                <p className="text-xs text-destructive">{formErrors.parentId}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  El backend espera un UUID v4 cuando se asigna una categoria padre.
                </p>
              )}
            </div>

            {editingId && categoryDetailQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            ) : null}

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
              <Button type="submit" disabled={isSubmitting || categoryDetailQuery.isLoading}>
                {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear categoria"}
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
      <Shapes className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primera categoria
        </Button>
      ) : null}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
