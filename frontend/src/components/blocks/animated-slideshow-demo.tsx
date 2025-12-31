"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import {
  HoverSlider,
  HoverSliderImageWrap,
  HoverSliderVideo,
  TextStaggerHover,
  useHoverSliderContext,
  usePrefersReducedMotion,
} from "@/components/ui/animated-slideshow";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  title: string;
  label: string;
  kicker: string;
  description: string;
  href: string;
  videoSrc: string;
}

const DEBUG_BOUNDS = true;

const SLIDES: Slide[] = [
  {
    id: "adecuaciones",
    title: "Adecuaciones el\u00e9ctricas",
    label: "Infraestructura el\u00e9ctrica",
    kicker: "Energ\u00eda",
    description:
      "Intervenciones en tableros, canalizaciones y puesta a tierra con cumplimiento NTC 2050/RETIE.",
    href: "adecuaciones-electricas.html",
    videoSrc: "../assets/Adecuaciones%20electricas%202.mp4",
  },
  {
    id: "comunicaciones",
    title: "Comunicaciones y cableado estructurado",
    label: "Conectividad y datos",
    kicker: "Comunicaciones",
    description:
      "Dise\u00f1o, instalaci\u00f3n y certificaci\u00f3n de cableado estructurado, redes y canalizaciones.",
    href: "cableado-estructurado.html",
    videoSrc: "../assets/COMUNICACIONES.mp4",
  },
  {
    id: "cctv",
    title: "CCTV y seguridad",
    label: "Seguridad y supervisi\u00f3n",
    kicker: "Seguridad",
    description: "Instalaci\u00f3n \u00b7 Configuraci\u00f3n \u00b7 Soporte",
    href: "cctv.html",
    videoSrc: "../assets/CCTV.mp4",
  },
  {
    id: "hvac",
    title: "HVAC / BMS",
    label: "Confort y control",
    kicker: "Clima",
    description:
      "Diagn\u00f3stico, ajuste de control e integraci\u00f3n BMS para confort estable y eficiencia.",
    href: "hvac-bms.html",
    videoSrc: "../assets/HVAC%20VIDEO.mp4",
  },
  {
    id: "automatizacion",
    title: "Automatizaci\u00f3n",
    label: "Automatizaci\u00f3n",
    kicker: "Control",
    description:
      "Integraci\u00f3n PLC/HMI, datos y alarmas para estabilidad de procesos y mejora medible.",
    href: "automatizacion.html",
    videoSrc:
      "../assets/Dise%C3%B1o%20el%C3%A9ctrico%20y%20automatizaci%C3%B3n%20profesional%20seg%C3%BAn%20norma%20RETIE%20%20NTC%20%C2%B7%20BMS%20%C2%B7%20Baja%20tensi%C3%B3n.mp4",
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    label: "Continuidad operativa",
    kicker: "Continuidad",
    description:
      "Plan preventivo y correctivo con trazabilidad y soporte para activos cr\u00edticos.",
    href: "mantenimiento.html",
    videoSrc: "../assets/MANTENIMIENTO.mp4",
  },
  {
    id: "revision",
    title: "Consultor\u00eda",
    label: "An\u00e1lisis y auditor\u00eda",
    kicker: "Auditor\u00eda",
    description:
      "Auditor\u00eda de ingenier\u00eda y control de cantidades con informes para consorcios.",
    href: "revision-tecnica.html",
    videoSrc: "../assets/interventoria.mp4",
  },
];

function HoverSliderAutoRotate({
  length,
  paused,
  intervalMs = 9000,
}: {
  length: number;
  paused: boolean;
  intervalMs?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeSlide, changeSlide } = useHoverSliderContext();

  React.useEffect(() => {
    if (prefersReducedMotion || paused || length <= 1) {
      return;
    }
    const id = window.setTimeout(() => {
      changeSlide((activeSlide + 1) % length);
    }, intervalMs);
    return () => window.clearTimeout(id);
  }, [activeSlide, changeSlide, intervalMs, length, paused, prefersReducedMotion]);

  return null;
}

