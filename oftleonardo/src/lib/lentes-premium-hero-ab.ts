/**
 * Teste A/B do hero em `/conteudos/lentes-premium-catarata`.
 *
 * - **A**: hero com scroll longo e animações (modelo alinhado ao deploy anterior em `main`).
 * - **B**: hero estático focado em conversão (layout atual).
 *
 * Atribuição: 50/50 persistida em `localStorage`. Sobrescreva com `?lp_hero=a` ou `?lp_hero=b`.
 * Limpe a chave no DevTools para sortear de novo.
 */
export type LentesPremiumHeroAbVariant = "A" | "B";

export const LENTES_PREMIUM_HERO_AB_STORAGE_KEY = "oft_ab_lentes_premium_hero_v1";

/** Query string: `lp_hero=a` | `lp_hero=b` (força variante sem gravar no storage). */
export const LENTES_PREMIUM_HERO_AB_QUERY = "lp_hero";

export function resolveLentesPremiumHeroAbVariant(): LentesPremiumHeroAbVariant {
  if (typeof window === "undefined") return "B";

  const params = new URLSearchParams(window.location.search);
  const q = params.get(LENTES_PREMIUM_HERO_AB_QUERY)?.toLowerCase();
  if (q === "a") return "A";
  if (q === "b") return "B";

  try {
    const stored = localStorage.getItem(LENTES_PREMIUM_HERO_AB_STORAGE_KEY);
    if (stored === "A" || stored === "B") return stored;
    const roll: LentesPremiumHeroAbVariant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(LENTES_PREMIUM_HERO_AB_STORAGE_KEY, roll);
    return roll;
  } catch {
    return "B";
  }
}
