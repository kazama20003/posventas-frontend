"use client"

import * as React from "react"
import {
  Banknote,
  Building2,
  ClipboardList,
  CreditCard,
  Handshake,
  LayoutDashboard,
  Package,
  Settings2,
  ShoppingCart,
  Truck,
  UserCircle2,
  Users,
  Warehouse,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { ActiveStoreSelector } from "./active-store-selector"
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
import { useAuthMe } from "@/lib/api/auth"
import { useActiveTenant } from "@/lib/app/active-tenant-context"

type BuildRoute = (path: string) => string
type UserRole = "admin" | "support" | "manager" | "seller"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  initialTenant: {
    slug: string
    name: string
  }
}

function readStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function getNameFromEmail(email: string | null) {
  if (!email) {
    return null
  }

  const localPart = email.split("@")[0]?.trim()
  if (!localPart) {
    return null
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeRole(value: string | null): UserRole {
  switch (value?.trim().toUpperCase()) {
    case "SUPPORT":
      return "support"
    case "MANAGER":
      return "manager"
    case "SELLER":
    case "CASHIER":
      return "seller"
    case "OWNER":
    case "ADMIN":
    default:
      return "admin"
  }
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
          title: "Caja",
          url: route("/cash"),
          icon: Banknote,
          isActive: isRouteActive(pathname, route("/cash")),
        },
        {
          title: "Punto de venta",
          url: route("/pos"),
          icon: ShoppingCart,
          isActive: isRouteActive(pathname, route("/pos")),
        },
        {
          title: "Pedidos",
          url: route("/orders"),
          icon: ClipboardList,
          isActive: isRouteActive(pathname, route("/orders")),
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
          title: "Proveedores",
          url: route("/suppliers"),
          icon: Handshake,
          isActive: isRouteActive(pathname, route("/suppliers")),
        },
        {
          title: "Compras",
          url: route("/purchase-orders"),
          icon: Truck,
          isActive: isRouteActive(pathname, route("/purchase-orders")),
        },
        {
          title: "Almacenes",
          url: route("/warehouses"),
          icon: Warehouse,
          isActive: isRouteActive(pathname, route("/warehouses")),
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
          url: route("/stores"),
          icon: Building2,
          isActive: isRouteActive(pathname, route("/stores")),
        },
        {
          title: "Usuarios y roles",
          url: route("/users"),
          icon: Users,
          isActive:
            isRouteActive(pathname, route("/users")) ||
            isRouteActive(pathname, route("/access/users")),
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

export function AppSidebar({ initialTenant, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const authQuery = useAuthMe()
  const { tenantSlug, tenantName } = useActiveTenant()
  const slug = tenantSlug ?? initialTenant.slug
  const tenantLabel = tenantName ?? initialTenant.name
  const dashboardUrl = slug ? `/app/${slug}` : "#"
  const currentUser = React.useMemo(() => {
    const payload = authQuery.data && typeof authQuery.data === "object"
      ? (authQuery.data as Record<string, unknown>)
      : {}
    const email = readStringField(payload, ["email"])
    const name =
      readStringField(payload, ["name", "displayName", "fullName", "username"]) ??
      getNameFromEmail(email) ??
      "Mi cuenta"
    const avatar =
      readStringField(payload, ["avatar", "avatarUrl", "picture", "image", "photoUrl"]) ?? ""
    const role = normalizeRole(readStringField(payload, ["role", "userRole"]))

    return {
      name,
      email: email ?? "",
      avatar,
      role,
    }
  }, [authQuery.data])

  const route = React.useCallback<BuildRoute>(
    (path) => {
      if (!slug) return "#"
      return `/app/${slug}${path}`
    },
    [slug]
  )

  const navMainGroups = React.useMemo(
    () => buildMainNavGroups(route, currentUser.role, pathname),
    [currentUser.role, route, pathname]
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-2">
        <ActiveStoreSelector appLabel="Phoenix POS" tenantLabel={tenantLabel} />
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
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
