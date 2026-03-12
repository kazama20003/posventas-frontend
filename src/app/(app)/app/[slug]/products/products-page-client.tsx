"use client"

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import { DollarSign, ImagePlus, Package, Pencil, Plus, RefreshCcw, Search, ShieldCheck, Trash2 } from "lucide-react"

import {
  PRODUCT_TYPE_VALUES,
  UNIT_OF_MEASURE_VALUES,
  getApiErrorMessage,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/lib/api/products"
import type {
  CreateProductInput,
  Product,
  ProductImage,
  ProductVariant,
  ProductTypeValue,
  UnitOfMeasureValue,
  UpdateProductInput,
  VariantAttributeValue,
} from "@/lib/api/products"
import { useCategories } from "@/lib/api/categories"
import { useDeleteUploadImage, useUploadImage } from "@/lib/api/uploads"
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

type ProductsPageClientProps = {
  slug: string
}

type ProductImageFormValue = {
  key: string
  url: string
}

type ProductVariantFormValue = {
  id?: string
  sku: string
  barcode: string
  unitOfMeasure: string
  attributes: string
  cost: string
}

type ProductFormValues = {
  name: string
  description: string
  categoryId: string
  salePrice: string
  taxRate: string
  brand: string
  minStock: string
  productType: string
  isActive: boolean
  trackStock: boolean
  visibleInPos: boolean
  images: ProductImageFormValue[]
  variants: ProductVariantFormValue[]
}

type ProductFormErrors = {
  name?: string
  description?: string
  categoryId?: string
  salePrice?: string
  taxRate?: string
  brand?: string
  minStock?: string
  productType?: string
  images?: string
  imageErrors?: Array<{ key?: string; url?: string }>
  variants?: string
  variantErrors?: Array<{
    sku?: string
    barcode?: string
    unitOfMeasure?: string
    attributes?: string
    cost?: string
  }>
}

type CategoryLike = {
  id: string | number
  name?: string
  parentId?: string | null
}

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const decimalPattern = /^\d+(\.\d{1,2})?$/
const integerPattern = /^\d+$/
const PRODUCT_IMAGE_FOLDER = "products"

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  salePrice: "0",
  taxRate: "0",
  brand: "",
  minStock: "",
  productType: "PHYSICAL",
  isActive: true,
  trackStock: true,
  visibleInPos: true,
  images: [],
  variants: [],
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

    const category: CategoryLike | undefined = categories.find((item) => String(item.id) === lookupId)
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

  const parentPath = getCategoryPath(category.parentId, categories)

  return {
    label: category.name ?? String(category.id),
    helper: `Subcategoria de ${parentPath}`,
    isRoot: false,
  }
}

function getProductCategoryDisplayMeta(
  product: Product,
  categories: CategoryLike[]
) {
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

function normalizeImages(images: ProductImageFormValue[]): ProductImage[] | undefined {
  const normalized = images
    .map((image) => ({
      key: image.key.trim(),
      url: image.url.trim(),
    }))
    .filter((image) => image.key.length > 0 || image.url.length > 0)

  return normalized.length > 0 ? normalized : undefined
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isVariantAttributeValue(value: unknown): value is VariantAttributeValue {
  return value === null || ["string", "number", "boolean"].includes(typeof value)
}

function parseVariantAttributes(value: string) {
  const normalized = value.trim()
  if (!normalized) return undefined

  const parsed = JSON.parse(normalized)
  if (!isPlainRecord(parsed)) {
    throw new Error("Los atributos deben ser un objeto JSON.")
  }

  const invalidValue = Object.values(parsed).some((entry) => !isVariantAttributeValue(entry))
  if (invalidValue) {
    throw new Error("Los atributos solo admiten string, number, boolean o null.")
  }

  return parsed as Record<string, VariantAttributeValue>
}

function hasVariantContent(variant: ProductVariantFormValue) {
  return [
    variant.sku.trim(),
    variant.barcode.trim(),
    variant.unitOfMeasure.trim(),
    variant.attributes.trim(),
    variant.cost.trim(),
  ].some((value) => value.length > 0)
}

function normalizeVariants(variants: ProductVariantFormValue[]): ProductVariant[] | undefined {
  const normalized = variants
    .filter((variant) => hasVariantContent(variant))
    .map((variant) => ({
      id: normalizeOptional(variant.id ?? ""),
      sku: variant.sku.trim(),
      barcode: normalizeOptional(variant.barcode) ?? null,
      unitOfMeasure: normalizeOptional(variant.unitOfMeasure) as UnitOfMeasureValue | undefined,
      attributes: parseVariantAttributes(variant.attributes),
      cost: normalizeOptional(variant.cost) ? Number(variant.cost) : null,
    }))
    .map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      sku: variant.sku,
      barcode: variant.barcode,
      unitOfMeasure: variant.unitOfMeasure,
      attributes: variant.attributes,
      cost: variant.cost,
    }))

  return normalized.length > 0 ? normalized : undefined
}

