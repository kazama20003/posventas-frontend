import { NextRequest, NextResponse } from "next/server"

const TOKEN_COOKIE_NAME = "posventas_token"
const TENANT_ID_COOKIE_NAME = "posventas_tenant_id"
const TENANT_SLUG_COOKIE_NAME = "posventas_tenant_slug"
const TENANT_HEADER_NAME = "x-tenant-id"

const AUTH_PATHS = new Set(["/login", "/register"])

type AuthTokenPayload = {
  sub: string
  tenantId: string
  tenantSlug?: string
  email?: string
  iat?: number
  exp: number
}

function decodeBase64Url(base64Url: string) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`
  return Buffer.from(padded, "base64").toString("utf-8")
}

function parseTokenPayload(token: string): AuthTokenPayload | null {
  const parts = token.split(".")
  if (parts.length !== 3) {
    return null
  }

  try {
    const payloadString = decodeBase64Url(parts[1] ?? "")
    const payload = JSON.parse(payloadString) as Partial<AuthTokenPayload>

    if (
      typeof payload.sub !== "string" ||
      typeof payload.tenantId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null
    }

    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      tenantSlug: typeof payload.tenantSlug === "string" ? payload.tenantSlug : undefined,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

function isTokenExpired(exp: number) {
  return exp * 1000 <= Date.now()
}

function extractTenantSlugFromPath(pathname: string) {
  if (!pathname.startsWith("/app/")) {
    return null
  }

  const [, , slug] = pathname.split("/")
  return slug ? decodeURIComponent(slug) : null
}

function getSafeNextPath(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next")
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null
  }

  if (AUTH_PATHS.has(next)) {
    return null
  }

  return next
}

function setTenantCookies(
  response: NextResponse,
  tenantId: string | null,
  tenantSlug?: string | null,
) {
  if (tenantId) {
    response.cookies.set({
      name: TENANT_ID_COOKIE_NAME,
      value: tenantId,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })
  } else {
    response.cookies.delete(TENANT_ID_COOKIE_NAME)
  }

  if (tenantSlug !== undefined) {
    if (tenantSlug) {
      response.cookies.set({
        name: TENANT_SLUG_COOKIE_NAME,
        value: tenantSlug,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
      })
    } else {
      response.cookies.delete(TENANT_SLUG_COOKIE_NAME)
    }
  }
}

function continueWithTenant(
  request: NextRequest,
  tenantId: string | null,
  tenantSlug?: string | null,
  clearToken = false,
) {
  const headers = new Headers(request.headers)

  if (tenantId) {
    headers.set(TENANT_HEADER_NAME, tenantId)
  } else {
    headers.delete(TENANT_HEADER_NAME)
  }

  const response = NextResponse.next({
    request: {
      headers,
    },
  })

  setTenantCookies(response, tenantId, tenantSlug)

  if (clearToken) {
    response.cookies.delete(TOKEN_COOKIE_NAME)
  }

  return response
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

function replaceTenantSlugInPath(pathname: string, tenantSlug: string) {
  const parts = pathname.split("/")
  if (parts.length < 3) {
    return `/app/${tenantSlug}`
  }

  parts[2] = encodeURIComponent(tenantSlug)
  return parts.join("/")
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isProtectedPath = pathname.startsWith("/app")
  const isAuthPath = AUTH_PATHS.has(pathname)
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    if (isProtectedPath) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("next", `${pathname}${search}`)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete(TENANT_ID_COOKIE_NAME)
      response.cookies.delete(TENANT_SLUG_COOKIE_NAME)
      return response
    }

    return continueWithTenant(request, null, null)
  }

  const payload = parseTokenPayload(token)
  if (!payload || isTokenExpired(payload.exp)) {
    if (isProtectedPath) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("next", `${pathname}${search}`)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete(TOKEN_COOKIE_NAME)
      response.cookies.delete(TENANT_ID_COOKIE_NAME)
      response.cookies.delete(TENANT_SLUG_COOKIE_NAME)
      return response
    }

    return continueWithTenant(request, null, null, true)
  }

  const tokenTenantSlug = payload.tenantSlug ?? null
  const currentPathSlug = extractTenantSlugFromPath(pathname)
  const cookieSlug = request.cookies.get(TENANT_SLUG_COOKIE_NAME)?.value ?? null
  const tenantSlug = tokenTenantSlug ?? currentPathSlug ?? cookieSlug

  if (
    isProtectedPath &&
    tokenTenantSlug &&
    currentPathSlug &&
    tokenTenantSlug !== currentPathSlug
  ) {
    const destinationPath = replaceTenantSlugInPath(pathname, tokenTenantSlug)
    const response = redirectTo(request, `${destinationPath}${search}`)
    setTenantCookies(response, payload.tenantId, tokenTenantSlug)
    return response
  }

  if (isAuthPath) {
    const nextPath = getSafeNextPath(request)
    const destination = nextPath ?? (tenantSlug ? `/app/${tenantSlug}` : "/")
    const response = redirectTo(request, destination)
    setTenantCookies(response, payload.tenantId, tenantSlug)
    return response
  }

  return continueWithTenant(request, payload.tenantId, tenantSlug)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json).*)",
  ],
}
