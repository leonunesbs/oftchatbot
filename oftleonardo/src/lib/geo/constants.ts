export const GEO_CITY_COOKIE_NAME = "oft_geo_city";
export const GEO_CITY_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 6;
export const GEO_REQUEST_TIMEOUT_MS = 600;

export const SUPPORTED_GEO_CITIES = [
  {
    slug: "fortaleza",
    name: "Fortaleza",
    state: "CE",
  },
  {
    slug: "sao-domingos-do-maranhao",
    name: "São Domingos do Maranhão",
    state: "MA",
  },
  {
    slug: "fortuna-ma",
    name: "Fortuna",
    state: "MA",
  },
] as const;

export type SupportedGeoCity = (typeof SUPPORTED_GEO_CITIES)[number];
export type SupportedGeoCitySlug = SupportedGeoCity["slug"];

export const DEFAULT_GEO_CITY_SLUG: SupportedGeoCitySlug = "fortaleza";