function getPrimaryImageUrl(images?: ProductImage[] | null) {
  const firstImage = images?.find((image) => image.url.trim().length > 0)
  return firstImage?.url ?? null
}

function validateProduct(values: ProductFormValues) {
  const errors: ProductFormErrors = {}
  const name = values.name.trim()
  const description = values.description.trim()
  const categoryId = values.categoryId.trim()
  const salePrice = values.salePrice.trim()
  const taxRate = values.taxRate.trim()
  const brand = values.brand.trim()
  const minStock = values.minStock.trim()
  const imageErrors: Array<{ key?: string; url?: string }> = []
  const variantErrors: Array<{
    sku?: string
    barcode?: string
    unitOfMeasure?: string
    attributes?: string
    cost?: string
  }> = []
  const usedVariantSkus = new Map<string, number[]>()

  if (name.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (name.length > 160) {
    errors.name = "El nombre no puede superar 160 caracteres."
  }

  if (description.length > 1000) {
    errors.description = "La descripcion no puede superar 1000 caracteres."
  }

  if (categoryId.length > 0 && !uuidV4Pattern.test(categoryId)) {
    errors.categoryId = "La categoria debe ser un UUID v4 valido."
  }

  if (salePrice.length === 0) {
    errors.salePrice = "El precio de venta es obligatorio."
  } else if (!decimalPattern.test(salePrice)) {
    errors.salePrice = "Usa un monto valido con hasta 2 decimales."
  }

  if (taxRate.length === 0) {
    errors.taxRate = "La tasa de impuesto es obligatoria."
  } else if (!decimalPattern.test(taxRate)) {
    errors.taxRate = "Usa un porcentaje valido con hasta 2 decimales."
  }

  if (brand.length > 120) {
    errors.brand = "La marca no puede superar 120 caracteres."
  }

  if (minStock.length > 0 && !integerPattern.test(minStock)) {
    errors.minStock = "El stock minimo debe ser un entero mayor o igual a 0."
  }

  if (values.productType.length > 0 && !PRODUCT_TYPE_VALUES.includes(values.productType as ProductTypeValue)) {
    errors.productType = "Selecciona un tipo de producto valido."
  }

  if (values.images.length > 10) {
    errors.images = "Solo se permiten hasta 10 imagenes por producto."
  }

  if (values.variants.length > 100) {
    errors.variants = "Solo se permiten hasta 100 variantes por producto."
  }

  values.images.forEach((image, index) => {
    const key = image.key.trim()
    const url = image.url.trim()
    const entryError: { key?: string; url?: string } = {}

    if (key.length === 0 && url.length === 0) {
      imageErrors[index] = entryError
      return
    }

    if (key.length === 0) {
      entryError.key = "La key es obligatoria."
    } else if (key.length > 500) {
      entryError.key = "La key no puede superar 500 caracteres."
    }

    if (url.length === 0) {
      entryError.url = "La URL es obligatoria."
    } else if (url.length > 1000) {
      entryError.url = "La URL no puede superar 1000 caracteres."
    }

    imageErrors[index] = entryError
  })

  if (imageErrors.some((entry) => entry?.key || entry?.url)) {
    errors.images = errors.images ?? "Corrige las imagenes antes de guardar."
    errors.imageErrors = imageErrors
  }

  values.variants.forEach((variant, index) => {
    const sku = variant.sku.trim()
    const barcode = variant.barcode.trim()
    const unitOfMeasure = variant.unitOfMeasure.trim()
    const attributes = variant.attributes.trim()
    const cost = variant.cost.trim()
    const entryError: {
      sku?: string
      barcode?: string
      unitOfMeasure?: string
      attributes?: string
      cost?: string
    } = {}

    if (!hasVariantContent(variant)) {
      variantErrors[index] = entryError
      return
    }

    if (sku.length === 0) {
      entryError.sku = "El SKU es obligatorio."
    } else if (sku.length > 80) {
      entryError.sku = "El SKU no puede superar 80 caracteres."
    } else {
      const normalizedSku = sku.toLowerCase()
      usedVariantSkus.set(normalizedSku, [...(usedVariantSkus.get(normalizedSku) ?? []), index])
    }

    if (barcode.length > 120) {
      entryError.barcode = "El barcode no puede superar 120 caracteres."
    }

    if (unitOfMeasure.length > 0 && !UNIT_OF_MEASURE_VALUES.includes(unitOfMeasure as UnitOfMeasureValue)) {
      entryError.unitOfMeasure = "Selecciona una unidad valida."
    }

    if (attributes.length > 0) {
      try {
        parseVariantAttributes(attributes)
      } catch (error) {
        entryError.attributes =
          error instanceof Error ? error.message : "Los atributos deben ser un objeto JSON valido."
      }
    }

    if (cost.length > 0 && !decimalPattern.test(cost)) {
      entryError.cost = "El costo debe ser un monto valido con hasta 2 decimales."
    }

    variantErrors[index] = entryError
  })

  usedVariantSkus.forEach((indexes) => {
    if (indexes.length < 2) return
    indexes.forEach((index) => {
      variantErrors[index] = {
        ...variantErrors[index],
        sku: "Cada variante debe tener un SKU unico.",
      }
    })
  })

  if (variantErrors.some((entry) => entry?.sku || entry?.barcode || entry?.unitOfMeasure || entry?.attributes || entry?.cost)) {
    errors.variants = errors.variants ?? "Corrige las variantes antes de guardar."
    errors.variantErrors = variantErrors
  }

  return errors
}

function toCreatePayload(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name.trim(),
    description: normalizeOptional(values.description) ?? null,
    categoryId: normalizeOptional(values.categoryId) ?? null,
    images: normalizeImages(values.images),
    variants: normalizeVariants(values.variants),
    salePrice: Number(values.salePrice),
    isActive: values.isActive,
    brand: normalizeOptional(values.brand) ?? null,
    trackStock: values.trackStock,
    taxRate: Number(values.taxRate),
    minStock: normalizeOptional(values.minStock) ? Number(values.minStock) : undefined,
    productType: values.productType.length > 0 ? (values.productType as ProductTypeValue) : undefined,
    visibleInPos: values.visibleInPos,
  }
}

