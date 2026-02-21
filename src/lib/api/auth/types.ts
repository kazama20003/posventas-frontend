export interface AuthUser {
  id?: string | number
  name?: string
  email?: string
  [key: string]: unknown
}

export interface AuthTenant {
  id?: string | number
  name?: string
  slug?: string
  [key: string]: unknown
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  tenantName?: string
  tenantSlug?: string
  [key: string]: unknown
}

export interface AuthSessionResponse {
  user: AuthUser
  tenant: AuthTenant
}

export interface LogoutResponse {
  ok: true
}

export interface AuthJwtPayload {
  sub?: string | number
  email?: string
  tenantId?: string | number
  tenantSlug?: string
  [key: string]: unknown
}
