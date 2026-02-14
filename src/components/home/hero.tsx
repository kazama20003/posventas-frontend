import React from "react"

const Hero = () => {
  return (
    <section
      className="
        relative overflow-hidden
        h-[115svh] md:h-[calc(100vh+6rem)]
        rounded-none rounded-b-[2rem] md:rounded-b-[2rem]
        bg-black
      "
    >
      {/* VIDEO de fondo */}
      <video
        className="absolute inset-0 h-full w-full object-cover rounded-none rounded-b-[2rem] md:rounded-b-[2rem]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://images.unsplash.com/photo-1593698054578-9733645ee6f6?auto=format&fit=crop&w=1920&q=80"
      >
        {/* Reemplaza esta URL por tu video */}
        <source src="https://res.cloudinary.com/demzflxgq/video/upload/v1770839953/4524440-hd_1920_1080_25fps_hcgnlu.mp4" type="video/mp4" />
      </video>

      {/* Overlays recortados */}
      <div className="absolute inset-0 rounded-none rounded-b-[2rem] md:rounded-b-[2rem] bg-gradient-to-b from-black/15 via-black/10 to-black/75" />
      <div className="absolute inset-0 rounded-none rounded-b-[2rem] md:rounded-b-[2rem] bg-[radial-gradient(circle_at_22%_35%,rgba(255,255,255,0.18),transparent_50%)]" />

      <div
        className="
          relative z-10 flex h-full flex-col justify-end
          px-6 pb-14 pt-28
          md:px-10 md:pb-20 md:pt-32
        "
      >
        <div className="max-w-3xl space-y-8">
          <h1 className="leading-[0.95] text-white">
            <span className="block font-serif text-5xl italic sm:text-6xl md:text-8xl">
              Cobra en segundos
            </span>
            <span className="block whitespace-nowrap font-sans text-4xl font-normal not-italic sm:text-5xl md:text-8xl">
              Controla inventario facilmente
            </span>
          </h1>

          <button
            type="button"
            className="rounded-full bg-[#56b432] px-8 py-4 text-xl font-medium text-black transition hover:bg-[#67c942]"
          >
            Obten una suscripcion
          </button>
        </div>

        <div className="mt-10 flex justify-end md:mt-12">
          <article className="flex w-full max-w-[22rem] items-center gap-4 rounded-3xl bg-black/55 p-4 text-white backdrop-blur-md">
            <p className="text-lg leading-tight">
              Des problemes avec les insectes ? Dites Bye Bye Bibittes !
            </p>
            <div className="flex items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-3xl">
                v
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-500 text-2xl font-semibold">
                B
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default Hero