function toUpdatePayload(values: ProductFormValues): UpdateProductInput {
  return {
    name: values.name.trim(),
    description: normalizeOptional(values.description) ?? null,
    categoryId: normalizeOptional(values.categoryId) ?? null,
    images: normalizeImages(values.images),
    variants: normalizeVariants(values.variants),
    salePrice: Number(values.salePrice),
    isActive: values.isActive,
    brand: normalizeOptional(values.brand) ?? null,
    trackStock: values.trackStock,
    taxRate: Number(values.taxRate),
    minStock: normalizeOptional(values.minStock) ? Number(values.minStock) : undefined,
    productType: values.productType.length > 0 ? (values.productType as ProductTypeValue) : undefined,
    visibleInPos: values.visibleInPos,
  }
}

function getFormValuesFromProduct(product: Product): ProductFormValues {
  return {
    name: String(product.name ?? ""),
    description: String(product.description ?? ""),
    categoryId: String(product.categoryId ?? product.category?.id ?? ""),
    salePrice:
      typeof product.salePrice === "number" && Number.isFinite(product.salePrice)
        ? String(product.salePrice)
        : "0",
    taxRate:
      typeof product.taxRate === "number" && Number.isFinite(product.taxRate)
        ? String(product.taxRate)
        : "0",
    brand: String(product.brand ?? ""),
    minStock:
      typeof product.minStock === "number" && Number.isFinite(product.minStock)
        ? String(product.minStock)
        : "",
    productType:
      typeof product.productType === "string" && PRODUCT_TYPE_VALUES.includes(product.productType as ProductTypeValue)
        ? product.productType
        : "PHYSICAL",
    isActive: product.isActive ?? true,
    trackStock: product.trackStock ?? true,
    visibleInPos: product.visibleInPos ?? true,
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          key: String(image.key ?? ""),
          url: String(image.url ?? ""),
        }))
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          id: typeof variant.id === "string" ? variant.id : undefined,
          sku: String(variant.sku ?? ""),
          barcode: String(variant.barcode ?? ""),
          unitOfMeasure: String(variant.unitOfMeasure ?? ""),
          attributes: variant.attributes ? JSON.stringify(variant.attributes, null, 2) : "",
          cost:
            typeof variant.cost === "number" && Number.isFinite(variant.cost)
              ? String(variant.cost)
              : "",
        }))
      : [],
  }
}

