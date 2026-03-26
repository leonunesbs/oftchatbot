import { Button } from "@/components/ui/button";
import { Eye, Glasses, ArrowRight, AlertTriangle } from "lucide-react";

interface InstructionsStepProps {
  onContinue: () => void;
}

export default function InstructionsStep({ onContinue }: InstructionsStepProps) {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Antes de Começar
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Para obter resultados confiáveis, siga as orientações abaixo durante
          todo o teste.
        </p>
      </div>

      <div className="grid w-full max-w-sm gap-4">
        <div className="flex items-start gap-4 rounded-xl border-2 border-brand/30 bg-brand/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Glasses className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Use sua melhor correção</span>
            <span className="text-muted-foreground text-sm leading-relaxed">
              Se você usa óculos ou lentes de contato, mantenha-os durante o
              teste. O objetivo é medir a acuidade visual com a melhor correção
              disponível.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border-2 border-brand/30 bg-brand/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Eye className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Teste um olho de cada vez</span>
            <span className="text-muted-foreground text-sm leading-relaxed">
              Cubra um olho com a palma da mão (sem pressionar) e realize o
              teste completo. Depois, repita com o outro olho.
            </span>
          </div>
        </div>
      </div>

      <div className="flex max-w-sm items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Este teste <strong>não substitui</strong> uma consulta oftalmológica.
          Procure um especialista para avaliação completa.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-2 gap-2"
        onClick={onContinue}
      >
        Entendi, Iniciar
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
