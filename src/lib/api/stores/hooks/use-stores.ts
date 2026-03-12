import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { storesService } from "../services/stores.service"
import type { CreateStoreInput, UpdateStoreInput } from "../types"

export const storeKeys = {
  all: ["stores"] as const,
  lists: () => ["stores", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["stores", "list", filters ?? {}] as const,
  details: () => ["stores", "detail"] as const,
  detail: (id: string | number) => ["stores", "detail", id] as const,
}

interface UseStoresOptions {
  enabled?: boolean
}

interface UseStoreOptions {
  enabled?: boolean
}

export function useStores(options?: UseStoresOptions) {
  return useQuery({
    queryKey: storeKeys.lists(),
    queryFn: storesService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useStore(id: string | number | null | undefined, options?: UseStoreOptions) {
  return useQuery({
    queryKey: storeKeys.detail(id ?? ""),
    queryFn: () => storesService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStoreInput) => storesService.create(payload),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
      queryClient.setQueryData(storeKeys.detail(String(store.id)), store)
    },
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateStoreInput }) =>
      storesService.update(id, payload),
    onSuccess: (store) => {
      queryClient.setQueryData(storeKeys.detail(String(store.id)), store)
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => storesService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: storeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}
