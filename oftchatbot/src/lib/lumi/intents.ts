import { intentPatterns, normalizeForMatch } from "@/lib/lumi/patterns";
import type { DetectedIntent, LumiIntent } from "@/lib/lumi/types";

function escapeRegex(input: string) {
  return input.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(text: string, term: string) {
  if (!term) {
    return false;
  }
  if (term.includes(" ")) {
    return text.includes(term);
  }
  return new RegExp(`\\b${escapeRegex(term)}\\b`, "u").test(text);
}

function scoreMatches(text: string, terms: string[]) {
  let score = 0;
  const matched: string[] = [];

  for (const term of terms) {
    const normalizedTerm = normalizeForMatch(term);
    if (!normalizedTerm) {
      continue;
    }
    if (hasTerm(text, normalizedTerm)) {
      score += 1;
      matched.push(term);
    }
  }

  return { score, matched };
}

export function detectIntent(rawText: string): DetectedIntent {
  const text = normalizeForMatch(rawText);
  const allIntents = Object.keys(intentPatterns) as LumiIntent[];
  let best: DetectedIntent = {
    intent: "fallback",
    score: 0,
    matchedBy: "none",
  };

  for (const intent of allIntents) {
    if (intent === "fallback") {
      continue;
    }
    const pattern = intentPatterns[intent];
    const fromKeywords = scoreMatches(text, pattern.keywords);
    const fromSynonyms = scoreMatches(text, pattern.synonyms);
    const fromTypos = scoreMatches(text, pattern.typos);
    const score = fromKeywords.score * 3 + fromSynonyms.score * 2 + fromTypos.score;

    if (score <= 0) {
      continue;
    }

    const weightedScore = score + pattern.priority;
    if (weightedScore > best.score) {
      best = {
        intent,
        score: weightedScore,
        matchedBy: [...fromKeywords.matched, ...fromSynonyms.matched, ...fromTypos.matched].join(", "),
      };
    }
  }

  return best;
}

export function isAffirmative(rawText: string) {
  const text = normalizeForMatch(rawText);
  return /^(sim|ok|claro|isso|pode ser|confirmo|fechado|isso mesmo)$/.test(text);
}

export function isNegative(rawText: string) {
  const text = normalizeForMatch(rawText);
  return /^(nao|n|negativo|nao quero|prefiro nao|cancelar)$/.test(text);
}

export function isGreetingMessage(rawText: string) {
  const text = normalizeForMatch(rawText);
  return /^(oi+|ola+|opa+|e ai|eae|bom dia+|boa tarde+|boa noite+)( lumi)?$/.test(text);
}
