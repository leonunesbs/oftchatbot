import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Ruler } from "lucide-react";
import {
  AVAILABLE_DISTANCES,
  DEFAULT_DISTANCE_M,
  DISTANCE_STORAGE_KEY,
  type TestDistance,
} from "./constants";

interface DistanceSelectionProps {
  onSelect: (distance: TestDistance) => void;
}

function getStoredDistance(): number {
  try {
    const stored = localStorage.getItem(DISTANCE_STORAGE_KEY);
    if (stored) {
      const value = Number(stored);
      if (AVAILABLE_DISTANCES.some((d) => d.meters === value)) return value;
    }
  } catch {
    // ignore
  }
  return DEFAULT_DISTANCE_M;
}

export default function DistanceSelection({
  onSelect,
}: DistanceSelectionProps) {
  const [selected, setSelected] = useState<number>(getStoredDistance);

  const handleConfirm = () => {
    const distance = AVAILABLE_DISTANCES.find((d) => d.meters === selected)!;
    try {
      localStorage.setItem(DISTANCE_STORAGE_KEY, String(distance.meters));
    } catch {
      // storage unavailable
    }
    onSelect(distance);
  };

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Distância do Teste
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Selecione a distância entre seus olhos e a tela durante o teste.
          Os tamanhos dos optótipos são ajustados para a distância selecionada.
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-2">
        {AVAILABLE_DISTANCES.map((d) => {
          const isSelected = selected === d.meters;
          return (
            <button
              key={d.meters}
              type="button"
              onClick={() => setSelected(d.meters)}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                isSelected
                  ? "border-brand bg-brand/10 text-brand shadow-sm"
                  : "border-border bg-card text-foreground hover:border-brand/40 hover:bg-brand/5"
              }`}
            >
              {isSelected && (
                <Check className="absolute top-1.5 right-1.5 size-3.5 text-brand" />
              )}
              <span className="text-base font-bold">{d.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex max-w-sm items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
        <Ruler className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Use uma fita métrica ou régua para medir a distância. Mantenha a
          mesma distância durante todo o teste para resultados precisos.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-2 gap-2"
        onClick={handleConfirm}
      >
        <Check className="size-4" />
        Confirmar Distância
      </Button>
    </div>
  );
}
