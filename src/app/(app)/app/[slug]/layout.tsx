import React from "react"
import { AppSidebar } from "@/components/app/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { requireActiveTenant } from "./tenant-resolver"

type DashboardLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { slug } = await params
  const tenant = await requireActiveTenant(slug)

  return (
    <SidebarProvider>
      <AppSidebar />
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
