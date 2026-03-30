import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WhatsAppModal from "@/components/WhatsAppModal";
import { Eye, RotateCcw, MessageCircle, Info } from "lucide-react";
import type { TestResults } from "./VisualAcuityTest";

interface ResultsStepProps {
  results: TestResults;
  distanceLabel: string;
  onRestart: () => void;
}

function snellenDenominator(acuity: string): number {
  if (acuity.startsWith("<")) return Infinity;
  const parts = acuity.split("/");
  return parseInt(parts[1], 10);
}

function getInterpretation(acuity: string): {
  label: string;
  color: string;
} {
  const denom = snellenDenominator(acuity);
  if (denom <= 20) return { label: "Normal", color: "text-green-600" };
  if (denom <= 40) return { label: "Leve redução", color: "text-yellow-600" };
  if (denom <= 100) return { label: "Redução moderada", color: "text-orange-600" };
  return { label: "Redução importante", color: "text-red-600" };
}

function needsAttention(results: TestResults): boolean {
  return (
    snellenDenominator(results.od) > 25 ||
    snellenDenominator(results.os) > 25
  );
}

export default function ResultsStep({ results, distanceLabel, onRestart }: ResultsStepProps) {
  const odInterp = getInterpretation(results.od);
  const osInterp = getInterpretation(results.os);
  const attention = needsAttention(results);
  const whatsappMessageTemplate = `Olá, Dr. Leonardo! Fiz o teste de acuidade visual no site e obtive OD: ${results.od}, OE: ${results.os}. Gostaria de agendar uma consulta em {city}.`;

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Resultado do Teste
        </h1>
        <p className="text-muted-foreground text-sm">
          Acuidade visual estimada a {distanceLabel}
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="size-4" />
              Olho Direito (OD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{results.od}</p>
            <p className={`text-sm font-medium ${odInterp.color}`}>
              {odInterp.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="size-4" />
              Olho Esquerdo (OE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{results.os}</p>
            <p className={`text-sm font-medium ${osInterp.color}`}>
              {osInterp.label}
            </p>
          </CardContent>
        </Card>
      </div>

      {attention ? (
        <div className="max-w-sm rounded-xl border border-orange-200 bg-orange-50 p-4 text-center dark:border-orange-900/50 dark:bg-orange-950/30">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Seu resultado sugere que uma avaliação profissional pode ser
            importante. Um exame oftalmológico completo pode identificar causas
            tratáveis.
          </p>
        </div>
      ) : (
        <div className="max-w-sm rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Atenção: visão normal não exclui doenças oculares
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Existem doenças graves, como o glaucoma, que podem não alterar a
                acuidade visual nas fases iniciais, mas ameaçam silenciosamente a
                visão e o campo visual. Consultas oftalmológicas periódicas são
                essenciais mesmo com boa acuidade.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-muted-foreground max-w-sm text-center text-xs">
        Este teste é uma ferramenta de triagem e não substitui uma consulta
        oftalmológica completa. Os resultados podem variar de acordo com a
        calibração da tela e condições de iluminação.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <WhatsAppModal
          size="lg"
          className="w-full gap-2"
          whatsappMessageTemplate={whatsappMessageTemplate}
          showOnlineBookingCta={true}
        >
          <MessageCircle className="size-4" />
          Agendar Consulta
        </WhatsAppModal>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2"
          onClick={onRestart}
        >
          <RotateCcw className="size-4" />
          Refazer Teste
        </Button>
      </div>
    </div>
  );
}
