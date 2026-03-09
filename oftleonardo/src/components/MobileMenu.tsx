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
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");

    const toggles = document.querySelectorAll(".theme-toggle");
    toggles.forEach((toggle) => {
      const sun = toggle.querySelector(".theme-icon-sun");
      const moon = toggle.querySelector(".theme-icon-moon");
      if (!sun || !moon) return;
      if (next) {
        sun.classList.add("hidden");
        moon.classList.remove("hidden");
        moon.classList.add("inline-flex");
        sun.classList.remove("inline-flex");
      } else {
        moon.classList.add("hidden");
        sun.classList.remove("hidden");
        sun.classList.add("inline-flex");
        moon.classList.remove("inline-flex");
      }
    });
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
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
            <Button variant="ghost" size="icon" aria-label="Fechar menu">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <nav className="flex flex-col gap-1">
            {siteConfig.navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Separator className="my-4" />
          <a
            href="/acuidade-visual"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Eye className="size-4" />
            Teste de Acuidade Visual
          </a>
          <a
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
          >
            <CalendarCheck2 className="size-4" />
            Agendamento Online
          </WhatsAppModal>
          <Separator className="my-4" />
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {dark ? "Modo claro" : "Modo escuro"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
