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
      className="hero-slider relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hero-frame relative h-[100dvh] min-h-[100vh] w-full overflow-hidden rounded-[28px] bg-[#0f1a40] shadow-[0_30px_90px_rgba(15,26,64,0.35)]">
        <div className="absolute left-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/70 opacity-80 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur sm:left-5 sm:top-5 sm:h-14 sm:w-14">
          <img
            src="../assets/11zon_cropped.png"
            alt="KoolRed"
            className="h-7 w-7 object-contain sm:h-9 sm:w-9"
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
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_25%,rgba(255,255,255,0.06)_0%,rgba(11,16,36,0.45)_55%,rgba(11,16,36,0.85)_100%),linear-gradient(to_top,rgba(11,16,36,0.65),rgba(11,16,36,0.25),transparent)]" />
              <div className="absolute inset-0 flex items-end">
                <div className="hero-content w-full p-4 sm:p-6 md:p-10">
                  <div
                    className={cn(
                      "max-w-full rounded-xl border border-[rgba(148,163,184,0.28)] bg-[#0b1024]/45 p-5 text-white shadow-[0_18px_40px_rgba(8,12,28,0.38)] backdrop-blur-sm transition-all duration-500 motion-reduce:transition-none sm:max-w-[520px] sm:rounded-2xl sm:p-6 lg:max-w-[720px]",
                      isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    )}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                      {slide.kicker}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                      {slide.titleLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </h2>
                    <p className="mt-3 max-w-[560px] text-[13px] leading-relaxed text-white/80 sm:text-sm md:text-base">
                      {slide.description}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <a className="btn secondary w-full sm:w-auto" href={slide.href}>
                        {"Explorar soluci\u00f3n"}
                      </a>
                      <a className="btn primary w-full sm:w-auto" href="#contacto">
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
          className="slider-arrow slider-arrow--prev group absolute left-3 bottom-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/12 text-[20px] font-semibold leading-none text-white/90 shadow-[0_12px_28px_rgba(8,12,28,0.32)] backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/18 hover:shadow-[0_0_18px_rgba(148,163,184,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 motion-reduce:transition-none sm:left-4 sm:bottom-6 sm:h-11 sm:w-11 sm:text-[22px] md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          {"\u2039"}
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Siguiente"
          className="slider-arrow slider-arrow--next group absolute right-3 bottom-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/12 text-[20px] font-semibold leading-none text-white/90 shadow-[0_12px_28px_rgba(8,12,28,0.32)] backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/18 hover:shadow-[0_0_18px_rgba(148,163,184,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 motion-reduce:transition-none sm:right-4 sm:bottom-6 sm:h-11 sm:w-11 sm:text-[22px] md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          {"\u203a"}
        </button>

        <div className="slider-counter pointer-events-none absolute bottom-4 right-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur sm:bottom-5 sm:right-6 sm:text-[11px]">
          {`0${current + 1} / 0${total}`}
        </div>
      </div>
    </section>
  );
}
