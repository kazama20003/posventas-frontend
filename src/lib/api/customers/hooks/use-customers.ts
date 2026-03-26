import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customersService } from "../services/customers.service"
import type { CreateCustomerInput, UpdateCustomerInput } from "../types"

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => ["customers", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["customers", "list", filters ?? {}] as const,
  details: () => ["customers", "detail"] as const,
  detail: (id: string | number) => ["customers", "detail", id] as const,
}

interface UseCustomersOptions {
  enabled?: boolean
}

interface UseCustomerOptions {
  enabled?: boolean
}

export function useCustomers(options?: UseCustomersOptions) {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: customersService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useCustomer(
  id: string | number | null | undefined,
  options?: UseCustomerOptions
) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customersService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCustomerInput) => customersService.create(payload),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.setQueryData(customerKeys.detail(String(customer.id)), customer)
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateCustomerInput }) =>
      customersService.update(id, payload),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(String(customer.id)), customer)
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => customersService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
