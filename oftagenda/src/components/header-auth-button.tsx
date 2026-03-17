"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronsUpDown, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

let sessionProbePromise: Promise<SessionState | null> | null = null;
let sessionProbeCache: SessionState | null | undefined;

type HeaderAuthButtonProps = {
  clerkEnabled: boolean;
  initialSessionState: SessionState;
  triggerId?: string;
};

export type SessionState = {
  isAuthenticated: boolean;
  userId: string | null;
  avatarUrl: string | null;
  firstName: string | null;
};

export function HeaderAuthButton({
  clerkEnabled,
  initialSessionState,
  triggerId,
}: HeaderAuthButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [{ isAuthenticated, userId, avatarUrl, firstName }, setSessionState] =
    useState<SessionState>(initialSessionState);

  useEffect(() => {
    sessionProbeCache = initialSessionState;
    setSessionState(initialSessionState);
  }, [
    initialSessionState.avatarUrl,
    initialSessionState.firstName,
    initialSessionState.isAuthenticated,
    initialSessionState.userId,
  ]);

  useEffect(() => {
    if (!clerkEnabled || isSigningOut) {
      return;
    }

    let isMounted = true;

    async function syncSessionState() {
      try {
        const nextState = await probeSessionState();
        if (!nextState || !isMounted) {
          return;
        }
        setSessionState(nextState);
      } catch {
        // Keep optimistic SSR state when session probe fails.
      }
    }

    void syncSessionState();

    return () => {
      isMounted = false;
    };
  }, [clerkEnabled, isSigningOut]);

  if (!clerkEnabled) {
    return (
      <Button variant="outline" disabled>
        Clerk não configurado
      </Button>
    );
  }

  if (!isAuthenticated) {
    const qs = searchParams.toString();
    const returnPath = qs ? `${pathname}?${qs}` : (pathname || "/");
    const signInHref = `/sign-in?redirect_url=${encodeURIComponent(returnPath)}`;
    return (
      <Button asChild>
        <Link href={signInHref}>Entrar</Link>
      </Button>
    );
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
      });
    } finally {
      const loggedOutState = {
        isAuthenticated: false,
        userId: null,
        avatarUrl: null,
        firstName: null,
      };
      sessionProbeCache = loggedOutState;
      setSessionState(loggedOutState);
      window.location.href = "/";
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={triggerId}
          variant="outline"
          className="h-9 rounded-full border-border/70 bg-muted/30 px-2.5 text-foreground/90 shadow-xs ring-1 ring-transparent transition-all hover:border-border hover:bg-muted/60 hover:text-foreground hover:shadow-sm data-[state=open]:bg-muted data-[state=open]:ring-ring/25"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={firstName ? `Avatar de ${firstName}` : "Avatar"}
              width={20}
              height={20}
              className="size-6 rounded-full object-cover ring-1 ring-border/60"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary ring-1 ring-primary/20"
            >
              {firstName?.trim().charAt(0) ? (
                firstName.trim().charAt(0).toUpperCase()
              ) : (
                <User className="size-3.5" />
              )}
            </span>
          )}
          <span className="max-w-28 truncate">{firstName ? `Olá, ${firstName}` : "Minha conta"}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground transition-colors group-data-[state=open]/button:text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{firstName ? `Conta de ${firstName}` : "Minha conta"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" prefetch={false}>Ir para o painel</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          {isSigningOut ? "Saindo..." : "Sair da plataforma"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function probeSessionState(): Promise<SessionState | null> {
  if (sessionProbeCache !== undefined) {
    return sessionProbeCache;
  }

  if (!sessionProbePromise) {
    sessionProbePromise = fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = (await response.json()) as Partial<SessionState> & {
          clerkEnabled?: boolean;
        };
        if (payload.clerkEnabled === false) {
          return null;
        }
        return {
          isAuthenticated: Boolean(payload.isAuthenticated),
          userId: typeof payload.userId === "string" ? payload.userId : null,
          avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
          firstName: typeof payload.firstName === "string" ? payload.firstName : null,
        } satisfies SessionState;
      })
      .catch(() => null)
      .finally(() => {
        sessionProbePromise = null;
      });
  }

  const resolved = await sessionProbePromise;
  sessionProbeCache = resolved;
  return resolved;
}
