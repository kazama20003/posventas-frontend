import { apiClient } from "@/lib/api/client"
import type {
  CreateSupplierInput,
  DeleteSupplierResponse,
  Supplier,
  SuppliersListResponse,
  UpdateSupplierInput,
} from "../types"

const SUPPLIERS_ENDPOINTS = {
  list: "/suppliers",
  byId: (id: string | number) => `/suppliers/${id}`,
} as const

export const suppliersService = {
  create: async (payload: CreateSupplierInput) => {
    const { data } = await apiClient.post<Supplier>(SUPPLIERS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<SuppliersListResponse>(SUPPLIERS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Supplier>(SUPPLIERS_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateSupplierInput) => {
    const { data } = await apiClient.patch<Supplier>(SUPPLIERS_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteSupplierResponse>(SUPPLIERS_ENDPOINTS.byId(id))
    return data
  },
}
