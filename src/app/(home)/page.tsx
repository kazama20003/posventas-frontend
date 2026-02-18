"use client"
import Hero from "@/components/home/hero"
import EntrepriseSection from "@/components/home/entreprise-section"
import ServicesSection from "@/components/home/services-section"
export default function Page() {

  return (
      <>
      <main className="min-h-screen bg-[#0f1115]">
      <Hero />
      <div className="section-dark-surface relative">
        <div className="section-dark-overlay pointer-events-none absolute inset-0" />
        <div className="relative">
          <EntrepriseSection />
          <ServicesSection />
        </div>
      </div>
    </main>
      </>
  )
}