export interface CustomerAddress {
  line1: string
  line2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  [key: string]: unknown
}

export interface Customer {
  id: string | number
  name: string
  email?: string | null
  phone?: string | null
  addresses?: CustomerAddress[]
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateCustomerInput {
  name: string
  email?: string | null
  phone?: string | null
  addresses?: CustomerAddress[]
}

export interface UpdateCustomerInput {
  name?: string
  email?: string | null
  phone?: string | null
  addresses?: CustomerAddress[]
}

export type CustomersListResponse = Customer[]

export interface DeleteCustomerResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
