"use client"

import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const tools = [
  {
    id: "gtm-nav-tools-acuidade-visual",
    href: "/acuidade-visual",
    label: "Teste Visual",
  },
  {
    id: "gtm-nav-tools-amsler",
    href: "/tela-de-amsler",
    label: "Tela de Amsler",
  },
  {
    id: "gtm-nav-tools-olho-seco",
    href: "/calculadora-olho-seco",
    label: "Olho seco",
  },
  {
    id: "gtm-nav-tools-agendamento-online",
    href: "/agendamento-online",
    label: "Agendamento Online",
  },
  {
    id: "gtm-nav-tools-conteudos",
    href: "/conteudos",
    label: "Hub de Conteúdos",
  },
] as const

export default function HeaderToolsMenu() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="group inline-flex items-center gap-0.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/90 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:text-foreground"
      >
        Ferramentas
        <ChevronDown
          className="size-4 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {tools.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
            <a id={item.id} href={item.href}>
              {item.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
