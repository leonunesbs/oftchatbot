import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    __oftConsentActions?: {
      grant: () => void;
      deny: () => void;
    };
  }
}

const CONSENT_KEY = "oftcore:consent:v1";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) setVisible(true);
  }, []);

  function handleGrant() {
    window.__oftConsentActions?.grant();
    setVisible(false);
  }

  function handleDeny() {
    window.__oftConsentActions?.deny();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-lg">
        <p className="text-sm font-semibold leading-tight">
          Sua privacidade em primeiro lugar
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Usamos cookies opcionais para entender o que funciona melhor e melhorar
          sua experiência. Se preferir, você pode continuar somente com os
          essenciais sem afetar as funcionalidades principais.
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Saiba mais em{" "}
          <a
            href="/politica-de-privacidade"
            className="underline underline-offset-2"
          >
            Política de Privacidade
          </a>
          .
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button id="gtm-consent-essential-only" variant="outline" size="sm" onClick={handleDeny}>
            Apenas essenciais
          </Button>
          <Button id="gtm-consent-accept" size="sm" onClick={handleGrant}>
            Aceitar e continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
