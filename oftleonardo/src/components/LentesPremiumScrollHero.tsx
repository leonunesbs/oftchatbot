import { useLayoutEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LentesPremiumScrollHeroProps = {
  title: string;
  description: string;
  readingTime: string;
  /** Data da última revisão já formatada em pt-BR (ex.: 28 de março de 2026). */
  lastReviewedFormatted: string;
  /** Artigo editorial (badge «Opinião»); padrão é conteúdo técnico. */
  isOpinion?: boolean;
  /** Link âncora para a seção de agendamento (ex.: #agendar). */
  scheduleAnchorHref?: string;
  scheduleAnchorId?: string;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function quantizeProgress(p: number) {
  return Math.round(p * 1200) / 1200;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Narrativa: vislumbre de uso multifocal — independência relativa dos óculos. */
const STORY_BEATS: readonly { text: string; fadeInStart: number; fadeInEnd: number }[] = [
  {
    text: "Longe, intermediário e perto passam a compartilhar o mesmo plano de foco — menos troca de óculos no ritmo do dia.",
    fadeInStart: 0,
    fadeInEnd: 0.22,
  },
  {
    text: "A lente intraocular redistribui a luz em zonas ou anéis; não devolve o cristalino jovem, mas pode reduzir a dependência de correção.",
    fadeInStart: 0.12,
    fadeInEnd: 0.4,
  },
  {
    text: "Há contrapartidas possíveis: halos, sensação de contraste diferente e curva de adaptação — tudo deve ser conversado antes da escolha.",
    fadeInStart: 0.3,
    fadeInEnd: 0.62,
  },
  {
    text: "Exames, retina saudável e metas realistas definem se multifocal, EDoF ou monofocal fazem sentido para você.",
    fadeInStart: 0.52,
    fadeInEnd: 0.92,
  },
];

const FOCUS_LAYERS = [
  {
    label: "Longe",
    hint: "Paisagem, placas, rosto",
    gradient: "from-sky-500/30 via-sky-900/20 to-zinc-950",
  },
  {
    label: "Intermediário",
    hint: "Tela, painel, cozinha",
    gradient: "from-emerald-500/25 via-teal-900/20 to-zinc-950",
  },
  {
    label: "Perto",
    hint: "Leitura, celular, detalhes",
    gradient: "from-amber-500/20 via-amber-900/15 to-zinc-950",
  },
] as const;

export function LentesPremiumScrollHero({
  title,
  description,
  readingTime,
  lastReviewedFormatted,
  isOpinion = false,
  scheduleAnchorHref = "#agendar",
  scheduleAnchorId = "gtm-artigo-lentes-premium-catarata-hero-agendar",
}: LentesPremiumScrollHeroProps) {
  const [trackEl, setTrackEl] = useState<HTMLDivElement | null>(null);
  const lastProgressRef = useRef(-1);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useLayoutEffect(() => {
    if (!trackEl) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setPrefersReducedMotion(mq.matches);
      if (mq.matches) setProgress(1);
    };
    apply();
    mq.addEventListener("change", apply);
    if (mq.matches) {
      return () => mq.removeEventListener("change", apply);
    }

    const el = trackEl;
    let rafPending = 0;
    let lastObservedW = 0;
    let lastObservedH = 0;

    const update = () => {
      if (document.visibilityState !== "visible") return;
      const rect = el.getBoundingClientRect();
      const trackHeight = Math.max(rect.height, el.offsetHeight, 1);
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scrollable = Math.max(1, trackHeight - vh);
      let p = clamp01(-rect.top / scrollable);
      if (p >= 0.997) p = 1;
      p = quantizeProgress(p);
      const prev = lastProgressRef.current;
      if (Math.abs(p - prev) > 1 / 2400) {
        lastProgressRef.current = p;
        setProgress(p);
      }
    };

    const scheduleUpdate = () => {
      if (rafPending) return;
      rafPending = requestAnimationFrame(() => {
        rafPending = 0;
        update();
      });
    };

    const onWindowResize = () => {
      lastProgressRef.current = -1;
      scheduleUpdate();
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", onWindowResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onWindowResize);
    window.visualViewport?.addEventListener("scroll", onWindowResize);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        const cr = entries[0]?.contentRect;
        if (cr) {
          const dw = Math.abs(cr.width - lastObservedW);
          const dh = Math.abs(cr.height - lastObservedH);
          lastObservedW = cr.width;
          lastObservedH = cr.height;
          if (dw > 0.5 || dh > 0.5) {
            lastProgressRef.current = -1;
          }
        }
        scheduleUpdate();
      });
      resizeObserver.observe(el);
    }

    scheduleUpdate();

    return () => {
      if (rafPending) cancelAnimationFrame(rafPending);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("scroll", onWindowResize);
      resizeObserver?.disconnect();
      mq.removeEventListener("change", apply);
    };
  }, [trackEl]);

  const t = progress >= 1 ? 1 : easeOutCubic(progress);

  const LAYERS_FOCUS_BY = 0.72;
  const layersT = progress >= 1 ? 1 : easeOutCubic(clamp01(progress / LAYERS_FOCUS_BY));

  const blurPx = t >= 1 ? 0 : lerp(16, 0, t);
  const stackZ = lerp(64, 0, t);
  const stackRotateY = lerp(10, 0, t);
  const stackRotateX = lerp(-5, 0, t);
  const stackScale = lerp(1.08, 1, t);
  const stackX = lerp(0, -8, t);
  const stackY = lerp(0, 6, t);

  const textZ = lerp(48, 0, t);
  const textRotateY = lerp(-5, 0, t);
  const textRotateX = lerp(3, 0, t);
  const textScale = lerp(1.1, 1, t);
  const textSlideX = lerp(4, 0, t);
  const opacityMuted = lerp(0.45, 1, t);

  return (
    <div
      ref={setTrackEl}
      className="relative min-h-[290dvh] w-full min-w-0 max-w-full bg-gradient-to-b from-muted/40 via-background to-background"
      style={{ minHeight: "min(290dvh, 300vh)" }}
    >
      <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-start px-3 pb-10 pt-16 sm:px-5 sm:pb-12 sm:pt-24 md:justify-center md:px-6 md:pt-28">
        <div
          className="mx-auto grid w-full min-w-0 max-w-6xl items-center gap-5 sm:gap-7 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-6 lg:gap-10 [transform-style:preserve-3d]"
          style={{
            perspective: "min(1100px, 140vw)",
            perspectiveOrigin: "50% 40%",
          }}
        >
          <div
            className="relative mx-auto flex w-full min-w-0 max-w-[min(100%,320px)] justify-center md:order-2 md:mx-0 md:max-w-none md:justify-end"
            aria-hidden
            style={{
              transform: prefersReducedMotion
                ? undefined
                : `translate3d(${stackX}%, ${stackY}%, 0) translateZ(${stackZ}px) rotateX(${stackRotateX}deg) rotateY(${stackRotateY}deg) scale(${stackScale})`,
              transformOrigin: "center center",
              willChange: prefersReducedMotion ? undefined : "transform",
            }}
          >
            <div className="relative w-full max-w-[300px] md:max-w-[340px]">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90 sm:text-[11px]">
                Um vislumbre de foco em três distâncias
              </div>
              <div className="flex gap-2 sm:gap-2.5">
                {FOCUS_LAYERS.map((layer, i) => {
                  const stagger = prefersReducedMotion ? 1 : clamp01((layersT * 1.15 - i * 0.06) / 0.95);
                  const layerBlur = prefersReducedMotion ? 0 : lerp(11, 0, stagger);
                  const layerOpacity = prefersReducedMotion ? 1 : lerp(0.35, 1, stagger);
                  return (
                    <div
                      key={layer.label}
                      className={cn(
                        "relative min-h-[200px] flex-1 overflow-hidden rounded-2xl border border-border/70 bg-zinc-950/90 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.42)] sm:min-h-[220px] sm:rounded-3xl",
                        "ring-1 ring-inset ring-white/5",
                      )}
                      style={{
                        filter: layerBlur <= 0.05 ? "none" : `blur(${layerBlur}px)`,
                        opacity: layerOpacity,
                        transform: prefersReducedMotion
                          ? undefined
                          : `translateZ(${lerp(8 - i * 4, 0, stagger)}px)`,
                      }}
                    >
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-b opacity-90",
                          layer.gradient,
                        )}
                      />
                      <div className="relative flex h-full flex-col justify-end p-2.5 sm:p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-100 sm:text-[10px]">
                          {layer.label}
                        </p>
                        <p className="mt-0.5 text-[8px] leading-snug text-zinc-300/95 sm:text-[9px]">{layer.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute -bottom-3 left-1/2 h-8 w-[78%] -translate-x-1/2 rounded-[100%] bg-black/25 blur-xl" />
            </div>
          </div>

          <div
            className="isolate flex min-w-0 flex-col justify-center text-left [transform-style:preserve-3d] md:order-1"
            style={{
              transform: prefersReducedMotion
                ? undefined
                : `translate3d(${textSlideX}%, 0, 0) translateZ(${textZ}px) rotateX(${textRotateX}deg) rotateY(${textRotateY}deg) scale(${textScale})`,
              transformOrigin: "left center",
            }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
              <span className="inline-flex items-center rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand">
                {readingTime} de leitura
              </span>
              <span className="inline-flex items-center rounded-full border border-zinc-600/50 bg-zinc-900/40 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300">
                Última revisão: {lastReviewedFormatted}
              </span>
              {isOpinion ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-amber-100">
                  Opinião
                </span>
              ) : null}
            </div>

            <h1
              className={cn(
                "font-black text-foreground break-words [overflow-wrap:anywhere]",
                "text-[clamp(1.75rem,6.5vw,5.25rem)] leading-[0.95] tracking-tight sm:text-[clamp(2rem,7vw,5.25rem)]",
              )}
              style={{
                filter: blurPx <= 0 ? "none" : `blur(${blurPx}px)`,
                letterSpacing: `${lerp(-0.042, -0.026, t)}em`,
              }}
            >
              Lentes premium
            </h1>
            <p
              className="mt-2 text-[clamp(1.05rem,3.1vw,2rem)] font-semibold tracking-tight text-muted-foreground sm:mt-3"
              style={{
                filter: blurPx <= 0 ? "none" : `blur(${blurPx * 0.85}px)`,
                opacity: opacityMuted,
              }}
            >
              Multifocalidade e escolha na catarata
            </p>

            <ol
              className="mb-6 mt-6 max-w-xl space-y-3 border-l-2 border-brand/25 pl-4 sm:mb-8 sm:mt-7 sm:space-y-3.5"
              aria-label="Resumo em quatro passos"
            >
              {STORY_BEATS.map((beat, index) => {
                const reveal = prefersReducedMotion
                  ? 1
                  : smoothstep(beat.fadeInStart, beat.fadeInEnd, progress);
                const lineBlur = prefersReducedMotion ? 0 : 9 * (1 - reveal);
                return (
                  <li
                    key={index}
                    className="list-none text-[13px] leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed"
                    style={{
                      opacity: prefersReducedMotion ? 1 : 0.25 + 0.75 * reveal,
                      filter: lineBlur <= 0.05 ? "none" : `blur(${lineBlur}px)`,
                      transform: prefersReducedMotion ? undefined : `translateY(${lerp(10, 0, reveal)}px)`,
                    }}
                  >
                    {beat.text}
                  </li>
                );
              })}
            </ol>

            <p
              className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base md:text-lg"
              style={{
                filter: blurPx <= 0 ? "none" : `blur(${blurPx * 0.5}px)`,
                opacity: lerp(0.55, 1, t),
              }}
            >
              {description}
            </p>

            <div className="mt-6 flex w-full min-w-0 flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a
                id={scheduleAnchorId}
                href={scheduleAnchorHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full min-w-0 justify-center sm:w-auto",
                )}
              >
                Agendar avaliação
              </a>
              <a
                href="/conteudos"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full min-w-0 justify-center sm:w-auto",
                )}
              >
                Outros conteúdos
              </a>
            </div>
            <p className="sr-only">{title}</p>
          </div>
        </div>

        <p
          className="mx-auto mt-8 max-w-6xl px-1 text-center text-[11px] text-muted-foreground/80 sm:mt-10 sm:text-xs"
          aria-hidden="true"
        >
          Continue rolando para o artigo completo sobre tipos de lente, indicações e expectativas
        </p>
      </div>
    </div>
  );
}
