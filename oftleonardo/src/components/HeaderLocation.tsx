import { getDefaultGeoCity, getSupportedCityBySlug } from "@/lib/geo/city";
import { GEO_CITY_COOKIE_NAME } from "@/lib/geo/constants";
import type { GeoCityResolution } from "@/lib/geo/resolve-city";
import { useLayoutEffect, useState } from "react";

let sharedGeoFetch: Promise<GeoCityResolution> | null = null;

function fetchGeoCityOnce(): Promise<GeoCityResolution> {
  if (!sharedGeoFetch) {
    sharedGeoFetch = fetch("/api/geo/city").then((r) => r.json() as Promise<GeoCityResolution>);
  }
  return sharedGeoFetch;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function labelFromSlug(slug: string | null): string {
  const c = getSupportedCityBySlug(slug);
  if (c) return `${c.name} · ${c.state}`;
  const d = getDefaultGeoCity();
  return `${d.name} · ${d.state}`;
}

type Props = {
  className?: string;
  id?: string;
};

export default function HeaderLocation({ className, id }: Props) {
  const [label, setLabel] = useState(() => labelFromSlug(readCookie(GEO_CITY_COOKIE_NAME)));

  useLayoutEffect(() => {
    const slug = readCookie(GEO_CITY_COOKIE_NAME);
    if (slug && getSupportedCityBySlug(slug)) {
      setLabel(labelFromSlug(slug));
      return;
    }

    let cancelled = false;
    fetchGeoCityOnce()
      .then((data) => {
        if (cancelled) return;
        setLabel(`${data.name} · ${data.state}`);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      id={id}
      className={className}
      aria-live="polite"
      title="Cidade de referência para agendamento (estimada pelo seu acesso)"
    >
      {label}
    </span>
  );
}
