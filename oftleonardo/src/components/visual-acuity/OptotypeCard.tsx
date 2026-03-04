import { useMemo } from "react";
import TumblingE from "./TumblingE";
import SnellenLetter from "./SnellenLetter";
import {
  type AcuityLevel,
  type OptotypeMode,
  optotypeHeightPx,
  generateSeededOrientations,
  generateSeededLetters,
} from "./constants";

interface OptotypeCardProps {
  level: AcuityLevel;
  pxPerMm: number;
  distanceM: number;
  mode: OptotypeMode;
  chartSeed: string;
  eyeSide: "OD" | "OS";
}

const OPTOTYPE_COUNT = 5;

export default function OptotypeCard({
  level,
  pxPerMm,
  distanceM,
  mode,
  chartSeed,
  eyeSide,
}: OptotypeCardProps) {
  const sizePx = Math.max(optotypeHeightPx(level.denominator, pxPerMm, distanceM), 2);
  const gapPx = sizePx;
  const rowWidthPx = OPTOTYPE_COUNT * sizePx + (OPTOTYPE_COUNT - 1) * gapPx;
  const seedBase = `${chartSeed}-${mode}-${eyeSide}-${level.snellen}`;
  const orientations = useMemo(() => generateSeededOrientations(OPTOTYPE_COUNT, seedBase), [seedBase]);
  const letters = useMemo(() => generateSeededLetters(OPTOTYPE_COUNT, seedBase), [seedBase]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {level.snellen}
      </span>
      <div className="flex w-full items-center justify-center overflow-hidden">
        <div
          className="flex items-center justify-center"
          style={{ width: `${rowWidthPx}px`, gap: `${gapPx}px` }}
        >
          {mode === "tumbling-e"
            ? orientations.map((orientation, i) => (
                <TumblingE
                  key={i}
                  size={sizePx}
                  orientation={orientation}
                />
              ))
            : letters.map((letter, i) => (
                <SnellenLetter
                  key={i}
                  letter={letter}
                  size={sizePx}
                  className="text-foreground"
                />
              ))}
        </div>
      </div>
    </div>
  );
}
