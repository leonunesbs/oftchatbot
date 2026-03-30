import { BookOpen, CheckCircle2, Monitor, Mountain, type LucideIcon } from "lucide-react";
import { type MutableRefObject, useLayoutEffect, useMemo, useRef } from "react";

import { LentesPremiumIolSketch } from "@/components/LentesPremiumIolSketch";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LentesPremiumHeroVariantProps = {
  title: string;
  description: string;
  readingTime: string;
  lastReviewedFormatted: string;
  isOpinion?: boolean;
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

/** Narrativa: “premium” vai além de trifocal — distâncias, qualidade visual e trade-offs de luz. */
const STORY_BEATS: readonly { text: string; fadeInStart: number; fadeInEnd: number }[] = [
  {
    text: "Lente premium na catarata não resume a trifocal: pode ser nitidez na distância planejada, faixa de foco mais ampla (EDoF) ou menos óculos no dia a dia — sempre discutindo contraste e halos.",
    fadeInStart: 0,
    fadeInEnd: 0.22,
  },
  {
    text: "Multifocal e trifocal dividem a luz entre focos; monofocal de linha superior prioriza a imagem em uma distância. Em ambos os casos há compromissos a alinhar antes da cirurgia.",
    fadeInStart: 0.12,
    fadeInEnd: 0.4,
  },
  {
    text: "Há contrapartidas possíveis: halos, sensação de contraste diferente e curva de adaptação — tudo deve ser conversado antes da escolha.",
    fadeInStart: 0.3,
    fadeInEnd: 0.62,
  },
  {
    text: "Exames (retina, nervo, medidas) e metas honestas definem se monofocal de linha superior, EDoF, multifocal/trifocal ou tórica fazem sentido — na consulta você fecha o plano com o oftalmologista.",
    fadeInStart: 0.52,
    fadeInEnd: 0.92,
  },
];

/** Ilustração alinhada à variante B (ícones, glow e tipografia dos cartões). */
const FOCUS_LAYERS: readonly {
  label: string;
  tag: string;
  Icon: LucideIcon;
  iconTint: string;
  glow: string;
  gradient: string;
}[] = [
  {
    label: "Longe",
    tag: "Direção, TV, rosto",
    Icon: Mountain,
    iconTint: "text-sky-200/95",
    glow: "bg-sky-400/25",
    gradient: "from-sky-500/35 via-sky-900/25 to-zinc-950",
  },
  {
    label: "Meio",
    tag: "Notebook, cozinha",
    Icon: Monitor,
    iconTint: "text-emerald-200/95",
    glow: "bg-emerald-400/22",
    gradient: "from-emerald-500/30 via-teal-900/22 to-zinc-950",
  },
  {
    label: "Perto",
    tag: "Leitura, celular",
    Icon: BookOpen,
    iconTint: "text-amber-200/95",
    glow: "bg-amber-400/20",
    gradient: "from-amber-500/25 via-amber-900/18 to-zinc-950",
  },
];

const LAYERS_FOCUS_BY = 0.72;

type MotionDom = {
  stack: HTMLDivElement | null;
  textCol: HTMLDivElement | null;
  h1: HTMLElement | null;
  sub: HTMLParagraphElement | null;
  desc: HTMLParagraphElement | null;
  storyLis: (HTMLLIElement | null)[];
  layerOuters: (HTMLDivElement | null)[];
  layerInners: (HTMLDivElement | null)[];
  /** Área do ícone — defocus acompanha o fundo, em intensidade menor. */
  layerIconWraps: (HTMLDivElement | null)[];
};

function applyMotionFrame(dom: MotionDom, progress: number, reduced: boolean) {
  const p = reduced ? 1 : progress;
  const t = p >= 1 ? 1 : easeOutCubic(p);
  const layersT = p >= 1 ? 1 : easeOutCubic(clamp01(p / LAYERS_FOCUS_BY));

  const blurPx = t >= 1 ? 0 : lerp(16, 0, t);
  const opacityMuted = lerp(0.45, 1, t);

  const { stack, textCol, h1, sub, desc, storyLis, layerOuters, layerInners, layerIconWraps } = dom;

  /** Sem transform 3D no scroll — blur/opacidade apenas (melhor em mobile). */
  if (stack) {
    stack.style.transform = "";
    stack.style.removeProperty("will-change");
  }

  if (textCol) {
    textCol.style.transform = "";
    textCol.style.removeProperty("will-change");
  }

  if (h1) {
    h1.style.filter = blurPx <= 0 ? "none" : `blur(${blurPx}px)`;
    h1.style.letterSpacing = `${lerp(-0.042, -0.026, t)}em`;
  }

  if (sub) {
    sub.style.filter = blurPx <= 0 ? "none" : `blur(${blurPx * 0.85}px)`;
    sub.style.opacity = String(opacityMuted);
  }

  if (desc) {
    desc.style.filter = blurPx <= 0 ? "none" : `blur(${blurPx * 0.5}px)`;
    desc.style.opacity = String(lerp(0.55, 1, t));
  }

  for (let i = 0; i < STORY_BEATS.length; i++) {
    const li = storyLis[i];
    if (!li) continue;
    const beat = STORY_BEATS[i]!;
    const reveal = reduced ? 1 : smoothstep(beat.fadeInStart, beat.fadeInEnd, p);
    const lineBlur = reduced ? 0 : 9 * (1 - reveal);
    li.style.opacity = String(reduced ? 1 : 0.25 + 0.75 * reveal);
    li.style.filter = lineBlur <= 0.05 ? "none" : `blur(${lineBlur}px)`;
    li.style.transform = "";
  }

  for (let i = 0; i < FOCUS_LAYERS.length; i++) {
    const outer = layerOuters[i];
    const inner = layerInners[i];
    const iconWrap = layerIconWraps[i];
    if (!outer || !inner) continue;
    const stagger = reduced ? 1 : clamp01((layersT * 1.15 - i * 0.06) / 0.95);
    const layerBlur = reduced ? 0 : lerp(11, 0, stagger);
    const layerOpacity = reduced ? 1 : lerp(0.35, 1, stagger);
    /** Defocus nas ilustrações: metade do blur do fundo (teto ~5,5px). */
    const iconDefocusPx = reduced ? 0 : layerBlur * 0.5;
    outer.style.transform = "";
    outer.style.removeProperty("will-change");
    inner.style.filter = layerBlur <= 0.05 ? "none" : `blur(${layerBlur}px)`;
    inner.style.opacity = String(layerOpacity);

    if (iconWrap) {
      if (reduced) {
        iconWrap.style.filter = "";
        iconWrap.style.removeProperty("opacity");
        iconWrap.style.removeProperty("will-change");
      } else {
        iconWrap.style.filter = iconDefocusPx <= 0.05 ? "none" : `blur(${iconDefocusPx}px)`;
        iconWrap.style.opacity = String(lerp(0.82, 1, stagger));
        iconWrap.style.willChange = p < 0.999 ? "filter, opacity" : "auto";
      }
    }
  }
}

function patchMotionRef<K extends keyof MotionDom>(
  motionDomRef: MutableRefObject<MotionDom>,
  key: K,
  value: MotionDom[K],
) {
  motionDomRef.current = { ...motionDomRef.current, [key]: value };
}

/** Variante **A** — hero com trilha de scroll e blur (baseline de deploy). */
export function LentesPremiumHeroVariantA({
  title,
  description,
  readingTime,
  lastReviewedFormatted,
  isOpinion = false,
  scheduleAnchorHref = "/agendamento-online",
  scheduleAnchorId = "gtm-artigo-lentes-premium-catarata-hero-agendar",
}: LentesPremiumHeroVariantProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastProgressRef = useRef(-1);
  const motionDomRef = useRef<MotionDom>({
    stack: null,
    textCol: null,
    h1: null,
    sub: null,
    desc: null,
    storyLis: Array.from({ length: STORY_BEATS.length }, () => null),
    layerOuters: Array.from({ length: FOCUS_LAYERS.length }, () => null),
    layerInners: Array.from({ length: FOCUS_LAYERS.length }, () => null),
    layerIconWraps: Array.from({ length: FOCUS_LAYERS.length }, () => null),
  });

  const storyLiRefs = useMemo(
    () =>
      STORY_BEATS.map((_, index) => (el: HTMLLIElement | null) => {
        const next = motionDomRef.current.storyLis.slice();
        next[index] = el;
        patchMotionRef(motionDomRef, "storyLis", next);
      }),
    [],
  );

  const layerOuterRefs = useMemo(
    () =>
      FOCUS_LAYERS.map((_, index) => (el: HTMLDivElement | null) => {
        const next = motionDomRef.current.layerOuters.slice();
        next[index] = el;
        patchMotionRef(motionDomRef, "layerOuters", next);
      }),
    [],
  );

  const layerInnerRefs = useMemo(
    () =>
      FOCUS_LAYERS.map((_, index) => (el: HTMLDivElement | null) => {
        const next = motionDomRef.current.layerInners.slice();
        next[index] = el;
        patchMotionRef(motionDomRef, "layerInners", next);
      }),
    [],
  );

  const layerIconWrapRefs = useMemo(
    () =>
      FOCUS_LAYERS.map((_, index) => (el: HTMLDivElement | null) => {
        const next = motionDomRef.current.layerIconWraps.slice();
        next[index] = el;
        patchMotionRef(motionDomRef, "layerIconWraps", next);
      }),
    [],
  );

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;

    let rafPending = 0;
    let resizeObserver: ResizeObserver | undefined;
    let lastObservedW = 0;
    let lastObservedH = 0;

    const update = () => {
      if (document.visibilityState !== "visible") return;
      const rect = el.getBoundingClientRect();
      const trackHeight = Math.max(rect.height, el.offsetHeight, 1);
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scrollable = Math.max(1, trackHeight - vh);
      /** Primeiros pixels de scroll: progresso 0 (layout estável, conteúdo legível por mais rolagem); depois 0→1 no restante da trilha. */
      const progressLeadIn = Math.min(220, Math.max(96, Math.round(vh * 0.18)));
      const scrolled = Math.max(0, -rect.top);
      const denom = Math.max(1, scrollable - progressLeadIn);
      let p =
        scrolled <= progressLeadIn ? 0 : clamp01((scrolled - progressLeadIn) / denom);
      if (p >= 0.997) p = 1;
      p = quantizeProgress(p);
      const prev = lastProgressRef.current;
      if (Math.abs(p - prev) <= 1 / 2400) return;
      lastProgressRef.current = p;
      applyMotionFrame(motionDomRef.current, p, false);
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

    const attachScrollChain = () => {
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", onWindowResize, { passive: true });
      /** Só `resize`: `visualViewport` `scroll` (ex.: barra de endereço / pan com zoom) recalcula o hero inteiro e pode “puxar” a página ou saltar o progresso ao alternar rolagem. */
      window.visualViewport?.addEventListener("resize", onWindowResize);

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

      update();
    };

    const detachScrollChain = () => {
      if (rafPending) cancelAnimationFrame(rafPending);
      rafPending = 0;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("resize", onWindowResize);
      resizeObserver?.disconnect();
      resizeObserver = undefined;
    };

    const onReducedMotionChange = () => {
      const next = mq.matches;
      if (next === reducedMotion) return;
      reducedMotion = next;
      lastProgressRef.current = -1;

      if (next) {
        detachScrollChain();
        applyMotionFrame(motionDomRef.current, 1, true);
      } else {
        attachScrollChain();
      }
    };

    mq.addEventListener("change", onReducedMotionChange);

    if (reducedMotion) {
      applyMotionFrame(motionDomRef.current, 1, true);
    } else {
      attachScrollChain();
    }

    return () => {
      mq.removeEventListener("change", onReducedMotionChange);
      detachScrollChain();
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative min-h-[470dvh] w-full min-w-0 max-w-full bg-gradient-to-b from-muted/40 via-background to-background"
      style={{ minHeight: "min(470dvh, 500vh)" }}
      data-lentes-hero-variant="A"
    >
      <div className="sticky top-[4.75rem] z-0 flex min-h-[calc(100dvh-4.75rem)] flex-col justify-start px-3 pb-12 pt-16 sm:px-5 sm:pb-14 sm:pt-[4.25rem] md:px-6 md:pb-12 md:pt-24 lg:pt-28">
        <div className="mx-auto grid w-full min-w-0 max-w-6xl items-start gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-9 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-6 md:gap-y-6 lg:gap-x-10 lg:gap-y-10">
          <div
            ref={(node) => patchMotionRef(motionDomRef, "stack", node)}
            className="relative mx-auto flex w-full min-w-0 max-w-[368px] justify-center md:order-2 md:mx-auto md:max-w-[392px] md:justify-self-center"
            aria-hidden
          >
            <div className="relative mx-auto w-full max-w-[332px] pb-14 sm:max-w-[360px] sm:pb-16 md:max-w-[392px] md:pb-10">
              <div className="mb-4 flex justify-center sm:mb-5">
                <span className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90 sm:text-[11px]">
                  O que você quer enxergar bem
                </span>
              </div>
              <div className="flex gap-3 sm:gap-3.5">
                {FOCUS_LAYERS.map((layer, i) => {
                  const { Icon, iconTint, glow, gradient } = layer;
                  return (
                    <div
                      key={layer.label}
                      ref={layerOuterRefs[i]}
                      className={cn(
                        "relative min-h-[172px] flex-1 overflow-hidden rounded-2xl border border-border/70 bg-zinc-950/92 sm:min-h-[188px] sm:rounded-3xl md:min-h-[202px]",
                        "ring-1 ring-inset ring-white/[0.06]",
                      )}
                      style={{
                        boxShadow:
                          "0 20px 40px -18px rgba(0,0,0,0.45), 0 8px 16px -6px rgba(0,0,0,0.28)",
                      }}
                    >
                      {/* Blur/opacity no fundo; ilustrações recebem defocus menor via applyMotionFrame. */}
                      <div
                        ref={layerInnerRefs[i]}
                        className="absolute inset-0 isolate"
                        aria-hidden
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-92", gradient)} />
                        <div
                          className={cn(
                            "pointer-events-none absolute left-1/2 top-[40%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:h-[4.25rem] sm:w-[4.25rem]",
                            glow,
                          )}
                        />
                      </div>
                      <div className="relative z-[1] grid h-full min-h-[inherit] grid-rows-2">
                        <div
                          ref={layerIconWrapRefs[i]}
                          className="relative flex min-h-0 flex-col items-center justify-center px-1 pt-2 pb-1 sm:pt-3"
                        >
                          <Icon
                            className={cn(
                              "relative h-10 w-10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] sm:h-11 sm:w-11",
                              iconTint,
                            )}
                            strokeWidth={1.35}
                            aria-hidden
                          />
                        </div>
                        <div className="relative flex min-h-0 flex-col items-center justify-center border-t border-white/10 bg-black/25 px-2 py-2 sm:px-2.5 sm:py-2.5">
                          <div>
                            <p className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-50 sm:text-[10px]">
                              {layer.label}
                            </p>
                            <p className="mt-0.5 text-center text-[8px] font-medium leading-tight text-zinc-300/95 sm:text-[9px]">
                              {layer.tag}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <LentesPremiumIolSketch className="mt-6 sm:mt-7" />
              <div className="mt-6 rounded-2xl border border-dashed border-brand/35 bg-gradient-to-br from-brand/[0.07] to-transparent p-4 sm:mt-7 sm:rounded-3xl sm:p-5">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand sm:text-[11px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  Checklist rápido
                </p>
                <ul className="mt-2.5 space-y-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                    Retina e nervo óptico em dia nos exames.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                    Prioridades claras: direção noturna, leitura, telas e contraste.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                    Astigmatismo relevante pode pedir tórica ou estratégia combinada.
                  </li>
                </ul>
              </div>
              <div className="pointer-events-none absolute bottom-2 left-1/2 h-8 w-[78%] -translate-x-1/2 rounded-[100%] bg-black/25 blur-xl" />
            </div>
          </div>

          <div
            ref={(node) => patchMotionRef(motionDomRef, "textCol", node)}
            className="isolate relative z-[1] flex min-w-0 flex-col justify-center text-left md:order-1"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5 sm:gap-3 md:mb-4">
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
              ref={(node) => patchMotionRef(motionDomRef, "h1", node)}
              className={cn(
                "font-black text-foreground break-words [overflow-wrap:anywhere]",
                "text-[clamp(1.75rem,6.5vw,5.25rem)] leading-[0.95] tracking-tight sm:text-[clamp(2rem,7vw,5.25rem)]",
              )}
            >
              Lentes premium
            </h1>
            <p
              ref={(node) => patchMotionRef(motionDomRef, "sub", node)}
              className="mt-3 text-[clamp(1.05rem,3.1vw,2rem)] font-semibold tracking-tight text-muted-foreground sm:mt-4"
            >
              Multifocal, EDoF e tórica na catarata: o que avaliar antes da cirurgia
            </p>

            <ol
              className="mb-6 mt-6 max-w-xl space-y-3 border-l-2 border-brand/25 pl-4 sm:mb-8 sm:mt-7 sm:space-y-3.5"
              aria-label="Resumo em quatro passos"
            >
              {STORY_BEATS.map((beat, index) => (
                <li
                  key={index}
                  ref={storyLiRefs[index]}
                  className="list-none text-[13px] leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed"
                >
                  {beat.text}
                </li>
              ))}
            </ol>

            <p
              ref={(node) => patchMotionRef(motionDomRef, "desc", node)}
              className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base md:text-lg"
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
                Agendar consulta online
              </a>
              <a
                href="#conteudo-principal"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full min-w-0 justify-center sm:w-auto",
                )}
              >
                Ler o guia completo
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
