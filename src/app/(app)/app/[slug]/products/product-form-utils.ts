import {
  PRODUCT_TYPE_VALUES,
  UNIT_OF_MEASURE_VALUES,
} from "@/lib/api/products"
import type {
  CreateProductInput,
  Product,
  ProductImage,
  ProductTypeValue,
  ProductVariant,
  UnitOfMeasureValue,
  UpdateProductInput,
  VariantAttributeValue,
} from "@/lib/api/products"

export type ProductImageFormValue = {
  key: string
  url: string
}

export type ProductVariantFormValue = {
  id?: string
  sku: string
  barcode: string
  unitOfMeasure: string
  attributes: string
  cost: string
}

export type ProductFormValues = {
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

export type ProductFormErrors = {
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

export type CategoryLike = {
  id: string | number
  name?: string
  parentId?: string | null
}

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const decimalPattern = /^\d+(\.\d{1,2})?$/
const integerPattern = /^\d+$/

export const PRODUCT_IMAGE_FOLDER = "products"

export const defaultFormValues: ProductFormValues = {
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

export function readRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

export function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export function formatMoney(value?: number | null) {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  if (!Number.isFinite(amount)) return "S/ 0.00"

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatTaxRate(value?: number | null) {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  if (!Number.isFinite(amount)) return "0%"
  return `${amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}%`
}

export function formatProductType(value?: string | null) {
  if (value === "SERVICE") return "Servicio"
  return "Fisico"
}

export function getCategoryPath(
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

export function getCategoryDisplayMeta(
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

  const invalidValue = Object.values(parsed).some(
    (entry) => !isVariantAttributeValue(entry)
  )
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

function normalizeVariants(
  variants: ProductVariantFormValue[]
): ProductVariant[] | undefined {
  const normalized = variants
    .filter((variant) => hasVariantContent(variant))
    .map((variant) => ({
      id: normalizeOptional(variant.id ?? ""),
      sku: variant.sku.trim(),
      barcode: normalizeOptional(variant.barcode) ?? null,
      unitOfMeasure: normalizeOptional(
        variant.unitOfMeasure
      ) as UnitOfMeasureValue | undefined,
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

export function validateProduct(values: ProductFormValues) {
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

  if (
    values.productType.length > 0 &&
    !PRODUCT_TYPE_VALUES.includes(values.productType as ProductTypeValue)
  ) {
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
      usedVariantSkus.set(normalizedSku, [
        ...(usedVariantSkus.get(normalizedSku) ?? []),
        index,
      ])
    }

    if (barcode.length > 120) {
      entryError.barcode = "El barcode no puede superar 120 caracteres."
    }

    if (
      unitOfMeasure.length > 0 &&
      !UNIT_OF_MEASURE_VALUES.includes(unitOfMeasure as UnitOfMeasureValue)
    ) {
      entryError.unitOfMeasure = "Selecciona una unidad valida."
    }

    if (attributes.length > 0) {
      try {
        parseVariantAttributes(attributes)
      } catch (error) {
        entryError.attributes =
          error instanceof Error
            ? error.message
            : "Los atributos deben ser un objeto JSON valido."
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

  if (
    variantErrors.some(
      (entry) =>
        entry?.sku ||
        entry?.barcode ||
        entry?.unitOfMeasure ||
        entry?.attributes ||
        entry?.cost
    )
  ) {
    errors.variants = errors.variants ?? "Corrige las variantes antes de guardar."
    errors.variantErrors = variantErrors
  }

  return errors
}

export function toCreatePayload(values: ProductFormValues): CreateProductInput {
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
    minStock: normalizeOptional(values.minStock)
      ? Number(values.minStock)
      : undefined,
    productType:
      values.productType.length > 0
        ? (values.productType as ProductTypeValue)
        : undefined,
    visibleInPos: values.visibleInPos,
  }
}

export function toUpdatePayload(values: ProductFormValues): UpdateProductInput {
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
    minStock: normalizeOptional(values.minStock)
      ? Number(values.minStock)
      : undefined,
    productType:
      values.productType.length > 0
        ? (values.productType as ProductTypeValue)
        : undefined,
    visibleInPos: values.visibleInPos,
  }
}

export function getFormValuesFromProduct(product: Product): ProductFormValues {
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
      typeof product.productType === "string" &&
      PRODUCT_TYPE_VALUES.includes(product.productType as ProductTypeValue)
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
          attributes: variant.attributes
            ? JSON.stringify(variant.attributes, null, 2)
            : "",
          cost:
            typeof variant.cost === "number" && Number.isFinite(variant.cost)
              ? String(variant.cost)
              : "",
        }))
      : [],
  }
}
