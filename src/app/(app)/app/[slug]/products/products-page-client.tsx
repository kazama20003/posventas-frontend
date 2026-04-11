"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GripVertical,
  ImagePlus,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"

import { useCategories } from "@/lib/api/categories"
import {
  getApiErrorMessage,
  useDeleteProduct,
  useProducts,
} from "@/lib/api/products"
import type { Product } from "@/lib/api/products"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type CategoryLike = {
  id: string | number
  name?: string
  parentId?: string | null
}

type ProductTableRow = {
  id: string
  product: Product
  categoryLabel: string
  categoryHelper: string
  categoryPath: string
  primaryImageUrl: string | null
  hasVariants: boolean
}

function readRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

function formatMoney(value?: number | null) {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  if (!Number.isFinite(amount)) return "S/ 0.00"

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatTaxRate(value?: number | null) {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  if (!Number.isFinite(amount)) return "0%"
  return `${amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}%`
}

function formatProductType(value?: string | null) {
  if (value === "SERVICE") return "Servicio"
  return "Fisico"
}

function formatCoverage(value: number, total: number) {
  if (total <= 0) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

function getProductMetricTone(value: number, total: number) {
  const ratio = total > 0 ? value / total : 0
  if (ratio >= 0.65) return "positive" as const
  if (ratio >= 0.35) return "neutral" as const
  return "negative" as const
}

function getProductStockMeta(product: Product) {
  if (product.trackStock === false) {
    return {
      label: "Sin control",
      helper: "No controla inventario",
    }
  }

  if (typeof product.minStock === "number") {
    return {
      label: `Min ${product.minStock}`,
      helper: "Control de stock activo",
    }
  }

  return {
    label: "Control activo",
    helper: "Sin stock minimo",
  }
}

function getCategoryPath(
  categoryId: string | number | null | undefined,
  categories: CategoryLike[]
) {
  if (!categoryId) return "Sin categoria"

  const path: string[] = []
  let currentId: string | number | null | undefined = categoryId
  const visited = new Set<string>()

  while (currentId) {
    const lookupId: string = String(currentId)
    if (visited.has(lookupId)) break
    visited.add(lookupId)

    const category = categories.find((item) => String(item.id) === lookupId)
    if (!category) break

    path.unshift(category.name ?? lookupId)
    currentId = category.parentId ?? null
  }

  return path.length > 0 ? path.join(" / ") : "Sin categoria"
}

function getCategoryDisplayMeta(
  categoryId: string | number | null | undefined,
  categories: CategoryLike[]
) {
  if (!categoryId) {
    return {
      label: "Sin categoria",
      helper: "Producto sin clasificacion",
      isRoot: false,
    }
  }

  const category = categories.find((item) => String(item.id) === String(categoryId))
  if (!category) {
    return {
      label: "Sin categoria",
      helper: "Categoria no encontrada",
      isRoot: false,
    }
  }

  if (!category.parentId) {
    return {
      label: category.name ?? String(category.id),
      helper: "Categoria principal",
      isRoot: true,
    }
  }

  return {
    label: category.name ?? String(category.id),
    helper: `Subcategoria de ${getCategoryPath(category.parentId, categories)}`,
    isRoot: false,
  }
}

function getProductCategoryDisplayMeta(product: Product, categories: CategoryLike[]) {
  if (product.categoryId) {
    return getCategoryDisplayMeta(product.categoryId, categories)
  }

  if (product.category?.id) {
    return getCategoryDisplayMeta(product.category.id, categories)
  }

  return {
    label: "Sin categoria",
    helper: "Producto sin clasificacion",
    isRoot: false,
  }
}

function getPrimaryImageUrl(images?: { url?: string | null }[] | null) {
  const firstImage = images?.find((image) => String(image.url ?? "").trim().length > 0)
  return firstImage?.url ?? null
}

export function ProductsPageClient() {
  const params = useParams()
  const slug = readRouteParam(params?.slug)
  const productsHref = slug ? `/app/${slug}/products` : "/app"
  const createHref = `${productsHref}/new`

  const [search, setSearch] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const productsQuery = useProducts()
  const categoriesQuery = useCategories()
  const deleteProduct = useDeleteProduct()

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return products

    return products.filter((product) => {
      const categoryMeta = getProductCategoryDisplayMeta(product, categories)

      return [
        product.name,
        product.description,
        product.brand,
        product.productType,
        categoryMeta.label,
        categoryMeta.helper,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [categories, products, search])

  const productTableRows = useMemo<ProductTableRow[]>(
    () =>
      filteredProducts.map((product) => {
        const categoryMeta = getProductCategoryDisplayMeta(product, categories)

        return {
          id: String(product.id),
          product,
          categoryLabel: categoryMeta.label,
          categoryHelper: categoryMeta.helper,
          categoryPath: getCategoryPath(
            product.categoryId ?? product.category?.id,
            categories
          ),
          primaryImageUrl: getPrimaryImageUrl(product.images),
          hasVariants: (product.variants?.length ?? 0) > 0,
        }
      }),
    [categories, filteredProducts]
  )

  const activeProducts = products.filter((product) => product.isActive !== false).length
  const productsWithImages = products.filter((product) => (product.images?.length ?? 0) > 0).length
  const visibleInPosProducts = products.filter(
    (product) => product.visibleInPos !== false
  ).length
  const averageSalePrice =
    products.length > 0
      ? products.reduce((total, product) => total + Number(product.salePrice ?? 0), 0) /
        products.length
      : 0

  async function handleDelete(product: Product) {
    if (!window.confirm(`Eliminar el producto "${product.name}"?`)) return

    setActionError(null)

    try {
      await deleteProduct.mutateAsync(product.id)
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          "No se pudo eliminar el producto. Puede tener variantes activas asociadas."
        )
      )
    }
  }

  return (
    <main className="min-w-0 w-full space-y-5 bg-background p-2 sm:p-3 lg:p-4">
      <header className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-1 size-9 shrink-0 rounded-md border border-border bg-background text-muted-foreground shadow-none" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Gestion comercial
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Productos
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Vista general del catalogo con acciones directas para crear y editar.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar productos"
                className="h-9 rounded-md border-border bg-background pl-9 shadow-none"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                className="h-9 w-full px-3 sm:w-auto"
                onClick={() => void productsQuery.refetch()}
                disabled={productsQuery.isFetching}
              >
                <RefreshCcw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button asChild className="h-9 w-full px-3 sm:w-auto">
                <Link href={createHref}>
                  <Plus className="h-4 w-4" />
                  Nuevo producto
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Productos activos"
          value={String(activeProducts)}
          hint="Disponibles para operar"
          badge={formatCoverage(activeProducts, products.length)}
          tone={getProductMetricTone(activeProducts, products.length)}
          icon={<Package className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          label="Precio promedio"
          value={formatMoney(averageSalePrice)}
          hint="Promedio simple del catalogo"
          badge={`${products.length} items`}
          tone="positive"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          label="Con imagenes"
          value={String(productsWithImages)}
          hint="Cobertura visual del catalogo"
          badge={formatCoverage(productsWithImages, products.length)}
          tone={getProductMetricTone(productsWithImages, products.length)}
          icon={<ImagePlus className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          label="Visible en POS"
          value={String(visibleInPosProducts)}
          hint={`${categories.length} categorias disponibles`}
          badge={formatCoverage(visibleInPosProducts, products.length)}
          tone={getProductMetricTone(visibleInPosProducts, products.length)}
          icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
        />
      </section>

      <section className="min-w-0">
        <Card className="min-w-0 overflow-hidden border-0 bg-transparent shadow-none">
          <CardContent className="min-w-0 p-3 sm:p-4">
            {actionError ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            {productsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : productsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(
                  productsQuery.error,
                  "No se pudo cargar la lista de productos."
                )}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="No hay productos para mostrar"
                description={
                  products.length === 0
                    ? "Crea el primer producto para comenzar a poblar el catalogo."
                    : "Ajusta la busqueda para encontrar un producto existente."
                }
                createHref={products.length === 0 ? createHref : undefined}
              />
            ) : (
              <ProductsDataTable
                rows={productTableRows}
                productsHref={productsHref}
                createHref={createHref}
                activeProducts={activeProducts}
                categorizedProducts={rowsWithCategories(productTableRows)}
                onDelete={handleDelete}
                isDeleting={deleteProduct.isPending}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function rowsWithCategories(rows: ProductTableRow[]) {
  return rows.filter((row) => row.categoryLabel !== "Sin categoria").length
}

function MetricCard({
  label,
  value,
  hint,
  badge,
  tone,
  icon,
}: {
  label: string
  value: string
  hint: string
  badge: string
  tone: "positive" | "neutral" | "negative"
  icon: ReactNode
}) {
  const toneClassMap = {
    positive: "border-border bg-muted text-foreground",
    neutral: "border-border bg-muted text-muted-foreground",
    negative: "border-border bg-muted text-foreground",
  } as const

  return (
    <Card className="rounded-md py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
              <span
                className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium ${toneClassMap[tone]}`}
              >
                {badge}
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-sm border border-border bg-muted/30 p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductsDataTable({
  rows,
  productsHref,
  createHref,
  activeProducts,
  categorizedProducts,
  onDelete,
  isDeleting,
}: {
  rows: ProductTableRow[]
  productsHref: string
  createHref: string
  activeProducts: number
  categorizedProducts: number
  onDelete: (product: Product) => Promise<void>
  isDeleting: boolean
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<ColumnDef<ProductTableRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Seleccionar todos los productos visibles"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={`Seleccionar ${row.original.product.name}`}
          />
        ),
      },
      {
        accessorKey: "product",
        header: "Product Name",
        cell: ({ row }) => {
          const entry = row.original
          const product = entry.product

          return (
            <div className="flex min-w-[220px] items-center gap-3">
              <GripVertical className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 md:block" />
              <ProductImagePreview
                url={entry.primaryImageUrl}
                label={`Imagen principal de ${product.name}`}
                size="sm"
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {product.brand || entry.categoryLabel}
                </p>
                <p className="max-w-[18ch] truncate text-[11px] text-muted-foreground">
                  {product.description?.trim() || entry.categoryHelper}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: "price",
        header: "Rate",
        cell: ({ row }) => {
          const product = row.original.product

          return (
            <div className="min-w-[110px] space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {formatMoney(product.salePrice)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatProductType(product.productType)} | {formatTaxRate(product.taxRate)}
              </p>
            </div>
          )
        },
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const stockMeta = getProductStockMeta(row.original.product)

          return (
            <div className="min-w-[120px] space-y-1">
              <p className="text-sm font-semibold text-foreground">{stockMeta.label}</p>
              <p className="text-[11px] text-muted-foreground">{stockMeta.helper}</p>
            </div>
          )
        },
      },
      {
        accessorKey: "categoryLabel",
        header: "Category",
        cell: ({ row }) => {
          const entry = row.original

          return (
            <div className="min-w-[150px] space-y-1">
              <span className="inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground">
                {entry.categoryLabel}
              </span>
              <p className="truncate text-[11px] text-muted-foreground">
                {entry.categoryPath}
              </p>
            </div>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const product = row.original.product

          return (
            <div className="min-w-[140px] space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge
                  active={product.isActive !== false}
                  activeLabel="Activo"
                  inactiveLabel="Inactivo"
                />
                <StatusBadge
                  active={product.visibleInPos !== false}
                  activeLabel="POS"
                  inactiveLabel="Oculto"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {row.original.hasVariants
                  ? `${product.variants?.length ?? 0} variantes`
                  : "Sin variantes"}
              </p>
            </div>
          )
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: () => <div className="text-right" />,
        cell: ({ row }) => {
          const product = row.original.product

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`${productsHref}/edit/${product.id}`}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void onDelete(product)}
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [isDeleting, onDelete, productsHref]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    state: {
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    enableRowSelection: true,
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  const responsiveColumnClassMap: Record<string, string> = {
    select: "w-10",
    product: "min-w-[240px]",
    price: "min-w-[110px]",
    stock: "hidden md:table-cell min-w-[110px]",
    categoryLabel: "hidden lg:table-cell min-w-[140px]",
    status: "hidden xl:table-cell min-w-[130px]",
    actions: "w-12 text-right",
  }

  return (
    <div className="min-w-0 space-y-4 rounded-md border border-border bg-card p-3 text-foreground shadow-none sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 p-1">
          <TableScopeChip label="Productos" count={rows.length} active />
          <TableScopeChip label="Con categoria" count={categorizedProducts} />
          <TableScopeChip label="Activos" count={activeProducts} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl"
            disabled
          >
            <SlidersHorizontal className="h-4 w-4" />
            Personalizar columnas
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-xl"
          >
            <Link href={createHref}>
              <Plus className="h-4 w-4" />
              Agregar producto
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value=""
            onChange={() => undefined}
            placeholder="Buscar en la tabla"
            className="h-10 rounded-xl border-border bg-background pl-9 shadow-none"
            readOnly
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground">
            {selectedCount} de {rows.length} fila(s) seleccionadas
          </span>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-md border border-border bg-background">
        <Table className="min-w-[560px] md:min-w-[760px] xl:min-w-[980px]">
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${responsiveColumnClassMap[header.id] ?? ""} ${
                      header.id === "actions"
                        ? "text-right text-muted-foreground"
                        : "text-[11px] tracking-[0.08em] text-muted-foreground uppercase"
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={`border-border ${row.getIsSelected() ? "bg-muted/50" : "bg-transparent"} hover:bg-muted/30`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`${responsiveColumnClassMap[cell.column.id] ?? ""} py-4 align-middle text-foreground`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 px-1 text-sm text-muted-foreground xl:flex-row xl:items-center xl:justify-between">
        <p className="text-sm text-muted-foreground">{selectedCount} de {rows.length} fila(s) seleccionadas.</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
              className="h-8 min-w-[76px] rounded-xl border border-border bg-background px-2 text-sm text-foreground outline-none"
            >
              {[5, 10, 25].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(Math.max(totalPages - 1, 0))}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TableScopeChip({
  label,
  count,
  active = false,
}: {
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:bg-background hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
          active ? "bg-muted text-foreground" : "bg-muted/70 text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

function ProductImagePreview({
  url,
  label,
  size = "md",
}: {
  url?: string | null
  label: string
  size?: "sm" | "md" | "editor"
}) {
  const sizeClassMap = {
    sm: "h-11 w-11 rounded-xl",
    md: "h-18 w-18 rounded-2xl",
    editor: "h-32 w-full rounded-2xl",
  } as const

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border bg-muted/30 text-muted-foreground ${sizeClassMap[size]}`}
      >
        <div className="text-center">
          <ImagePlus className="mx-auto h-5 w-5" />
          <span className="mt-2 block text-[11px] font-medium">Sin imagen</span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`border border-border bg-muted/20 bg-cover bg-center ${sizeClassMap[size]}`}
      style={{ backgroundImage: `url("${url}")` }}
    />
  )
}

function EmptyState({
  title,
  description,
  createHref,
}: {
  title: string
  description: string
  createHref?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {createHref ? (
        <Button asChild className="mt-4 gap-2">
          <Link href={createHref}>
            <Plus className="h-4 w-4" />
            Crear primer producto
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
