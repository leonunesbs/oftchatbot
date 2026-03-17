import Link from "next/link";
import { Suspense } from "react";
import {
  File01Icon,
  LayoutBottomIcon,
  LayoutIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRightIcon, MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorModeToggle } from "@/components/color-mode-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderAuthButton } from "@/components/header-auth-button";
import type { SessionState } from "@/components/header-auth-button";
import { siteConfig } from "@/config/site";

type AppHeaderProps = {
  clerkEnabled: boolean;
  sessionState: SessionState;
};

export function AppHeader({ clerkEnabled, sessionState }: AppHeaderProps) {
  const panelHref = "/dashboard";
  const navItems = [
    { href: "/", label: "Home", description: "Página inicial", icon: LayoutIcon },
    { href: panelHref, label: "Painel", description: "Sua área principal", icon: LayoutBottomIcon },
    { href: "/agendar", label: "Agendar", description: "Buscar horário disponível", icon: SearchIcon },
  ];
  const mobileSecondaryItems = [
    {
      href: `${siteConfig.social.oftleonardoSite}/conteudos?utm_source=oftagenda&utm_medium=referral&utm_campaign=crossdomain_seo`,
      label: "Conteúdos",
      description: "Abrir artigos e materiais",
      icon: File01Icon,
      external: true,
    },
  ];
  const oftleonardoContentUrl = `${siteConfig.social.oftleonardoSite}/conteudos?utm_source=oftagenda&utm_medium=referral&utm_campaign=crossdomain_seo`;
  const mobileMenuContentId = "mobile-menu-sheet-content";
  const mobileMenuTriggerId = "mobile-menu-sheet-trigger";

  return (
    <header data-app-header className="border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="rounded-md border border-border/80 bg-muted/60 p-1">
            <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span>Minha Agenda</span>
            <span className="text-[11px] font-normal text-muted-foreground">Leonardo Nunes</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex md:gap-3">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <Link href={item.href} prefetch={item.href === panelHref ? false : undefined}>
                {item.label}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" asChild>
            <Link href={oftleonardoContentUrl} target="_blank" rel="noreferrer">
              Conteúdos
            </Link>
          </Button>
          <ColorModeToggle />
          <Suspense fallback={<Button variant="outline">Entrar</Button>}>
            <HeaderAuthButton
              clerkEnabled={clerkEnabled}
              initialSessionState={sessionState}
              triggerId="header-auth-trigger-desktop"
            />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ColorModeToggle />
          <Sheet>
            <SheetTrigger asChild aria-controls={mobileMenuContentId}>
              <Button
                id={mobileMenuTriggerId}
                variant="outline"
                size="sm"
                aria-label="Abrir menu"
                aria-controls={mobileMenuContentId}
                className="gap-2 px-2.5"
              >
                <MenuIcon className="size-4" />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              id={mobileMenuContentId}
              aria-labelledby={mobileMenuTriggerId}
              side="right"
              className="w-[88vw] max-w-sm"
            >
              <SheetHeader className="pb-3">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Acesse rapidamente as principais áreas da plataforma.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-5 px-6 pb-6">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Navegação
                  </p>
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <Button variant="ghost" asChild className="h-auto justify-start rounded-lg py-2.5">
                          <Link
                            href={item.href}
                            prefetch={item.href === panelHref ? false : undefined}
                            className="flex w-full items-center gap-3"
                          >
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-col text-left">
                              <span className="truncate text-sm font-medium">{item.label}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Atalhos
                  </p>
                  <div className="flex flex-col gap-1">
                    {mobileSecondaryItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <Button variant="ghost" asChild className="h-auto justify-start rounded-lg py-2.5">
                          <Link
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noreferrer" : undefined}
                            className="flex w-full items-center gap-3"
                          >
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col text-left">
                              <span className="truncate text-sm font-medium">{item.label}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </span>
                            {item.external ? (
                              <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
                            ) : null}
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <Suspense fallback={<Button variant="outline">Entrar</Button>}>
                    <HeaderAuthButton
                      clerkEnabled={clerkEnabled}
                      initialSessionState={sessionState}
                      triggerId="header-auth-trigger-mobile"
                    />
                  </Suspense>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
