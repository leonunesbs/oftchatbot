/**
 * Alinha o epicentro do fundo cósmico ao centro vertical da seção "Guias e referências"
 * (`#conteudos-educativos`), mantendo escala e máscara do SVG — só desloca com translateY.
 */
const SECTION_ID = "conteudos-educativos";
const ANCHOR_SELECTOR = ".home-cosmic-anchor";
/** Epicentro no SVG em 50% da altura (gradiente + máscara centrados no viewBox). */
const EPICENTER_FRAC = 0.5;

function syncHomeCosmicAnchor(): void {
  const anchor = document.querySelector<HTMLElement>(ANCHOR_SELECTOR);
  const section = document.getElementById(SECTION_ID);
  if (!anchor || !section) return;

  const ar = anchor.getBoundingClientRect();
  const sr = section.getBoundingClientRect();
  const h = ar.height;
  if (h <= 0) return;

  const centerInAnchor = sr.top + sr.height / 2 - ar.top;
  const ty = centerInAnchor - h * EPICENTER_FRAC;
  anchor.style.setProperty("--cosmic-translate-y", `${Math.round(ty * 100) / 100}px`);
}

export function initHomeCosmicAnchor(): void {
  syncHomeCosmicAnchor();

  const onResize = () => {
    syncHomeCosmicAnchor();
  };
  window.addEventListener("resize", onResize, { passive: true });

  const anchor = document.querySelector(ANCHOR_SELECTOR);
  const section = document.getElementById(SECTION_ID);
  if (typeof ResizeObserver !== "undefined") {
    if (anchor) {
      new ResizeObserver(syncHomeCosmicAnchor).observe(anchor);
    }
    if (section) {
      new ResizeObserver(syncHomeCosmicAnchor).observe(section);
    }
  }

  requestAnimationFrame(() => {
    syncHomeCosmicAnchor();
  });
}
