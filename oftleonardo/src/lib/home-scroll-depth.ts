/**
 * Profundidade contínua no scroll: gradientes em camadas + leve inclinação das seções pós-hero.
 * Um listener passivo + rAF; sem scroll-timeline; respeita prefers-reduced-motion.
 */

function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

function applySectionDepth(
  el: HTMLElement,
  vh: number,
  tyMul: number,
  tiltMul: number,
): void {
  const r = el.getBoundingClientRect();
  const margin = 96;
  if (r.bottom < -margin || r.top > vh + margin) {
    el.style.setProperty("--home-section-ty", "0px");
    el.style.setProperty("--home-section-rx", "0deg");
    return;
  }
  const center = r.top + r.height / 2;
  const n = clamp((vh / 2 - center) / (vh * 0.62), -1, 1);
  const ty = n * -11 * tyMul;
  const rx = n * -1.85 * tiltMul;
  el.style.setProperty("--home-section-ty", `${ty.toFixed(2)}px`);
  el.style.setProperty("--home-section-rx", `${rx.toFixed(2)}deg`);
}

export function initHomeScrollDepth(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const layer1 = document.querySelector<HTMLElement>(".parallax-artifacts .parallax-layer--v1");
  const layer2 = document.querySelector<HTMLElement>(".parallax-artifacts .parallax-layer--v2");
  const sectionInners = document.querySelectorAll<HTMLElement>(".home-depth-section__inner");
  const heroTarget = document.querySelector<HTMLElement>(".home-hero-depth-target");

  const mdMq = window.matchMedia("(min-width: 768px)");
  let ticking = false;

  const apply = (): void => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = clamp(scrollY / scrollRange, 0, 1);

    if (mdMq.matches && layer1 && layer2) {
      const span = 52;
      const y1 = (p - 0.5) * span * 2 * 0.52;
      const y2 = (p - 0.5) * span * 2 * 0.82;
      const x1 = (p - 0.5) * 9;
      const x2 = (p - 0.5) * -12;
      layer1.style.transform = `translate3d(${x1.toFixed(2)}px, ${y1.toFixed(2)}px, 0)`;
      layer2.style.transform = `translate3d(${x2.toFixed(2)}px, ${y2.toFixed(2)}px, 0)`;
    } else {
      if (layer1) layer1.style.transform = "";
      if (layer2) layer2.style.transform = "";
    }

    const tyMul = mdMq.matches ? 1 : 0.58;
    const tiltMul = mdMq.matches ? 1 : 0.48;

    for (const el of sectionInners) {
      applySectionDepth(el, vh, tyMul, tiltMul);
    }

    if (heroTarget) {
      const r = heroTarget.getBoundingClientRect();
      if (r.bottom < -32 || r.top > vh + 32) {
        heroTarget.style.setProperty("--hero-depth-ty", "0px");
      } else {
        const center = r.top + r.height / 2;
        const n = clamp((vh / 2 - center) / (vh * 0.85), -1, 1);
        const ty = n * -7 * (mdMq.matches ? 1 : 0.32);
        heroTarget.style.setProperty("--hero-depth-ty", `${ty.toFixed(2)}px`);
      }
    }
  };

  const schedule = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      apply();
    });
  };

  apply();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  if (typeof mdMq.addEventListener === "function") {
    mdMq.addEventListener("change", schedule);
  } else {
    mdMq.addListener(schedule);
  }
}
