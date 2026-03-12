import { apiClient } from "@/lib/api/client"
import type {
  CreateUserInput,
  DeleteUserResponse,
  TenantBySlugResponse,
  UpdateUserInput,
  User,
  UsersListResponse,
} from "../types"

const USERS_ENDPOINTS = {
  list: "/users",
  byId: (id: string | number) => `/users/${id}`,
  tenantBySlug: (slug: string) => `/users/tenant/${slug}`,
} as const

export const usersService = {
  create: async (payload: CreateUserInput) => {
    const { data } = await apiClient.post<User>(USERS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<UsersListResponse>(USERS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<User>(USERS_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateUserInput) => {
    const { data } = await apiClient.patch<User>(USERS_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteUserResponse>(USERS_ENDPOINTS.byId(id))
    return data
  },

  getTenantBySlug: async (slug: string) => {
    const { data } = await apiClient.get<TenantBySlugResponse>(USERS_ENDPOINTS.tenantBySlug(slug))
    return data
  },
}
