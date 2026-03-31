"use client"

import { create } from "zustand"

import type { TenantMeResponse } from "@/lib/api/tenants"

export type ActiveTenantSnapshot = {
  id: string
  slug: string
  name: string
  createdAt?: string | null
  updatedAt?: string | null
  subscription?: TenantMeResponse["subscription"] | null
}

type ActiveTenantState = {
  tenant: ActiveTenantSnapshot | null
  tenantId: string | null
  tenantSlug: string | null
  tenantName: string | null
  isLoading: boolean
  isError: boolean
  error: unknown
  initializeTenant: (tenant: ActiveTenantSnapshot) => void
  syncTenant: (tenant: TenantMeResponse) => void
  setQueryState: (payload: {
    isLoading: boolean
    isError: boolean
    error: unknown
  }) => void
  clearTenant: () => void
}

const useActiveTenantStore = create<ActiveTenantState>((set) => ({
  tenant: null,
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  isLoading: true,
  isError: false,
  error: null,
  initializeTenant: (tenant) => {
    set((current) => ({
      tenant: {
        ...(current.tenant ?? {}),
        ...tenant,
      },
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    }))
  },
  syncTenant: (tenant) => {
    set({
      tenant,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      isError: false,
      error: null,
    })
  },
  setQueryState: ({ isLoading, isError, error }) => {
    set({
      isLoading,
      isError,
      error,
    })
  },
  clearTenant: () => {
    set({
      tenant: null,
      tenantId: null,
      tenantSlug: null,
      tenantName: null,
      isLoading: false,
      isError: false,
      error: null,
    })
  },
}))

export function useActiveTenant() {
  const tenant = useActiveTenantStore((state) => state.tenant)
  const tenantId = useActiveTenantStore((state) => state.tenantId)
  const tenantSlug = useActiveTenantStore((state) => state.tenantSlug)
  const tenantName = useActiveTenantStore((state) => state.tenantName)
  const isLoading = useActiveTenantStore((state) => state.isLoading)
  const isError = useActiveTenantStore((state) => state.isError)
  const error = useActiveTenantStore((state) => state.error)

  return {
    tenant,
    tenantId,
    tenantSlug,
    tenantName,
    isLoading,
    isError,
    error,
  }
}

export function useActiveTenantStoreApi() {
  const initializeTenant = useActiveTenantStore((state) => state.initializeTenant)
  const syncTenant = useActiveTenantStore((state) => state.syncTenant)
  const setQueryState = useActiveTenantStore((state) => state.setQueryState)
  const clearTenant = useActiveTenantStore((state) => state.clearTenant)

  return {
    initializeTenant,
    syncTenant,
    setQueryState,
    clearTenant,
  }
}

