import { apiClient } from "@/lib/api/client"
import type {
  CreatePurchaseOrderInput,
  DeletePurchaseOrderResponse,
  PurchaseOrder,
  PurchaseOrdersListResponse,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "../types"

const PURCHASE_ORDERS_ENDPOINTS = {
  list: "/purchase-orders",
  byId: (id: string | number) => `/purchase-orders/${id}`,
  receive: (id: string | number) => `/purchase-orders/${id}/receive`,
} as const

export const purchaseOrdersService = {
  create: async (payload: CreatePurchaseOrderInput) => {
    const { data } = await apiClient.post<PurchaseOrder>(PURCHASE_ORDERS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<PurchaseOrdersListResponse>(PURCHASE_ORDERS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<PurchaseOrder>(PURCHASE_ORDERS_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdatePurchaseOrderInput) => {
    const { data } = await apiClient.patch<PurchaseOrder>(PURCHASE_ORDERS_ENDPOINTS.byId(id), payload)
    return data
  },

  receive: async (id: string | number, payload: ReceivePurchaseOrderInput) => {
    const { data } = await apiClient.post<PurchaseOrder>(
      PURCHASE_ORDERS_ENDPOINTS.receive(id),
      payload
    )
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeletePurchaseOrderResponse>(
      PURCHASE_ORDERS_ENDPOINTS.byId(id)
    )
    return data
  },
}
