import { serverEnv } from "@/lib/env/server";
import type { AssistantMode } from "@/lib/assistants/types";

type FireMessageIntent =
  | "faq"
  | "triage"
  | "lead_capture"
  | "scheduling"
  | "rescheduling"
  | "confirmation"
  | "surgery"
  | "post_op"
  | "handoff_human"
  | "urgent_redirect"
  | "billing"
  | "other";

type FireConversationStage =
  | "first_contact"
  | "qualification"
  | "answering_question"
  | "offering_slot"
  | "collecting_data"
  | "confirming"
  | "handoff"
  | "follow_up";

type FireWrapInput = {
  assistant: AssistantMode;
  userMessage: string;
  deterministicReply: string;
  contactName?: string;
  intent?: FireMessageIntent;
  conversationStage?: FireConversationStage;
  userEmotion?:
    | "neutral"
    | "anxious"
    | "urgent"
    | "confused"
    | "price_sensitive"
    | "decisive";
  channel?: "whatsapp";
  locale?: "pt-BR";
  clinicName?: string;
  doctorName?: string;
  specialty?: string;
  city?: string;
  primaryGoal?:
    | "inform"
    | "reduce_friction"
    | "build_trust"
    | "collect_data"
    | "encourage_booking"
    | "confirm_next_step"
    | "handoff";
  ctaMode?: "none" | "soft" | "direct";
  mustPreserve?: string[];
  forbiddenTerms?: string[];
  previousAssistantMessage?: string;
  recentReplies?: string[];
};

const OPENAI_RESPONSES_ENDPOINT = "/responses";

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

function normalizeBaseUrl(rawBaseUrl?: string) {
  const candidate = (rawBaseUrl ?? "https://api.openai.com/v1").trim();
  return candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
}

