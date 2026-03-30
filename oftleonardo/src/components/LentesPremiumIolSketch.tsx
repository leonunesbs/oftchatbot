import { type Ref } from "react";

import { cn } from "@/lib/utils";

type LentesPremiumIolSketchProps = {
  className?: string;
  /** Quando definido, envolve o giro CSS num wrapper para `rotateY` extra via scroll (hero variante A). */
  scrollDriveRef?: Ref<HTMLDivElement>;
};

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
 * Esboço esquemático de LIO: óptica + hápticos em C, rotação em perspectiva.
 * Giro contínuo via CSS (`animation`); opcionalmente um wrapper com ref para somar rotação ao scroll.
 */
export function LentesPremiumIolSketch({ className, scrollDriveRef }: LentesPremiumIolSketchProps) {
  const spinBlock = (
    <div
      className="lentes-premium-iol-sketch-spin lentes-premium-iol-sketch-spin-animated w-full"
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
  );

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
      <div className="lentes-premium-iol-sketch-perspective relative w-full [contain:layout_style]">
        {scrollDriveRef ? (
          <div
            ref={scrollDriveRef}
            className="lentes-premium-iol-sketch-scroll-drive w-full [transform-style:preserve-3d]"
            style={{ transformOrigin: "50% 50%" }}
          >
            {spinBlock}
          </div>
        ) : (
          spinBlock
        )}
      </div>
    </div>
  );
}
