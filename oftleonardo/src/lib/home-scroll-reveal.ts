/**
 * Revelações da home com IntersectionObserver + animação CSS única (sem scroll-timeline).
 * Evita flicker da combinação view() + classe de “sync” e reduz trabalho na rolagem.
 */
const REVEAL_SELECTOR =
  ".scroll-reveal, .scroll-card-motion, .scroll-card-diagonal-left, .scroll-card-diagonal-right";

const PENDING = "home-reveal-pending";
const ACTIVE = "home-reveal-active";
const INSTANT = "home-reveal-instant";

function alreadyInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const topBound = vh * 0.06;
  const bottomBound = vh * 0.94;
  return r.bottom > topBound && r.top < bottomBound;
}

function reveal(el: Element, instant: boolean): void {
  el.classList.remove(PENDING);
  el.classList.add(ACTIVE);
  if (instant) el.classList.add(INSTANT);
}

export function initHomeScrollReveal(): void {
  const nodes = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
  if (nodes.length === 0) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const el of nodes) {
      reveal(el, true);
    }
    return;
  }

  const toObserve: HTMLElement[] = [];

  for (const el of nodes) {
    if (alreadyInView(el)) {
      reveal(el, true);
    } else {
      el.classList.add(PENDING);
      toObserve.push(el);
    }
  }

  if (toObserve.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const t = entry.target as HTMLElement;
        reveal(t, false);
        io.unobserve(t);
      }
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0,
    },
  );

  for (const el of toObserve) {
    io.observe(el);
  }
}