function safeJoinList(items?: string[]) {
  if (!items || items.length === 0) {
    return "nenhum";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function buildFireSystemPrompt() {
  return [
    "Você é Fire, secretária virtual da Clínica OFT Leonardo.",
    "Você atua como uma atendente sênior de clínica oftalmológica, especialista em comunicação por WhatsApp, acolhimento, clareza, redução de atrito, organização de agenda e conversão ética de interessados em consultas e cirurgias.",
    "",
    "Seu trabalho NÃO é decidir a conduta do negócio.",
    "Seu trabalho é REESCREVER a resposta base de um fluxo determinístico, deixando a mensagem mais natural, humana, clara e adequada para WhatsApp, sem alterar a decisão já tomada pelo sistema.",
    "",
    "Contexto da Fire:",
    "- Responde dúvidas frequentes.",
    "- Ajuda no agendamento e na remarcação de consultas.",
    "- Organiza os próximos passos de avaliação e cirurgia.",
    "- Faz acolhimento sem parecer robótica.",
    "- Mantém uma comunicação profissional, objetiva e calorosa.",
    "",
    "Regras obrigatórias de preservação:",
    "- Não mude links, URLs, protocolos, números, valores, datas, horários, nomes de médicos, nomes de locais, listas numeradas, instruções operacionais e direcionamentos de urgência.",
    "- Não invente disponibilidade, preço, exame, preparo, prazo, benefício, garantia, campanha ou condição comercial.",
    "- Não adicione diagnósticos, prescrições, promessas de resultado, orientação médica personalizada ou interpretação clínica individual.",
    "- Não contradiga o fluxo determinístico.",
    "- Não remova avisos de urgência, handoff para humano, pedido de dados, confirmação ou a próxima ação definida pela resposta base.",
    "",
    "Diretrizes de estilo:",
    "- Escreva em português do Brasil.",
    "- Soe como uma conversa real de WhatsApp com uma secretária excelente.",
    "- Seja acolhedora, organizada, natural e profissional.",
    "- Use frases curtas e fáceis de ler no celular.",
    "- Evite excesso de entusiasmo, excesso de emojis e linguagem forçada.",
    "- Evite repetir estruturas e bordões.",
    "- Não use as expressões 'fico à disposição', 'estou à disposição' ou variações equivalentes.",
    "- Quando houver preocupação, medo, ansiedade ou dúvida, comece com uma validação breve e respeitosa.",
    "- Quando o objetivo for conversão, use persuasão leve, sem pressão.",
    "- Quando o objetivo for coleta de dados, reduza atrito e peça o mínimo necessário de forma clara.",
    "- Quando o objetivo for agendamento, priorize a clareza do próximo passo.",
    "- Não force convite para agendamento em toda resposta.",
    "- Varie a estrutura da resposta conforme o contexto; não use molde fixo de 3 parágrafos.",
    "- Evite repetir a mesma ideia em blocos diferentes com pequenas variações.",
    "- Não abra com saudação quando a conversa já estiver em andamento.",
    "- Se houver URL longa, mantenha uma chamada curta e deixe o link sozinho em uma linha.",
    "",
    "Marketing conversacional para WhatsApp:",
    "- Priorize clareza, confiança, proximidade e facilidade.",
    "- Diminua a carga cognitiva da resposta.",
    "- Faça a mensagem parecer personalizada, mas sem inventar contexto.",
    "- Se houver CTA, ele deve ser natural, respeitoso e coerente com a intenção da resposta base.",
    "- A resposta deve ser útil primeiro, persuasiva depois.",
    "",
    "Formato da saída:",
    "- Retorne somente o texto final para o paciente.",
    "- Não use aspas.",
    "- Não explique seu raciocínio.",
  ].join("\n");
}

function buildFireUserPrompt(input: FireWrapInput) {
  const clinicName = input.clinicName ?? "Clínica OFT Leonardo";
  const doctorName = input.doctorName ?? "Dr. Leonardo";
  const specialty = input.specialty ?? "Oftalmologia";
  const city = input.city ?? "Fortaleza";
  const locale = input.locale ?? "pt-BR";
  const channel = input.channel ?? "whatsapp";
  const intent = input.intent ?? "other";
  const stage = input.conversationStage ?? "answering_question";
  const emotion = input.userEmotion ?? "neutral";
  const primaryGoal = input.primaryGoal ?? "inform";
  const ctaMode = input.ctaMode ?? "soft";

  return [
    "Reescreva a resposta base mantendo a mesma intenção de negócio.",
    "",
    "Contexto da operação:",
    `- Clínica: ${clinicName}`,
    `- Médico / marca principal: ${doctorName}`,
    `- Especialidade: ${specialty}`,
    `- Cidade principal: ${city}`,
    `- Canal: ${channel}`,
    `- Locale: ${locale}`,
    "",
    "Contexto da conversa:",
    `- Intenção da mensagem: ${intent}`,
    `- Etapa da conversa: ${stage}`,
    `- Estado emocional percebido do paciente: ${emotion}`,
    `- Objetivo principal da resposta: ${primaryGoal}`,
    `- Intensidade do CTA: ${ctaMode}`,
    input.contactName
      ? `- Nome do contato: ${input.contactName} (use apenas se soar natural)`
      : undefined,
    "",
    input.previousAssistantMessage
      ? ["Mensagem anterior da assistente:", input.previousAssistantMessage].join(
          "\n",
        )
      : undefined,
    "",
    input.recentReplies && input.recentReplies.length > 0
      ? [
          "Evite repetir padrões destas respostas recentes:",
          ...input.recentReplies.map((reply) => `- ${reply}`),
        ].join("\n")
      : undefined,
    "",
    "Mensagem do paciente:",
    input.userMessage,
    "",
    "Resposta base determinística a ser preservada:",
    input.deterministicReply,
    "",
    "Elementos que DEVEM ser preservados exatamente ou conceitualmente:",
    safeJoinList(input.mustPreserve),
    "",
    "Elementos proibidos:",
    safeJoinList(input.forbiddenTerms),
    "",
    "Instruções adicionais de escrita:",
    "- Soar como uma secretária experiente de clínica oftalmológica no WhatsApp.",
    "- Melhorar fluidez, acolhimento e legibilidade.",
    "- Manter a mensagem objetiva.",
    "- Evitar formato fixo em 3 blocos; na maioria dos casos prefira 1-2 blocos curtos.",
    "- Só usar 3 blocos quando realmente agregar clareza (ex.: orientação + próximo passo + confirmação).",
    "- Se o paciente trouxer receio, dor, urgência ou insegurança, abrir com validação breve.",
    "- Se houver pedido de próximo passo, deixar muito claro o que a pessoa precisa fazer agora.",
    "- Se houver CTA, que seja natural e sem pressão.",
    "- Não terminar com bordões genéricos repetitivos.",
    "- Não encerrar com 'fico à disposição' (nem variações).",
    "- Não repetir o mesmo conteúdo em parágrafos diferentes.",
    "- Quando etapa da conversa não for 'first_contact', evite iniciar com 'Oi', 'Olá' ou equivalente.",
    "",
    "Retorne apenas a mensagem final.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractOutputText(payload: unknown) {
  const data = payload as Record<string, unknown>;

  const outputText = data.output_text;
  if (typeof outputText === "string" && outputText.trim().length > 0) {
    return outputText.trim();
  }

  const output = data.output;
  if (!Array.isArray(output)) {
    return undefined;
  }

  for (const item of output) {
    const outputItem = item as Record<string, unknown>;
    const content = outputItem.content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      const part = contentItem as Record<string, unknown>;

      if (part.type === "output_text" && typeof part.text === "string") {
        const text = part.text.trim();
        if (text.length > 0) {
          return text;
        }
      }
    }
  }

  return undefined;
}

function logFoxFallback(reason: string, metadata?: Record<string, unknown>) {
  if (serverEnv.NODE_ENV === "production") {
    return;
  }

  console.warn(
    "[FIRE wrap fallback]",
    JSON.stringify({
      reason,
      ...(metadata ?? {}),
    }),
  );
}

function normalizeForPatternMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const EXACT_GENERIC_HELP_CLOSERS = new Set([
  "fico a disposicao",
  "fico a disposicao.",
  "qualquer duvida, estou a disposicao",
  "qualquer duvida, estou a disposicao.",
  "estou a disposicao para ajudar",
  "estou a disposicao para ajudar.",
  "conte comigo",
  "conte comigo.",
]);

const GENERIC_HELP_CLOSER_PATTERNS = [
  /^se precisar de algo mais,? estou aqui para ajudar\.?$/,
  /^estou aqui para ajudar(?: no que for preciso)?\.?$/,
];

function isGenericHelpClosure(line: string) {
  const normalized = normalizeForPatternMatch(line);

  if (!normalized) {
    return false;
  }

  if (EXACT_GENERIC_HELP_CLOSERS.has(normalized)) {
    return true;
  }

  if (/\b(fico|estou|seguimos|permaneco)\s+a disposicao\b/.test(normalized)) {
    return true;
  }

  return GENERIC_HELP_CLOSER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function removeTrailingGenericSentences(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return text;
  }

  const sentenceSplitPattern = /(?<=[.!?])\s+/;
  const canDropSentence = (sentence: string) =>
    isGenericHelpClosure(sentence) ||
    /\b(fico|estou|seguimos|permaneco)\s+a\s+disposicao\b/.test(
      normalizeForPatternMatch(sentence),
    );

  for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
    const sentences = paragraphs[index]?.split(sentenceSplitPattern).filter(Boolean) ?? [];
    while (sentences.length > 0 && canDropSentence(sentences[sentences.length - 1] ?? "")) {
      sentences.pop();
    }

    if (sentences.length > 0) {
      paragraphs[index] = sentences.join(" ").trim();
      break;
    }

    paragraphs.pop();
  }

  return paragraphs.join("\n\n").trim();
}

function sanitizeFireWrappedReply(text: string) {
  let sanitized = text.replace(/\r\n/g, "\n").trim();

  sanitized = sanitized.replace(/^["“”']+|["“”']+$/g, "").trim();

  const lines = sanitized.split("\n");

  while (
    lines.length > 0 &&
    isGenericHelpClosure(lines[lines.length - 1] ?? "")
  ) {
    lines.pop();

    while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
      lines.pop();
    }
  }

  sanitized = lines.join("\n").trim();
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  sanitized = removeTrailingGenericSentences(sanitized);
  sanitized = removeNearDuplicateParagraphs(sanitized);

  return sanitized;
}

function normalizeParagraphForSimilarity(value: string) {
  return normalizeForPatternMatch(value).replace(/[^a-z0-9\s]/g, "");
}

function isListLikeParagraph(paragraph: string) {
  const trimmed = paragraph.trim();
  if (!trimmed) {
    return false;
  }

  return (
    /^[-*]\s+/.test(trimmed) ||
    /^\d+[.)]\s+/.test(trimmed) ||
    trimmed.includes("\n- ") ||
    trimmed.includes("\n* ") ||
    /\n\d+[.)]\s+/.test(trimmed)
  );
}

