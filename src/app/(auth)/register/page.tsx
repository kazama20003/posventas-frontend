import Link from "next/link"

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

export default function RegisterPage() {
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

        <div className="space-y-3">
          <input type="text" placeholder="Name" className={inputClassName} />
          <input type="email" placeholder="Email" className={inputClassName} />
          <input type="password" placeholder="Password" className={inputClassName} />

          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            Continue with Local
          </button>
        </div>
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
