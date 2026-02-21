import { cookies } from "next/headers"
import { notFound } from "next/navigation"

export type Tenant = {
  id: string
  slug: string
  name: string
  plan: "starter" | "pro" | "enterprise"
  status: "active" | "inactive" | "trial"
  city: string
}

const STATIC_TENANTS: Tenant[] = [
  {
    id: "t_001",
    slug: "phoenix-store",
    name: "Phoenix Store",
    plan: "pro",
    status: "active",
    city: "Lima",
  },
  {
    id: "t_002",
    slug: "demo-market",
    name: "Demo Market",
    plan: "starter",
    status: "trial",
    city: "Arequipa",
  },
  {
    id: "t_003",
    slug: "central-shop",
    name: "Central Shop",
    plan: "enterprise",
    status: "active",
    city: "Cusco",
  },
  {
    id: "t_004",
    slug: "legacy-store",
    name: "Legacy Store",
    plan: "starter",
    status: "inactive",
    city: "Trujillo",
  },
]

const TENANT_ID_COOKIE_NAME = "posventas_tenant_id"
const TENANT_SLUG_COOKIE_NAME = "posventas_tenant_slug"

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase()
}

function formatTenantNameFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
}

async function resolveTenantFromAuthCookies(slug: string): Promise<Tenant | null> {
  const cookieStore = await cookies()
  const cookieSlug = cookieStore.get(TENANT_SLUG_COOKIE_NAME)?.value
  const cookieTenantId = cookieStore.get(TENANT_ID_COOKIE_NAME)?.value

  if (!cookieSlug || normalizeSlug(cookieSlug) !== normalizeSlug(slug)) {
    return null
  }

  return {
    id: cookieTenantId ?? `tenant_${normalizeSlug(cookieSlug)}`,
    slug: normalizeSlug(cookieSlug),
    name: formatTenantNameFromSlug(cookieSlug),
    plan: "pro",
    status: "active",
    city: "Lima",
  }
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const normalizedSlug = slug.trim().toLowerCase()
  const staticTenant = STATIC_TENANTS.find((tenant) => tenant.slug === normalizedSlug) ?? null

  if (staticTenant) {
    return staticTenant
  }

  return resolveTenantFromAuthCookies(normalizedSlug)
}

export async function requireActiveTenant(slug: string): Promise<Tenant> {
  // Reemplazar por DB real:
  // const tenant = await prisma.tenant.findUnique({ where: { slug } })
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  if (tenant.status !== "active") {
    notFound()
  }

  return tenant
}
