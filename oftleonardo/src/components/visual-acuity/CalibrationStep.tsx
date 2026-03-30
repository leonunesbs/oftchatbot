import { useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from "lucide-react";
import {
  CREDIT_CARD_HEIGHT_MM,
  CREDIT_CARD_ASPECT_RATIO,
  LOCALSTORAGE_KEY,
  SLIDER_POSITION_KEY,
  type CalibrationData,
} from "./constants";

interface CalibrationStepProps {
  onCalibrated: (pxPerMm: number) => void;
  initialPxPerMm?: number;
}

function getInitialSliderPosition(initialPxPerMm?: number): number {
  try {
    const stored = localStorage.getItem(SLIDER_POSITION_KEY);
    if (stored) {
      const value = Number(stored);
      if (value >= 100 && value <= 500) return value;
    }
  } catch {
    // ignore
  }
  if (initialPxPerMm) {
    return Math.round(initialPxPerMm * CREDIT_CARD_HEIGHT_MM);
  }
  return 220;
}

export default function CalibrationStep({
  onCalibrated,
  initialPxPerMm,
}: CalibrationStepProps) {
  const [cardHeightPx, setCardHeightPx] = useState(() =>
    getInitialSliderPosition(initialPxPerMm),
  );

  const cardWidthPx = cardHeightPx * CREDIT_CARD_ASPECT_RATIO;
  const pxPerMm = cardHeightPx / CREDIT_CARD_HEIGHT_MM;

  const handleConfirm = useCallback(() => {
    const data: CalibrationData = {
      pxPerMm,
      calibratedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
    onCalibrated(pxPerMm);
  }, [pxPerMm, onCalibrated]);

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Calibração da Tela
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Use um <strong>cartão físico padrão</strong> apenas como referência de
          tamanho (não envolve pagamento) e ajuste o controle deslizante até
          que o contorno abaixo tenha{" "}
          <strong>exatamente o mesmo tamanho</strong> do cartão.
        </p>
      </div>

      <div className="flex w-full max-w-lg items-center gap-6">
        {/* Vertical slider on the left */}
        <div className="flex h-72 flex-col items-center justify-center">
          <Slider
            orientation="vertical"
            min={100}
            max={500}
            step={1}
            value={[cardHeightPx]}
            onValueChange={([v]) => {
              setCardHeightPx(v);
              try {
                localStorage.setItem(SLIDER_POSITION_KEY, String(v));
              } catch {
                // storage full or unavailable
              }
            }}
            className="h-full data-[orientation=vertical]:w-10"
          />
        </div>

        {/* Credit card outline */}
        <div className="flex flex-1 items-center justify-center">
          <div
            className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-brand bg-brand/5 transition-all duration-100"
            style={{
              width: `${cardWidthPx}px`,
              height: `${cardHeightPx}px`,
            }}
          >
            <div className="flex flex-col items-center gap-2 opacity-40">
              <CreditCard className="size-8" />
              <span className="text-xs font-medium">
                {cardWidthPx.toFixed(0)} × {cardHeightPx.toFixed(0)} px
              </span>
            </div>

            {/* Corner markers */}
            <Corner position="top-left" />
            <Corner position="top-right" />
            <Corner position="bottom-left" />
            <Corner position="bottom-right" />
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-4 gap-2"
        onClick={handleConfirm}
      >
        <Check className="size-4" />
        Confirmar Calibração
      </Button>
    </div>
  );
}

function Corner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const base = "absolute size-4 border-brand";
  const styles: Record<string, string> = {
    "top-left": `${base} left-0 top-0 rounded-tl-sm border-l-2 border-t-2`,
    "top-right": `${base} right-0 top-0 rounded-tr-sm border-r-2 border-t-2`,
    "bottom-left": `${base} bottom-0 left-0 rounded-bl-sm border-b-2 border-l-2`,
    "bottom-right": `${base} bottom-0 right-0 rounded-br-sm border-b-2 border-r-2`,
  };
  return <div className={styles[position]} />;
}
