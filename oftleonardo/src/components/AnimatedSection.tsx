import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  mode?: "scroll" | "once" | "none";
}

const directionOffset = {
  up: { x: 0, y: 10 },
  down: { x: 0, y: -10 },
  left: { x: 10, y: 0 },
  right: { x: -10, y: 0 },
};

export default function AnimatedSection({
  children,
  delay = 0,
  className,
  direction = "up",
  mode = "scroll",
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const offset = directionOffset[direction];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setShouldReduceMotion(mediaQuery.matches);
    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (shouldReduceMotion) {
      node.style.opacity = "1";
      node.style.transform = "none";
      return;
    }

    if (mode === "none") {
      node.style.opacity = "1";
      node.style.transform = "none";
      node.style.transition = "none";
      return;
    }

    if (mode === "once") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          node.style.opacity = "1";
          node.style.transform = "translate3d(0, 0, 0) scale(1)";
          observer.disconnect();
        },
        {
          rootMargin: "0px 0px -60px 0px",
        },
      );

      node.style.opacity = "0";
      node.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0) scale(0.985)`;
      node.style.transitionProperty = "opacity, transform";
      node.style.transitionDuration = "0.6s";
      node.style.transitionTimingFunction = "cubic-bezier(0.16, 1, 0.3, 1)";
      node.style.transitionDelay = `${delay}s`;
      node.style.willChange = "opacity, transform";

      observer.observe(node);
      return () => observer.disconnect();
    }

    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    let rafId = 0;

    const applyProgress = (progress: number) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      const x = offset.x * (1 - eased);
      const y = offset.y * (1 - eased);
      const scale = 0.985 + eased * 0.015;

      node.style.opacity = eased.toFixed(3);
      node.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
        `scale(${scale.toFixed(4)})`;
    };

    const getProgress = () => {
      const viewportHeight = window.innerHeight || 1;
      const rect = node.getBoundingClientRect();
      const start = viewportHeight * 0.9;
      const end = viewportHeight * 0.25;
      const raw = (start - rect.top) / (start - end);
      const delayed = raw - delay * 0.45;
      return clamp(delayed);
    };

    const update = () => {
      rafId = 0;
      applyProgress(getProgress());
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    const onScroll = () => requestUpdate();
    const onResize = () => requestUpdate();

    applyProgress(getProgress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [delay, mode, offset.x, offset.y, shouldReduceMotion]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={
        shouldReduceMotion
          ? undefined
          : {
              opacity: 0,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(0.985)`,
              transitionProperty: "opacity, transform",
              transitionDuration: "0.35s",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "opacity, transform",
            }
      }
    >
      {children}
    </div>
  );
}
