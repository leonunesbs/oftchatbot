import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
const CYCLE: ThemeMode[] = ["light", "dark", "system"];

function resolveEffective(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

const ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const LABELS: Record<ThemeMode, string> = { light: "Tema claro", dark: "Tema escuro", system: "Tema do sistema" };

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  function cycleTheme() {
    const idx = CYCLE.indexOf(mode);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setMode(next);
    document.documentElement.classList.toggle("dark", resolveEffective(next) === "dark");
    localStorage.setItem("theme", next);
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { mode: next } }));
  }

  const visible = "rotate-0 scale-100 opacity-100";
  const hidden = "rotate-90 scale-0 opacity-0";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={LABELS[mode]}
      className="relative size-9 overflow-hidden"
    >
      {CYCLE.map((m) => {
        const Icon = ICONS[m];
        return (
          <Icon
            key={m}
            className={`absolute size-4 transition-all duration-300 ${mode === m ? visible : hidden}`}
          />
        );
      })}
    </Button>
  );
}