function SlideTrigger({ slide, index }: { slide: Slide; index: number }) {
  const { activeSlide, changeSlide } = useHoverSliderContext();
  const isActive = activeSlide === index;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      changeSlide(index);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 border-l-2 pl-4 transition-colors",
        isActive ? "border-[rgba(21,35,84,0.55)]" : "border-transparent"
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.32em] transition-colors",
          isActive ? "text-[rgba(21,35,84,0.7)]" : "text-slate-400"
        )}
      >
        {slide.kicker}
      </span>
      <TextStaggerHover
        text={slide.title}
        index={index}
        role="button"
        tabIndex={0}
        aria-current={isActive ? "true" : "false"}
        onKeyDown={handleKeyDown}
        className={cn(
          "block text-[20px] font-semibold leading-snug tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(21,35,84,0.35)] md:text-[24px]",
          isActive ? "text-[var(--brand-blue)]" : "text-slate-500/80"
        )}
      />
      <span
        className={cn(
          "h-[2px] w-14 rounded-full bg-[rgba(21,35,84,0.35)] transition-opacity",
          isActive ? "opacity-100" : "opacity-10"
        )}
      />
    </div>
  );
}

function ActiveSlideDetails({ slides }: { slides: Slide[] }) {
  const { activeSlide } = useHoverSliderContext();
  const slide = slides[activeSlide] ?? slides[0];

  return (
    <div className="mt-4 flex min-h-[200px] flex-col rounded-2xl border border-[rgba(21,35,84,0.14)] bg-white/95 p-5 shadow-[0_18px_36px_rgba(21,35,84,0.12)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[rgba(21,35,84,0.55)]">
        <span>{slide.label}</span>
        <span className="h-px w-6 bg-[rgba(21,35,84,0.35)]" />
        <span>{slide.kicker}</span>
      </div>
      <h3 className="mt-3 text-[20px] font-semibold text-[var(--brand-blue)]">
        {slide.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {slide.description}
      </p>
      <div className="mt-auto pt-4">
        <a
          className="btn secondary btn--fx"
          href={slide.href}
          aria-label={`Explorar soluci\u00f3n: ${slide.title}`}
        >
          {"Explorar soluci\u00f3n"}
        </a>
      </div>
    </div>
  );
}

function SlideMediaPanel({ slides }: { slides: Slide[] }) {
  const { activeSlide } = useHoverSliderContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldZoom = activeSlide === 1 && !prefersReducedMotion;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-[rgba(21,35,84,0.14)] bg-slate-50/90 p-4 shadow-[0_20px_40px_rgba(21,35,84,0.12)] backdrop-blur transition-transform duration-500",
        shouldZoom && "scale-[1.02] shadow-[0_26px_50px_rgba(21,35,84,0.16)]"
      )}
    >
      <HoverSliderImageWrap className="aspect-[16/9] min-h-[260px] rounded-xl border border-[rgba(21,35,84,0.12)] bg-slate-100 shadow-[0_16px_30px_rgba(21,35,84,0.14)]">
        {slides.map((slide, index) => (
          <HoverSliderVideo
            key={slide.id}
            index={index}
            src={slide.videoSrc}
            aria-label={slide.title}
          />
        ))}
      </HoverSliderImageWrap>
      <ActiveSlideDetails slides={slides} />
    </div>
  );
}

export function HoverSliderDemo() {
  const [paused, setPaused] = React.useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <HoverSlider
        className="relative isolate overflow-hidden bg-[#f6f8fc] py-6 text-slate-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <HoverSliderAutoRotate length={SLIDES.length} paused={paused} />

        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(21,35,84,0.16)_0.6px,transparent_0.6px)] [background-size:20px_20px] opacity-25" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(21,35,84,0.08)] via-white to-white" />

        <div className="mx-auto w-full max-w-[1200px] px-[18px]">
          <div
            className={cn(
              "rounded-[28px] border border-[rgba(21,35,84,0.12)] bg-white/90 p-5 shadow-[0_24px_60px_rgba(21,35,84,0.14)] backdrop-blur md:p-7",
              DEBUG_BOUNDS && "outline outline-2 outline-indigo-300"
            )}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-[var(--brand-blue)] md:text-3xl">
                {"Soluciones de ingenier\u00eda"}
              </h2>
            </div>

            <div
              className={cn(
                "mt-6 grid gap-8 lg:grid-cols-[0.55fr,1.45fr] lg:items-start lg:gap-10",
                DEBUG_BOUNDS && "outline outline-2 outline-sky-300"
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-5 lg:min-w-[240px] lg:pr-0",
                  DEBUG_BOUNDS && "outline outline-2 outline-amber-300"
                )}
              >
                {SLIDES.map((slide, index) => (
                  <SlideTrigger key={slide.id} slide={slide} index={index} />
                ))}
              </div>

              <div
                className={cn(
                  "lg:-ml-[40px] lg:justify-self-end lg:max-w-[640px]",
                  DEBUG_BOUNDS && "outline outline-2 outline-emerald-300"
                )}
              >
                <SlideMediaPanel slides={SLIDES} />
              </div>
            </div>
          </div>
        </div>
      </HoverSlider>
    </MotionConfig>
  );
}
