import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { inventoriesService } from "../services/inventories.service"
import type {
  CreateInventoryInput,
  CreateInventoryMovementInput,
  UpdateInventoryInput,
} from "../types"

export const inventoryKeys = {
  all: ["inventories"] as const,
  lists: () => ["inventories", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["inventories", "list", filters ?? {}] as const,
  details: () => ["inventories", "detail"] as const,
  detail: (id: string | number) => ["inventories", "detail", id] as const,
}

export const inventoryMovementKeys = {
  all: ["inventory-movements"] as const,
  lists: () => ["inventory-movements", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["inventory-movements", "list", filters ?? {}] as const,
  details: () => ["inventory-movements", "detail"] as const,
  detail: (id: string | number) => ["inventory-movements", "detail", id] as const,
}

interface UseInventoriesOptions {
  enabled?: boolean
}

interface UseInventoryOptions {
  enabled?: boolean
}

interface UseInventoryMovementsOptions {
  enabled?: boolean
}

interface UseInventoryMovementOptions {
  enabled?: boolean
}

export function useInventories(options?: UseInventoriesOptions) {
  return useQuery({
    queryKey: inventoryKeys.lists(),
    queryFn: inventoriesService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useInventory(id: string | number | null | undefined, options?: UseInventoryOptions) {
  return useQuery({
    queryKey: inventoryKeys.detail(id ?? ""),
    queryFn: () => inventoriesService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useInventoryMovements(options?: UseInventoryMovementsOptions) {
  return useQuery({
    queryKey: inventoryMovementKeys.lists(),
    queryFn: inventoriesService.listMovements,
    enabled: options?.enabled ?? true,
  })
}

export function useInventoryMovement(
  id: string | number | null | undefined,
  options?: UseInventoryMovementOptions
) {
  return useQuery({
    queryKey: inventoryMovementKeys.detail(id ?? ""),
    queryFn: () => inventoriesService.getMovementById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInventoryInput) => inventoriesService.create(payload),
    onSuccess: (inventory) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      queryClient.setQueryData(inventoryKeys.detail(String(inventory.id)), inventory)
    },
  })
}

export function useUpdateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateInventoryInput }) =>
      inventoriesService.update(id, payload),
    onSuccess: (inventory) => {
      queryClient.setQueryData(inventoryKeys.detail(String(inventory.id)), inventory)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useDeleteInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => inventoriesService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: inventoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInventoryMovementInput) =>
      inventoriesService.createMovement(payload),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryMovementKeys.all })
      queryClient.setQueryData(inventoryMovementKeys.detail(String(movement.id)), movement)
    },
  })
}
