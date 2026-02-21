import { apiClient } from "@/lib/api/client"
import type { TenantMeResponse, UpdateTenantMeInput } from "../types"

const TENANTS_ENDPOINTS = {
  me: "/tenants/me",
} as const

export const tenantsService = {
  me: async () => {
    const { data } = await apiClient.get<TenantMeResponse>(TENANTS_ENDPOINTS.me)
    return data
  },

  updateMe: async (payload: UpdateTenantMeInput) => {
    const { data } = await apiClient.patch<TenantMeResponse>(TENANTS_ENDPOINTS.me, payload)
    return data
  },
}
