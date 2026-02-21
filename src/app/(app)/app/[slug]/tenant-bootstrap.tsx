"use client"

import { useTenantMe } from "@/lib/api/tenants"

export function TenantBootstrap() {
  useTenantMe()
  return null
}
