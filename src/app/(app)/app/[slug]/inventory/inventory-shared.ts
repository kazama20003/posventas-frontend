import type { Product } from "@/lib/api/products"
import type { Store } from "@/lib/api/stores"
import type { Warehouse } from "@/lib/api/warehouses"

export type VariantOption = {
  variantId: string
  productId: string
  productName: string
  sku: string
  barcode?: string | null
  unitOfMeasure?: string | null
  label: string
}

export type StoreOption = {
  storeId: string
  label: string
  warehouseCount: number
}

export const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function formatDate(value?: string | null) {
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export function getVariantOptions(products: Product[]): VariantOption[] {
  return products.flatMap((product) => {
    if (!Array.isArray(product.variants)) return []

    return product.variants
      .filter((variant) => typeof variant.id === "string" && variant.id.length > 0)
      .map((variant) => {
        const variantId = String(variant.id)
        const sku = String(variant.sku ?? "")
        const barcode = typeof variant.barcode === "string" ? variant.barcode : null
        const unitOfMeasure = typeof variant.unitOfMeasure === "string" ? variant.unitOfMeasure : null
        const labelParts = [product.name, sku]

        if (unitOfMeasure) {
          labelParts.push(unitOfMeasure)
        }

        return {
          variantId,
          productId: String(product.id),
          productName: String(product.name ?? "Producto sin nombre"),
          sku,
          barcode,
          unitOfMeasure,
          label: labelParts.filter(Boolean).join(" - "),
        }
      })
  })
}

export function getWarehouseLabel(warehouse?: Warehouse | null) {
  if (!warehouse) return "Almacen no resuelto"
  const code = typeof warehouse.code === "string" && warehouse.code.trim().length > 0 ? warehouse.code.trim() : null
  return code ? `${warehouse.name} (${code})` : warehouse.name
}

export function getStoreLabel(store?: Store | null, fallbackStoreId?: string | null) {
  if (!store) {
    return fallbackStoreId ? `Sucursal ${fallbackStoreId}` : "Sucursal no resuelta"
  }

  const code = typeof store.code === "string" && store.code.trim().length > 0 ? store.code.trim() : null
  return code ? `${store.name} (${code})` : store.name
}

export function getStoreOptions(stores: Store[], warehouses: Warehouse[]) {
  const storeIdsWithWarehouses = new Map<string, number>()

  warehouses.forEach((warehouse) => {
    const storeId = String(warehouse.storeId ?? "").trim()
    if (!storeId) return
    storeIdsWithWarehouses.set(storeId, (storeIdsWithWarehouses.get(storeId) ?? 0) + 1)
  })

  return Array.from(storeIdsWithWarehouses.entries()).map(([storeId, warehouseCount]) => {
    const store = stores.find((candidate) => String(candidate.id) === storeId)

    return {
      storeId,
      warehouseCount,
      label: getStoreLabel(store, storeId),
    }
  })
}
