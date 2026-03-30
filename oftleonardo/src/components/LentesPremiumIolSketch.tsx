"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type LentesPremiumIolSketchProps = {
  className?: string;
};

/** Igual ao período anterior em CSS (32s/volta). */
const BASE_DEG_PER_SEC = 360 / 32;

const IMPULSE_DECAY = 0.94;
/** Só rolagem para baixo aumenta o impulso; para cima apenas amortecimento (evita leitura “invertida” ao alternar sentido). */
const SCROLL_IMPULSE_GAIN = 0.048;
const IMPULSE_TO_DEG_PER_SEC = 15;
const SCROLL_UP_DAMP = 0.88;
const MIN_DEG_PER_SEC = 1.35;
const MAX_DEG_PER_SEC = 185;
const MAX_IMPULSE = 22;

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

const iolSvgClass =
  "block h-auto w-full max-h-[min(28vw,156px)] overflow-visible sm:max-h-[170px] [&_.iol-optic]:text-foreground/55 [&_.iol-optic]:dark:text-foreground/48 [&_.iol-hapticos]:text-brand";

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
 * Giro de base constante + impulso só ao rolar para baixo (rolar para cima só amortecimento).
 * Ilustração genérica educativa — não reproduz produto ou marca de fabricante.
 */
export function LentesPremiumIolSketch({ className }: LentesPremiumIolSketchProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const spinImpulseRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useLayoutEffect(() => {
    const el = spinRef.current;
    const root = rootRef.current;
    if (!el || !root) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.style.transform = "translateZ(14px) rotateY(-14deg)";
      el.style.transformStyle = "preserve-3d";
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();
    lastScrollYRef.current = window.scrollY;

    /** Ordem: gira em torno do centro, depois afasta no eixo local — mantém a óptica centrada na perspectiva. */
    const applyTransform = () => {
      el.style.transform = `rotateY(${angleRef.current}deg) translateZ(18px)`;
    };

    const tick = (now: number) => {
      if (document.visibilityState !== "visible") {
        rafId = 0;
        el.style.willChange = "auto";
        return;
      }

      const dtSec = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      spinImpulseRef.current *= IMPULSE_DECAY;
      if (spinImpulseRef.current < 0.003) spinImpulseRef.current = 0;

      const extraDegPerSec = spinImpulseRef.current * IMPULSE_TO_DEG_PER_SEC;
      const degPerSec = clamp(BASE_DEG_PER_SEC + extraDegPerSec, MIN_DEG_PER_SEC, MAX_DEG_PER_SEC);

      angleRef.current += degPerSec * dtSec;
      angleRef.current %= 360;
      if (angleRef.current < 0) angleRef.current += 360;

      el.style.transformStyle = "preserve-3d";
      el.style.willChange = "transform";
      applyTransform();

      rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (document.visibilityState !== "visible") return;
      const y = window.scrollY;
      const d = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      if (d > 0.45) {
        spinImpulseRef.current += Math.min(d, 130) * SCROLL_IMPULSE_GAIN;
        spinImpulseRef.current = clamp(spinImpulseRef.current, 0, MAX_IMPULSE);
      } else if (d < -0.45) {
        spinImpulseRef.current *= SCROLL_UP_DAMP;
      }
    };

    const startLoop = () => {
      if (rafId) return;
      lastTs = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      el.style.willChange = "auto";
    };

    const sketchNearViewport = () => {
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      return r.bottom > -120 && r.top < vh + 120;
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        stopLoop();
      } else if (sketchNearViewport()) {
        lastScrollYRef.current = window.scrollY;
        lastTs = performance.now();
        startLoop();
      }
    };

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          const hit = entries[0]?.isIntersecting ?? false;
          if (!hit) stopLoop();
          else if (document.visibilityState === "visible") {
            lastScrollYRef.current = window.scrollY;
            startLoop();
          }
        },
        { threshold: 0, rootMargin: "100px 0px" },
      );
      io.observe(root);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    if (sketchNearViewport()) startLoop();

    return () => {
      stopLoop();
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      el.style.willChange = "auto";
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative mx-auto flex w-full max-w-[min(100%,288px)] items-center justify-center sm:max-w-[300px]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[90%] max-h-[160px] w-[90%] max-w-[280px] rounded-full bg-brand/[0.08] blur-2xl dark:bg-brand/[0.1]" />
      </div>
      <div className="lentes-premium-iol-sketch-perspective relative w-full [contain:layout_style]">
        <div
          ref={spinRef}
          className="lentes-premium-iol-sketch-spin w-full"
          style={{
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
          }}
        >
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
