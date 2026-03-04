import { useEffect, useMemo, useState } from "react";
import InstructionsStep from "./InstructionsStep";
import CalibrationStep from "./CalibrationStep";
import DistanceSelection from "./DistanceSelection";
import OptotypeSelection from "./OptotypeSelection";
import VisualAcuityTest from "./VisualAcuityTest";
import type { TestResults } from "./VisualAcuityTest";
import ResultsStep from "./ResultsStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  AVAILABLE_DISTANCES,
  LOCALSTORAGE_KEY,
  type CalibrationData,
  type OptotypeMode,
  type TestDistance,
} from "./constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";

type Step = "instructions" | "calibration" | "distance" | "optotype-selection" | "test" | "results";
type LiveRole = "solo" | "host" | "participant";
type StreamState = "idle" | "connecting" | "connected" | "reconnecting" | "closed";
const HOST_PREVIEW_PX_PER_MM = 8;
const DEFAULT_TEST_DISTANCE = AVAILABLE_DISTANCES[1] ?? AVAILABLE_DISTANCES[0];

function findDistanceByMeters(distanceM: number): TestDistance | null {
  return AVAILABLE_DISTANCES.find((distance) => distance.meters === distanceM) ?? null;
}

interface LiveSessionSnapshot {
  pin: string;
  status: "active" | "completed" | "expired";
  chartSeed: string;
  distanceM: number;
  optotypeMode: OptotypeMode;
  currentEye: "OD" | "OS";
  currentIndex: number;
  expiresAt: string;
}

