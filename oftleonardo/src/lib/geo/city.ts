import {
  DEFAULT_GEO_CITY_SLUG,
  SUPPORTED_GEO_CITIES,
  type SupportedGeoCity,
  type SupportedGeoCitySlug,
} from "./constants.ts";

function normalizeText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getSupportedCityBySlug(
  slug: string | null | undefined,
): SupportedGeoCity | null {
  if (!slug) return null;
  return SUPPORTED_GEO_CITIES.find((city) => city.slug === slug) ?? null;
}

export function getDefaultGeoCity() {
  return getSupportedCityBySlug(DEFAULT_GEO_CITY_SLUG) as SupportedGeoCity;
}

export function mapIpApiCityToSupportedCity(input: {
  city?: string | null;
  region?: string | null;
  regionName?: string | null;
  countryCode?: string | null;
}): SupportedGeoCitySlug | null {
  const cityNormalized = normalizeText(input.city);
  const regionNormalized = normalizeText(input.regionName);
  const regionCode = (input.region ?? "").trim().toUpperCase();
  const countryCode = (input.countryCode ?? "").trim().toUpperCase();

  if (cityNormalized === "fortaleza") {
    return "fortaleza";
  }

  if (
    cityNormalized === "sao domingos do maranhao" ||
    (cityNormalized === "sao domingos" &&
      (regionCode === "MA" || regionNormalized.includes("maranhao")))
  ) {
    return "sao-domingos-do-maranhao";
  }

  if (
    cityNormalized === "fortuna" &&
    countryCode === "BR" &&
    (regionCode === "MA" || regionNormalized.includes("maranhao"))
  ) {
    return "fortuna-ma";
  }

  return null;
}
