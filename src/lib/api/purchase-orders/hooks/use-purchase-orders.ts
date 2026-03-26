import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { purchaseOrdersService } from "../services/purchase-orders.service"
import type {
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "../types"

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => ["purchase-orders", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["purchase-orders", "list", filters ?? {}] as const,
  details: () => ["purchase-orders", "detail"] as const,
  detail: (id: string | number) => ["purchase-orders", "detail", id] as const,
}

interface UsePurchaseOrdersOptions {
  enabled?: boolean
}

interface UsePurchaseOrderOptions {
  enabled?: boolean
}

export function usePurchaseOrders(options?: UsePurchaseOrdersOptions) {
  return useQuery({
    queryKey: purchaseOrderKeys.lists(),
    queryFn: purchaseOrdersService.list,
    enabled: options?.enabled ?? true,
  })
}

export function usePurchaseOrder(
  id: string | number | null | undefined,
  options?: UsePurchaseOrderOptions
) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id ?? ""),
    queryFn: () => purchaseOrdersService.getById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderInput) => purchaseOrdersService.create(payload),
    onSuccess: (purchaseOrder) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      queryClient.setQueryData(
        purchaseOrderKeys.detail(String(purchaseOrder.id)),
        purchaseOrder
      )
    },
  })
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdatePurchaseOrderInput }) =>
      purchaseOrdersService.update(id, payload),
    onSuccess: (purchaseOrder) => {
      queryClient.setQueryData(
        purchaseOrderKeys.detail(String(purchaseOrder.id)),
        purchaseOrder
      )
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    },
  })
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: ReceivePurchaseOrderInput
    }) => purchaseOrdersService.receive(id, payload),
    onSuccess: (purchaseOrder) => {
      queryClient.setQueryData(
        purchaseOrderKeys.detail(String(purchaseOrder.id)),
        purchaseOrder
      )
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    },
  })
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => purchaseOrdersService.remove(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: purchaseOrderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    },
  })
}
