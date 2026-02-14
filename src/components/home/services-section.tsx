"use client"

import React, { useMemo, useState } from "react"

type Service = {
  title: string
  tags?: string[]
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span
    className="
      inline-flex items-center justify-center
      rounded-full border border-white/70
      px-3 py-1
      text-[12px] font-medium text-white/95
      bg-black/25
      backdrop-blur
    "
  >
    {children}
  </span>
)

export default function ServicesSection() {
  const services: Service[] = useMemo(
    () => [
      { title: "AÃ©ration", tags: ["AÃ©ration mÃ©canique", "AÃ©ration liquide"] },
      { title: "ContrÃ´les", tags: ["Mauvaises herbes", "Insectes"] },
      { title: "Fertilisation de pelouse", tags: ["Engrais"] },
      {
        title: "Hydro-ensemencement",
        tags: [
          "Hydro-ensemencement rÃ©sidentiel",
          "Hydro-ensemencement commercial",
          "Renforcement de pelouse",
        ],
      },
    ],
    [],
  )

  const [active, setActive] = useState<number>(0)

  return (
    <section
      id="servicessection"
      className="
        relative w-full
        bg-transparent
        py-16 md:py-20
        overflow-x-clip
      "
      aria-label="Services section"
    >
      {/* âœ… FULL WIDTH: sin max-w */}
      <div className="relative w-full px-4 md:px-10">
        {/* header */}
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-[62rem]">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-white/80">
              NOS SERVICES
            </p>

            <p className="mt-6 text-[22px] leading-snug text-white md:text-[26px]">
              Que vous ayez besoin de fertilisation, dâ€™aÃ©ration, d&apos;hydro-ensemencement,
              d&apos;un contrÃ´le d&apos;insectes ou de mauvaises herbes, nos experts sont lÃ  pour
              vous offrir des solutions adaptÃ©es Ã  vos besoins.
            </p>
          </div>

          <button
            type="button"
            className="
              hidden md:inline-flex
              items-center justify-center
              rounded-full bg-[#9b9b9b]
              px-7 py-3
              text-[14px] font-medium text-[#111]
              hover:bg-[#b1b1b1]
              transition
              shrink-0
            "
          >
            Tous les services
          </button>
        </div>

        {/* list */}
        <div className="mt-14 md:mt-16">
          <div className="space-y-4">
            {services.map((s, idx) => {
              const isActive = idx === active

              return (
                <button
                  key={s.title}
                  type="button"
                  onMouseEnter={() => setActive(idx)}
                  onFocus={() => setActive(idx)}
                  className={`
                    group relative w-full text-left
                    rounded-[2rem]
                    transition-colors duration-200
                    ${isActive ? "bg-[#58B234]" : "bg-transparent"}
                  `}
                >
                  <div
                    className={`
                      flex flex-col items-start gap-6
                      px-8 py-10 md:px-12
                      md:flex-row md:items-center md:justify-between
                      ${isActive ? "text-[#101010]" : "text-white"}
                    `}
                  >
                    {/* title */}
                    <span
                      className={`
                        block
                        max-w-full
                        text-[34px] leading-[0.95] tracking-[-0.02em]
                        sm:text-[44px]
                        md:text-[72px]
                        ${isActive ? "font-medium" : "font-normal"}
                      `}
                    >
                      {s.title}
                    </span>

                    {/* tags */}
                    <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
                      {(s.tags ?? []).map((t) =>
                        isActive ? (
                          <span
                            key={t}
                            className="
                              inline-flex items-center justify-center
                              rounded-full border border-black/40
                              px-3 py-1
                              text-[12px] font-medium text-[#101010]
                              bg-[#58B234]/60
                            "
                          >
                            {t}
                          </span>
                        ) : (
                          <Tag key={t}>{t}</Tag>
                        ),
                      )}
                    </div>
                  </div>

                  {!isActive && <div className="mx-8 md:mx-12 h-px bg-white/50" />}
                </button>
              )
            })}
          </div>

          {/* botÃ³n mobile */}
          <div className="mt-10 md:hidden">
            <button
              type="button"
              className="
                inline-flex w-full items-center justify-center
                rounded-full bg-[#9b9b9b]
                px-7 py-3
                text-[14px] font-medium text-[#111]
                hover:bg-[#b1b1b1]
                transition
              "
            >
              Tous les services
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}


