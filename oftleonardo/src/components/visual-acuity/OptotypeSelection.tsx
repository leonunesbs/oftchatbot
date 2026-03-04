import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OptotypeMode } from "./constants";

interface OptotypeSelectionProps {
  onSelect: (mode: OptotypeMode) => void;
}

export default function OptotypeSelection({ onSelect }: OptotypeSelectionProps) {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Tipo de Optotipo
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Escolha como as letras serão apresentadas durante o teste.
        </p>
      </div>

      <div className="grid w-full max-w-sm gap-4">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-brand/40"
          onClick={() => onSelect("tumbling-e")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <span className="text-2xl font-black" style={{ fontFamily: "monospace" }}>E</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Tumbling E</span>
              <span className="text-muted-foreground text-sm">
                Letra "E" em diferentes orientações. Ideal para crianças ou quem não conhece o alfabeto.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-brand/40"
          onClick={() => onSelect("snellen-letters")}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <span className="text-lg font-black tracking-wider">DFN</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Letras de Snellen</span>
              <span className="text-muted-foreground text-sm">
                Letras variadas como na tabela clássica de Snellen. Indicado para adultos alfabetizados.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
