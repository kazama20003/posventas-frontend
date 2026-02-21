import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/auth.service"
import type { LoginInput, RegisterInput } from "../types"
import {
  clearTenantId,
  clearTenantSlug,
  setTenantId,
  setTenantSlug,
} from "@/lib/api/tenant-context"

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
}

interface UseAuthMeOptions {
  enabled?: boolean
}

export function useAuthMe(options?: UseAuthMeOptions) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authService.me,
    enabled: options?.enabled ?? true,
    retry: false,
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RegisterInput) => authService.register(payload),
    onSuccess: (session) => {
      const tenantId =
        typeof session.tenant.id === "string" || typeof session.tenant.id === "number"
          ? String(session.tenant.id)
          : null
      const tenantSlug = typeof session.tenant.slug === "string" ? session.tenant.slug : null
      setTenantId(tenantId)
      setTenantSlug(tenantSlug)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginInput) => authService.login(payload),
    onSuccess: (session) => {
      const tenantId =
        typeof session.tenant.id === "string" || typeof session.tenant.id === "number"
          ? String(session.tenant.id)
          : null
      const tenantSlug = typeof session.tenant.slug === "string" ? session.tenant.slug : null
      setTenantId(tenantId)
      setTenantSlug(tenantSlug)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearTenantId()
      clearTenantSlug()
      queryClient.removeQueries({ queryKey: authKeys.me })
    },
  })
}

export function useGoogleAuth() {
  const startGoogleAuth = () => {
    if (typeof window === "undefined") {
      return
    }

    window.location.assign(authService.getGoogleAuthUrl())
  }

  return {
    startGoogleAuth,
  }
}
