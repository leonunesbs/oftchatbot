"use client"

import * as React from "react"

import WhatsAppModal from "@/components/WhatsAppModal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageCircle } from "lucide-react"

/** Valores 0–4 conforme o questionário OSDI; `na` = não aplicável (apenas itens 6–12). */
type OsdiAnswerValue = 0 | 1 | 2 | 3 | 4 | "na"

type OsdiSeverity = "normal" | "mild" | "moderate" | "severe"

function interpretOsdiScore(score: number): OsdiSeverity {
  if (score <= 12) return "normal"
  if (score <= 22) return "mild"
  if (score <= 32) return "moderate"
  return "severe"
}

const SEVERITY_LABELS: Record<OsdiSeverity, string> = {
  normal: "Normal (sem incapacidade relevante no índice)",
  mild: "Leve",
  moderate: "Moderado",
  severe: "Severo",
}

/** Rótulo curto para texto do WhatsApp (evita mensagem longa). */
const WHATSAPP_SEVERITY: Record<OsdiSeverity, string> = {
  normal: "normal",
  mild: "leve",
  moderate: "moderada",
  severe: "severa",
}

/** Ordem do mais leve ao mais intenso (melhor para leitura em lista vertical). */
const FREQUENCY_OPTIONS: { score: 0 | 1 | 2 | 3 | 4; label: string; hint: string }[] = [
  { score: 0, label: "Nunca", hint: "Sem esse sintoma ou limitação" },
  { score: 1, label: "Algumas vezes", hint: "Ocorreu com pouca frequência" },
  { score: 2, label: "Metade do tempo", hint: "Cerca de metade da semana" },
  { score: 3, label: "Maior parte do tempo", hint: "Na maior parte dos dias" },
  { score: 4, label: "Todo o tempo", hint: "Quase sempre ou sempre" },
]

type QuestionDef = {
  id: number
  text: string
  allowNa: boolean
}

const QUESTIONS: QuestionDef[] = [
  {
    id: 1,
    text: "A luz forte incomoda ou machuca seus olhos (sensibilidade à luz)?",
    allowNa: false,
  },
  {
    id: 2,
    text: "Sente como se tivesse areia ou algum corpo estranho nos olhos?",
    allowNa: false,
  },
  { id: 3, text: "Sente dor ou ardor nos olhos?", allowNa: false },
  { id: 4, text: "A visão fica embaçada?", allowNa: false },
  {
    id: 5,
    text: "Sente que enxerga pior do que considera normal para você (qualidade visual ruim)?",
    allowNa: false,
  },
  {
    id: 6,
    text: "Por causa dos olhos, você teve dificuldade para ler?",
    allowNa: true,
  },
  {
    id: 7,
    text: "Por causa dos olhos, você teve dificuldade para dirigir à noite?",
    allowNa: true,
  },
  {
    id: 8,
    text: "Por causa dos olhos, você teve dificuldade para trabalhar no computador ou para usar o caixa eletrônico?",
    allowNa: true,
  },
  {
    id: 9,
    text: "Por causa dos olhos, você teve dificuldade para assistir à TV?",
    allowNa: true,
  },
  {
    id: 10,
    text: "Seus olhos ficaram desconfortáveis em lugares com vento?",
    allowNa: true,
  },
  {
    id: 11,
    text: "Seus olhos ficaram desconfortáveis em ambientes muito secos (pouca umidade no ar)?",
    allowNa: true,
  },
  {
    id: 12,
    text: "Seus olhos ficaram desconfortáveis em ambientes com ar-condicionado?",
    allowNa: true,
  },
]

const SECTION_LABELS: { startId: number; endId: number; badge: string; title: string }[] = [
  { startId: 1, endId: 5, badge: "1/3", title: "Sintomas na última semana" },
  { startId: 6, endId: 9, badge: "2/3", title: "Atividades do dia a dia" },
  { startId: 10, endId: 12, badge: "3/3", title: "Ambientes e situações" },
]

function sectionForQuestionId(qid: number) {
  return SECTION_LABELS.find((s) => qid >= s.startId && qid <= s.endId) ?? SECTION_LABELS[0]
}

