"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type LentesPremiumIolSketchProps = {
  className?: string;
};

/** Igual ao período anterior em CSS (32s/volta). */
const BASE_DEG_PER_SEC = 360 / 32;

const IMPULSE_DECAY = 0.93;
/** Scroll para baixo (positivo) → acelera; para cima → desacelera (impulso negativo). */
const SCROLL_IMPULSE_GAIN = 0.042;
const IMPULSE_TO_DEG_PER_SEC = 16;
/** Permite desacelerar bastante ao rolar para cima, mantendo sempre giro para frente. */
const MIN_DEG_PER_SEC = 1.25;
const MAX_DEG_PER_SEC = 200;
const MAX_IMPULSE = 26;

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

const iolSvgClass =
  "h-auto w-full max-h-[min(28vw,156px)] overflow-visible sm:max-h-[170px] [&_.iol-optic]:text-foreground/55 [&_.iol-optic]:dark:text-foreground/48 [&_.iol-hapticos]:text-brand";

function LentesPremiumIolSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 160"
      overflow="visible"
      className={cn(iolSvgClass, className)}
    >
      <g transform="rotate(45 160 80)">
        {/* Óptica: disco levemente preenchido + anéis (lê-se melhor que só traço, principalmente no escuro). */}
        <g
          className="iol-optic"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <circle
            cx="160"
            cy="80"
            r="40"
            strokeWidth={1.2}
            className="fill-foreground/[0.07] dark:fill-foreground/[0.11]"
          />
          <circle cx="160" cy="80" r="30" strokeWidth={1} opacity={0.42} />
          <circle cx="160" cy="80" r="20" strokeWidth={0.95} opacity={0.36} />
          <circle cx="160" cy="80" r="10" strokeWidth={0.85} opacity={0.32} />
          <g opacity={0.28}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6;
              const x1 = 160 + Math.cos(a) * 23;
              const y1 = 80 + Math.sin(a) * 23;
              const x2 = 160 + Math.cos(a) * 37;
              const y2 = 80 + Math.sin(a) * 37;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.52} />;
            })}
          </g>
        </g>

        {/*
          Hápticos em C mais “agudos”: bulbo menor, ponta aproxima-se mais do eixo; simetria 180°.
        */}
        <g
          className="iol-hapticos"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.55}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M 200 80 C 244 50 216 6 193 1" />
          <path d="M 120 80 C 76 110 104 154 127 159" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Esboço esquemático de LIO: óptica circular (concêntrica) + hápticos em C presos só em um ponto por lado (3h / 9h), com rotação em perspectiva.
 * Giro de base constante + impulso no scroll (descer acelera, subir desacelera).
 * Ilustração genérica educativa — não reproduz produto ou marca de fabricante.
 */
export function LentesPremiumIolSketch({ className }: LentesPremiumIolSketchProps) {
  const spinRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const spinImpulseRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useLayoutEffect(() => {
    const el = spinRef.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.style.transform = "translateZ(14px) rotateY(-14deg)";
      el.style.transformStyle = "preserve-3d";
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();
    lastScrollYRef.current = window.scrollY;

    const tick = (now: number) => {
      const dtSec = Math.min((now - lastTs) / 1000, 0.072);
      lastTs = now;

      const y = window.scrollY;
      const scrollDelta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      if (Math.abs(scrollDelta) > 0.35) {
        spinImpulseRef.current += clamp(scrollDelta, -140, 140) * SCROLL_IMPULSE_GAIN;
        spinImpulseRef.current = clamp(spinImpulseRef.current, -MAX_IMPULSE, MAX_IMPULSE);
      }

      spinImpulseRef.current *= IMPULSE_DECAY;
      if (Math.abs(spinImpulseRef.current) < 0.004) spinImpulseRef.current = 0;

      const extraDegPerSec = spinImpulseRef.current * IMPULSE_TO_DEG_PER_SEC;
      const degPerSec = clamp(BASE_DEG_PER_SEC + extraDegPerSec, MIN_DEG_PER_SEC, MAX_DEG_PER_SEC);

      angleRef.current += degPerSec * dtSec;
      angleRef.current %= 360;
      if (angleRef.current < 0) angleRef.current += 360;

      el.style.transform = `translateZ(18px) rotateY(${angleRef.current}deg)`;
      el.style.transformStyle = "preserve-3d";
      el.style.willChange = "transform";

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[min(100%,288px)] items-center justify-center sm:max-w-[300px]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[90%] max-h-[160px] w-[90%] max-w-[280px] rounded-full bg-brand/[0.08] blur-2xl dark:bg-brand/[0.1]" />
      </div>
      <div className="lentes-premium-iol-sketch-perspective relative w-full">
        <div ref={spinRef} className="lentes-premium-iol-sketch-spin w-full">
          <div className="lentes-premium-iol-sketch-depth relative flex aspect-[2/1] w-full items-center justify-center">
            <div className="lentes-premium-iol-sketch-depth-front relative flex w-full items-center justify-center">
              <LentesPremiumIolSvg />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
