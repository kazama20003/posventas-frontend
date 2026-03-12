export interface Supplier {
  id: string | number
  name: string
  contact?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateSupplierInput {
  name: string
  contact?: string
}

export interface UpdateSupplierInput {
  name?: string
  contact?: string
}

export type SuppliersListResponse = Supplier[]

export interface DeleteSupplierResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