function computeOsdi(answers: Map<number, OsdiAnswerValue>): {
  score: number
  answered: number
  sum: number
} | null {
  let sum = 0
  let answered = 0
  for (let i = 1; i <= 12; i++) {
    const v = answers.get(i)
    if (v === undefined) return null
    if (v === "na") continue
    sum += v
    answered += 1
  }
  if (answered === 0) return null
  return {
    sum,
    answered,
    score: (sum * 25) / answered,
  }
}

const STORAGE_KEY = "oftleonardo-olho-seco-draft-v1"
/** Migração de rascunhos da URL antiga `/calculadora-osdi`. */
const LEGACY_STORAGE_KEY = "oftleonardo-osdi-draft-v1"

function loadDraft(): { answers: Map<number, OsdiAnswerValue>; step: number } | null {
  if (typeof window === "undefined") return null
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { answers?: Record<string, number | "na">; step?: number }
    if (!data.answers || typeof data.step !== "number") return null
    const m = new Map<number, OsdiAnswerValue>()
    for (const [k, v] of Object.entries(data.answers)) {
      const id = Number(k)
      if (id >= 1 && id <= 12 && (v === "na" || (typeof v === "number" && v >= 0 && v <= 4))) {
        m.set(id, v as OsdiAnswerValue)
      }
    }
    return { answers: m, step: Math.min(11, Math.max(0, data.step)) }
  } catch {
    return null
  }
}

