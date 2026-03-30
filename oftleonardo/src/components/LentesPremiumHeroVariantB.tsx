import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  Expand,
  Layers,
  MessageCircle,
  Monitor,
  Mountain,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { LentesPremiumHeroVariantProps } from "@/components/LentesPremiumHeroVariantA";

const FOCUS_LAYERS: readonly {
  label: string;
  tag: string;
  Icon: LucideIcon;
  iconTint: string;
  glow: string;
  gradient: string;
  floatDelayClass: string;
}[] = [
  {
    label: "Longe",
    tag: "Direção, TV, rosto",
    Icon: Mountain,
    iconTint: "text-sky-200/95",
    glow: "bg-sky-400/25",
    gradient: "from-sky-500/35 via-sky-900/25 to-zinc-950",
    floatDelayClass: "lentes-hero-card-float-delay-1",
  },
  {
    label: "Meio",
    tag: "Notebook, cozinha",
    Icon: Monitor,
    iconTint: "text-emerald-200/95",
    glow: "bg-emerald-400/22",
    gradient: "from-emerald-500/30 via-teal-900/22 to-zinc-950",
    floatDelayClass: "lentes-hero-card-float-delay-2",
  },
  {
    label: "Perto",
    tag: "Leitura, celular",
    Icon: BookOpen,
    iconTint: "text-amber-200/95",
    glow: "bg-amber-400/20",
    gradient: "from-amber-500/25 via-amber-900/18 to-zinc-950",
    floatDelayClass: "lentes-hero-card-float-delay-3",
  },
];

const LENS_TYPES: readonly { label: string; Icon: LucideIcon }[] = [
  { label: "Monofocal", Icon: CircleDot },
  { label: "Multifocal / trifocal", Icon: Layers },
  { label: "EDoF", Icon: Expand },
  { label: "Tórica", Icon: Target },
];

const VALUE_POINTS: readonly { text: string; Icon: LucideIcon }[] = [
  {
    text: "Veja o que multifocal, trifocal, EDoF e tórica costumam entregar — e onde ainda pode fazer sentido usar óculos — sem jargão de catálogo.",
    Icon: Sparkles,
  },
  {
    text: "Antecipe halos, contraste e adaptação: alinhe isso à sua rotina (direção à noite, telas, leitura) antes de escolher a lente.",
    Icon: ShieldCheck,
  },
  {
    text: "Chegue à consulta com perguntas prontas e decida com o oftalmologista com base nos seus exames e nas suas metas.",
    Icon: MessageCircle,
  },
];

function splitArticleTitle(fullTitle: string) {
  const idx = fullTitle.indexOf(":");
  if (idx === -1) {
    return { headline: fullTitle, subtitle: null as string | null };
  }
  return {
    headline: fullTitle.slice(0, idx).trim(),
    subtitle: fullTitle.slice(idx + 1).trim() || null,
  };
}

