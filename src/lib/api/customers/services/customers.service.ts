import { apiClient } from "@/lib/api/client"
import type {
  CreateCustomerInput,
  Customer,
  CustomersListResponse,
  DeleteCustomerResponse,
  UpdateCustomerInput,
} from "../types"

const CUSTOMERS_ENDPOINTS = {
  list: "/customers",
  byId: (id: string | number) => `/customers/${id}`,
} as const

export const customersService = {
  create: async (payload: CreateCustomerInput) => {
    const { data } = await apiClient.post<Customer>(CUSTOMERS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<CustomersListResponse>(CUSTOMERS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Customer>(CUSTOMERS_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateCustomerInput) => {
    const { data } = await apiClient.patch<Customer>(CUSTOMERS_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteCustomerResponse>(
      CUSTOMERS_ENDPOINTS.byId(id)
    )
    return data
  },
}
