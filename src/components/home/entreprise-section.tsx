"use client"

import React from "react"

type TextTone = "yellow" | "sky" | "green" | "dark" | "white"
type IconTone = "dark" | "white"

type TextPill = { kind: "text"; label: string; tone: TextTone }
type IconPill = { kind: "icon"; tone: IconTone }
type Pill = TextPill | IconPill

const GrassIcon = ({ tone }: { tone: IconTone }) => {
  const bg = tone === "dark" ? "bg-[#1F3C2B]" : "bg-white"
  const fg = tone === "dark" ? "#3EA13B" : "#57B93C"

  return (
    <div className={`grid h-[64px] w-[64px] place-items-center rounded-full ${bg} shadow-[0_8px_24px_rgba(0,0,0,0.25)]`}>
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M30 54c-2-12 3-23 12-32 2 9 0 18-5 25 7-2 14-7 18-16 2 14-6 26-25 29Z" fill={fg} />
        <path
          d="M28 54c-7-9-9-22-4-34 6 6 9 14 9 22 4-4 7-10 8-18 7 12 4 25-13 30Z"
          fill={fg}
          opacity="0.9"
        />
      </svg>
    </div>
  )
}

const toneClass: Record<TextTone, string> = {
  yellow: "bg-[#FFE600] text-[#111]",
  sky: "bg-[#9EDCFF] text-[#111]",
  green: "bg-[#5DBA32] text-[#0C1B10]",
  dark: "bg-[#224B31] text-white",
  white: "bg-white text-[#111]",
}

function MarqueeRow({
  items,
  duration = 30,
  reverse = false,
}: {
  items: Pill[]
  duration?: number
  reverse?: boolean
}) {
  const marqueeStyle = {
    animationDuration: `${duration}s`,
    animationDirection: reverse ? "reverse" : "normal",
  } as React.CSSProperties

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex min-w-full">
        <div
          style={marqueeStyle}
          className="flex w-max shrink-0 items-center gap-6 pl-6 pr-10 will-change-transform [transform:translate3d(0,0,0)] animate-[marquee_30s_linear_infinite]"
        >
          {[...items, ...items].map((it, idx) => {
            if (it.kind === "icon") return <GrassIcon key={`i-${idx}`} tone={it.tone} />

            return (
              <span
                key={`t-${idx}`}
                className={[
                  "inline-flex items-center justify-center",
                  "h-[64px] px-10",
                  "rounded-full",
                  "text-[34px] sm:text-[44px] leading-none font-medium tracking-[-0.02em]",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
                  "whitespace-nowrap",
                  toneClass[it.tone],
                ].join(" ")}
              >
                {it.label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function EntrepriseSection() {
  const rowA: Pill[] = [
    { kind: "text", label: "AÃ©ration", tone: "green" },
    { kind: "text", label: "Traitements", tone: "yellow" },
    { kind: "icon", tone: "dark" },
    { kind: "text", label: "Punaises des cÃ©rÃ©ales", tone: "sky" },
    { kind: "icon", tone: "dark" },
    { kind: "text", label: "Vers blancs", tone: "green" },
    { kind: "text", label: "ContrÃ´les", tone: "sky" },
    { kind: "text", label: "Chaux", tone: "yellow" },
  ]

  const rowB: Pill[] = [
    { kind: "text", label: "AÃ©ration", tone: "green" },
    { kind: "text", label: "ContrÃ´les", tone: "sky" },
    { kind: "text", label: "Engrais", tone: "white" },
    { kind: "text", label: "Mauvaises herbes", tone: "dark" },
    { kind: "icon", tone: "white" },
    { kind: "text", label: "Pissenlits", tone: "green" },
    { kind: "text", label: "Chaux", tone: "yellow" },
    { kind: "text", label: "Traitements", tone: "yellow" },
  ]

  return (
    <section
      id="entreprise"
      className="
        relative w-full overflow-hidden
        bg-transparent
        py-10 md:py-14
        px-0
      "
      aria-label="Entreprise section"
    >
      <div className="relative space-y-8 md:space-y-10">
        <MarqueeRow items={rowA} duration={28} reverse={false} />
        <MarqueeRow items={rowB} duration={32} reverse />
        <MarqueeRow items={rowA} duration={30} reverse={false} />
      </div>
    </section>
  )
}
