import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { productsService } from "../services/products.service"
import type { CreateProductInput, UpdateProductInput } from "../types"

export const productKeys = {
  all: ["products"] as const,
  lists: () => ["products", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["products", "list", filters ?? {}] as const,
  details: () => ["products", "detail"] as const,
  detail: (id: string | number) => ["products", "detail", id] as const,
}

interface UseProductsOptions {
  enabled?: boolean
}

interface UseProductOptions {
  enabled?: boolean
}

export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: productsService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useProduct(id: string | number | null | undefined, options?: UseProductOptions) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => productsService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductInput) => productsService.create(payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.setQueryData(productKeys.detail(String(product.id)), product)
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateProductInput }) =>
      productsService.update(id, payload),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(String(product.id)), product)
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => productsService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
