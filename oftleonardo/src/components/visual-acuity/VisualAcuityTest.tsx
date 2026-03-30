import { useState, useCallback, useEffect, useMemo } from "react";
import { type CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import OptotypeCard from "./OptotypeCard";
import {
  ACUITY_LEVELS,
  generateSeededLetters,
  generateSeededOrientations,
  type OptotypeMode,
  type Orientation,
} from "./constants";

type EyeSide = "OD" | "OS";
type LiveRole = "solo" | "host" | "participant";
const EXAMINER_OPTOTYPE_COUNT = 5;
const ORIENTATION_MAP: Record<Orientation, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};
const EYE_DISPLAY_LABEL: Record<EyeSide, "OD" | "OE"> = {
  OD: "OD",
  OS: "OE",
};

interface LiveSessionSnapshot {
  pin: string;
  status: "active" | "completed" | "expired";
  chartSeed: string;
  currentEye: EyeSide;
  currentIndex: number;
  expiresAt: string;
}

export interface TestResults {
  od: string;
  os: string;
}

interface VisualAcuityTestProps {
  pxPerMm: number;
  distanceM: number;
  mode: OptotypeMode;
  chartSeed: string;
  onComplete: (results: TestResults) => void;
  liveRole: LiveRole;
  livePin?: string;
  liveSession: LiveSessionSnapshot | null;
  streamState: string;
  onSessionAction: (action: "previous" | "next" | "cant-see" | "can-see-all" | "finish") => void;
  liveError: string | null;
}

