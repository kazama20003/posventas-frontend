import { apiClient } from "@/lib/api/client"
import type {
  CreateStoreInput,
  DeleteStoreResponse,
  Store,
  StoresListResponse,
  UpdateStoreInput,
} from "../types"

const STORES_ENDPOINTS = {
  list: "/stores",
  byId: (id: string | number) => `/stores/${id}`,
} as const

export const storesService = {
  create: async (payload: CreateStoreInput) => {
    const { data } = await apiClient.post<Store>(STORES_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<StoresListResponse>(STORES_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Store>(STORES_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateStoreInput) => {
    const { data } = await apiClient.patch<Store>(STORES_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteStoreResponse>(STORES_ENDPOINTS.byId(id))
    return data
  },
}
