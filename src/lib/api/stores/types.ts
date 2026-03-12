export interface Store {
  id: string | number
  name: string
  address?: string | null
  code?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateStoreInput {
  name: string
  address?: string
  code?: string
}

export interface UpdateStoreInput {
  name?: string
  address?: string
  code?: string
}

export type StoresListResponse = Store[]

export interface DeleteStoreResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
