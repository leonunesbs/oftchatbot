import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    __oftConsentActions?: {
      grant: () => void;
      deny: () => void;
    };
  }
}

const CONSENT_KEY = "oftcore:consent:v1";

export default function CookieConsentDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) setOpen(true);
  }, []);

  function handleGrant() {
    window.__oftConsentActions?.grant();
    setOpen(false);
  }

  function handleDeny() {
    window.__oftConsentActions?.deny();
    setOpen(false);
  }

  return (
    <Drawer open={open} dismissible={false}>
      <DrawerContent className="mx-auto max-w-3xl">
        <DrawerHeader>
          <DrawerTitle>Sua privacidade em primeiro lugar</DrawerTitle>
          <DrawerDescription>
            Usamos cookies opcionais para entender o que funciona melhor e
            melhorar sua experiência. Se preferir, você pode continuar somente
            com os essenciais sem afetar as funcionalidades principais.
          </DrawerDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            Saiba mais em{" "}
            <a
              href="/politica-de-privacidade"
              className="underline underline-offset-2"
            >
              Política de Privacidade
            </a>
            .
          </p>
        </DrawerHeader>
        <DrawerFooter className="flex-row justify-end">
          <Button variant="outline" onClick={handleDeny}>
            Apenas essenciais
          </Button>
          <Button onClick={handleGrant}>Aceitar e continuar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
