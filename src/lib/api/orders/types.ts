import type { Customer } from "@/lib/api/customers"
import type { ProductVariant } from "@/lib/api/products"
import type { Store } from "@/lib/api/stores"
import type { Warehouse } from "@/lib/api/warehouses"

export const ORDER_STATUS_VALUES = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CANCELED",
] as const

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number]

export const ORDER_PAYMENT_PROVIDER_VALUES = [
  "CASH",
  "CARD",
  "STRIPE",
  "PAYPAL",
  "OTHER",
] as const

export type OrderPaymentProviderValue =
  (typeof ORDER_PAYMENT_PROVIDER_VALUES)[number]

export const ORDER_PAYMENT_STATUS_VALUES = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const

export type OrderPaymentStatusValue = (typeof ORDER_PAYMENT_STATUS_VALUES)[number]

export const ORDER_UNIT_OF_MEASURE_VALUES = [
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

export type OrderUnitOfMeasureValue = (typeof ORDER_UNIT_OF_MEASURE_VALUES)[number]

export interface OrderLine {
  id?: string | number
  variantId: string
  variant?: ProductVariant | null
  quantity: number
  unitPrice?: number | null
  unitOfMeasure?: OrderUnitOfMeasureValue | null
  subtotal?: number
  total?: number
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface OrderPayment {
  id?: string | number
  amount: number
  provider: OrderPaymentProviderValue | (string & {})
  status?: OrderPaymentStatusValue | (string & {})
  providerRef?: string | null
  paidAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface Order {
  id: string | number
  storeId: string
  store?: Store | null
  customerId?: string | null
  customer?: Customer | null
  code?: string | null
  status?: OrderStatusValue | (string & {})
  discountAmount?: number
  subtotal?: number
  total?: number
  lines: OrderLine[]
  payments?: OrderPayment[]
  fulfilledAt?: string | null
  warehouseId?: string | null
  warehouse?: Warehouse | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateOrderLineInput {
  variantId: string
  quantity: number
  unitPrice?: number
  unitOfMeasure?: OrderUnitOfMeasureValue
}

export interface CreateOrderPaymentInput {
  amount: number
  provider: OrderPaymentProviderValue
  status?: OrderPaymentStatusValue
  providerRef?: string | null
  paidAt?: Date | string
}

export interface CreateOrderInput {
  storeId: string
  customerId?: string
  code?: string
  status?: OrderStatusValue
  discountAmount?: number
  idempotencyKey?: string
  lines: CreateOrderLineInput[]
  payments?: CreateOrderPaymentInput[]
}

export interface UpdateOrderLineInput {
  variantId: string
  quantity: number
  unitPrice?: number
  unitOfMeasure?: OrderUnitOfMeasureValue
}

export interface UpdateOrderPaymentInput {
  amount: number
  provider: OrderPaymentProviderValue
  status?: OrderPaymentStatusValue
  providerRef?: string | null
  paidAt?: Date | string
}

export interface UpdateOrderInput {
  storeId?: string
  customerId?: string | null
  code?: string
  status?: OrderStatusValue
  discountAmount?: number
  idempotencyKey?: string
  lines?: UpdateOrderLineInput[]
  payments?: UpdateOrderPaymentInput[]
}

export interface FulfillOrderInput {
  warehouseId?: string
}

export type OrdersListResponse = Order[]

export interface DeleteOrderResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
