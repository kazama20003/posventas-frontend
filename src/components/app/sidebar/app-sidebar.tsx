"use client"

import * as React from "react"
import {
  Building2,
  ClipboardList,
  Command,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings2,
  ShoppingCart,
  Truck,
  UserCircle2,
  Users,
  Warehouse,
} from "lucide-react"
import { useParams } from "next/navigation"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type BuildRoute = (path: string) => string
type UserRole = "admin" | "support" | "manager" | "seller"

const userData = {
  user: {
    name: "Usuario Demo",
    email: "usuario@phoenix.com",
    avatar: "",
    role: "admin" as UserRole,
  },
}

const buildMainNav = (route: BuildRoute, role: UserRole) => [
  {
    title: "Dashboard",
    url: route(""),
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Ventas",
    url: route("/sales/orders"),
    icon: ShoppingCart,
  },
  {
    title: "Clientes",
    url: route("/crm/customers"),
    icon: UserCircle2,
  },
  {
    title: "Productos",
    url: route("/catalog/products"),
    icon: Package,
  },
  {
    title: "Inventario",
    url: route("/inventory/stock"),
    icon: Warehouse,
  },
  {
    title: "Compras",
    url: route("/purchases/orders"),
    icon: Truck,
  },
  {
    title: "Sucursales y almacenes",
    url: route("/tenancy/stores"),
    icon: Building2,
  },
  {
    title: "Usuarios y roles",
    url: route("/access/users"),
    icon: Users,
  },
  {
    title: "Configuracion",
    url: route("/settings/app"),
    icon: Settings2,
  },
  {
    title: "Facturacion / Plan",
    url: route("/billing/subscriptions"),
    icon: CreditCard,
  },
  ...(role === "admin" || role === "support"
    ? [
        {
          title: "Auditoria",
          url: route("/audit/logs"),
          icon: ClipboardList,
        },
      ]
    : []),
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{ slug?: string | string[] }>()
  const rawSlug = params?.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug

  const route = React.useCallback<BuildRoute>(
    (path) => {
      if (!slug) return "#"
      return `/app/${slug}${path}`
    },
    [slug]
  )

  const navMain = React.useMemo(
    () => buildMainNav(route, userData.user.role),
    [route]
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={slug ? `/app/${slug}/dashboard` : "#"}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Phoenix POS</span>
                  <span className="truncate text-xs">{slug ?? "tenant"}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
