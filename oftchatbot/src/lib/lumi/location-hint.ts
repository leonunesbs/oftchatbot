type LocationHint = {
  ddd?: string;
  dddCity?: string;
  ipCity?: string;
};

type LocationHintInput = {
  phone?: string;
  sourceIp?: string;
};

const dddCityMap: Record<string, string> = {
  "85": "Fortaleza",
};

const ipCityCache = new Map<string, string | null>();

function normalizeDigits(value?: string) {
  return value?.replaceAll(/\D/g, "");
}

function extractDddFromPhone(phone?: string) {
  const digits = normalizeDigits(phone);
  if (!digits || digits.length < 10) {
    return undefined;
  }
  const localDigits = digits.startsWith("55") ? digits.slice(2) : digits;
  if (localDigits.length < 10) {
    return undefined;
  }
  return localDigits.slice(0, 2);
}

function extractPrimaryIp(sourceIp?: string) {
  if (!sourceIp) {
    return undefined;
  }
  const first = sourceIp.split(",")[0]?.trim();
  return first && first.length > 0 ? first : undefined;
}

function isPrivateIpV4(ip: string) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("0.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function isPrivateIp(ip: string) {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  if (ip.includes(":")) {
    return false;
  }
  return isPrivateIpV4(ip);
}

async function getCityFromIp(sourceIp?: string) {
  const ip = extractPrimaryIp(sourceIp);
  if (!ip || isPrivateIp(ip)) {
    return undefined;
  }
  if (ipCityCache.has(ip)) {
    const cached = ipCityCache.get(ip);
    return cached ?? undefined;
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,city`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok) {
      ipCityCache.set(ip, null);
      return undefined;
    }
    const body = (await response.json()) as {
      status?: string;
      countryCode?: string;
      city?: string;
    };
    if (
      body.status === "success" &&
      body.countryCode === "BR" &&
      typeof body.city === "string" &&
      body.city.trim().length > 0
    ) {
      const city = body.city.trim();
      ipCityCache.set(ip, city);
      return city;
    }
  } catch {
    ipCityCache.set(ip, null);
    return undefined;
  }

  ipCityCache.set(ip, null);
  return undefined;
}

export async function resolveLocationHint(
  input: LocationHintInput,
): Promise<LocationHint> {
  const ddd = extractDddFromPhone(input.phone);
  const dddCity = ddd ? dddCityMap[ddd] : undefined;
  const ipCity = await getCityFromIp(input.sourceIp);

  return {
    ddd,
    dddCity,
    ipCity,
  };
}
