const TENANT_STORAGE_KEY = "posventas_tenant_id"
const TENANT_COOKIE_NAME = "posventas_tenant_id"
const TENANT_SLUG_STORAGE_KEY = "posventas_tenant_slug"
const TENANT_SLUG_COOKIE_NAME = "posventas_tenant_slug"

let tenantIdState: string | null = null
let tenantSlugState: string | null = null

function parseCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null
  }

  const encodedName = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(";")

  for (const rawPart of parts) {
    const part = rawPart.trim()
    if (part.startsWith(encodedName)) {
      const cookieValue = part.slice(encodedName.length)
      return decodeURIComponent(cookieValue)
    }
  }

  return null
}

export function setTenantId(tenantId: string | null) {
  tenantIdState = tenantId

  if (typeof window === "undefined") {
    return
  }

  if (tenantId) {
    window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
    document.cookie = `${encodeURIComponent(TENANT_COOKIE_NAME)}=${encodeURIComponent(tenantId)}; path=/; SameSite=Lax`
  } else {
    window.localStorage.removeItem(TENANT_STORAGE_KEY)
    document.cookie = `${encodeURIComponent(TENANT_COOKIE_NAME)}=; Max-Age=0; path=/; SameSite=Lax`
  }
}

export function getTenantId() {
  if (tenantIdState) {
    return tenantIdState
  }

  if (typeof window === "undefined") {
    return null
  }

  const fromStorage = window.localStorage.getItem(TENANT_STORAGE_KEY)
  if (fromStorage) {
    tenantIdState = fromStorage
    return fromStorage
  }

  const fromCookie = parseCookieValue(TENANT_COOKIE_NAME)
  if (fromCookie) {
    tenantIdState = fromCookie
    window.localStorage.setItem(TENANT_STORAGE_KEY, fromCookie)
    return fromCookie
  }

  return null
}

export function clearTenantId() {
  setTenantId(null)
}

export function setTenantSlug(tenantSlug: string | null) {
  tenantSlugState = tenantSlug

  if (typeof window === "undefined") {
    return
  }

  if (tenantSlug) {
    window.localStorage.setItem(TENANT_SLUG_STORAGE_KEY, tenantSlug)
    document.cookie = `${encodeURIComponent(TENANT_SLUG_COOKIE_NAME)}=${encodeURIComponent(tenantSlug)}; path=/; SameSite=Lax`
  } else {
    window.localStorage.removeItem(TENANT_SLUG_STORAGE_KEY)
    document.cookie = `${encodeURIComponent(TENANT_SLUG_COOKIE_NAME)}=; Max-Age=0; path=/; SameSite=Lax`
  }
}

export function getTenantSlug() {
  if (tenantSlugState) {
    return tenantSlugState
  }

  if (typeof window === "undefined") {
    return null
  }

  const fromStorage = window.localStorage.getItem(TENANT_SLUG_STORAGE_KEY)
  if (fromStorage) {
    tenantSlugState = fromStorage
    return fromStorage
  }

  const fromCookie = parseCookieValue(TENANT_SLUG_COOKIE_NAME)
  if (fromCookie) {
    tenantSlugState = fromCookie
    window.localStorage.setItem(TENANT_SLUG_STORAGE_KEY, fromCookie)
    return fromCookie
  }

  return null
}

export function clearTenantSlug() {
  setTenantSlug(null)
}