function getTokenSet(value: string) {
  return new Set(
    value
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function isNearDuplicateParagraph(a: string, b: string) {
  const normalizedA = normalizeParagraphForSimilarity(a);
  const normalizedB = normalizeParagraphForSimilarity(b);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return true;
  }

  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return true;
  }

  const tokensA = getTokenSet(normalizedA);
  const tokensB = getTokenSet(normalizedB);
  if (tokensA.size === 0 || tokensB.size === 0) {
    return false;
  }

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  if (union <= 0) {
    return false;
  }

  const jaccard = intersection / union;
  return jaccard >= 0.72;
}

function removeNearDuplicateParagraphs(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length <= 1) {
    return text;
  }

  const deduped: string[] = [];
  for (const paragraph of paragraphs) {
    if (isListLikeParagraph(paragraph)) {
      deduped.push(paragraph);
      continue;
    }

    const alreadyCovered = deduped.some((kept) => {
      if (isListLikeParagraph(kept)) {
        return false;
      }
      return isNearDuplicateParagraph(kept, paragraph);
    });

    if (!alreadyCovered) {
      deduped.push(paragraph);
    }
  }

  return deduped.join("\n\n").trim();
}

export function isFoxEnabled(assistant: AssistantMode) {
  if (assistant !== "fire") {
    return false;
  }

  return (
    typeof serverEnv.OPENAI_API_KEY === "string" &&
    serverEnv.OPENAI_API_KEY.trim().length > 0
  );
}

