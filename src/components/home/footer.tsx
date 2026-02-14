import Link from "next/link"

const linksMain = ["Forfaits", "Services", "Conseils", "Succursales"]
const linksCompany = ["Blogue", "A propos", "Nous joindre"]
const linksSocial = ["Facebook", "Instagram", "LinkedIn", "Tiktok", "Youtube"]

export default function Footer() {
  return (
    <footer className="w-full bg-[#0f1115]">
      <section className="overflow-hidden rounded-t-[2rem] bg-[#141414] text-white">
        <div className="grid w-full gap-12 px-6 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:px-10 md:py-14 lg:px-14 lg:py-16">
          <div className="flex flex-col">
            <Link
              href="/"
              className="w-fit text-4xl font-extrabold tracking-tight text-white"
              aria-label="Inicio"
            >
              Phoenix
            </Link>

            <h2 className="mt-10 leading-[0.96] text-white">
              <span className="block font-serif text-[clamp(2.6rem,6vw,5.8rem)] italic">
                Coup de foudre
              </span>
              <span className="block font-sans text-[clamp(2.3rem,5.2vw,5.2rem)] font-normal">
                pour ma pelouse
              </span>
            </h2>

            <div className="mt-10 h-56 w-56 overflow-hidden rounded-3xl md:h-64 md:w-64">
              <img
                src="https://images.unsplash.com/photo-1620147461831-a97b99ade1d3?auto=format&fit=crop&w=900&q=80"
                alt="Persona sosteniendo cítricos frente a sus ojos"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <p className="mt-8 text-lg text-white/90">© 2026 Vertdure</p>
          </div>

          <div className="space-y-12 pt-2">
            <div className="border-t border-white/60 pt-5">
              <nav className="flex flex-col gap-4 text-[1.7rem] leading-none md:text-[1.9rem]">
                {linksMain.map((item) => (
                  <Link key={item} href="#" className="text-white/95 transition hover:text-white">
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <p className="text-5xl font-bold tracking-tight">vext</p>
              <div className="inline-flex rounded-full bg-white/55 p-1 text-base">
                <button
                  type="button"
                  className="rounded-full bg-[#1a1a1a] px-6 py-2 text-white"
                >
                  Francais
                </button>
                <button type="button" className="px-6 py-2 text-black/80">
                  English
                </button>
              </div>
            </div>

            <Link href="#" className="inline-block text-2xl text-white/90 hover:text-white">
              Vie privee
            </Link>
          </div>

          <div className="space-y-12 pt-2">
            <div className="border-t border-white/60 pt-5">
              <nav className="flex flex-col gap-4 text-[1.7rem] leading-none md:text-[1.9rem]">
                {linksCompany.map((item) => (
                  <Link key={item} href="#" className="text-white/95 transition hover:text-white">
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-white/60 pt-5">
              <nav className="flex flex-col gap-4 text-[1.7rem] leading-none md:text-[1.9rem]">
                {linksSocial.map((item) => (
                  <Link key={item} href="#" className="text-white/95 transition hover:text-white">
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}
