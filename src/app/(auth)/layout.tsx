import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background"
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-14 text-sm text-muted-foreground">Privacy policy</p>
      </div>
    </main>
  )
}
