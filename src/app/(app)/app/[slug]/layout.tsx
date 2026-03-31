import React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ActiveStoreBootstrap } from "@/lib/app/active-store-context"
import { TenantBootstrap } from "./tenant-bootstrap"
import { requireActiveTenant } from "./tenant-resolver"

type DashboardLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

const TENANT_SLUG_COOKIE_NAME = "posventas_tenant_slug"

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { slug } = await params
  const cookieStore = await cookies()
  const tenantSlugFromCookie = cookieStore.get(TENANT_SLUG_COOKIE_NAME)?.value ?? null

  if (tenantSlugFromCookie && tenantSlugFromCookie !== slug) {
    redirect(`/app/${tenantSlugFromCookie}`)
  }

  const tenant = await requireActiveTenant(slug)

  return (
    <SidebarProvider>
      <TenantBootstrap
        tenant={{
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        }}
      />
      <ActiveStoreBootstrap tenantSlug={tenant.slug} />
      <AppSidebar initialTenant={{ slug: tenant.slug, name: tenant.name }} />
      <SidebarInset className="bg-background">
        {children}
        <div className="border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Tenant: {tenant.name} ({tenant.slug})
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