export default function VisualAcuityApp() {
  const [chartSeed, setChartSeed] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>("instructions");
  const [pxPerMm, setPxPerMm] = useState<number | null>(null);
  const [distance, setDistance] = useState<TestDistance | null>(null);
  const [optotypeMode, setOptotypeMode] = useState<OptotypeMode>("tumbling-e");
  const [results, setResults] = useState<TestResults | null>(null);
  const [liveRole, setLiveRole] = useState<LiveRole>("solo");
  const [livePin, setLivePin] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [joinPin, setJoinPin] = useState("");
  const [liveSession, setLiveSession] = useState<LiveSessionSnapshot | null>(null);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (stored) {
        const data: CalibrationData = JSON.parse(stored);
        if (data.pxPerMm > 0) {
          setPxPerMm(data.pxPerMm);
        }
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  useEffect(() => {
    if (liveRole === "solo" || !livePin) {
      setStreamState("idle");
      return;
    }

    setStreamState("connecting");
    const source = new EventSource(`/api/live-session/stream?pin=${encodeURIComponent(livePin)}`);

    source.onopen = () => {
      setStreamState("connected");
    };

    const handleState = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as LiveSessionSnapshot;
        setLiveSession(payload);
        setLiveError(null);
      } catch {
        // ignore malformed state events
      }
    };

    const handleClosed = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { session?: LiveSessionSnapshot; reason?: string };
        if (payload.session) {
          setLiveSession(payload.session);
        }
        setLiveError(payload.reason === "expired" ? "A sessão expirou." : "A sessão foi encerrada.");
      } catch {
        setLiveError("A sessão foi encerrada.");
      }
      setStreamState("closed");
      source.close();
    };

    source.addEventListener("state", handleState as EventListener);
    source.addEventListener("closed", handleClosed as EventListener);
    source.addEventListener("heartbeat", () => {
      setStreamState("connected");
    });

    source.onerror = () => {
      setStreamState((current) => (current === "closed" ? "closed" : "reconnecting"));
    };

    return () => {
      source.close();
    };
  }, [liveRole, livePin]);

  const handleCalibrated = (value: number) => {
    setPxPerMm(value);
    if (liveRole === "participant") {
      const syncedDistance = liveSession ? findDistanceByMeters(liveSession.distanceM) : null;
      setDistance(syncedDistance ?? DEFAULT_TEST_DISTANCE);
      setStep("test");
      return;
    }
    setStep("distance");
  };

  const handleDistanceSelected = async (d: TestDistance) => {
    setDistance(d);
    if (liveRole === "host" && livePin && ownerToken) {
      try {
        const response = await fetch("/api/live-session/configure", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pin: livePin,
            ownerToken,
            distanceM: d.meters,
          }),
        });
        if (!response.ok) throw new Error("Não foi possível atualizar a distância da sessão.");
      } catch {
        setLiveError("Erro ao sincronizar a distância da sessão.");
        return;
      }
    }
    setStep("optotype-selection");
  };

  const handleOptotypeSelected = async (mode: OptotypeMode) => {
    setOptotypeMode(mode);
    if (liveRole === "host" && livePin && ownerToken) {
      try {
        const response = await fetch("/api/live-session/configure", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pin: livePin,
            ownerToken,
            optotypeMode: mode,
          }),
        });
        if (!response.ok) throw new Error("Não foi possível atualizar o optótipo da sessão.");
      } catch {
        setLiveError("Erro ao sincronizar o optótipo com a sessão.");
        return;
      }
    }
    setStep("test");
  };

  const handleTestComplete = (testResults: TestResults) => {
    setResults(testResults);
    setStep("results");
  };

  const handleRestart = () => {
    setResults(null);
    setDistance(null);
    setLiveRole("solo");
    setLivePin(null);
    setOwnerToken(null);
    setJoinPin("");
    setLiveSession(null);
    setLiveError(null);
    setStreamState("idle");
    setStep("instructions");
  };

  const handleStart = () => {
    setStep("calibration");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateSession = async () => {
    setIsLoadingSession(true);
    setLiveError(null);

    try {
      const response = await fetch("/api/live-session/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Não foi possível criar a sessão.");
      const data = (await response.json()) as {
        pin: string;
        ownerToken: string;
        session: LiveSessionSnapshot;
      };

      setLiveRole("host");
      setLivePin(data.pin);
      setOwnerToken(data.ownerToken);
      setLiveSession(data.session);
      setChartSeed(data.session.chartSeed);
      setDistance(findDistanceByMeters(data.session.distanceM) ?? DEFAULT_TEST_DISTANCE);
      if (!pxPerMm) {
        // Host does not need physical calibration; use a readable preview scale.
        setPxPerMm(HOST_PREVIEW_PX_PER_MM);
      }
      setStep("distance");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setLiveError("Erro ao criar sessão. Tente novamente.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleJoinSession = async () => {
    const normalized = joinPin.trim();
    if (!/^\d{4}$/.test(normalized)) {
      setLiveError("Digite um PIN de 4 dígitos.");
      return;
    }

    setIsLoadingSession(true);
    setLiveError(null);

    try {
      const response = await fetch("/api/live-session/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: normalized }),
      });
      if (!response.ok) throw new Error("Sessão não encontrada.");

      const data = (await response.json()) as { session: LiveSessionSnapshot };
      setLiveRole("participant");
      setLivePin(normalized);
      setLiveSession(data.session);
      setOwnerToken(null);
      setOptotypeMode(data.session.optotypeMode);
      setChartSeed(data.session.chartSeed);
      setDistance(findDistanceByMeters(data.session.distanceM) ?? DEFAULT_TEST_DISTANCE);
      handleStart();
    } catch {
      setLiveError("PIN inválido ou sessão expirada.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSessionAction = async (
    action: "previous" | "next" | "cant-see" | "can-see-all" | "finish",
  ) => {
    if (liveRole !== "host" || !livePin || !ownerToken) return;

    try {
      await fetch("/api/live-session/advance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pin: livePin,
          ownerToken,
          action,
        }),
      });
    } catch {
      setLiveError("Não foi possível sincronizar a sessão.");
    }
  };

  const streamLabel = useMemo(() => {
    switch (streamState) {
      case "connected":
        return "conectado";
      case "connecting":
        return "conectando";
      case "reconnecting":
        return "reconectando";
      case "closed":
        return "encerrado";
      default:
        return "inativo";
    }
  }, [streamState]);

  useEffect(() => {
    if (liveRole === "solo" || !liveSession) return;
    if (optotypeMode !== liveSession.optotypeMode) {
      setOptotypeMode(liveSession.optotypeMode);
    }
    if (chartSeed !== liveSession.chartSeed) {
      setChartSeed(liveSession.chartSeed);
    }
    const syncedDistance = findDistanceByMeters(liveSession.distanceM);
    if (syncedDistance && distance?.meters !== syncedDistance.meters) {
      setDistance(syncedDistance);
    }
  }, [chartSeed, distance?.meters, liveRole, liveSession, optotypeMode]);

  const renderSessionPanel = () => (
    <Card className="mx-auto w-full max-w-md border-dashed bg-muted/20 py-3 shadow-none">
      <CardHeader className="space-y-1 px-4">
        <h2 className="text-sm font-medium leading-none">Avaliação remota</h2>
        <CardDescription className="text-xs">
          Permite ao examinador conduzir a acuidade visual a distancia.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <details>
          <summary className="text-muted-foreground cursor-pointer text-xs">
            Abrir opções da avaliação remota
          </summary>
          <div className="mt-3 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCreateSession}
              disabled={isLoadingSession}
            >
              Iniciar avaliação remota
            </Button>
            <div className="flex items-end gap-2">
              <div className="w-full space-y-1">
                <label htmlFor="remote-session-pin" className="text-xs font-medium">
                  Código da avaliação remota
                </label>
                <InputOTP
                  id="remote-session-pin"
                  maxLength={4}
                  value={joinPin}
                  pattern={REGEXP_ONLY_DIGITS}
                  onChange={(value) => setJoinPin(value)}
                  containerClassName="w-full"
                  aria-label="Código da avaliação remota"
                >
                  <InputOTPGroup className="w-full">
                    <InputOTPSlot index={0} className="h-10 w-full" />
                    <InputOTPSlot index={1} className="h-10 w-full" />
                    <InputOTPSlot index={2} className="h-10 w-full" />
                    <InputOTPSlot index={3} className="h-10 w-full" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={handleJoinSession}
                disabled={isLoadingSession || joinPin.length !== 4}
              >
                Acessar
              </Button>
            </div>
            {liveError ? <p className="text-destructive text-xs">{liveError}</p> : null}
          </div>
        </details>
      </CardContent>
    </Card>
  );

  switch (step) {
    case "instructions":
      return (
        <div className="space-y-8 pb-8">
          <InstructionsStep onContinue={handleStart} />
          <section className="px-4">
            <div className="mx-auto w-full max-w-3xl">
              {renderSessionPanel()}
            </div>
          </section>
        </div>
      );
    case "calibration":
      return (
        <CalibrationStep
          onCalibrated={handleCalibrated}
          initialPxPerMm={pxPerMm ?? undefined}
        />
      );
    case "distance":
      return <DistanceSelection onSelect={handleDistanceSelected} />;
    case "optotype-selection":
      return <OptotypeSelection onSelect={handleOptotypeSelected} />;
    case "test":
      return (
        <VisualAcuityTest
          pxPerMm={pxPerMm!}
          distanceM={distance!.meters}
          mode={optotypeMode}
          chartSeed={chartSeed}
          onComplete={handleTestComplete}
          liveRole={liveRole}
          livePin={livePin ?? undefined}
          liveSession={liveSession}
          streamState={streamLabel}
          onSessionAction={handleSessionAction}
          liveError={liveError}
        />
      );
    case "results":
      return (
        <ResultsStep
          results={results!}
          distanceLabel={distance!.label}
          onRestart={handleRestart}
        />
      );
  }
}