/** Variante **B** — hero estático com foco em conversão. */
export function LentesPremiumHeroVariantB({
  title,
  description,
  readingTime,
  lastReviewedFormatted,
  isOpinion = false,
  scheduleAnchorHref = "/agendamento-online",
  scheduleAnchorId = "gtm-artigo-lentes-premium-catarata-hero-agendar",
}: LentesPremiumHeroVariantProps) {
  const { headline, subtitle } = splitArticleTitle(title);

  return (
    <section
      className="relative w-full min-w-0 max-w-full overflow-x-hidden border-b border-border/70 bg-gradient-to-b from-muted/45 via-background to-background"
      aria-labelledby="lentes-premium-hero-heading"
      data-lentes-hero-variant="B"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[18%] top-[6%] h-[min(52vh,400px)] w-[min(52vh,400px)] rounded-full bg-brand/14 blur-3xl" />
        <div className="absolute -right-[12%] bottom-[8%] h-[min(44vh,360px)] w-[min(44vh,360px)] rounded-full bg-teal-500/11 blur-3xl" />
        <div
          className="absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-14 md:pb-20 md:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,1fr)] lg:gap-14 xl:gap-16">
          <div className="min-w-0">
            <div
              className={cn(
                "lentes-hero-rise mb-5 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-2.5",
              )}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/12 px-3 py-1 text-xs font-semibold tracking-wide text-brand">
                <Sparkles className="h-3.5 w-3.5 opacity-90" aria-hidden />
                Guia + próximo passo na consulta
              </span>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {readingTime} de leitura
              </span>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                Revisado em {lastReviewedFormatted}
              </span>
              {isOpinion ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                  Opinião
                </span>
              ) : null}
            </div>

            <h1
              id="lentes-premium-hero-heading"
              className={cn(
                "lentes-hero-rise lentes-hero-rise-delay-1 font-black tracking-tight text-foreground [overflow-wrap:anywhere]",
                "text-[clamp(1.85rem,5.8vw,3.35rem)] leading-[1.05] sm:text-[clamp(2rem,5.2vw,3.5rem)]",
              )}
            >
              {headline}
            </h1>
            {subtitle ? (
              <p
                className={cn(
                  "lentes-hero-rise lentes-hero-rise-delay-1 mt-2 text-pretty text-lg font-semibold tracking-tight text-muted-foreground sm:text-xl",
                )}
              >
                {subtitle}
              </p>
            ) : null}

            <p
              className={cn(
                "lentes-hero-rise lentes-hero-rise-delay-2 mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg",
              )}
            >
              {description}
            </p>

            <ul className="lentes-hero-rise lentes-hero-rise-delay-3 mt-8 max-w-xl space-y-3.5">
              {VALUE_POINTS.map(({ text, Icon }) => (
                <li key={text} className="flex gap-3 text-sm leading-snug text-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/14 text-brand ring-1 ring-brand/20">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>

            <div
              className={cn(
                "lentes-hero-rise lentes-hero-rise-delay-4 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
              )}
            >
              <a
                id={scheduleAnchorId}
                href={scheduleAnchorHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "inline-flex w-full min-w-0 shrink-0 justify-center gap-2 shadow-md shadow-brand/20 sm:w-auto",
                )}
              >
                <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden />
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

            <p
              className={cn(
                "lentes-hero-rise lentes-hero-rise-delay-5 mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm",
              )}
            >
              Conteúdo educativo, sem indicação de marca. Na consulta com o Dr Leonardo, exames e objetivos definem se
              multifocal, EDoF, tórica ou monofocal é a melhor combinação para o seu caso.
            </p>

            <p className="sr-only">{title}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none">
            <div className="lentes-hero-rise lentes-hero-rise-delay-2 mb-4 flex items-center justify-center gap-2 lg:justify-start">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                O que você quer enxergar bem
              </span>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 lg:justify-start">
              {FOCUS_LAYERS.map((layer) => {
                const { Icon, iconTint, glow, gradient, floatDelayClass } = layer;
                return (
                  <div
                    key={layer.label}
                    className={cn(
                      "lentes-hero-card-float relative min-h-[158px] flex-1 overflow-hidden rounded-2xl border border-border/70 bg-zinc-950/92 shadow-lg ring-1 ring-inset ring-white/[0.06] sm:min-h-[176px] sm:rounded-3xl md:min-h-[188px]",
                      floatDelayClass,
                    )}
                    style={{
                      boxShadow:
                        "0 20px 40px -18px rgba(0,0,0,0.45), 0 8px 16px -6px rgba(0,0,0,0.28)",
                    }}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-b opacity-92", gradient)} />
                    <div className="relative flex h-full min-h-[inherit] flex-col">
                      <div className="relative flex flex-1 flex-col items-center justify-center px-2 pt-4 pb-2">
                        <div
                          className={cn(
                            "pointer-events-none absolute left-1/2 top-[40%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:h-[4.25rem] sm:w-[4.25rem]",
                            glow,
                          )}
                          aria-hidden
                        />
                        <Icon
                          className={cn(
                            "relative z-[1] h-10 w-10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] sm:h-11 sm:w-11",
                            iconTint,
                          )}
                          strokeWidth={1.35}
                          aria-hidden
                        />
                      </div>
                      <div className="relative border-t border-white/10 bg-black/25 px-2 py-2 sm:px-2.5 sm:py-2.5">
                        <p className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-50 sm:text-[11px]">
                          {layer.label}
                        </p>
                        <p className="mt-0.5 text-center text-[9px] font-medium leading-tight text-zinc-300/95 sm:text-[10px]">
                          {layer.tag}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lentes-hero-rise lentes-hero-rise-delay-4 mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {LENS_TYPES.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/85 bg-background/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm sm:text-[11px]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-brand/90" aria-hidden />
                  {label}
                </span>
              ))}
            </div>

            <div className="lentes-hero-rise lentes-hero-rise-delay-5 mt-6 rounded-2xl border border-dashed border-brand/35 bg-gradient-to-br from-brand/[0.07] to-transparent p-4 sm:rounded-3xl sm:p-5">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand sm:text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Checklist rápido
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-snug text-muted-foreground sm:text-sm">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                  Retina e nervo óptico em dia nos exames — isso orienta se multifocal faz sentido.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                  Prioridades claras: direção à noite, leitura fina, telas, contraste.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/75" aria-hidden />
                  Astigmatismo relevante pode pedir tórica ou estratégia combinada.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
