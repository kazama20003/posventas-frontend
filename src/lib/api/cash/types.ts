import type { Store } from "@/lib/api/stores"
import type { User } from "@/lib/api/users"

export const CASH_MOVEMENT_MANUAL_TYPES = ["CASH_IN", "CASH_OUT"] as const

export type CashMovementManualType =
  (typeof CASH_MOVEMENT_MANUAL_TYPES)[number]

export const CASH_SESSION_STATUS_VALUES = ["OPEN", "CLOSED"] as const

export type CashSessionStatusValue = (typeof CASH_SESSION_STATUS_VALUES)[number]

export interface CashRegister {
  id: string | number
  storeId: string
  store?: Store | null
  name: string
  code?: string | null
  isActive?: boolean
  deletedAt?: string | null
  currentSessionId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CashSession {
  id: string | number
  cashRegisterId: string
  cashRegister?: CashRegister | null
  openedByUserId?: string | null
  openedBy?: User | null
  closedByUserId?: string | null
  closedBy?: User | null
  openingAmount: number
  expectedClosingAmount?: number | null
  countedClosingAmount?: number | null
  closingAmount?: number | null
  notes?: string | null
  status?: CashSessionStatusValue | (string & {})
  openedAt?: string | null
  closedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CashMovement {
  id: string | number
  cashRegisterId: string
  cashRegister?: CashRegister | null
  cashSessionId?: string | null
  cashSession?: CashSession | null
  createdByUserId?: string | null
  createdBy?: User | null
  type: CashMovementManualType | (string & {})
  amount: number
  reason?: string | null
  referenceId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateCashRegisterInput {
  storeId: string
  name: string
  code?: string
}

export interface UpdateCashRegisterInput {
  name?: string
  code?: string
  isActive?: boolean
}

export interface OpenCashSessionInput {
  cashRegisterId: string
  openingAmount: number
  notes?: string
}

export interface CloseCashSessionInput {
  countedClosingAmount: number
  notes?: string
}

export interface CreateCashMovementInput {
  cashRegisterId: string
  cashSessionId?: string
  type: CashMovementManualType
  amount: number
  reason?: string
  referenceId?: string
}

export type CashRegistersListResponse = CashRegister[]

export type CashSessionsListResponse = CashSession[]

export type CashMovementsListResponse = CashMovement[]

export type CashRegisterOpenSessionResponse = CashSession | null

export interface DeleteCashRegisterResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
