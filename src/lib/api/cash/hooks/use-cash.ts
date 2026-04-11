import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cashService } from "../services/cash.service"
import type {
  CloseCashSessionInput,
  CreateCashMovementInput,
  CreateCashRegisterInput,
  UpdateCashRegisterInput,
  OpenCashSessionInput,
} from "../types"

export const cashKeys = {
  all: ["cash"] as const,
  registers: {
    all: ["cash", "registers"] as const,
    lists: () => ["cash", "registers", "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["cash", "registers", "list", filters ?? {}] as const,
    details: () => ["cash", "registers", "detail"] as const,
    detail: (id: string | number) => ["cash", "registers", "detail", id] as const,
    openSession: (id: string | number) =>
      ["cash", "registers", "detail", id, "open-session"] as const,
  },
  sessions: {
    all: ["cash", "sessions"] as const,
    lists: () => ["cash", "sessions", "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["cash", "sessions", "list", filters ?? {}] as const,
    details: () => ["cash", "sessions", "detail"] as const,
    detail: (id: string | number) => ["cash", "sessions", "detail", id] as const,
  },
  movements: {
    all: ["cash", "movements"] as const,
    lists: () => ["cash", "movements", "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["cash", "movements", "list", filters ?? {}] as const,
    details: () => ["cash", "movements", "detail"] as const,
    detail: (id: string | number) => ["cash", "movements", "detail", id] as const,
  },
}

interface UseCashRegistersOptions {
  enabled?: boolean
}

interface UseCashRegisterOptions {
  enabled?: boolean
}

interface UseCashRegisterOpenSessionOptions {
  enabled?: boolean
}

interface UseCashSessionsOptions {
  enabled?: boolean
}

interface UseCashSessionOptions {
  enabled?: boolean
}

interface UseCashMovementsOptions {
  enabled?: boolean
}

interface UseCashMovementOptions {
  enabled?: boolean
}

export function useCashRegisters(options?: UseCashRegistersOptions) {
  return useQuery({
    queryKey: cashKeys.registers.lists(),
    queryFn: cashService.listRegisters,
    enabled: options?.enabled ?? true,
  })
}

export function useCashRegister(
  id: string | number | null | undefined,
  options?: UseCashRegisterOptions
) {
  return useQuery({
    queryKey: cashKeys.registers.detail(id ?? ""),
    queryFn: () => cashService.getRegisterById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCashRegisterOpenSession(
  id: string | number | null | undefined,
  options?: UseCashRegisterOpenSessionOptions
) {
  return useQuery({
    queryKey: cashKeys.registers.openSession(id ?? ""),
    queryFn: () => cashService.getRegisterOpenSession(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCashRegisterInput) => cashService.createRegister(payload),
    onSuccess: (cashRegister) => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
      queryClient.setQueryData(cashKeys.registers.detail(String(cashRegister.id)), cashRegister)
    },
  })
}

export function useUpdateCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: UpdateCashRegisterInput
    }) => cashService.updateRegister(id, payload),
    onSuccess: (cashRegister) => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
      queryClient.setQueryData(cashKeys.registers.detail(String(cashRegister.id)), cashRegister)
    },
  })
}

export function useDeleteCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => cashService.removeRegister(id),
    onSuccess: (_response, id) => {
      queryClient.removeQueries({ queryKey: cashKeys.registers.detail(id) })
      queryClient.removeQueries({ queryKey: cashKeys.registers.openSession(id) })
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
    },
  })
}

export function useCashSessions(options?: UseCashSessionsOptions) {
  return useQuery({
    queryKey: cashKeys.sessions.lists(),
    queryFn: cashService.listSessions,
    enabled: options?.enabled ?? true,
  })
}

export function useCashSession(
  id: string | number | null | undefined,
  options?: UseCashSessionOptions
) {
  return useQuery({
    queryKey: cashKeys.sessions.detail(id ?? ""),
    queryFn: () => cashService.getSessionById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useOpenCashSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OpenCashSessionInput) => cashService.openSession(payload),
    onSuccess: (cashSession) => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
      queryClient.setQueryData(cashKeys.sessions.detail(String(cashSession.id)), cashSession)
      queryClient.setQueryData(
        cashKeys.registers.openSession(String(cashSession.cashRegisterId)),
        cashSession
      )
    },
  })
}

export function useCloseCashSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: CloseCashSessionInput
    }) => cashService.closeSession(id, payload),
    onSuccess: (cashSession) => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
      queryClient.setQueryData(cashKeys.sessions.detail(String(cashSession.id)), cashSession)
      if (cashSession.cashRegisterId) {
        queryClient.setQueryData(
          cashKeys.registers.openSession(String(cashSession.cashRegisterId)),
          null
        )
      }
    },
  })
}

export function useCashMovements(options?: UseCashMovementsOptions) {
  return useQuery({
    queryKey: cashKeys.movements.lists(),
    queryFn: cashService.listMovements,
    enabled: options?.enabled ?? true,
  })
}

export function useCashMovement(
  id: string | number | null | undefined,
  options?: UseCashMovementOptions
) {
  return useQuery({
    queryKey: cashKeys.movements.detail(id ?? ""),
    queryFn: () => cashService.getMovementById(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
  })
}

export function useCreateCashMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCashMovementInput) => cashService.createMovement(payload),
    onSuccess: (cashMovement) => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all })
      queryClient.setQueryData(cashKeys.movements.detail(String(cashMovement.id)), cashMovement)
    },
  })
}
