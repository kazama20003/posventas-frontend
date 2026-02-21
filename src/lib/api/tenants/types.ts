export type TenantPlan = "FREE" | "PRO" | "ENTERPRISE" | (string & {})
export type TenantSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | (string & {})
export type TenantSubscriptionProvider = "STRIPE" | "PADDLE" | (string & {})

export interface TenantSubscription {
  id: string
  plan: TenantPlan
  status: TenantSubscriptionStatus
  provider: TenantSubscriptionProvider
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  lastProviderEventAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantMeResponse {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  subscription: TenantSubscription
}

export interface UpdateTenantMeInput {
  name: string
}
