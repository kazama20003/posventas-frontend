import EntrepriseSection from "@/components/home/entreprise-section";
import Footer from "@/components/home/footer";
import Header from "@/components/home/header";
import Hero from "@/components/home/hero";
import LenisScroll from "@/components/home/lenis-scroll";
import ServicesSection from "@/components/home/services-section";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1115]">
      <LenisScroll />
      <Header />
      <Hero />
      <div className="section-dark-surface relative">
        <div className="section-dark-overlay pointer-events-none absolute inset-0" />
        <div className="relative">
          <EntrepriseSection />
          <ServicesSection />
          <Footer />
        </div>
      </div>
    </main>
  );
}
