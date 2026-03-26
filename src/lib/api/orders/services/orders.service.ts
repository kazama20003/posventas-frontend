import { apiClient } from "@/lib/api/client"
import type {
  CreateOrderInput,
  DeleteOrderResponse,
  FulfillOrderInput,
  Order,
  OrdersListResponse,
  UpdateOrderInput,
} from "../types"

const ORDERS_ENDPOINTS = {
  list: "/orders",
  byId: (id: string | number) => `/orders/${id}`,
  fulfill: (id: string | number) => `/orders/${id}/fulfill`,
} as const

export const ordersService = {
  create: async (payload: CreateOrderInput) => {
    const { data } = await apiClient.post<Order>(ORDERS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<OrdersListResponse>(ORDERS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Order>(ORDERS_ENDPOINTS.byId(id))
    return data
  },

  fulfill: async (id: string | number, payload: FulfillOrderInput = {}) => {
    const { data } = await apiClient.post<Order>(ORDERS_ENDPOINTS.fulfill(id), payload)
    return data
  },

  update: async (id: string | number, payload: UpdateOrderInput) => {
    const { data } = await apiClient.patch<Order>(ORDERS_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteOrderResponse>(ORDERS_ENDPOINTS.byId(id))
    return data
  },
}
