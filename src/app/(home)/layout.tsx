"use client"

import Footer from "@/components/home/footer"
import Header from "@/components/home/header"
import LenisScroll from "@/components/home/lenis-scroll"
import type { ReactNode } from "react"
interface HomeLayoutProps {
  children: ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
   
    <>
    <LenisScroll/>
    <Header/>
    {children}
    <Footer/>
    </>
  )
}