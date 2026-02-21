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
import { useParams, usePathname } from "next/navigation"

import { NavMain, type NavMainGroup } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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

const isRouteActive = (pathname: string | null, url: string) => {
  if (!pathname) return false
  if (pathname === url) return true
  return pathname.startsWith(`${url}/`)
}

const buildMainNavGroups = (
  route: BuildRoute,
  role: UserRole,
  pathname: string | null
): NavMainGroup[] => {
  const reportsItems = [
    {
      title: "Resumen general",
      url: route("/reports"),
    },
    {
      title: "Ventas",
      url: route("/reports/sales"),
    },
    {
      title: "Clientes",
      url: route("/reports/customers"),
    },
    {
      title: "Inventario",
      url: route("/reports/inventory"),
    },
  ]

  if (role === "admin" || role === "support") {
    reportsItems.push({
      title: "Auditoria",
      url: route("/audit/logs"),
    })
  }

  return [
    {
      label: "Ventas",
      items: [
        {
          title: "Punto de venta",
          url: route("/pos"),
          icon: ShoppingCart,
          isActive: isRouteActive(pathname, route("/pos")),
        },
        {
          title: "Ventas",
          url: route("/sales"),
          icon: ClipboardList,
          isActive: isRouteActive(pathname, route("/sales")),
        },
        {
          title: "Clientes",
          url: route("/customers"),
          icon: UserCircle2,
          isActive: isRouteActive(pathname, route("/customers")),
        },
      ],
    },
    {
      label: "Inventario",
      items: [
        {
          title: "Productos",
          url: route("/products"),
          icon: Package,
          isActive: isRouteActive(pathname, route("/products")),
          items: [
            { title: "Todos los productos", url: route("/products") },
            { title: "Categorias", url: route("/products/categories") },
          ],
        },
        {
          title: "Inventario",
          url: route("/inventory"),
          icon: Warehouse,
          isActive: isRouteActive(pathname, route("/inventory")),
          items: [
            { title: "Stock actual", url: route("/inventory") },
            { title: "Movimientos", url: route("/inventory/movements") },
            { title: "Ajustes", url: route("/inventory/adjustments") },
          ],
        },
        {
          title: "Compras",
          url: route("/purchases"),
          icon: Truck,
          isActive: isRouteActive(pathname, route("/purchases")),
        },
      ],
    },
    {
      label: "Reportes",
      items: [
        {
          title: "Analitica y reportes",
          url: route("/reports"),
          icon: ClipboardList,
          isActive:
            isRouteActive(pathname, route("/reports")) ||
            isRouteActive(pathname, route("/audit/logs")),
          items: reportsItems,
        },
      ],
    },
    {
      label: "Administracion",
      items: [
        {
          title: "Sucursales",
          url: route("/tenancy/stores"),
          icon: Building2,
          isActive: isRouteActive(pathname, route("/tenancy/stores")),
        },
        {
          title: "Usuarios y roles",
          url: route("/access/users"),
          icon: Users,
          isActive: isRouteActive(pathname, route("/access/users")),
        },
        {
          title: "Facturacion",
          url: route("/billing/subscriptions"),
          icon: CreditCard,
          isActive: isRouteActive(pathname, route("/billing/subscriptions")),
        },
        {
          title: "Configuracion",
          url: route("/settings/app"),
          icon: Settings2,
          isActive: isRouteActive(pathname, route("/settings/app")),
        },
      ],
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{ slug?: string | string[] }>()
  const pathname = usePathname()
  const rawSlug = params?.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
  const dashboardUrl = slug ? `/app/${slug}` : "#"

  const route = React.useCallback<BuildRoute>(
    (path) => {
      if (!slug) return "#"
      return `/app/${slug}${path}`
    },
    [slug]
  )

  const navMainGroups = React.useMemo(
    () => buildMainNavGroups(route, userData.user.role, pathname),
    [route, pathname]
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-2">
        <div className="rounded-lg bg-sidebar-accent/20 px-2 py-2">
          <a href={dashboardUrl} className="flex min-w-0 items-center gap-3">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Command className="size-4" />
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Phoenix POS</span>
              <span className="truncate text-xs text-sidebar-foreground/70">{slug ?? "tenant"}</span>
            </div>
          </a>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isRouteActive(pathname, dashboardUrl)}
              size="sm"
              asChild
            >
              <a href={dashboardUrl}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarSeparator />
        <NavMain groups={navMainGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
