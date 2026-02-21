"use client"

import { useEffect } from "react"
import {
  clearTenantId,
  clearTenantSlug,
  setTenantId,
  setTenantSlug,
} from "./tenant-context"

type TenantContextHydratorProps = {
  tenantId: string | null
  tenantSlug: string | null
}

export function TenantContextHydrator({
  tenantId,
  tenantSlug,
}: TenantContextHydratorProps) {
  useEffect(() => {
    if (tenantId) {
      setTenantId(tenantId)
    } else {
      clearTenantId()
    }

    if (tenantSlug) {
      setTenantSlug(tenantSlug)
    } else {
      clearTenantSlug()
    }
  }, [tenantId, tenantSlug])

  return null
}
