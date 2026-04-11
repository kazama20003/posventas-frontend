import { apiClient } from "@/lib/api/client"
import type {
  CashMovement,
  CashMovementsListResponse,
  CashRegister,
  CashRegisterOpenSessionResponse,
  CashRegistersListResponse,
  CashSession,
  CashSessionsListResponse,
  CloseCashSessionInput,
  CreateCashMovementInput,
  CreateCashRegisterInput,
  DeleteCashRegisterResponse,
  OpenCashSessionInput,
  UpdateCashRegisterInput,
} from "../types"

const CASH_ENDPOINTS = {
  registers: "/cash/registers",
  registerById: (id: string | number) => `/cash/registers/${id}`,
  registerOpenSession: (id: string | number) => `/cash/registers/${id}/open-session`,
  sessions: "/cash/sessions",
  openSession: "/cash/sessions/open",
  sessionById: (id: string | number) => `/cash/sessions/${id}`,
  closeSession: (id: string | number) => `/cash/sessions/${id}/close`,
  movements: "/cash/movements",
  movementById: (id: string | number) => `/cash/movements/${id}`,
} as const

export const cashService = {
  createRegister: async (payload: CreateCashRegisterInput) => {
    const { data } = await apiClient.post<CashRegister>(CASH_ENDPOINTS.registers, payload)
    return data
  },

  listRegisters: async () => {
    const { data } = await apiClient.get<CashRegistersListResponse>(CASH_ENDPOINTS.registers)
    return data
  },

  getRegisterById: async (id: string | number) => {
    const { data } = await apiClient.get<CashRegister>(CASH_ENDPOINTS.registerById(id))
    return data
  },

  updateRegister: async (id: string | number, payload: UpdateCashRegisterInput) => {
    const { data } = await apiClient.patch<CashRegister>(CASH_ENDPOINTS.registerById(id), payload)
    return data
  },

  removeRegister: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteCashRegisterResponse>(
      CASH_ENDPOINTS.registerById(id)
    )
    return data
  },

  getRegisterOpenSession: async (id: string | number) => {
    const { data } = await apiClient.get<CashRegisterOpenSessionResponse>(
      CASH_ENDPOINTS.registerOpenSession(id)
    )
    return data
  },

  openSession: async (payload: OpenCashSessionInput) => {
    const { data } = await apiClient.post<CashSession>(CASH_ENDPOINTS.openSession, payload)
    return data
  },

  listSessions: async () => {
    const { data } = await apiClient.get<CashSessionsListResponse>(CASH_ENDPOINTS.sessions)
    return data
  },

  getSessionById: async (id: string | number) => {
    const { data } = await apiClient.get<CashSession>(CASH_ENDPOINTS.sessionById(id))
    return data
  },

  closeSession: async (id: string | number, payload: CloseCashSessionInput) => {
    const { data } = await apiClient.post<CashSession>(CASH_ENDPOINTS.closeSession(id), payload)
    return data
  },

  createMovement: async (payload: CreateCashMovementInput) => {
    const { data } = await apiClient.post<CashMovement>(CASH_ENDPOINTS.movements, payload)
    return data
  },

  listMovements: async () => {
    const { data } = await apiClient.get<CashMovementsListResponse>(CASH_ENDPOINTS.movements)
    return data
  },

  getMovementById: async (id: string | number) => {
    const { data } = await apiClient.get<CashMovement>(CASH_ENDPOINTS.movementById(id))
    return data
  },
}
