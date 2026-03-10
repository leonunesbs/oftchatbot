import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  GEO_CITY_COOKIE_NAME,
  type SupportedGeoCitySlug,
} from "@/lib/geo/constants";
import { useEffect, useMemo, useState, type ReactNode } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function buildWhatsAppUrl(whatsappNumber: string, messageText: string) {
  const message = encodeURIComponent(messageText);
  return `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${message}`;
}

const CONSENT_KEY = "oftcore:consent:v1";

function trackClick(cityName: string) {
  try {
    if (localStorage.getItem(CONSENT_KEY) !== "granted") return;
  } catch {
    return;
  }

  const payload = {
    city: cityName,
    channel: "whatsapp",
  };
  window.dataLayer?.push({ event: "start_booking", ...payload });
  window.gtag?.("event", "start_booking", payload);
}

function readCookieValue(cookieName: string) {
  if (typeof document === "undefined") return null;

  const encodedName = encodeURIComponent(cookieName);
  const cookiePart = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${encodedName}=`));

  if (!cookiePart) return null;

  const value = cookiePart.slice(encodedName.length + 1);
  return decodeURIComponent(value);
}

interface Props {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  triggerAriaLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  whatsappMessageTemplate?: string;
  showOnlineBookingCta?: boolean;
}

export default function WhatsAppModal({
  children,
  variant = "default",
  size = "default",
  className,
  triggerAriaLabel,
  dialogTitle = "Agendar Consulta",
  dialogDescription = "Escolha a cidade e inicie o agendamento pelo WhatsApp",
  whatsappMessageTemplate = "Olá, Dr. Leonardo! Gostaria de agendar uma consulta oftalmológica em {city}.",
  showOnlineBookingCta = true,
}: Props) {
  const [preferredCitySlug, setPreferredCitySlug] = useState<SupportedGeoCitySlug | null>(null);

  useEffect(() => {
    const cookieValue = readCookieValue(GEO_CITY_COOKIE_NAME);
    if (
      cookieValue &&
      siteConfig.cities.some((city) => city.slug === cookieValue)
    ) {
      setPreferredCitySlug(cookieValue as SupportedGeoCitySlug);
    }
  }, []);

  const orderedCities = useMemo(() => {
    if (!preferredCitySlug) return siteConfig.cities;

    return [...siteConfig.cities].sort((cityA, cityB) => {
      if (cityA.slug === preferredCitySlug) return -1;
      if (cityB.slug === preferredCitySlug) return 1;
      return 0;
    });
  }, [preferredCitySlug]);

  const buildCityWhatsAppUrl = (cityName: string, whatsappNumber: string) =>
    buildWhatsAppUrl(
      whatsappNumber,
      whatsappMessageTemplate.replace("{city}", cityName),
    );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={triggerAriaLabel}
        >
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          {orderedCities.map((city) => (
            <a
              key={city.slug}
              href={buildCityWhatsAppUrl(city.name, city.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(city.name)}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-600/10 text-green-600 transition-colors group-hover:bg-green-600/20">
                <WhatsAppIcon className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-foreground">
                  {city.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {city.state}
                </span>
              </span>
            </a>
          ))}
        </div>
        {showOnlineBookingCta && (
          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Prefere escolher data e horário agora? Faça seu agendamento online em
              poucos cliques.
            </p>
            <Button asChild className="mt-3 w-full">
              <a href={siteConfig.partnerApps.oftagenda}>Agendar online</a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
