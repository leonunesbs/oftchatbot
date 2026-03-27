const brand = "var(--color-brand)";

function dot(x: number, y: number, r: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0 ${r}px, transparent ${r}px)`;
}

function glow(x: number, y: number, spread: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0%, transparent ${spread}px)`;
}

function ring(
  x: number,
  y: number,
  innerR: number,
  outerR: number,
  opacity: number,
) {
  return `radial-gradient(circle at ${x}% ${y}%, transparent 0 ${innerR}px, color-mix(in oklab, ${brand} ${opacity}%, transparent) ${innerR}px ${outerR}px, transparent ${outerR}px)`;
}

function sparkle(x: number, y: number, opacity: number) {
  return dot(x, y, 1.5, opacity);
}

const MASK_DEFAULT =
  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)";
const MASK_INNER =
  "linear-gradient(to bottom, transparent 2%, black 18%, black 84%, transparent 98%)";

export default function ParallaxArtifacts() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-1 block overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Mobile: slow layer — dots + soft glows ── */}
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 lg:hidden"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            dot(14, 12, 4, 11),
            dot(42, 20, 6, 10),
            dot(78, 16, 5, 10),
            dot(24, 68, 6, 9),
            dot(72, 74, 5, 10),
            dot(56, 44, 3, 10),
            dot(90, 50, 4, 9),
            dot(6, 46, 5, 8),
            dot(32, 8, 4, 10),
            dot(62, 52, 5, 9),
            dot(8, 78, 4, 9),
            dot(94, 36, 3, 10),
            glow(50, 42, 80, 5),
            glow(18, 28, 50, 4),
            glow(80, 70, 60, 4),
            glow(38, 88, 65, 4),
            glow(4, 22, 55, 3),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.4,
        }}
      />

      {/* ── Mobile: medium layer — rings + sparkles ── */}
      <div
        className="parallax-layer parallax-layer--medium absolute inset-0 lg:hidden"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            ring(20, 30, 4, 6, 9),
            ring(64, 22, 3, 5, 8),
            ring(80, 60, 5, 7, 8),
            ring(36, 76, 3, 5, 9),
            ring(8, 52, 3, 5, 8),
            ring(50, 8, 4, 6, 9),
            sparkle(12, 18, 16),
            sparkle(48, 14, 14),
            sparkle(74, 40, 15),
            sparkle(30, 56, 14),
            sparkle(88, 82, 15),
            sparkle(54, 64, 14),
            sparkle(22, 8, 15),
            sparkle(96, 58, 14),
            sparkle(40, 92, 15),
            sparkle(66, 30, 14),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.38,
        }}
      />

      {/* ── Mobile: fast layer — dots + sparkles ── */}
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 lg:hidden"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            dot(10, 34, 7, 8),
            dot(30, 22, 5, 8),
            dot(58, 30, 8, 8),
            dot(82, 24, 6, 7),
            dot(18, 72, 7, 8),
            dot(48, 70, 5, 8),
            dot(84, 78, 7, 8),
            dot(4, 12, 6, 7),
            dot(70, 6, 5, 8),
            dot(94, 44, 6, 7),
            sparkle(22, 48, 13),
            sparkle(66, 16, 12),
            sparkle(40, 84, 13),
            sparkle(92, 56, 12),
            sparkle(14, 62, 13),
            sparkle(52, 38, 12),
            sparkle(76, 90, 13),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.36,
        }}
      />

      {/* ── Desktop: slow layer 1 — scattered dots ── */}
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            dot(8, 12, 3, 12),
            dot(22, 16, 5, 10),
            dot(42, 10, 4, 11),
            dot(65, 18, 6, 9),
            dot(88, 14, 4, 10),
            dot(14, 52, 6, 9),
            dot(46, 46, 4, 10),
            dot(76, 54, 5, 9),
            dot(26, 82, 5, 10),
            dot(70, 84, 4, 11),
            dot(34, 68, 4, 9),
            dot(58, 76, 6, 9),
            dot(90, 62, 4, 10),
            dot(4, 36, 3, 10),
            dot(52, 32, 4, 9),
            dot(96, 40, 3, 10),
            dot(18, 8, 4, 11),
            dot(54, 22, 5, 10),
            dot(78, 8, 3, 10),
            dot(12, 66, 5, 9),
            dot(38, 58, 4, 10),
            dot(82, 46, 5, 9),
            dot(6, 92, 4, 10),
            dot(62, 94, 3, 10),
          ].join(", "),
        }}
      />

      {/* ── Desktop: slow layer 2 — soft ambient glows ── */}
      <div
        className="parallax-layer parallax-layer--slow absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            glow(15, 20, 90, 5),
            glow(50, 42, 110, 4),
            glow(85, 30, 80, 4),
            glow(30, 75, 100, 4),
            glow(72, 80, 90, 5),
            glow(8, 60, 70, 3),
            glow(92, 70, 70, 3),
            glow(38, 12, 75, 4),
            glow(64, 58, 95, 4),
            glow(22, 88, 85, 4),
            glow(96, 24, 65, 3),
          ].join(", "),
          maskImage: MASK_INNER,
          opacity: 0.28,
        }}
      />

      {/* ── Desktop: medium layer — rings + sparkles ── */}
      <div
        className="parallax-layer parallax-layer--medium absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            ring(12, 24, 4, 6.5, 9),
            ring(38, 18, 3, 5, 8),
            ring(62, 36, 5, 7.5, 8),
            ring(86, 22, 3.5, 5.5, 9),
            ring(24, 64, 4, 6, 8),
            ring(56, 72, 5, 7, 8),
            ring(82, 68, 3.5, 5.5, 9),
            ring(44, 52, 3, 5, 7),
            ring(6, 40, 3, 5, 8),
            ring(70, 8, 4, 6, 9),
            ring(92, 46, 3.5, 5.5, 8),
            sparkle(8, 16, 16),
            sparkle(30, 10, 14),
            sparkle(52, 22, 15),
            sparkle(76, 14, 14),
            sparkle(94, 28, 15),
            sparkle(18, 48, 14),
            sparkle(42, 58, 15),
            sparkle(68, 44, 14),
            sparkle(90, 52, 15),
            sparkle(14, 78, 14),
            sparkle(48, 86, 15),
            sparkle(74, 90, 14),
            sparkle(26, 34, 15),
            sparkle(58, 12, 14),
            sparkle(84, 34, 15),
            sparkle(4, 70, 14),
            sparkle(96, 76, 15),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.36,
        }}
      />

      {/* ── Desktop: fast layer 1 — dots ── */}
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            dot(12, 30, 8, 7),
            dot(34, 24, 6, 7),
            dot(58, 32, 9, 8),
            dot(84, 26, 6, 7),
            dot(20, 74, 8, 7),
            dot(52, 70, 6, 8),
            dot(86, 78, 8, 7),
            dot(6, 50, 7, 7),
            dot(42, 56, 5, 7),
            dot(72, 48, 7, 7),
            dot(96, 58, 6, 7),
            dot(24, 8, 6, 8),
            dot(70, 18, 7, 7),
            dot(8, 88, 8, 7),
            dot(48, 42, 6, 8),
            dot(90, 92, 7, 7),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.42,
        }}
      />

      {/* ── Desktop: fast layer 2 — dense sparkle field ── */}
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            sparkle(5, 8, 13),
            sparkle(18, 20, 12),
            sparkle(32, 12, 14),
            sparkle(46, 28, 12),
            sparkle(60, 6, 13),
            sparkle(74, 22, 12),
            sparkle(88, 16, 14),
            sparkle(10, 44, 12),
            sparkle(28, 52, 13),
            sparkle(50, 40, 12),
            sparkle(70, 56, 14),
            sparkle(92, 48, 12),
            sparkle(16, 68, 13),
            sparkle(36, 80, 12),
            sparkle(56, 66, 14),
            sparkle(78, 76, 12),
            sparkle(94, 84, 13),
            sparkle(24, 92, 12),
            sparkle(64, 88, 14),
            sparkle(84, 94, 12),
            sparkle(2, 32, 13),
            sparkle(40, 2, 12),
            sparkle(98, 38, 14),
            sparkle(12, 58, 13),
            sparkle(54, 18, 12),
            sparkle(82, 62, 14),
            sparkle(30, 96, 13),
            sparkle(66, 42, 12),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.34,
        }}
      />

      {/* ── Desktop: fast layer 3 — mid-page glow patches ── */}
      <div
        className="parallax-layer parallax-layer--fast absolute inset-0 hidden lg:block"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: [
            glow(8, 62, 60, 5),
            glow(26, 56, 50, 4),
            glow(44, 64, 55, 5),
            glow(66, 58, 50, 4),
            glow(88, 66, 60, 5),
            glow(18, 38, 55, 4),
            glow(52, 78, 58, 5),
            glow(76, 34, 52, 4),
            glow(34, 18, 48, 4),
          ].join(", "),
          maskImage: MASK_DEFAULT,
          opacity: 0.3,
        }}
      />
    </div>
  );
}
