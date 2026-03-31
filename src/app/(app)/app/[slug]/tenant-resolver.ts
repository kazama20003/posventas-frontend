import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { TenantMeResponse } from "@/lib/api/tenants"

export type Tenant = {
  id: string
  slug: string
  name: string
  plan: "starter" | "pro" | "enterprise"
  status: "active" | "inactive" | "trial"
}

const TENANT_ID_COOKIE_NAME = "posventas_tenant_id"
const TENANT_SLUG_COOKIE_NAME = "posventas_tenant_slug"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase()
}

function toTenantPlan(plan: string): Tenant["plan"] {
  switch (plan.trim().toUpperCase()) {
    case "ENTERPRISE":
      return "enterprise"
    case "PRO":
      return "pro"
    default:
      return "starter"
  }
}

function toTenantStatus(status: string): Tenant["status"] {
  switch (status.trim().toUpperCase()) {
    case "ACTIVE":
      return "active"
    case "TRIALING":
      return "trial"
    default:
      return "inactive"
  }
}

function serializeCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore
    .getAll()
    .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
    .join("; ")
}

async function resolveTenantFromBackend(slug: string): Promise<Tenant | null> {
  const cookieStore = await cookies()
  const cookieSlug = cookieStore.get(TENANT_SLUG_COOKIE_NAME)?.value
  const cookieTenantId = cookieStore.get(TENANT_ID_COOKIE_NAME)?.value

  if (!cookieSlug || !cookieTenantId || normalizeSlug(cookieSlug) !== normalizeSlug(slug)) {
    return null
  }

  const headers = new Headers({
    Accept: "application/json",
    Cookie: serializeCookies(cookieStore),
    "x-tenant-id": cookieTenantId,
    "x-tenant-slug": normalizeSlug(cookieSlug),
  })

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/tenants/me`, {
    method: "GET",
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  const tenant = (await response.json()) as TenantMeResponse
  const resolvedSlug = normalizeSlug(tenant.slug)

  if (!tenant.id || !tenant.name || resolvedSlug !== normalizeSlug(slug)) {
    return null
  }

  return {
    id: tenant.id,
    slug: resolvedSlug,
    name: tenant.name,
    plan: toTenantPlan(tenant.subscription?.plan ?? ""),
    status: toTenantStatus(tenant.subscription?.status ?? ""),
  }
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const normalizedSlug = slug.trim().toLowerCase()
  return resolveTenantFromBackend(normalizedSlug)
}

export async function requireActiveTenant(slug: string): Promise<Tenant> {
  // Reemplazar por DB real:
  // const tenant = await prisma.tenant.findUnique({ where: { slug } })
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  if (tenant.status === "inactive") {
    notFound()
  }

  return tenant
}
