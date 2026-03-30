import { useLayoutEffect, useRef, useState } from "react";

import { LentesPremiumHeroVariantA } from "@/components/LentesPremiumHeroVariantA";
import type { LentesPremiumHeroVariantProps } from "@/components/LentesPremiumHeroVariantA";
import { LentesPremiumHeroVariantB } from "@/components/LentesPremiumHeroVariantB";
import { resolveAudiencePageContext } from "@/config/analytics-audiences";
import { hasAnalyticsConsent } from "@/lib/analytics";
import { ANALYTICS_APP } from "@/lib/oft-analytics-events";
import {
  type LentesPremiumHeroAbVariant,
  resolveLentesPremiumHeroAbVariant,
} from "@/lib/lentes-premium-hero-ab";

const AB_EXPERIMENT_ID = "lentes_premium_hero_2026_03";

const DL_EVENT = "lentes_premium_hero_ab";

function pushAbExposure(variant: LentesPremiumHeroAbVariant) {
  if (!hasAnalyticsConsent()) return;
  const ctx = resolveAudiencePageContext(window.location.pathname, window.location.search);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: DL_EVENT,
    analytics_app: ANALYTICS_APP.oftleonardo,
    ab_experiment_id: AB_EXPERIMENT_ID,
    ab_variant: variant,
    ab_variant_label: variant === "A" ? "deployed_scroll" : "conversion_static",
    funnel_stage: ctx.funnel_stage,
    page_intent: ctx.page_intent,
    ...(ctx.content_theme ? { content_theme: ctx.content_theme } : {}),
  });
}

/**
 * Teste A/B do hero em lentes premium: **A** = layout alternativo (sem trilha/sticky), **B** = estático conversão.
 *
 * - Atribuição 50/50 em `localStorage` (`oft_ab_lentes_premium_hero_v1`).
 * - Forçar: `?lp_hero=a` ou `?lp_hero=b` (não altera o storage).
 * - GTM: evento customizado `lentes_premium_hero_ab` (com consentimento).
 */
export function LentesPremiumHeroAB(props: LentesPremiumHeroVariantProps) {
  const [variant, setVariant] = useState<LentesPremiumHeroAbVariant>("B");
  const exposurePushed = useRef(false);

  useLayoutEffect(() => {
    const v = resolveLentesPremiumHeroAbVariant();
    setVariant(v);
    if (exposurePushed.current) return;
    exposurePushed.current = true;
    pushAbExposure(v);
  }, []);

  return (
    <div
      data-ab-experiment={AB_EXPERIMENT_ID}
      data-ab-variant={variant}
      className="contents"
    >
      {variant === "A" ? <LentesPremiumHeroVariantA {...props} /> : <LentesPremiumHeroVariantB {...props} />}
    </div>
  );
}
