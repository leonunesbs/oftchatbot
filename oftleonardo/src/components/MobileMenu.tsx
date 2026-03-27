import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import WhatsAppModal from "./WhatsAppModal";
import {
  CalendarCheck2,
  Eye,
  Grid3X3,
  Menu,
  Monitor,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  type ThemeMode = "light" | "dark" | "system";
  const CYCLE: ThemeMode[] = ["light", "dark", "system"];

  function getStoredTheme(): ThemeMode {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "system";
  }

  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode;
      if (mode) setTheme(mode);
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  function cycleTheme() {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
    localStorage.setItem("theme", next);

    const effective =
      next === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next;
    document.documentElement.classList.toggle("dark", effective === "dark");

    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { mode: next } }));
  }

  const THEME_ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
  const THEME_LABELS: Record<ThemeMode, string> = { light: "Modo claro", dark: "Modo escuro", system: "Tema do sistema" };
  const ThemeIcon = THEME_ICONS[theme];

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          id="gtm-mobile-menu-open"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="flex h-full flex-col overflow-hidden">
        <DrawerHeader className="flex-row items-start justify-between">
          <DrawerTitle className="text-left">
            <span className="block text-xs font-normal uppercase tracking-widest text-muted-foreground">
              Oftalmologista
            </span>
            <span className="text-lg font-semibold">Leonardo Nunes</span>
          </DrawerTitle>
          <DrawerClose asChild>
            <Button id="gtm-mobile-menu-close" variant="ghost" size="icon" aria-label="Fechar menu">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <nav className="flex flex-col gap-1">
            {siteConfig.navLinks.map((link) => {
              const navId =
                link.href === "/#atuacao"
                  ? "gtm-mobile-nav-especialidades"
                  : link.href === "/#atendimento"
                    ? "gtm-mobile-nav-atendimento"
                    : link.href === "/#diferenciais"
                      ? "gtm-mobile-nav-diferenciais"
                      : link.href === "/#consulta"
                        ? "gtm-mobile-nav-consulta"
                        : link.href === "/#faq"
                          ? "gtm-mobile-nav-faq"
                          : "gtm-mobile-nav-link";
              return (
              <a
                key={link.href}
                id={navId}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {link.label}
              </a>
              );
            })}
          </nav>
          <Separator className="my-4" />
          <a
            id="gtm-mobile-tools-acuidade-visual"
            href="/acuidade-visual"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Eye className="size-4" />
            Teste de Acuidade Visual
          </a>
          <a
            id="gtm-mobile-tools-amsler"
            href="/tela-de-amsler"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Grid3X3 className="size-4" />
            Tela de Amsler
          </a>
          <WhatsAppModal
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            triggerAriaLabel="Agendar consulta"
            triggerId="gtm-mobile-menu-agendamento"
            onlineBookingLinkId="gtm-mobile-menu-dialog-agendar-online"
          >
            <CalendarCheck2 className="size-4" />
            Agendamento Online
          </WhatsAppModal>
          <Separator className="my-4" />
          <button
            id="gtm-mobile-menu-theme"
            type="button"
            onClick={cycleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ThemeIcon className="size-4" />
            {THEME_LABELS[theme]}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
