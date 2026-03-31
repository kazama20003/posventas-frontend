"use client"

import { useEffect } from "react"

import { useTenantMe } from "@/lib/api/tenants"
import {
  clearTenantId,
  clearTenantSlug,
  setTenantId,
  setTenantSlug,
} from "@/lib/api/tenant-context"
import {
  type ActiveTenantSnapshot,
  useActiveTenantStoreApi,
} from "@/lib/app/active-tenant-context"

type TenantBootstrapProps = {
  tenant: ActiveTenantSnapshot
}

export function TenantBootstrap({ tenant }: TenantBootstrapProps) {
  const tenantQuery = useTenantMe()
  const { initializeTenant, syncTenant, setQueryState, clearTenant } = useActiveTenantStoreApi()

  useEffect(() => {
    initializeTenant(tenant)
    setTenantId(tenant.id)
    setTenantSlug(tenant.slug)
  }, [initializeTenant, tenant])

  useEffect(() => {
    setQueryState({
      isLoading: tenantQuery.isLoading,
      isError: tenantQuery.isError,
      error: tenantQuery.error,
    })
  }, [setQueryState, tenantQuery.error, tenantQuery.isError, tenantQuery.isLoading])

  useEffect(() => {
    if (!tenantQuery.data) {
      return
    }

    syncTenant(tenantQuery.data)
    setTenantId(tenantQuery.data.id)
    setTenantSlug(tenantQuery.data.slug)
  }, [syncTenant, tenantQuery.data])

  useEffect(() => {
    return () => {
      clearTenant()
      clearTenantId()
      clearTenantSlug()
    }
  }, [clearTenant])

  return null
}
