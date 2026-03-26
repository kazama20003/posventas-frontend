"use client"

import * as React from "react"
import { Building2, Check, ChevronsUpDown, Command } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getApiErrorMessage } from "@/lib/api/stores"
import { useActiveStore } from "@/lib/app/active-store-context"

type ActiveStoreSelectorProps = {
  appLabel: string
  tenantLabel: string
}

export function ActiveStoreSelector({
  appLabel,
  tenantLabel,
}: ActiveStoreSelectorProps) {
  const { isMobile } = useSidebar()
  const {
    stores,
    selectedStore,
    selectedStoreId,
    setSelectedStoreId,
    isLoading,
    isError,
    error,
  } = useActiveStore()

  const helperText = React.useMemo(() => {
    if (isLoading) {
      return "Cargando sucursales"
    }

    if (isError) {
      return getApiErrorMessage(error, "No se pudieron cargar las sucursales.")
    }

    if (selectedStore?.code) {
      return selectedStore.code
    }

    return selectedStore?.address ?? tenantLabel
  }, [error, isError, isLoading, selectedStore, tenantLabel])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={isLoading || stores.length === 0}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{appLabel}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {selectedStore?.name ?? helperText}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">Sucursal activa</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {appLabel} · {helperText}
              </span>
            </DropdownMenuLabel>

            {stores.length > 0 ? (
              stores.map((store) => {
                const storeId = String(store.id)
                const isSelected = storeId === selectedStoreId

                return (
                  <DropdownMenuItem
                    key={storeId}
                    onSelect={() => setSelectedStoreId(storeId)}
                    className="gap-3 p-2"
                  >
                    <div className="flex size-7 items-center justify-center rounded-md border">
                      <Building2 className="size-3.5" />
                    </div>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{store.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {store.code ?? store.address ?? `ID ${storeId}`}
                      </span>
                    </div>
                    {isSelected ? <Check className="size-4 text-primary" /> : null}
                  </DropdownMenuItem>
                )
              })
            ) : (
              <DropdownMenuItem disabled className="p-2 text-muted-foreground">
                No hay sucursales disponibles
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="p-2 text-xs text-muted-foreground">
              Este cambio se aplica globalmente al POS.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
