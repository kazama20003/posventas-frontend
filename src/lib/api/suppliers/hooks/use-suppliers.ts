import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { suppliersService } from "../services/suppliers.service"
import type { CreateSupplierInput, UpdateSupplierInput } from "../types"

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => ["suppliers", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["suppliers", "list", filters ?? {}] as const,
  details: () => ["suppliers", "detail"] as const,
  detail: (id: string | number) => ["suppliers", "detail", id] as const,
}

interface UseSuppliersOptions {
  enabled?: boolean
}

interface UseSupplierOptions {
  enabled?: boolean
}

export function useSuppliers(options?: UseSuppliersOptions) {
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: suppliersService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useSupplier(
  id: string | number | null | undefined,
  options?: UseSupplierOptions
) {
  return useQuery({
    queryKey: supplierKeys.detail(id ?? ""),
    queryFn: () => suppliersService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplierInput) => suppliersService.create(payload),
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      queryClient.setQueryData(supplierKeys.detail(String(supplier.id)), supplier)
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateSupplierInput }) =>
      suppliersService.update(id, payload),
    onSuccess: (supplier) => {
      queryClient.setQueryData(supplierKeys.detail(String(supplier.id)), supplier)
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => suppliersService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: supplierKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}
