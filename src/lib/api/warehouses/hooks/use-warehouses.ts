import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { warehousesService } from "../services/warehouses.service"
import type { CreateWarehouseInput, UpdateWarehouseInput } from "../types"

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => ["warehouses", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["warehouses", "list", filters ?? {}] as const,
  details: () => ["warehouses", "detail"] as const,
  detail: (id: string | number) => ["warehouses", "detail", id] as const,
}

interface UseWarehousesOptions {
  enabled?: boolean
}

interface UseWarehouseOptions {
  enabled?: boolean
}

export function useWarehouses(options?: UseWarehousesOptions) {
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: warehousesService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useWarehouse(id: string | number | null | undefined, options?: UseWarehouseOptions) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ""),
    queryFn: () => warehousesService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWarehouseInput) => warehousesService.create(payload),
    onSuccess: (warehouse) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
      queryClient.setQueryData(warehouseKeys.detail(String(warehouse.id)), warehouse)
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateWarehouseInput }) =>
      warehousesService.update(id, payload),
    onSuccess: (warehouse) => {
      queryClient.setQueryData(warehouseKeys.detail(String(warehouse.id)), warehouse)
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => warehousesService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: warehouseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}
