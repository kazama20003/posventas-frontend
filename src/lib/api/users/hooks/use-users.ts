import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usersService } from "../services/users.service"
import type { CreateUserInput, UpdateUserInput } from "../types"

export const userKeys = {
  all: ["users"] as const,
  lists: () => ["users", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["users", "list", filters ?? {}] as const,
  details: () => ["users", "detail"] as const,
  detail: (id: string | number) => ["users", "detail", id] as const,
  tenantBySlug: (slug: string) => ["users", "tenant", slug] as const,
}

interface UseUsersOptions {
  enabled?: boolean
}

interface UseUserOptions {
  enabled?: boolean
}

interface UseTenantBySlugOptions {
  enabled?: boolean
}

export function useUsers(options?: UseUsersOptions) {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useUser(id: string | number | null | undefined, options?: UseUserOptions) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => usersService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useTenantBySlug(
  slug: string | null | undefined,
  options?: UseTenantBySlugOptions
) {
  return useQuery({
    queryKey: userKeys.tenantBySlug(slug ?? ""),
    queryFn: () => usersService.getTenantBySlug(slug ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(slug),
    retry: false,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserInput) => usersService.create(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.setQueryData(userKeys.detail(String(user.id)), user)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateUserInput }) =>
      usersService.update(id, payload),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(String(user.id)), user)
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => usersService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
