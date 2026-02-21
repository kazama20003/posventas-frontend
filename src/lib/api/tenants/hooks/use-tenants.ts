import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { setTenantId, setTenantSlug } from "@/lib/api/tenant-context"
import { tenantsService } from "../services/tenants.service"
import type { UpdateTenantMeInput } from "../types"

export const tenantKeys = {
  all: ["tenants"] as const,
  me: ["tenants", "me"] as const,
}

interface UseTenantMeOptions {
  enabled?: boolean
}

function syncTenantContext(tenantId: string, tenantSlug: string) {
  setTenantId(tenantId)
  setTenantSlug(tenantSlug)
}

export function useTenantMe(options?: UseTenantMeOptions) {
  const query = useQuery({
    queryKey: tenantKeys.me,
    queryFn: tenantsService.me,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    syncTenantContext(query.data.id, query.data.slug)
  }, [query.data])

  return query
}

export function useUpdateTenantMe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTenantMeInput) => tenantsService.updateMe(payload),
    onSuccess: (tenant) => {
      syncTenantContext(tenant.id, tenant.slug)
      queryClient.setQueryData(tenantKeys.me, tenant)
      queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    },
  })
}
