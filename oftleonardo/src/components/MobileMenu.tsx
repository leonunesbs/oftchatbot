import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { CalendarCheck2, Eye, Grid3X3, Menu, Moon, Sun } from "lucide-react";
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
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-full w-72 flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="text-left">
            <span className="block text-xs font-normal uppercase tracking-widest text-muted-foreground">
              Oftalmologista
            </span>
            <span className="text-lg font-semibold">Leonardo Nunes</span>
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="min-h-0 flex-1 overflow-y-auto">
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
        <a
          href={siteConfig.partnerApps.oftagenda}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <CalendarCheck2 className="size-4" />
          Agendamento Online
        </a>
          <Separator className="my-4" />
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {dark ? "Modo claro" : "Modo escuro"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
