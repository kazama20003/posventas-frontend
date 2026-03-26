import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ordersService } from "../services/orders.service"
import type { CreateOrderInput, FulfillOrderInput, UpdateOrderInput } from "../types"

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => ["orders", "list"] as const,
  list: (filters?: Record<string, unknown>) => ["orders", "list", filters ?? {}] as const,
  details: () => ["orders", "detail"] as const,
  detail: (id: string | number) => ["orders", "detail", id] as const,
}

interface UseOrdersOptions {
  enabled?: boolean
}

interface UseOrderOptions {
  enabled?: boolean
}

export function useOrders(options?: UseOrdersOptions) {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: ordersService.list,
    enabled: options?.enabled ?? true,
  })
}

export function useOrder(id: string | number | null | undefined, options?: UseOrderOptions) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => ordersService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderInput) => ordersService.create(payload),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.setQueryData(orderKeys.detail(String(order.id)), order)
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateOrderInput }) =>
      ordersService.update(id, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(String(order.id)), order)
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export function useFulfillOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload?: FulfillOrderInput
    }) => ordersService.fulfill(id, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(String(order.id)), order)
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => ordersService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: orderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
