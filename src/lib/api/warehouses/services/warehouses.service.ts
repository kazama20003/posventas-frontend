import { apiClient } from "@/lib/api/client"
import type {
  CreateWarehouseInput,
  DeleteWarehouseResponse,
  Warehouse,
  WarehousesListResponse,
  UpdateWarehouseInput,
} from "../types"

const WAREHOUSES_ENDPOINTS = {
  list: "/warehouses",
  byId: (id: string | number) => `/warehouses/${id}`,
} as const

export const warehousesService = {
  create: async (payload: CreateWarehouseInput) => {
    const { data } = await apiClient.post<Warehouse>(WAREHOUSES_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<WarehousesListResponse>(WAREHOUSES_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Warehouse>(WAREHOUSES_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateWarehouseInput) => {
    const { data } = await apiClient.patch<Warehouse>(WAREHOUSES_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteWarehouseResponse>(WAREHOUSES_ENDPOINTS.byId(id))
    return data
  },
}
