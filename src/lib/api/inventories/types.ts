import type { ProductVariant } from "@/lib/api/products"
import type { Warehouse } from "@/lib/api/warehouses"

export interface Inventory {
  id: string | number
  variantId: string
  warehouseId: string
  variant?: ProductVariant | null
  warehouse?: Warehouse | null
  quantity?: number
  reserved?: number
  reason?: string | null
  referenceId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface InventoryMovement {
  id: string | number
  variantId: string
  warehouseId: string
  variant?: ProductVariant | null
  warehouse?: Warehouse | null
  delta: number
  reason: string
  referenceId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateInventoryInput {
  variantId: string
  warehouseId: string
  quantity?: number
  reserved?: number
  reason?: string
  referenceId?: string
}

export interface UpdateInventoryInput {
  variantId?: string
  warehouseId?: string
  quantity?: number
  reserved?: number
  reason?: string
  referenceId?: string
}

export interface CreateInventoryMovementInput {
  variantId: string
  warehouseId: string
  delta: number
  reason: string
  referenceId?: string
}

export type InventoriesListResponse = Inventory[]
export type InventoryMovementsListResponse = InventoryMovement[]

export interface DeleteInventoryResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
