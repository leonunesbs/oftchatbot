export default function ParallaxArtifacts() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-1 block overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 lg:hidden"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 14% 12%, color-mix(in oklab, var(--color-brand) 11%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 42% 20%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 78% 16%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 24% 68%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 72% 74%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(ellipse at 50% 42%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0%, transparent 62%)",
          ].join(", "),
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
          opacity: 0.36,
        }}
      />
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 lg:hidden"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 10% 34%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 30% 22%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 58% 30%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 8px, transparent 8px)",
            "radial-gradient(circle at 82% 24%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 18% 72%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 48% 70%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 84% 78%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 7px, transparent 7px)",
          ].join(", "),
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          opacity: 0.32,
        }}
      />
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 8% 12%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0 3px, transparent 3px)",
            "radial-gradient(circle at 22% 16%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 42% 10%, color-mix(in oklab, var(--color-brand) 11%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 65% 18%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 88% 14%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 14% 52%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 46% 46%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 76% 54%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 26% 82%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 70% 84%, color-mix(in oklab, var(--color-brand) 11%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 58% 76%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 90% 62%, color-mix(in oklab, var(--color-brand) 10%, transparent) 0 4px, transparent 4px)",
          ].join(", "),
        }}
      />
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 6% 30%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 28% 40%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 52% 28%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 74% 42%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 92% 34%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 18% 88%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 4px, transparent 4px)",
            "radial-gradient(circle at 48% 82%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 5px, transparent 5px)",
            "radial-gradient(circle at 80% 86%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 4px, transparent 4px)",
          ].join(", "),
          maskImage:
            "linear-gradient(to bottom, transparent 2%, black 18%, black 84%, transparent 98%)",
          opacity: 0.26,
        }}
      />
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 12% 30%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 8px, transparent 8px)",
            "radial-gradient(circle at 34% 24%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 58% 32%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 9px, transparent 9px)",
            "radial-gradient(circle at 84% 26%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 20% 74%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 8px, transparent 8px)",
            "radial-gradient(circle at 52% 70%, color-mix(in oklab, var(--color-brand) 8%, transparent) 0 6px, transparent 6px)",
            "radial-gradient(circle at 86% 78%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 8px, transparent 8px)",
          ].join(", "),
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%",
          backgroundPosition: "center, center, center, center, center, center, center",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          opacity: 0.36,
        }}
      />
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            "radial-gradient(circle at 8% 62%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 9px, transparent 9px)",
            "radial-gradient(circle at 26% 56%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 44% 64%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 8px, transparent 8px)",
            "radial-gradient(circle at 66% 58%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 7px, transparent 7px)",
            "radial-gradient(circle at 88% 66%, color-mix(in oklab, var(--color-brand) 7%, transparent) 0 9px, transparent 9px)",
          ].join(", "),
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          opacity: 0.28,
        }}
      />
    </div>
  );
}
