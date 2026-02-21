"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useMemo, useState } from "react"
import { getApiErrorMessage, useGoogleAuth, useRegister } from "@/lib/api/auth"

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M21.805 12.23c0-.75-.067-1.47-.192-2.16H12v4.09h5.49a4.7 4.7 0 0 1-2.034 3.086v2.56h3.293c1.928-1.776 3.056-4.394 3.056-7.576Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.074-.916 6.765-2.494l-3.293-2.56c-.914.613-2.085.974-3.472.974-2.658 0-4.91-1.795-5.714-4.21H2.882v2.643A10.2 10.2 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.286 13.71a6.12 6.12 0 0 1-.319-1.95c0-.677.115-1.333.319-1.95V7.166H2.882a10.2 10.2 0 0 0 0 9.188l3.404-2.643Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.6c1.5 0 2.848.516 3.91 1.526l2.933-2.933C17.067 2.546 14.753 1.6 12 1.6A10.2 10.2 0 0 0 2.882 7.166L6.286 9.81C7.09 7.395 9.342 5.6 12 5.6Z"
        fill="#EA4335"
      />
    </svg>
  )
}

const inputClassName =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function getTenantAppPath(tenantSlug: unknown) {
  if (typeof tenantSlug === "string" && tenantSlug.length > 0) {
    return `/app/${tenantSlug}`
  }

  return "/"
}

export default function RegisterPage() {
  const router = useRouter()
  const { startGoogleAuth } = useGoogleAuth()
  const registerMutation = useRegister()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tenantName: "",
  })

  const errorMessage = useMemo(() => {
    if (!registerMutation.error) {
      return null
    }

    return getApiErrorMessage(registerMutation.error, "No fue posible crear la cuenta.")
  }, [registerMutation.error])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedTenantName = form.tenantName.trim() || form.name.trim()
    const normalizedTenantSlug = toSlug(normalizedTenantName)

    registerMutation.mutate(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        tenantName: normalizedTenantName || undefined,
        tenantSlug: normalizedTenantSlug || undefined,
      },
      {
        onSuccess: (session) => {
          router.push(getTenantAppPath(session.tenant.slug))
        },
      },
    )
  }

  return (
    <section className="rounded-3xl border border-border bg-card/95 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8">
      <p className="text-center font-serif text-5xl leading-none text-primary">Phoenix</p>

      <div className="mt-8 space-y-1">
        <h1 className="font-sans text-3xl font-semibold leading-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Create your account with Google or local account.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={startGoogleAuth}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Name"
            className={inputClassName}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            autoComplete="name"
            required
          />
          <input
            type="text"
            placeholder="Tenant name"
            className={inputClassName}
            value={form.tenantName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tenantName: event.target.value,
              }))
            }
          />
          <input
            type="email"
            placeholder="Email"
            className={inputClassName}
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={inputClassName}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            autoComplete="new-password"
            required
          />

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:pointer-events-none disabled:opacity-70"
          >
            {registerMutation.isPending ? "Creating..." : "Continue with Local"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground transition hover:text-primary">
          Sign in
        </Link>
      </p>
    </section>
  )
}
