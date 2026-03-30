import { BookOpen, CheckCircle2, Monitor, Mountain, type LucideIcon } from "lucide-react";

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

/** Narrativa: “premium” vai além de trifocal — distâncias, qualidade visual e trade-offs de luz. */
const STORY_BEATS: readonly { text: string }[] = [
  {
    text: "Lente premium na catarata não resume a trifocal: pode ser nitidez na distância planejada, faixa de foco mais ampla (EDoF) ou menos óculos no dia a dia — sempre discutindo contraste e halos.",
  },
  {
    text: "Multifocal e trifocal dividem a luz entre focos; monofocal de linha superior prioriza a imagem em uma distância. Em ambos os casos há compromissos a alinhar antes da cirurgia.",
  },
  {
    text: "Há contrapartidas possíveis: halos, sensação de contraste diferente e curva de adaptação — tudo deve ser conversado antes da escolha.",
  },
  {
    text: "Exames (retina, nervo, medidas) e metas honestas definem se monofocal de linha superior, EDoF, multifocal/trifocal ou tórica fazem sentido — na consulta você fecha o plano com o oftalmologista.",
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

/** Variante **A** — mesmo conteúdo da B com outro arranjo visual; LIO só com giro CSS (sem trilha longa, sticky nem scroll em JS). */
export function LentesPremiumHeroVariantA({
  title,
  description,
  readingTime,
  lastReviewedFormatted,
  isOpinion = false,
  scheduleAnchorHref = "/agendamento-online",
  scheduleAnchorId = "gtm-artigo-lentes-premium-catarata-hero-agendar",
}: LentesPremiumHeroVariantProps) {
  return (
    <div
      className="relative w-full min-w-0 max-w-full overflow-x-hidden border-b border-border/70 bg-gradient-to-b from-muted/40 via-background to-background"
      data-lentes-hero-variant="A"
    >
      <div className="relative z-0 flex flex-col justify-start px-3 pb-12 pt-16 sm:px-5 sm:pb-14 sm:pt-[4.25rem] md:px-6 md:pb-12 md:pt-24 lg:pt-28">
        <div className="mx-auto grid w-full min-w-0 max-w-6xl items-start gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-9 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-6 md:gap-y-6 lg:gap-x-10 lg:gap-y-10">
          <div
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
                {FOCUS_LAYERS.map((layer) => {
                  const { Icon, iconTint, glow, gradient } = layer;
                  return (
                    <div
                      key={layer.label}
                      className={cn(
                        "relative min-h-[172px] flex-1 overflow-hidden rounded-2xl border border-border/70 bg-zinc-950/92 sm:min-h-[188px] sm:rounded-3xl md:min-h-[202px]",
                        "ring-1 ring-inset ring-white/[0.06]",
                      )}
                      style={{
                        boxShadow:
                          "0 20px 40px -18px rgba(0,0,0,0.45), 0 8px 16px -6px rgba(0,0,0,0.28)",
                      }}
                    >
                      <div className="absolute inset-0 isolate" aria-hidden>
                        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-92", gradient)} />
                        <div
                          className={cn(
                            "pointer-events-none absolute left-1/2 top-[40%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:h-[4.25rem] sm:w-[4.25rem]",
                            glow,
                          )}
                        />
                      </div>
                      <div className="relative z-[1] grid h-full min-h-[inherit] grid-rows-2">
                        <div className="relative flex min-h-0 flex-col items-center justify-center px-1 pt-2 pb-1 sm:pt-3">
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
                    Retina e nervo óptico saudáveis nos exames.
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

          <div className="isolate relative z-[1] flex min-w-0 flex-col justify-center text-left md:order-1">
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
              className={cn(
                "font-black text-foreground break-words [overflow-wrap:anywhere]",
                "text-[clamp(1.75rem,6.5vw,5.25rem)] leading-[0.95] tracking-tight sm:text-[clamp(2rem,7vw,5.25rem)]",
              )}
            >
              Lentes premium
            </h1>
            <p className="mt-3 text-[clamp(1.05rem,3.1vw,2rem)] font-semibold tracking-tight text-muted-foreground sm:mt-4">
              Multifocal, EDoF e tórica na catarata: o que avaliar antes da cirurgia
            </p>

            <ol
              className="mb-6 mt-6 max-w-xl space-y-3 border-l-2 border-brand/25 pl-4 sm:mb-8 sm:mt-7 sm:space-y-3.5"
              aria-label="Resumo em quatro passos"
            >
              {STORY_BEATS.map((beat, index) => (
                <li
                  key={index}
                  className="list-none text-[13px] leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed"
                >
                  {beat.text}
                </li>
              ))}
            </ol>

            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base md:text-lg">
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
          O guia completo sobre tipos de lente, indicações e expectativas está abaixo
        </p>
      </div>
    </div>
  );
}