function saveDraft(answers: Map<number, OsdiAnswerValue>, step: number) {
  try {
    const obj: Record<string, number | "na"> = {}
    answers.forEach((v, k) => {
      obj[String(k)] = v
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: obj, step }))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore quota */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function firstUnansweredStep(answers: Map<number, OsdiAnswerValue>): number {
  for (let i = 1; i <= 12; i++) {
    if (!answers.has(i)) return i - 1
  }
  return 11
}

export default function OsdiCalculator() {
  const [mounted, setMounted] = React.useState(false)
  const [bootstrapped, setBootstrapped] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Map<number, OsdiAnswerValue>>(() => new Map())
  const [showResult, setShowResult] = React.useState(false)
  const [panelVisible, setPanelVisible] = React.useState(true)
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultAnchorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.answers.size > 0) {
      setAnswers(draft.answers)
      if (draft.answers.size === 12) {
        setShowResult(true)
        setStep(11)
      } else {
        setStep(firstUnansweredStep(draft.answers))
      }
    }
    setBootstrapped(true)
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!bootstrapped) return
    saveDraft(answers, step)
  }, [bootstrapped, answers, step])

  const result = React.useMemo(() => {
    if (answers.size < 12) return null
    return computeOsdi(answers)
  }, [answers])

  const severity = result ? interpretOsdiScore(result.score) : null

  const isComplete = answers.size === 12

  const setAnswer = React.useCallback((qid: number, value: OsdiAnswerValue) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(qid, value)
      return next
    })
  }, [])

  const goToStep = React.useCallback((nextStep: number) => {
    setPanelVisible(false)
    window.setTimeout(() => {
      setStep(nextStep)
      setPanelVisible(true)
    }, 120)
  }, [])

  const pickOption = React.useCallback(
    (qid: number, value: OsdiAnswerValue, isLastQuestion: boolean) => {
      setAnswer(qid, value)
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      advanceTimer.current = setTimeout(() => {
        if (isLastQuestion) {
          setShowResult(true)
        } else {
          goToStep(step + 1)
        }
      }, 220)
    },
    [setAnswer, goToStep, step],
  )

  React.useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  React.useEffect(() => {
    if (!showResult) return
    resultAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [showResult])

  const reset = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setAnswers(new Map())
    setStep(0)
    setShowResult(false)
    clearDraft()
  }

  const currentQ = QUESTIONS[step]
  const section = currentQ ? sectionForQuestionId(currentQ.id) : SECTION_LABELS[0]

  const handleBack = () => {
    if (showResult) {
      setShowResult(false)
      setStep(11)
      return
    }
    if (step > 0) goToStep(step - 1)
  }

  if (!mounted) {
    return (
      <div
        id="calculadora-olho-seco-app"
        className="mx-auto min-h-[320px] max-w-lg px-4 py-8"
        aria-hidden
      />
    )
  }

  return (
    <div id="calculadora-olho-seco-app" className="mx-auto max-w-lg px-4 py-4 sm:py-6">
      {!showResult && (
        <div className="mb-6 rounded-xl border border-border bg-muted/25 p-4 text-sm leading-relaxed text-muted-foreground shadow-sm">
          <p>
            Pense na <strong className="text-foreground">última semana</strong>. Uma pergunta por vez —
            leva poucos minutos. Seu progresso fica salvo neste aparelho para você continuar depois. O
            resultado segue a escala clínica OSDI (índice de superfície ocular).
          </p>
        </div>
      )}

      {showResult && isComplete && result && severity ? (
        <div ref={resultAnchorRef} className="scroll-mt-8">
          <output
            className="block rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center"
            aria-live="polite"
          >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resultado estimado
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
            {result.score.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">
            OSDI = (soma dos pontos) × 25 ÷ (questões válidas, exceto N/A)
          </p>
          <p className="mt-4 text-base font-semibold text-foreground">{SEVERITY_LABELS[severity]}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Pontuações mais altas indicam maior impacto nos sintomas e nas atividades. Este resultado
            não substitui exame clínico.
          </p>
          <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3">
            <WhatsAppModal
              size="lg"
              className="h-12 w-full gap-2 text-base"
              whatsappMessageTemplate={`Olá, Dr. Leonardo! Usei a calculadora de olho seco no site: ${result.score.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pontos na escala OSDI (classificação ${WHATSAPP_SEVERITY[severity]}). Gostaria de agendar consulta para avaliar em {city}.`}
              triggerId="gtm-olho-seco-result-schedule-whatsapp"
              onlineBookingLinkId="gtm-olho-seco-result-dialog-agendar-online"
              triggerAriaLabel="Agendar consulta após resultado da calculadora de olho seco"
              showOnlineBookingCta={true}
            >
              <MessageCircle className="size-4" />
              Agendar consulta
            </WhatsAppModal>
            <div className="flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" onClick={handleBack}>
                Ver respostas anteriores
              </Button>
              <Button type="button" variant="outline" onClick={reset}>
                Refazer questionário
              </Button>
            </div>
          </div>
          </output>
        </div>
      ) : (
        <>
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Parte {section.badge} · {section.title}
              </span>
              <span aria-live="polite">
                {step + 1} / {QUESTIONS.length}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={12}
              aria-label="Progresso do questionário"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((step + 1) / 12) * 100}%` }}
              />
            </div>
          </div>

          <div
            className={cn(
              "transition-opacity duration-200 ease-out",
              panelVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {currentQ && (
              <fieldset className="space-y-4">
                <legend
                  id="osdi-current-question"
                  className="text-base font-semibold leading-snug text-foreground sm:text-lg"
                >
                  {currentQ.text}
                </legend>

                <div
                  className="flex flex-col gap-2.5"
                  role="radiogroup"
                  aria-labelledby="osdi-current-question"
                >
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const selected = answers.get(currentQ.id) === opt.score
                    return (
                      <button
                        key={opt.score}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => pickOption(currentQ.id, opt.score, step === 11)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                          "min-h-[3.25rem] active:scale-[0.99]",
                          selected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.hint}</span>
                      </button>
                    )
                  })}

                  {currentQ.allowNa && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={answers.get(currentQ.id) === "na"}
                      onClick={() => pickOption(currentQ.id, "na", step === 11)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 rounded-xl border-2 border-dashed px-4 py-3.5 text-left transition-all",
                        "min-h-[3.25rem] active:scale-[0.99]",
                        answers.get(currentQ.id) === "na"
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        Não se aplica nesta semana
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Não fiz essa atividade ou não estive nessa situação
                      </span>
                    </button>
                  )}
                </div>
              </fieldset>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={handleBack}
              disabled={step === 0 && !showResult}
            >
              Voltar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Limpar e recomeçar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
