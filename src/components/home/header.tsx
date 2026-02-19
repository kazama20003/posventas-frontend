"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  Menu,
  X,
  Plus,
  ShoppingCart,
  User,
} from "lucide-react"

const NAV = [
  { label: "Pro", href: "/forfaits" },
  { label: "Servicios", href: "/services" },
  {
    label: "Soluciones",
    href: "/conseils",
    children: [
      { label: "Guides", href: "/conseils/guides" },
      { label: "Blog", href: "/conseils/blog" },
      { label: "FAQ", href: "/conseils/faq" },
    ],
  },
  { label: "Precios", href: "/succursales" },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [conseilsOpen, setConseilsOpen] = useState(false)
  const conseilsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!conseilsRef.current) return
      if (!conseilsRef.current.contains(e.target as Node)) setConseilsOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      {/* FULL WIDTH */}
      <div className="flex w-full items-center justify-between px-5 py-4 md:px-8 lg:px-10">
        {/* LOGO (blanco pero NO gigante ni con tracking exagerado) */}
        <Link
          href="/"
          className="font-sans select-none text-[38px] leading-none font-extrabold tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
          aria-label="Accueil"
        >
          Phoenix
        </Link>

        {/* DESKTOP */}
        <div className="hidden items-center gap-3 md:flex">
          {/* PILL oscuro como la captura */}
          <nav
            className="font-sans flex items-center gap-1 rounded-full border border-white/8 bg-black/45 px-2.5 py-1.5 backdrop-blur-md shadow-[0_12px_35px_rgba(0,0,0,0.35)]"
            aria-label="Navigation principale"
          >
            {NAV.map((item) => {
              const hasChildren = "children" in item && !!item.children?.length

              if (!hasChildren) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full px-4 py-[6px] text-[16px] leading-none font-medium tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <div key={item.label} className="relative" ref={conseilsRef}>
                  <button
                    type="button"
                    onClick={() => setConseilsOpen((v) => !v)}
                    className="flex items-center gap-1 rounded-full px-4 py-[6px] text-[16px] leading-none font-medium tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white"
                    aria-haspopup="menu"
                    aria-expanded={conseilsOpen}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4 opacity-80" />
                  </button>

                  {conseilsOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
                    >
                      <div className="p-2">
                        {item.children!.map((c) => (
                          <Link
                            key={c.href}
                            href={c.href}
                            role="menuitem"
                            onClick={() => setConseilsOpen(false)}
                            className="block rounded-xl px-3 py-2 text-[14px] tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white"
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* + dentro del pill */}
            <Link
              href="/register"
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/15 hover:text-white"
              aria-label="Registrarse"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </nav>

          {/* CÍRCULO CARRITO */}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:bg-black/55 hover:text-white"
            aria-label="Panier"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>

          {/* CÍRCULO USUARIO */}
          <Link
            href="/login"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:bg-black/55 hover:text-white"
            aria-label="Iniciar sesión"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>

        {/* MOBILE */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            aria-label="Panier"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="w-full px-5 pb-4 md:hidden">
          <div className="rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            {NAV.map((item) => {
              const hasChildren = "children" in item && !!item.children?.length

              if (!hasChildren) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-3 py-3 text-[14px] font-medium tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <div key={item.label} className="rounded-xl">
                  <div className="px-3 py-3 text-[14px] font-medium tracking-[0.01em] text-white/80">
                    {item.label}
                  </div>
                  <div className="pb-2">
                    {item.children!.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-3 py-2 text-[14px] tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}

            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-[14px] font-medium tracking-[0.01em] text-white/90 transition hover:bg-white/15 hover:text-white"
              aria-label="Registrarse"
            >
              <Plus className="h-4 w-4" />
              Registrarse
            </Link>

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-[14px] font-medium tracking-[0.01em] text-white/90 transition hover:bg-black/55 hover:text-white"
              aria-label="Iniciar sesión"
            >
              <User className="h-4 w-4" />
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
