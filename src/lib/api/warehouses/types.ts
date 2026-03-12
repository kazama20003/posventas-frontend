export interface Warehouse {
  id: string | number
  storeId: string
  name: string
  code?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateWarehouseInput {
  storeId: string
  name: string
  code?: string
}

export interface UpdateWarehouseInput {
  storeId?: string
  name?: string
  code?: string
}

export type WarehousesListResponse = Warehouse[]

export interface DeleteWarehouseResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
