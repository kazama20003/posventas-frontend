"use client"

import type { ReactNode } from "react"
interface AppLayoutProps {
  children: ReactNode
}

export default function HomeLayout({ children }: AppLayoutProps) {
  return (
   
    <>
    {children}
    </>
  )
}