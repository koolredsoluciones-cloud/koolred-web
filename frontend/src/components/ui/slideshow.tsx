"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  titleLines: string[];
  kicker: string;
  description: string;
  videoSrc: string;
  href: string;
};

const SLIDES: Slide[] = [
  {
    id: "adecuaciones",
    titleLines: ["Adecuaciones", "el\u00e9ctricas"],
    kicker: "Energ\u00eda",
    description:
      "Intervenciones en tableros, canalizaciones y puesta a tierra con cumplimiento NTC 2050/RETIE.",
    href: "adecuaciones-electricas.html",
    videoSrc: "../assets/Adecuaciones%20electricas%202.mp4",
  },
  {
    id: "comunicaciones",
    titleLines: ["Comunicaciones", "y cableado estructurado"],
    kicker: "Comunicaciones",
    description:
      "Dise\u00f1o, instalaci\u00f3n y certificaci\u00f3n de cableado estructurado, redes y canalizaciones.",
    href: "cableado-estructurado.html",
    videoSrc: "",
  },
  {
    id: "cctv",
    titleLines: ["CCTV y", "seguridad"],
    kicker: "Seguridad",
    description: "Instalaci\u00f3n, configuraci\u00f3n y soporte para vigilancia continua.",
    href: "cctv.html",
    videoSrc: "../assets/CCTV.mp4",
  },
  {
    id: "hvac",
    titleLines: ["HVAC /", "BMS"],
    kicker: "Clima",
    description:
      "Diagn\u00f3stico, ajuste de control e integraci\u00f3n BMS para confort estable y eficiencia.",
    href: "hvac-bms.html",
    videoSrc: "../assets/HVAC%20VIDEO.mp4",
  },
  {
    id: "automatizacion",
    titleLines: ["Automatizaci\u00f3n", "y control"],
    kicker: "Control",
    description:
      "Integraci\u00f3n PLC/HMI, datos y alarmas para estabilidad de procesos y mejora medible.",
    href: "automatizacion.html",
    videoSrc:
      "../assets/Dise%C3%B1o%20el%C3%A9ctrico%20y%20automatizaci%C3%B3n%20profesional%20seg%C3%BAn%20norma%20RETIE%20%20NTC%20%C2%B7%20BMS%20%C2%B7%20Baja%20tensi%C3%B3n.mp4",
  },
  {
    id: "mantenimiento",
    titleLines: ["Mantenimiento", "el\u00e9ctrico"],
    kicker: "Continuidad",
    description:
      "Plan preventivo y correctivo con trazabilidad y soporte para activos cr\u00edticos.",
    href: "mantenimiento.html",
    videoSrc: "../assets/MANTENIMIENTO.mp4",
  },
  {
    id: "consultoria",
    titleLines: ["Consultor\u00eda", "t\u00e9cnica"],
    kicker: "Auditor\u00eda",
    description:
      "Auditor\u00eda de ingenier\u00eda y control de cantidades con informes para consorcios.",
    href: "revision-tecnica.html",
    videoSrc: "../assets/interventoria.mp4",
  },
];

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return prefersReduced;
}

function SlideVideo({
  src,
  isActive,
  label,
}: {
  src: string;
  isActive: boolean;
  label: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }
    if (prefersReducedMotion || !isActive) {
      video.pause();
      video.currentTime = 0;
      return;
    }
    video.play().catch(() => {});
  }, [isActive, prefersReducedMotion]);

  if (!src) {
    return (
      <div
        aria-label={label}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(15,26,64,0.85))]"
      />
    );
  }

  return (
    <video
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] motion-reduce:transition-none",
        isActive ? "scale-[1.02]" : "scale-100"
      )}
      muted
      playsInline
      loop
      preload="metadata"
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default function Slideshow() {
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const total = SLIDES.length;

  React.useEffect(() => {
    if (prefersReducedMotion || paused || total <= 1) {
      return;
    }
    const id = window.setTimeout(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 9000);
    return () => window.clearTimeout(id);
  }, [current, paused, prefersReducedMotion, total]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + total) % total);

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative min-h-[76svh] w-full overflow-hidden rounded-[28px] bg-[#0f1a40] shadow-[0_30px_90px_rgba(15,26,64,0.35)] md:min-h-[84svh]">
        <div className="absolute left-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur">
          <img
            src="../assets/LOGO%20.png"
            alt="KoolRed"
            className="h-9 w-9 object-contain"
          />
        </div>
        {SLIDES.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <SlideVideo
                src={slide.videoSrc}
                isActive={isActive}
                label={slide.titleLines.join(" ")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1024]/80 via-[#0b1024]/35 to-transparent" />
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-6 md:p-10">
                  <div
                    className={cn(
                      "max-w-[720px] rounded-2xl border border-white/15 bg-[#0b1024]/55 p-6 text-white shadow-[0_20px_60px_rgba(8,12,28,0.55)] backdrop-blur transition-all duration-500 motion-reduce:transition-none",
                      isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    )}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                      {slide.kicker}
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-5xl">
                      {slide.titleLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </h2>
                    <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-white/80 md:text-base">
                      {slide.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a className="btn secondary" href={slide.href}>
                        {"Explorar soluci\u00f3n"}
                      </a>
                      <a className="btn primary" href="#contacto">
                        {"Hablar con un ingeniero"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={prevSlide}
          aria-label="Anterior"
          className="group absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[22px] font-semibold leading-none text-white shadow-[0_10px_20px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-200 hover:-translate-y-1/2 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 motion-reduce:transition-none"
        >
          {"\u2039"}
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Siguiente"
          className="group absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[22px] font-semibold leading-none text-white shadow-[0_10px_20px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-200 hover:-translate-y-1/2 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 motion-reduce:transition-none"
        >
          {"\u203a"}
        </button>

        <div className="pointer-events-none absolute bottom-5 right-6 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur">
          {`0${current + 1} / 0${total}`}
        </div>
      </div>
    </section>
  );
}
