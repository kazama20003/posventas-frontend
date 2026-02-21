import axios from "axios"
import type { AxiosError } from "axios"
import { getTenantId, getTenantSlug } from "./tenant-context"

export interface ApiErrorResponse {
  message?: string | string[]
  error?: string
  statusCode?: number
  [key: string]: unknown
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const tenantId = getTenantId()
  const tenantSlug = getTenantSlug()

  if (tenantId) {
    config.headers.set("x-tenant-id", tenantId)
  } else {
    config.headers.delete("x-tenant-id")
  }

  if (tenantSlug) {
    config.headers.set("x-tenant-slug", tenantSlug)
  } else {
    config.headers.delete("x-tenant-slug")
  }

  return config
})

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = normalizePath(path)

  if (!apiBaseUrl) {
    return normalizedPath
  }

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return `${apiBaseUrl.replace(/\/$/, "")}${normalizedPath}`
  }

  return `${apiBaseUrl}${normalizedPath}`
}

function toText(message?: string | string[]) {
  if (!message) {
    return undefined
  }

  return Array.isArray(message) ? message.join(", ") : message
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la solicitud.",
) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const axiosError = error as AxiosError<ApiErrorResponse>
  const responseMessage = toText(axiosError.response?.data?.message)

  if (responseMessage) {
    return responseMessage
  }

  if (axiosError.message) {
    return axiosError.message
  }

  return fallback
}
