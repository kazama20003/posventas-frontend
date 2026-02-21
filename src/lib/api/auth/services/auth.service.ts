import { buildApiUrl, apiClient } from "@/lib/api/client"
import type {
  AuthJwtPayload,
  AuthSessionResponse,
  LoginInput,
  LogoutResponse,
  RegisterInput,
} from "../types"

const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  google: "/auth/google",
  googleCallback: "/auth/google/callback",
  logout: "/auth/logout",
  me: "/auth/me",
} as const

export const authService = {
  register: async (payload: RegisterInput) => {
    const { data } = await apiClient.post<AuthSessionResponse>(AUTH_ENDPOINTS.register, payload)
    return data
  },

  login: async (payload: LoginInput) => {
    const { data } = await apiClient.post<AuthSessionResponse>(AUTH_ENDPOINTS.login, payload)
    return data
  },

  logout: async () => {
    const { data } = await apiClient.post<LogoutResponse>(AUTH_ENDPOINTS.logout)
    return data
  },

  me: async () => {
    const { data } = await apiClient.get<AuthJwtPayload>(AUTH_ENDPOINTS.me)
    return data
  },

  getGoogleAuthUrl: () => buildApiUrl(AUTH_ENDPOINTS.google),
  getGoogleCallbackUrl: () => buildApiUrl(AUTH_ENDPOINTS.googleCallback),
}
