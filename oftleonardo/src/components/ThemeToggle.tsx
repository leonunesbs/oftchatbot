import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    setSpinning(true);
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setTimeout(() => setSpinning(false), 500);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="relative size-9 overflow-hidden"
    >
      <Sun
        className={`absolute size-4 transition-all duration-500 ease-in-out ${
          dark
            ? "-rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        } ${spinning && !dark ? "animate-spin-once" : ""}`}
      />
      <Moon
        className={`absolute size-4 transition-all duration-500 ease-in-out ${
          dark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        } ${spinning && dark ? "animate-spin-once" : ""}`}
      />
    </Button>
  );
}
