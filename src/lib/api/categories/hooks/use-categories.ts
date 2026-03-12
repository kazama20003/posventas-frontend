import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { categoriesService } from "../services/categories.service"
import type { CreateCategoryInput, UpdateCategoryInput } from "../types"

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => ["categories", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["categories", "list", filters ?? {}] as const,
  details: () => ["categories", "detail"] as const,
  detail: (id: string | number) => ["categories", "detail", id] as const,
}

interface UseCategoriesOptions {
  enabled?: boolean
}

interface UseCategoryOptions {
  enabled?: boolean
}

export function useCategories(options?: UseCategoriesOptions) {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: categoriesService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useCategory(
  id: string | number | null | undefined,
  options?: UseCategoryOptions
) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ""),
    queryFn: () => categoriesService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryInput) => categoriesService.create(payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.setQueryData(categoryKeys.detail(String(category.id)), category)
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateCategoryInput }) =>
      categoriesService.update(id, payload),
    onSuccess: (category) => {
      queryClient.setQueryData(categoryKeys.detail(String(category.id)), category)
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => categoriesService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
