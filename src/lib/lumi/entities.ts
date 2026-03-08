import type { DatePreference, LumiCollectedData } from "@/lib/lumi/types";

type LocationMatcher = {
  value: string;
  keywords: string[];
};

type ConsultationTypeMatcher = {
  value: string;
  keywords: string[];
};

const locationMatchers: LocationMatcher[] = [
  {
    value: "Fortaleza",
    keywords: ["fortaleza", "aldeota", "meireles", "centro", "sul", "norte"],
  },
  {
    value: "São Domingos do Maranhão",
    keywords: [
      "sao domingos do maranhao",
      "sao domingos",
      "domingos do maranhao",
    ],
  },
  {
    value: "Fortuna",
    keywords: ["fortuna", "fortuna ma"],
  },
];

const consultationTypeMatchers: ConsultationTypeMatcher[] = [
  {
    value: "consulta geral",
    keywords: [
      "geral",
      "consulta geral",
      "consulta oftalmologica",
      "avaliacao da visao central",
      "teste de acuidade visual",
      "acuidade visual",
      "visao central",
    ],
  },
  {
    value: "retina",
    keywords: ["retina"],
  },
  {
    value: "catarata",
    keywords: ["catarata"],
  },
  {
    value: "glaucoma",
    keywords: ["glaucoma"],
  },
  {
    value: "olho seco",
    keywords: ["olho seco"],
  },
  {
    value: "exames",
    keywords: ["exames", "exame"],
  },
  {
    value: "revisao",
    keywords: ["revisao"],
  },
];

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function normalizePhone(rawPhone: string) {
  const digits = rawPhone.replaceAll(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) {
    return undefined;
  }
  return digits;
}

export function isValidEmail(rawEmail: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
}

function extractDatePreference(text: string): DatePreference | undefined {
  const normalized = normalizeText(text);
  const dateIsoMatch = normalized.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const dateBrMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);

  const period = normalized.includes("manha")
    ? "manha"
    : normalized.includes("tarde")
      ? "tarde"
      : normalized.includes("noite")
        ? "noite"
        : undefined;

  if (dateIsoMatch) {
    return {
      raw: dateIsoMatch[0],
      period,
      isoDate: `${dateIsoMatch[1]}-${dateIsoMatch[2]}-${dateIsoMatch[3]}`,
    };
  }

  if (dateBrMatch) {
    const currentYear = new Date().getFullYear();
    const day = Number(dateBrMatch[1]);
    const month = Number(dateBrMatch[2]);
    const yearRaw = dateBrMatch[3] ? Number(dateBrMatch[3]) : currentYear;
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const isoDate = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      return { raw: dateBrMatch[0], period, isoDate };
    }
  }

  if (period) {
    return { raw: period, period };
  }
  if (normalized.includes("hoje") || normalized.includes("amanha")) {
    return {
      raw: normalized.includes("amanha") ? "amanha" : "hoje",
      period,
    };
  }

  return undefined;
}

export function extractEntities(messageText: string): Partial<LumiCollectedData> {
  const normalized = normalizeText(messageText);
  const extracted: Partial<LumiCollectedData> = {};

  const emailMatch = messageText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch?.[0] && isValidEmail(emailMatch[0])) {
    extracted.email = emailMatch[0].toLowerCase();
  }

  const phoneMatch = messageText.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}/);
  if (phoneMatch?.[0]) {
    const phone = normalizePhone(phoneMatch[0]);
    if (phone) {
      extracted.phone = phone;
    }
  }

  for (const location of locationMatchers) {
    if (location.keywords.some((keyword) => normalized.includes(keyword))) {
      extracted.location = location.value;
      break;
    }
  }

  for (const consultationType of consultationTypeMatchers) {
    if (
      consultationType.keywords.some((keyword) => normalized.includes(keyword))
    ) {
      extracted.consultationType = consultationType.value;
      break;
    }
  }

  const datePreference = extractDatePreference(messageText);
  if (datePreference) {
    extracted.datePreference = datePreference;
  }

  const nameMatch = messageText.match(/(?:me chamo|sou|nome)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-\s]{3,80})/i);
  if (nameMatch?.[1]) {
    extracted.fullName = nameMatch[1].trim().replaceAll(/\s+/g, " ");
  }

  return extracted;
}
