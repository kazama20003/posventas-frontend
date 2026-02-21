export { getApiErrorMessage } from "@/lib/api/client"
export {
  clearTenantId,
  clearTenantSlug,
  getTenantId,
  getTenantSlug,
  setTenantId,
  setTenantSlug,
} from "@/lib/api/tenant-context"
export { authService } from "./services/auth.service"
export { authKeys, useAuthMe, useGoogleAuth, useLogin, useLogout, useRegister } from "./hooks/use-auth"
export type {
  AuthJwtPayload,
  AuthSessionResponse,
  AuthTenant,
  AuthUser,
  LoginInput,
  LogoutResponse,
  RegisterInput,
} from "./types"
