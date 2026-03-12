export const USER_ROLE_VALUES = ["OWNER", "ADMIN", "SELLER", "CASHIER"] as const

export type UserRoleValue = (typeof USER_ROLE_VALUES)[number]

export interface UserStore {
  id: string | number
  name?: string
  code?: string | null
  address?: string | null
  [key: string]: unknown
}

export interface UserRole {
  id?: string | number
  name: UserRoleValue | (string & {})
  [key: string]: unknown
}

export interface User {
  id: string | number
  email: string
  displayName?: string | null
  ruc?: string | null
  phone?: string | null
  isActive?: boolean
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  role?: UserRoleValue | (string & {})
  roles?: UserRole[]
  stores?: UserStore[]
  storeIds?: string[]
  [key: string]: unknown
}

export interface CreateUserInput {
  email: string
  password: string
  displayName?: string
  ruc?: string
  phone?: string
  role?: UserRoleValue
  storeIds?: string[]
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  password?: string
  displayName?: string
  ruc?: string
  phone?: string
  role?: UserRoleValue
  storeIds?: string[]
  isActive?: boolean
}

export type UsersListResponse = User[]

export interface DeleteUserResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}

export interface TenantBySlugResponse {
  id: string | number
  slug: string
  name: string
  [key: string]: unknown
}
