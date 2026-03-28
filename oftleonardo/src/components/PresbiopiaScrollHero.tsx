import { useLayoutEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PresbiopiaScrollHeroProps = {
  title: string;
  description: string;
  readingTime: string;
  /** Data da última revisão já formatada em pt-BR (ex.: 28 de março de 2026). */
  lastReviewedFormatted: string;
  /** Link âncora para a seção de agendamento (ex.: #agendar). */
  scheduleAnchorHref?: string;
  scheduleAnchorId?: string;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Curva suave entre 0 e 1 no intervalo [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number) {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Narrativa em atos: cada trecho ganha nitidez num trecho do scroll (progresso 0–1). */
const STORY_BEATS: readonly { text: string; fadeInStart: number; fadeInEnd: number }[] = [
  {
    text: "Primeiro, o perto deixa de ser confortável — leitura e tela pedem mais distância.",
    fadeInStart: 0,
    fadeInEnd: 0.22,
  },
  {
    text: "O cristalino perde flexibilidade: é um processo natural, não ‘falta de cuidado’ com os olhos.",
    fadeInStart: 0.12,
    fadeInEnd: 0.4,
  },
  {
    text: "Óculos, lentes ou outras opções existem — a escolha certa depende do exame e da sua rotina.",
    fadeInStart: 0.3,
    fadeInEnd: 0.62,
  },
  {
    text: "Entender ajuda; decidir com segurança é o papel da avaliação oftalmológica completa.",
    fadeInStart: 0.52,
    fadeInEnd: 0.92,
  },
];

export function PresbiopiaScrollHero({
  title,
  description,
  readingTime,
  lastReviewedFormatted,
  scheduleAnchorHref = "#agendar",
  scheduleAnchorId = "gtm-artigo-presbiopia-hero-agendar",
}: PresbiopiaScrollHeroProps) {
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
    let rafLoop = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const trackHeight = Math.max(rect.height, el.offsetHeight, 1);
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scrollable = Math.max(1, trackHeight - vh);
      let p = clamp01(-rect.top / scrollable);
      if (p >= 0.997) p = 1;
      const prev = lastProgressRef.current;
      if (Math.abs(p - prev) > 0.0001) {
        lastProgressRef.current = p;
        setProgress(p);
      }
    };

    const tick = () => {
      if (document.visibilityState === "visible") {
        update();
      }
      rafLoop = requestAnimationFrame(tick);
    };

    const onLayout = () => {
      lastProgressRef.current = -1;
      update();
    };

    rafLoop = requestAnimationFrame(tick);

    window.addEventListener("resize", onLayout, { passive: true });
    window.visualViewport?.addEventListener("resize", onLayout);
    window.visualViewport?.addEventListener("scroll", onLayout);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(onLayout);
      resizeObserver.observe(el);
    }

    update();

    return () => {
      cancelAnimationFrame(rafLoop);
      window.removeEventListener("resize", onLayout);
      window.visualViewport?.removeEventListener("resize", onLayout);
      window.visualViewport?.removeEventListener("scroll", onLayout);
      resizeObserver?.disconnect();
      mq.removeEventListener("change", apply);
    };
  }, [trackEl]);

  const t = progress >= 1 ? 1 : easeOutCubic(progress);

  /**
   * Foco da tela do celular completa antes do fim da trilha (fração do progresso 0–1),
   * para as letras ficarem nítidas com o hero ainda em sticky — a trilha é longa o bastante
   * para “segurar” depois disso sem começar a rolar o artigo cedo demais.
   */
  const PHONE_FOCUS_BY = 0.74;
  const phoneScreenT =
    progress >= 1 ? 1 : easeOutCubic(clamp01(progress / PHONE_FOCUS_BY));

  /** Blur forte no início (DOF); some ao focar. */
  const blurPx = t >= 1 ? 0 : lerp(16, 0, t);
  /** Celular: começa maior e “à frente” (Z+), afasta-se e encolhe ao focar. */
  const phoneZ = lerp(72, 0, t);
  const phoneRotateY = lerp(11, 0, t);
  const phoneRotateX = lerp(-6, 0, t);
  const phoneScale = lerp(1.2, 0.9, t);
  const phoneX = lerp(0, -12, t);
  const phoneY = lerp(0, 7, t);
  /** Bloco de texto: mesma lógica de profundidade, leve rotação em Y. */
  const textZ = lerp(52, 0, t);
  const textRotateY = lerp(-6, 0, t);
  const textRotateX = lerp(3.5, 0, t);
  const textScale = lerp(1.12, 1, t);
  const textSlideX = lerp(5, 0, t);
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
            perspectiveOrigin: "50% 38%",
          }}
        >
          {/* Ilustração: primeiro no mobile (primeira dobra); à direita no desktop (md:order-2) */}
          <div
            className="relative mx-auto flex w-full min-w-0 max-w-[180px] justify-center min-[400px]:max-w-[210px] sm:max-w-[240px] md:order-2 md:mx-0 md:max-w-none md:justify-center lg:justify-end"
            aria-hidden
            style={{
              transform: prefersReducedMotion
                ? undefined
                : `translate3d(${phoneX}%, ${phoneY}%, 0) translateZ(${phoneZ}px) rotateX(${phoneRotateX}deg) rotateY(${phoneRotateY}deg) scale(${phoneScale})`,
              transformOrigin: "center center",
              transition: prefersReducedMotion ? "none" : undefined,
              willChange: prefersReducedMotion ? undefined : "transform",
            }}
          >
            <div className="relative aspect-[9/19] w-full max-w-[180px] rounded-[1.75rem] border border-border/80 bg-zinc-950 p-2 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] min-[400px]:max-w-[200px] min-[400px]:rounded-[1.9rem] sm:max-w-[260px] sm:rounded-[2.25rem] sm:p-[10px] md:w-[min(36vw,300px)] md:max-w-none">
              <div className="pointer-events-none absolute left-1/2 top-2.5 z-10 h-5 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />
              <div
                className="relative h-full w-full overflow-hidden rounded-[1.65rem] bg-zinc-900"
                style={{
                  filter: phoneScreenT >= 1 ? "none" : `blur(${lerp(12, 0, phoneScreenT)}px)`,
                }}
              >
                <div className="flex h-full flex-col px-2.5 pb-2 pt-7">
                  {/* Barra de status fictícia */}
                  <div className="mb-2 flex items-center justify-between px-0.5">
                    <span className="text-[8px] font-medium tabular-nums text-zinc-500">9:41</span>
                    <div className="flex items-center gap-0.5">
                      <div className="h-1.5 w-3 rounded-sm bg-zinc-600" />
                      <div className="h-2 w-4 rounded border border-zinc-600 bg-zinc-800" />
                    </div>
                  </div>

                  {/* Conteúdo tipo leitor / artigo (tema: vista cansada) */}
                  <div className="min-h-0 flex-1 rounded-xl bg-zinc-950/90 p-2.5 ring-1 ring-inset ring-white/5">
                    <p className="text-[7px] font-semibold uppercase tracking-wider text-sky-400/90">
                      Saúde · olhos
                    </p>
                    <h3 className="mt-1.5 text-[10px] font-bold leading-tight text-zinc-100">
                      Quando o perto deixa de focar
                    </h3>
                    <p className="mt-2 text-[7px] leading-snug text-zinc-400">
                      Mensagens e letras pequenas podem exigir mais distância ou mais luz do que antes.
                    </p>
                    <p className="mt-1.5 text-[7px] leading-snug text-zinc-500">
                      Isso costuma aparecer aos poucos — muitas pessoas notam entre 40 e 45 anos.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-zinc-800/90 pt-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600/40 to-zinc-800 text-[9px] font-bold text-sky-200/90"
                        aria-hidden
                      >
                        Aa
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[7px] font-medium text-zinc-500">Dica de leitura</p>
                        <p className="text-[7px] text-zinc-400">Afastar o celular alguns centímetros costuma ajudar na hora.</p>
                      </div>
                    </div>
                  </div>

                  {/* Dock fictício + indicador home */}
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <div className="flex w-full items-center justify-between px-1">
                      {[
                        { label: "Ler", active: true },
                        { label: "Busca", active: false },
                        { label: "Mapas", active: false },
                        { label: "Mais", active: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={cn(
                            "flex flex-col items-center gap-0.5",
                            item.active ? "opacity-100" : "opacity-45",
                          )}
                        >
                          <div
                            className={cn(
                              "h-7 w-7 rounded-xl",
                              item.active
                                ? "bg-sky-500/25 ring-1 ring-sky-400/40"
                                : "bg-zinc-800/90",
                            )}
                          />
                          <span className="text-[6px] font-medium text-zinc-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-1 w-9 rounded-full bg-zinc-700/90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna principal: leitura em F — título → subtítulo → narrativa → descrição → ações (md:order-1 = à esquerda no desktop) */}
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
            </div>

            <h1
              className={cn(
                "font-black text-foreground break-words [overflow-wrap:anywhere]",
                "text-[clamp(1.875rem,7vw,5.75rem)] leading-[0.95] tracking-tight sm:text-[clamp(2.25rem,7.5vw,5.75rem)]",
              )}
              style={{
                filter: blurPx <= 0 ? "none" : `blur(${blurPx}px)`,
                letterSpacing: `${lerp(-0.045, -0.028, t)}em`,
              }}
            >
              Vista cansada
            </h1>
            <p
              className="mt-2 text-[clamp(1.125rem,3.4vw,2.25rem)] font-semibold tracking-tight text-muted-foreground sm:mt-3"
              style={{
                filter: blurPx <= 0 ? "none" : `blur(${blurPx * 0.85}px)`,
                opacity: opacityMuted,
              }}
            >
              Presbiopia
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
          Continue rolando para acompanhar a história e, em seguida, o artigo completo
        </p>
      </div>
    </div>
  );
}
