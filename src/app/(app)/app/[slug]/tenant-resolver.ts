import { cache } from "react"
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

export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const normalizedSlug = slug.trim().toLowerCase()
  return STATIC_TENANTS.find((tenant) => tenant.slug === normalizedSlug) ?? null
})

export const requireActiveTenant = cache(async (slug: string): Promise<Tenant> => {
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
})
