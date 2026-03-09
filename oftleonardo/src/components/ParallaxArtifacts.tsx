import { useEffect, useRef } from "react";

export default function ParallaxArtifacts() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let ticking = false;
    const update = () => {
      wrapper.style.setProperty("--parallax-y", `${window.scrollY}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0 -z-1 hidden overflow-hidden motion-safe:lg:block"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          transform: "translate3d(0, calc(var(--parallax-y, 0px) * -0.06), 0)",
          willChange: "transform",
          backgroundImage: [
            "radial-gradient(circle at 6% 10%, color-mix(in oklab, var(--color-brand) 14%, transparent) 0 3px, transparent 3px)",
            "radial-gradient(circle at 20% 12%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 39% 8%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 58% 15%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 8px, transparent 8px)",
            "radial-gradient(circle at 84% 13%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 12% 45%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 48% 42%, color-mix(in oklab, var(--color-brand) 11%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 72% 49%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 90% 40%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 9px, transparent 9px)",
            "radial-gradient(circle at 8% 80%, color-mix(in oklab, var(--color-brand) 11%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 37% 76%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 66% 86%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 92% 74%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 8px, transparent 8px)",
          ].join(", "),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          transform: "translate3d(0, calc(var(--parallax-y, 0px) * -0.12), 0)",
          willChange: "transform",
          backgroundImage: [
            "linear-gradient(45deg, transparent 49.2%, color-mix(in oklab, var(--color-brand) 10%, transparent) 49.2% 50.8%, transparent 50.8%)",
            "linear-gradient(-45deg, transparent 49.2%, color-mix(in oklab, var(--color-brand) 10%, transparent) 49.2% 50.8%, transparent 50.8%)",
          ].join(", "),
          backgroundSize: "220px 220px, 220px 220px",
          backgroundPosition: "0 0, 0 0",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          opacity: 0.45,
        }}
      />
    </div>
  );
}
