"use client"

import type { ReactNode } from "react"
interface AuthLayoutProps {
  children: ReactNode
}

export default function HomeLayout({ children }: AuthLayoutProps) {
  return (
   
    <>
    {children}
    </>
  )
}