export async function wrapWithFox(input: FireWrapInput) {
  if (!isFoxEnabled(input.assistant)) {
    logFoxFallback("fire_disabled_or_missing_openai_key");
    return input.deterministicReply;
  }

  const baseUrl = normalizeBaseUrl(serverEnv.OPENAI_BASE_URL);
  const timeout = withTimeoutSignal(serverEnv.FOX_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${OPENAI_RESPONSES_ENDPOINT}`, {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverEnv.OPENAI_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        model: serverEnv.FOX_OPENAI_MODEL,
        temperature: serverEnv.FOX_TEMPERATURE,
        max_output_tokens: serverEnv.FOX_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "text",
          },
        },
        input: [
          {
            role: "system",
            content: buildFireSystemPrompt(),
          },
          {
            role: "user",
            content: buildFireUserPrompt(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      logFoxFallback("openai_non_ok_response", {
        status: response.status,
        statusText: response.statusText,
      });
      return input.deterministicReply;
    }

    const payload = (await response.json()) as unknown;
    const wrapped = extractOutputText(payload);
    if (!wrapped || wrapped.length < 3) {
      logFoxFallback("empty_or_invalid_openai_output");
      return input.deterministicReply;
    }

    const sanitized = sanitizeFireWrappedReply(wrapped);
    if (sanitized.length < 3) {
      logFoxFallback("sanitized_reply_became_empty");
      return input.deterministicReply;
    }
    return sanitized;
  } catch (error) {
    logFoxFallback("openai_request_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return input.deterministicReply;
  } finally {
    timeout.cleanup();
  }
}
