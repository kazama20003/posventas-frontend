import type { ProductVariant } from "@/lib/api/products"
import type { Store } from "@/lib/api/stores"
import type { Supplier } from "@/lib/api/suppliers"
import type { Warehouse } from "@/lib/api/warehouses"

export const PURCHASE_ORDER_UNIT_OF_MEASURE_VALUES = [
  "UNIT",
  "KG",
  "G",
  "L",
  "ML",
  "M",
  "CM",
  "BOX",
  "PACK",
  "DOZEN",
] as const

export type PurchaseOrderUnitOfMeasureValue =
  (typeof PURCHASE_ORDER_UNIT_OF_MEASURE_VALUES)[number]

export interface PurchaseOrderLine {
  id?: string | number
  variantId: string
  variant?: ProductVariant | null
  quantity: number
  unitCost: number
  unitOfMeasure?: PurchaseOrderUnitOfMeasureValue | null
  receivedQuantity?: number
  pendingQuantity?: number
  subtotal?: number
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface PurchaseOrder {
  id: string | number
  supplierId: string
  supplier?: Supplier | null
  storeId?: string | null
  store?: Store | null
  code?: string | null
  status?: string
  lines: PurchaseOrderLine[]
  subtotal?: number
  total?: number
  warehouseId?: string | null
  warehouse?: Warehouse | null
  receivedAt?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreatePurchaseOrderLineInput {
  variantId: string
  quantity: number
  unitCost: number
  unitOfMeasure?: PurchaseOrderUnitOfMeasureValue
}

export interface CreatePurchaseOrderInput {
  supplierId: string
  storeId?: string
  code?: string
  lines: CreatePurchaseOrderLineInput[]
}

export interface UpdatePurchaseOrderLineInput {
  variantId: string
  quantity: number
  unitCost: number
  unitOfMeasure?: PurchaseOrderUnitOfMeasureValue
}

export interface UpdatePurchaseOrderInput {
  supplierId?: string
  storeId?: string
  code?: string
  lines?: UpdatePurchaseOrderLineInput[]
}

export interface ReceivePurchaseOrderInput {
  warehouseId: string
}

export type PurchaseOrdersListResponse = PurchaseOrder[]

export interface DeletePurchaseOrderResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