export function ProductsPageClient({ slug }: ProductsPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formValues, setFormValues] = useState<ProductFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null)
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([])

  const productsQuery = useProducts()
  const categoriesQuery = useCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const uploadImage = useUploadImage()
  const deleteUploadImage = useDeleteUploadImage()

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

  const activeProducts = products.filter((product) => product.isActive !== false).length
  const productsWithImages = products.filter((product) => (product.images?.length ?? 0) > 0).length
  const visibleInPosProducts = products.filter((product) => product.visibleInPos !== false).length
  const averageSalePrice =
    products.length > 0
      ? products.reduce((total, product) => total + Number(product.salePrice ?? 0), 0) / products.length
      : 0
  const recentProducts = useMemo(
    () =>
      [...products]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [products]
  )

  function resetForm() {
    setEditingProduct(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
    setUploadingImageIndex(null)
    setDeletingImageIndex(null)
    imageInputRefs.current = []
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  function openCreateSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function openEditSheet(product: Product) {
    setEditingProduct(product)
    setFormValues(getFormValuesFromProduct(product))
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  function handleImageChange(index: number, field: keyof ProductImageFormValue, value: string) {
    setFormValues((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image
      ),
    }))

    setFormErrors((current) => {
      const nextImageErrors = [...(current.imageErrors ?? [])]
      if (nextImageErrors[index]) {
        nextImageErrors[index] = { ...nextImageErrors[index], [field]: undefined }
      }

      return {
        ...current,
        images: undefined,
        imageErrors: nextImageErrors,
      }
    })
    setActionError(null)
  }

  function handleVariantChange(index: number, field: keyof ProductVariantFormValue, value: string) {
    setFormValues((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }))

    setFormErrors((current) => {
      const nextVariantErrors = [...(current.variantErrors ?? [])]
      if (nextVariantErrors[index]) {
        nextVariantErrors[index] = { ...nextVariantErrors[index], [field]: undefined }
      }

      return {
        ...current,
        variants: undefined,
        variantErrors: nextVariantErrors,
      }
    })
    setActionError(null)
  }

  function removeImageAtIndex(index: number) {
    imageInputRefs.current.splice(index, 1)

    setFormValues((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }))
    setFormErrors((current) => ({
      ...current,
      images: undefined,
      imageErrors: (current.imageErrors ?? []).filter((_, imageIndex) => imageIndex !== index),
    }))
  }

  function handleAddImage() {
    setFormValues((current) => {
      if (current.images.length >= 10) return current
      return {
        ...current,
        images: [...current.images, { key: "", url: "" }],
      }
    })
    setFormErrors((current) => ({ ...current, images: undefined }))
  }

  function handleAddVariant() {
    setFormValues((current) => {
      if (current.variants.length >= 100) return current
      return {
        ...current,
        variants: [
          ...current.variants,
          {
            sku: "",
            barcode: "",
            unitOfMeasure: "",
            attributes: "",
            cost: "",
          },
        ],
      }
    })
    setFormErrors((current) => ({ ...current, variants: undefined }))
  }

  async function handleImageFileChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImageIndex(index)
    setActionError(null)

    try {
      const uploaded = await uploadImage.mutateAsync({
        file,
        folder: PRODUCT_IMAGE_FOLDER,
      })

      setFormValues((current) => ({
        ...current,
        images: current.images.map((image, imageIndex) =>
          imageIndex === index
            ? {
                key: uploaded.key,
                url: uploaded.url,
              }
            : image
        ),
      }))
      setFormErrors((current) => {
        const nextImageErrors = [...(current.imageErrors ?? [])]
        nextImageErrors[index] = {}

        return {
          ...current,
          images: undefined,
          imageErrors: nextImageErrors,
        }
      })
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo subir la imagen."))
    } finally {
      setUploadingImageIndex(null)
      event.target.value = ""
    }
  }

  async function handleRemoveImage(index: number) {
    const image = formValues.images[index]
    const imageKey = image?.key.trim() ?? ""
    const imageUrl = image?.url.trim() ?? ""

    if (!imageKey || !imageUrl) {
      removeImageAtIndex(index)
      return
    }

    setDeletingImageIndex(index)
    setActionError(null)

    try {
      await deleteUploadImage.mutateAsync({ key: imageKey })
      removeImageAtIndex(index)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar la imagen del almacenamiento."))
    } finally {
      setDeletingImageIndex(null)
    }
  }

  function handleRemoveVariant(index: number) {
    setFormValues((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
    setFormErrors((current) => ({
      ...current,
      variants: undefined,
      variantErrors: (current.variantErrors ?? []).filter((_, variantIndex) => variantIndex !== index),
    }))
  }

  function openImagePicker(index: number) {
    imageInputRefs.current[index]?.click()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateProduct(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createProduct.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el producto."))
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Eliminar el producto "${product.name}"?`)) return

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

  const isSubmitting =
    createProduct.isPending ||
    updateProduct.isPending ||
    uploadImage.isPending ||
    deleteUploadImage.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de productos
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Catalogo comercial
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Gestiona el catalogo de <span className="font-semibold text-foreground">{slug}</span>,
                controla precio, stock, visibilidad en POS y la estructura comercial de cada ficha.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void productsQuery.refetch()}
              disabled={productsQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Package className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
          label="Productos activos"
          value={String(activeProducts)}
          hint={`${filteredProducts.length} visibles con el filtro actual`}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          label="Precio promedio"
          value={formatMoney(averageSalePrice)}
          hint="Promedio simple del catalogo"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          icon={<ImagePlus className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
          label="Con imagenes"
          value={String(productsWithImages)}
          hint={`${products.length > 0 ? Math.round((productsWithImages / products.length) * 100) : 0}% del catalogo`}
        />
        <MetricCard
          icon={<ShieldCheck className="h-5 w-5 text-violet-700 dark:text-violet-300" />}
          iconClass="bg-violet-100 dark:bg-violet-950/30"
          label="Visibles en POS"
          value={String(visibleInPosProducts)}
          hint={`${categories.length} categorias disponibles`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de productos</CardTitle>
                <CardDescription>
                  Alta, edicion y limpieza del catalogo comercial del tenant.
                </CardDescription>
              </div>
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, marca, tipo o categoria"
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

            {productsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-18 rounded-xl" />
                ))}
              </div>
            ) : productsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(productsQuery.error, "No se pudo cargar la lista de productos.")}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="No hay productos para mostrar"
                description={
                  products.length === 0
                    ? "Crea el primer producto para comenzar a poblar el catalogo."
                    : "Ajusta la busqueda para encontrar un producto existente."
                }
                onCreate={products.length === 0 ? openCreateSheet : undefined}
              />
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const categoryMeta = getProductCategoryDisplayMeta(product, categories)
                    const primaryImageUrl = getPrimaryImageUrl(product.images)

                    return (
                      <article
                        key={String(product.id)}
                        className="rounded-2xl border border-border/70 bg-muted/10 p-4"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <ProductImagePreview
                              url={primaryImageUrl}
                              label={`Imagen principal de ${product.name}`}
                              size="lg"
                            />
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-foreground">{product.name}</p>
                                <StatusBadge
                                  active={product.isActive !== false}
                                  activeLabel="Activo"
                                  inactiveLabel="Inactivo"
                                />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {product.brand || "Sin marca"} - ID {String(product.id)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge
                                  active={product.visibleInPos !== false}
                                  activeLabel="Visible en POS"
                                  inactiveLabel="Oculto en POS"
                                  color="blue"
                                />
                                <StatusBadge
                                  active={product.trackStock !== false}
                                  activeLabel="Controla stock"
                                  inactiveLabel="Sin stock"
                                  color="amber"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditSheet(product)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => void handleDelete(product)}
                              disabled={deleteProduct.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                          <div className="rounded-xl border border-border/60 bg-background p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Categoria
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                                categoryMeta.isRoot
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                              }`}
                            >
                              {categoryMeta.label}
                            </span>
                            <p className="mt-2 text-xs text-muted-foreground">{categoryMeta.helper}</p>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-background p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Comercial
                            </p>
                            <p className="mt-2 text-base font-semibold text-foreground">
                              {formatMoney(product.salePrice)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatProductType(product.productType)} - Impuesto {formatTaxRate(product.taxRate)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {typeof product.minStock === "number"
                                ? `Stock minimo ${product.minStock}`
                                : "Sin stock minimo"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {product.variants?.length
                                ? `${product.variants.length} variante(s) configurada(s)`
                                : "Sin variantes"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-background p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Imagenes
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <ProductImagePreview
                                url={primaryImageUrl}
                                label={`Miniatura de ${product.name}`}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {product.images?.length ? `${product.images.length} cargada(s)` : "Sin imagenes"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {primaryImageUrl ? "La primera imagen ya se muestra en ficha." : "Aun no tiene portada."}
                                </p>
                                {product.variants?.length ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    SKU: {product.variants.slice(0, 3).map((variant) => variant.sku).join(", ")}
                                    {product.variants.length > 3 ? "..." : ""}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-background p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Actualizacion
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {formatDate(product.updatedAt ?? product.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Ultimo movimiento registrado del producto.
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
          <SummaryCard
            title="Con categoria"
            value={String(products.filter((product) => Boolean(product.categoryId ?? product.category?.id)).length)}
            description="Productos ya clasificados dentro del arbol comercial."
          />
          <SummaryCard
            title="Fisicos vs servicio"
            value={`${products.filter((product) => product.productType !== "SERVICE").length} / ${products.filter((product) => product.productType === "SERVICE").length}`}
            description="Conteo rapido de productos fisicos y servicios."
          />
          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimos productos creados o actualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen productos registrados.
                </div>
              ) : (
                recentProducts.map((product) => {
                  const categoryMeta = getProductCategoryDisplayMeta(product, categories)

                  return (
                    <div
                      key={`recent-${String(product.id)}`}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {categoryMeta.label} - {categoryMeta.helper}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {formatMoney(product.salePrice)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatProductType(product.productType)} | {product.brand || "Sin marca"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(product.updatedAt ?? product.createdAt)}
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingProduct ? "Editar producto" : "Nuevo producto"}</SheetTitle>
            <SheetDescription>
              {editingProduct
                ? "Actualiza categoria, precio, stock, visibilidad e imagenes del producto seleccionado."
                : "Registra un nuevo producto dentro del catalogo comercial."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" htmlFor="product-name" error={formErrors.name}>
                <Input
                  id="product-name"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Ej. Collar de plata"
                  maxLength={160}
                  aria-invalid={Boolean(formErrors.name)}
                />
              </Field>

              <Field label="Marca" htmlFor="product-brand" error={formErrors.brand} hint="Opcional.">
                <Input
                  id="product-brand"
                  value={formValues.brand}
                  onChange={(event) => handleFieldChange("brand", event.target.value)}
                  placeholder="Ej. Silver Line"
                  maxLength={120}
                  aria-invalid={Boolean(formErrors.brand)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="product-category" className="text-sm font-medium text-foreground">
                  Categoria
                </label>
                <select
                  id="product-category"
                  value={formValues.categoryId}
                  onChange={(event) => handleFieldChange("categoryId", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  aria-invalid={Boolean(formErrors.categoryId)}
                >
                  <option value="">Sin categoria</option>
                  {categories.map((category) => {
                    const meta = getCategoryDisplayMeta(category.id, categories)
                    return (
                      <option key={String(category.id)} value={String(category.id)}>
                        {meta.isRoot
                          ? `Categoria principal: ${meta.label}`
                          : `${meta.label} (${meta.helper})`}
                      </option>
                    )
                  })}
                </select>
                {formErrors.categoryId ? (
                  <p className="text-xs text-destructive">{formErrors.categoryId}</p>
                ) : categoriesQuery.isError ? (
                  <p className="text-xs text-destructive">
                    {getApiErrorMessage(categoriesQuery.error, "No se pudieron cargar las categorias.")}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Si eliges una subcategoria, la principal se infiere por su parentId.
                  </p>
                )}
              </div>

              <Field label="Tipo de producto" htmlFor="product-type" error={formErrors.productType}>
                <select
                  id="product-type"
                  value={formValues.productType}
                  onChange={(event) => handleFieldChange("productType", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  aria-invalid={Boolean(formErrors.productType)}
                >
                  {PRODUCT_TYPE_VALUES.map((productType) => (
                    <option key={productType} value={productType}>
                      {formatProductType(productType)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Descripcion"
              htmlFor="product-description"
              error={formErrors.description}
              hint="Opcional. Hasta 1000 caracteres."
            >
              <textarea
                id="product-description"
                value={formValues.description}
                onChange={(event) => handleFieldChange("description", event.target.value)}
                placeholder="Ej. Modelo premium"
                rows={4}
                maxLength={1000}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Precio de venta" htmlFor="product-sale-price" error={formErrors.salePrice}>
                <Input
                  id="product-sale-price"
                  inputMode="decimal"
                  value={formValues.salePrice}
                  onChange={(event) => handleFieldChange("salePrice", event.target.value)}
                  placeholder="0.00"
                  aria-invalid={Boolean(formErrors.salePrice)}
                />
              </Field>

              <Field label="Impuesto (%)" htmlFor="product-tax-rate" error={formErrors.taxRate}>
                <Input
                  id="product-tax-rate"
                  inputMode="decimal"
                  value={formValues.taxRate}
                  onChange={(event) => handleFieldChange("taxRate", event.target.value)}
                  placeholder="18"
                  aria-invalid={Boolean(formErrors.taxRate)}
                />
              </Field>

              <Field
                label="Stock minimo"
                htmlFor="product-min-stock"
                error={formErrors.minStock}
                hint="Opcional. Entero >= 0."
              >
                <Input
                  id="product-min-stock"
                  inputMode="numeric"
                  value={formValues.minStock}
                  onChange={(event) => handleFieldChange("minStock", event.target.value)}
                  placeholder="0"
                  aria-invalid={Boolean(formErrors.minStock)}
                />
              </Field>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumen</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatMoney(Number(formValues.salePrice || 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Impuesto {formatTaxRate(Number(formValues.taxRate || 0))}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <ToggleCard
                title="Activo"
                description="Disponible para operar."
                checked={formValues.isActive}
                onChange={(checked) => handleFieldChange("isActive", checked)}
              />
              <ToggleCard
                title="Controla stock"
                description="Usar niveles minimos y control de inventario."
                checked={formValues.trackStock}
                onChange={(checked) => handleFieldChange("trackStock", checked)}
              />
              <ToggleCard
                title="Visible en POS"
                description="Aparece en caja y ventas rapidas."
                checked={formValues.visibleInPos}
                onChange={(checked) => handleFieldChange("visibleInPos", checked)}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Variantes</p>
                  <p className="text-xs text-muted-foreground">
                    Configura SKU, barcode, unidad, costo y atributos por cada variante.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleAddVariant}
                  disabled={formValues.variants.length >= 100}
                >
                  <Plus className="h-4 w-4" />
                  Agregar variante
                </Button>
              </div>

              {formErrors.variants ? <p className="text-xs text-destructive">{formErrors.variants}</p> : null}

              {formValues.variants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  No hay variantes registradas para este producto.
                </div>
              ) : (
                <div className="space-y-3">
                  {formValues.variants.map((variant, index) => {
                    const variantError = formErrors.variantErrors?.[index]

                    return (
                      <div key={`variant-${variant.id ?? index}`} className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Variante {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              {variant.id ? `ID ${variant.id}` : "Nueva variante aun no guardada."}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <Field label="SKU" htmlFor={`product-variant-sku-${index}`} error={variantError?.sku}>
                            <Input
                              id={`product-variant-sku-${index}`}
                              value={variant.sku}
                              onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                              placeholder="SKU-001"
                              maxLength={80}
                            />
                          </Field>

                          <Field
                            label="Barcode"
                            htmlFor={`product-variant-barcode-${index}`}
                            error={variantError?.barcode}
                            hint="Opcional."
                          >
                            <Input
                              id={`product-variant-barcode-${index}`}
                              value={variant.barcode}
                              onChange={(event) => handleVariantChange(index, "barcode", event.target.value)}
                              placeholder="7751234567890"
                              maxLength={120}
                            />
                          </Field>

                          <div className="space-y-2">
                            <label htmlFor={`product-variant-unit-${index}`} className="text-sm font-medium text-foreground">
                              Unidad
                            </label>
                            <select
                              id={`product-variant-unit-${index}`}
                              value={variant.unitOfMeasure}
                              onChange={(event) => handleVariantChange(index, "unitOfMeasure", event.target.value)}
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                              aria-invalid={Boolean(variantError?.unitOfMeasure)}
                            >
                              <option value="">Sin unidad</option>
                              {UNIT_OF_MEASURE_VALUES.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                            {variantError?.unitOfMeasure ? (
                              <p className="text-xs text-destructive">{variantError.unitOfMeasure}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Opcional.</p>
                            )}
                          </div>

                          <Field
                            label="Costo"
                            htmlFor={`product-variant-cost-${index}`}
                            error={variantError?.cost}
                            hint="Opcional. Hasta 2 decimales."
                          >
                            <Input
                              id={`product-variant-cost-${index}`}
                              inputMode="decimal"
                              value={variant.cost}
                              onChange={(event) => handleVariantChange(index, "cost", event.target.value)}
                              placeholder="0.00"
                            />
                          </Field>
                        </div>

                        <Field
                          label="Atributos JSON"
                          htmlFor={`product-variant-attributes-${index}`}
                          error={variantError?.attributes}
                          hint='Opcional. Ejemplo: {"color":"rojo","talla":"M"}'
                        >
                          <textarea
                            id={`product-variant-attributes-${index}`}
                            value={variant.attributes}
                            onChange={(event) => handleVariantChange(index, "attributes", event.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          />
                        </Field>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Imagenes</p>
                  <p className="text-xs text-muted-foreground">
                    Sube archivos usando la carpeta `products` o completa manualmente key y URL.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleAddImage}
                  disabled={formValues.images.length >= 10 || uploadImage.isPending || deleteUploadImage.isPending}
                >
                  <Plus className="h-4 w-4" />
                  Agregar imagen
                </Button>
              </div>

              {formErrors.images ? <p className="text-xs text-destructive">{formErrors.images}</p> : null}

              {formValues.images.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  No hay imagenes registradas para este producto.
                </div>
              ) : (
                <div className="space-y-3">
                  {formValues.images.map((image, index) => {
                    const imageError = formErrors.imageErrors?.[index]
                    const isUploadingImage = uploadImage.isPending && uploadingImageIndex === index
                    const isDeletingImage = deleteUploadImage.isPending && deletingImageIndex === index
                    const isImageBusy = isUploadingImage || isDeletingImage
                    return (
                      <div key={`image-${index}`} className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Imagen {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              {isUploadingImage
                                ? "Subiendo archivo..."
                                : isDeletingImage
                                  ? "Eliminando archivo..."
                                  : image.url
                                    ? "Imagen cargada y lista para guardarse en el producto."
                                    : "Selecciona un archivo para completar key y URL automaticamente."}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              ref={(node) => {
                                imageInputRefs.current[index] = node
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => void handleImageFileChange(index, event)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openImagePicker(index)}
                              disabled={isImageBusy}
                            >
                              <ImagePlus className="h-4 w-4" />
                              {isUploadingImage ? "Subiendo..." : "Subir archivo"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => void handleRemoveImage(index)}
                              disabled={isImageBusy}
                            >
                              <Trash2 className="h-4 w-4" />
                              {isDeletingImage ? "Quitando..." : "Quitar"}
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Vista previa
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Asi vera el equipo la imagen del producto.
                              </p>
                            </div>
                            <ProductImagePreview
                              url={image.url}
                              label={`Vista previa de la imagen ${index + 1}`}
                              size="editor"
                            />
                            {image.url ? (
                              <a
                                href={image.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                              >
                                Abrir imagen en otra pestana
                              </a>
                            ) : null}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Key" htmlFor={`product-image-key-${index}`} error={imageError?.key}>
                              <Input
                                id={`product-image-key-${index}`}
                                value={image.key}
                                onChange={(event) => handleImageChange(index, "key", event.target.value)}
                                placeholder="tenant-id/products/archivo.jpg"
                                maxLength={500}
                                disabled={isImageBusy}
                              />
                            </Field>
                            <Field label="URL" htmlFor={`product-image-url-${index}`} error={imageError?.url}>
                              <Input
                                id={`product-image-url-${index}`}
                                value={image.url}
                                onChange={(event) => handleImageChange(index, "url", event.target.value)}
                                placeholder="https://..."
                                maxLength={1000}
                                disabled={isImageBusy}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                {isSubmitting ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
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

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  color = "emerald",
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  color?: "emerald" | "blue" | "amber"
}) {
  const activeClassMap = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  } as const

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
        active ? activeClassMap[color] : "border-border bg-muted/30 text-muted-foreground"
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
  size?: "sm" | "md" | "lg" | "editor"
}) {
  const sizeClassMap = {
    sm: "h-14 w-14 rounded-xl",
    md: "h-18 w-18 rounded-2xl",
    lg: "h-20 w-20 rounded-2xl",
    editor: "h-32 w-full rounded-2xl",
  } as const

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border/70 bg-muted/30 text-muted-foreground ${sizeClassMap[size]}`}
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
      className={`border border-border/60 bg-muted/20 bg-cover bg-center shadow-sm ${sizeClassMap[size]}`}
      style={{ backgroundImage: `url("${url}")` }}
    />
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-muted/10 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-input"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
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
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer producto
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