export default function VisualAcuityTest({
  pxPerMm,
  distanceM,
  mode,
  chartSeed,
  onComplete,
  liveRole,
  livePin,
  liveSession,
  streamState,
  onSessionAction,
  liveError,
}: VisualAcuityTestProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentEye, setCurrentEye] = useState<EyeSide>("OD");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [odResult, setOdResult] = useState<string | null>(null);
  const isParticipant = liveRole === "participant";
  const isHost = liveRole === "host";
  const examinerKeyByEye = useMemo(() => {
    return (["OD", "OS"] as EyeSide[]).map((eye) => {
      const rows = ACUITY_LEVELS.map((level) => {
        const seed = `${chartSeed}-${mode}-${eye}-${level.snellen}`;
        const key =
          mode === "snellen-letters"
            ? generateSeededLetters(EXAMINER_OPTOTYPE_COUNT, seed).join(" ")
            : generateSeededOrientations(EXAMINER_OPTOTYPE_COUNT, seed)
                .map((orientation) => ORIENTATION_MAP[orientation])
                .join(" ");

        return { snellen: level.snellen, key };
      });

      return { eye, rows };
    });
  }, [chartSeed, mode]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!isParticipant || !liveSession || !api) return;

    if (currentEye !== liveSession.currentEye) {
      setCurrentEye(liveSession.currentEye);
    }

    if (currentIndex !== liveSession.currentIndex) {
      setCurrentIndex(liveSession.currentIndex);
      api.scrollTo(liveSession.currentIndex);
    }
  }, [api, currentEye, currentIndex, isParticipant, liveSession]);

  const handleCantSee = useCallback(() => {
    if (isParticipant) return;
    const acuity =
      currentIndex === 0
        ? "< 20/200"
        : ACUITY_LEVELS[currentIndex - 1].snellen;

    if (currentEye === "OD") {
      setOdResult(acuity);
      setCurrentEye("OS");
      setCurrentIndex(0);
    } else {
      onComplete({
        od: odResult ?? "< 20/200",
        os: acuity,
      });
    }
    if (isHost) {
      onSessionAction("cant-see");
    }
  }, [currentEye, currentIndex, isHost, isParticipant, odResult, onComplete, onSessionAction]);

  const handleCanSeeAll = useCallback(() => {
    if (isParticipant) return;
    const bestAcuity = ACUITY_LEVELS[ACUITY_LEVELS.length - 1].snellen;

    if (currentEye === "OD") {
      setOdResult(bestAcuity);
      setCurrentEye("OS");
      setCurrentIndex(0);
    } else {
      onComplete({
        od: odResult ?? bestAcuity,
        os: bestAcuity,
      });
    }
    if (isHost) {
      onSessionAction("can-see-all");
    }
  }, [currentEye, isHost, isParticipant, odResult, onComplete, onSessionAction]);

  const handleNext = useCallback(() => {
    if (isParticipant) return;
    api?.scrollNext();
    if (isHost) {
      onSessionAction("next");
    }
  }, [api, isHost, isParticipant, onSessionAction]);

  const handlePrevious = useCallback(() => {
    if (!isHost) return;
    api?.scrollPrev();
    onSessionAction("previous");
  }, [api, isHost, onSessionAction]);

  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === ACUITY_LEVELS.length - 1;

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-6 px-4 py-8">
      {liveRole !== "solo" ? (
        <div className="w-full max-w-lg rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
          <p className="text-sm font-medium">
            Avaliação remota {livePin ? `#${livePin}` : ""}
          </p>
          <p className="text-muted-foreground text-xs">
            {isHost ? "Você conduz o exame." : "Exame conduzido pelo examinador."} Conexão: {streamState}.
          </p>
          {liveError ? <p className="text-destructive mt-1 text-xs">{liveError}</p> : null}
        </div>
      ) : null}
      {isHost ? (
        <div className="w-full max-w-2xl rounded-xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-sm font-semibold">Modo examinador (gabarito completo)</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Use este gabarito para conferir as respostas do paciente durante a consulta.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {examinerKeyByEye.map((group) => (
              <div key={group.eye} className="rounded-md border bg-background/60 p-3">
                <p className="mb-2 text-xs font-semibold">Olho {EYE_DISPLAY_LABEL[group.eye]}</p>
                <ul className="space-y-1">
                  {group.rows.map((row) => (
                    <li key={`${group.eye}-${row.snellen}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">{row.snellen}</span>
                      <span className="font-mono tracking-wide">{row.key}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Eye indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {currentEye === "OD" ? (
              <Eye className="size-5 text-brand" />
            ) : (
              <EyeOff className="text-muted-foreground size-5" />
            )}
            <span
              className={
                currentEye === "OD"
                  ? "font-bold text-brand"
                  : "text-muted-foreground text-sm"
              }
            >
              OD
            </span>
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="flex items-center gap-1.5">
            {currentEye === "OS" ? (
              <Eye className="size-5 text-brand" />
            ) : (
              <EyeOff className="text-muted-foreground size-5" />
            )}
            <span
              className={
                currentEye === "OS"
                  ? "font-bold text-brand"
                  : "text-muted-foreground text-sm"
              }
            >
              OE
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {currentEye === "OD"
            ? "Tampe o olho esquerdo e leia com o olho direito"
            : "Tampe o olho direito e leia com o olho esquerdo"}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {ACUITY_LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full transition-colors ${
              i <= currentIndex ? "bg-brand" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Carousel */}
      <div className="w-full max-w-lg">
        <Carousel
          key={currentEye}
          setApi={setApi}
          opts={{ watchDrag: false }}
          className="w-full"
        >
          <CarouselContent>
            {ACUITY_LEVELS.map((level) => (
              <CarouselItem key={level.snellen}>
                <div className="flex min-h-[40dvh] items-center justify-center px-4 py-8">
                  <OptotypeCard
                    level={level}
                    pxPerMm={pxPerMm}
                    distanceM={distanceM}
                    mode={mode}
                    chartSeed={chartSeed}
                    eyeSide={currentEye}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Action buttons */}
      {isParticipant ? (
        <div className="text-muted-foreground text-sm">
          Aguarde o examinador ajustar os cards.
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-3">
          {isHost ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={handlePrevious}
                disabled={isFirstCard}
              >
                <ChevronLeft className="size-4" />
                Voltar
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full gap-2"
                onClick={handleNext}
                disabled={isLastCard}
              >
                Próximo
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : isLastCard ? (
            <Button type="button" size="lg" className="w-full gap-2" onClick={handleCanSeeAll}>
              Consigo ver
            </Button>
          ) : (
            <Button type="button" size="lg" className="w-full gap-2" onClick={handleNext}>
              Próximo
              <ChevronRight className="size-4" />
            </Button>
          )}
          {isHost && isLastCard ? (
            <Button type="button" size="lg" className="w-full gap-2" onClick={handleCanSeeAll}>
              Consigo ver
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleCantSee}
          >
            Não consigo ler
          </Button>
        </div>
      )}
    </div>
  );
}
