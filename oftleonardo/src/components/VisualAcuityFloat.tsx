import { Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export default function VisualAcuityFloat() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("va-float-dismissed");
    if (!wasDismissed) {
      const timer = setTimeout(() => setDismissed(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("va-float-dismissed", "1");
  }

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${
        dismissed
          ? "pointer-events-none translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative">
        <a
          href="/acuidade-visual"
          className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/90 px-4 py-3 shadow-lg backdrop-blur-lg transition-all hover:border-brand/40 hover:shadow-xl"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand/20">
            <Eye className="size-5" />
          </span>
          <span className="flex flex-col pr-6">
            <span className="text-sm font-semibold text-foreground">
              Teste sua visão
            </span>
            <span className="text-xs text-muted-foreground">
              Acuidade visual online e gratuito
            </span>
          </span>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 size-6 rounded-full bg-background shadow-sm border border-border hover:bg-muted"
          onClick={handleDismiss}
          aria-label="Fechar"
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
}
