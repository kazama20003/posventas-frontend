import { apiClient } from "@/lib/api/client"
import type {
  CreateInventoryInput,
  CreateInventoryMovementInput,
  DeleteInventoryResponse,
  InventoriesListResponse,
  Inventory,
  InventoryMovement,
  InventoryMovementsListResponse,
  UpdateInventoryInput,
} from "../types"

const INVENTORIES_ENDPOINTS = {
  list: "/inventories",
  byId: (id: string | number) => `/inventories/${id}`,
  movements: "/inventories/movements",
  movementById: (id: string | number) => `/inventories/movements/${id}`,
} as const

export const inventoriesService = {
  create: async (payload: CreateInventoryInput) => {
    const { data } = await apiClient.post<Inventory>(INVENTORIES_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<InventoriesListResponse>(INVENTORIES_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Inventory>(INVENTORIES_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateInventoryInput) => {
    const { data } = await apiClient.patch<Inventory>(INVENTORIES_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteInventoryResponse>(INVENTORIES_ENDPOINTS.byId(id))
    return data
  },

  createMovement: async (payload: CreateInventoryMovementInput) => {
    const { data } = await apiClient.post<InventoryMovement>(INVENTORIES_ENDPOINTS.movements, payload)
    return data
  },

  listMovements: async () => {
    const { data } = await apiClient.get<InventoryMovementsListResponse>(INVENTORIES_ENDPOINTS.movements)
    return data
  },

  getMovementById: async (id: string | number) => {
    const { data } = await apiClient.get<InventoryMovement>(INVENTORIES_ENDPOINTS.movementById(id))
    return data
  },
}
