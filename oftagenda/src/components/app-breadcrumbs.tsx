"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type AppBreadcrumbsProps = {
  className?: string;
  maxItems?: number;
};

type Crumb = {
  href: string;
  label: string;
  isCurrent: boolean;
};

type DisplayItem =
  | {
      type: "crumb";
      value: Crumb;
    }
  | {
      type: "ellipsis";
      key: string;
    };

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Painel",
  admin: "Admin",
  agendar: "Agendar",
  resumo: "Resumo",
  detalhes: "Detalhes",
  status: "Status",
  eventos: "Eventos",
  reservas: "Reservas",
  agenda: "Agenda",
  cancelar: "Cancelar",
  contato: "Contato",
  "novo-agendamento": "Novo agendamento",
  reagendar: "Reagendar",
  usuarios: "Usuários",
  "nova-disponibilidade": "Nova disponibilidade",
  "sign-in": "Entrar",
  "sign-up": "Criar conta",
  waitlist: "Lista de espera",
  "termos-de-uso": "Termos de Uso",
  "politica-de-privacidade": "Política de Privacidade",
  embed: "Embed",
};

const HIDDEN_PREFIXES = ["/api", "/dashboard/admin"];

function looksLikeIdentifier(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[a-f0-9]{24}$/i.test(segment) ||
    /^[a-f0-9-]{16,}$/i.test(segment)
  );
}

function toTitleCase(rawSegment: string): string {
  const normalized = decodeURIComponent(rawSegment).replace(/[-_]+/g, " ").trim();

  if (!normalized) {
    return "Detalhes";
  }

  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  if (looksLikeIdentifier(segment)) {
    return "Detalhes";
  }

  return toTitleCase(segment);
}

function collapseCrumbs(crumbs: Crumb[], maxItems: number): DisplayItem[] {
  if (crumbs.length <= maxItems) {
    return crumbs.map((crumb) => ({
      type: "crumb" as const,
      value: crumb,
    }));
  }

  const [head] = crumbs;
  if (!head) {
    return [];
  }
  const tailCount = Math.max(maxItems - 2, 1);
  const tail = crumbs.slice(-tailCount);

  return [
    { type: "crumb" as const, value: head },
    { type: "ellipsis", key: "ellipsis" },
    ...tail.map((crumb) => ({
      type: "crumb" as const,
      value: crumb,
    })),
  ];
}

export function AppBreadcrumbs({ className, maxItems = 4 }: AppBreadcrumbsProps) {
  const pathname = usePathname();

  if (!pathname || pathname === "/" || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  const crumbs: Crumb[] = [
    { href: "/", label: "Início", isCurrent: segments.length === 0 },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isCurrent = index === segments.length - 1;

      return {
        href,
        label: getSegmentLabel(segment),
        isCurrent,
      };
    }),
  ];

  const collapsedCrumbs = collapseCrumbs(crumbs, Math.max(maxItems, 3));
  return (
    <Breadcrumb className={cn("w-full", className)}>
      <BreadcrumbList>
        {collapsedCrumbs.map((item, index) => {
          const isLastItem = index === collapsedCrumbs.length - 1;
          const key = item.type === "crumb" ? item.value.href : item.key;

          return (
            <Fragment key={key}>
              <BreadcrumbItem>
                {item.type === "ellipsis" ? (
                  <BreadcrumbEllipsis />
                ) : item.value.isCurrent ? (
                  <BreadcrumbPage>{item.value.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.value.href}>{item.value.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLastItem ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
