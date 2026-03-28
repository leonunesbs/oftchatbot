const brand = "var(--color-brand)";

function dot(x: number, y: number, r: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0 ${r}px, transparent ${r}px)`;
}

function glow(x: number, y: number, spread: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0%, transparent ${spread}px)`;
}

function ellipseGlow(
  x: number,
  y: number,
  rx: string,
  ry: string,
  opacity: number,
  fadeEnd: string,
) {
  return `radial-gradient(ellipse ${rx} ${ry} at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0%, transparent ${fadeEnd})`;
}

function lineBand(angle: number, opacity: number) {
  return `linear-gradient(${angle}deg, transparent 0%, transparent 43%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 50%, transparent 57%, transparent 100%)`;
}

/** Traço diagonal fino (evita mais círculos/pontos). */
function shard(angle: number, opacity: number) {
  return `linear-gradient(${angle}deg, transparent 0%, transparent 44%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 50%, transparent 56%, transparent 100%)`;
}

function arcWedge(
  x: number,
  y: number,
  fromDeg: number,
  opacity: number,
  spanDeg: number,
) {
  const peak = spanDeg * 0.45;
  return `conic-gradient(from ${fromDeg}deg at ${x}% ${y}%, transparent 0deg, color-mix(in oklab, ${brand} ${opacity}%, transparent) ${peak}deg, transparent ${spanDeg}deg, transparent 360deg)`;
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

/** Fundo distante: faixas, cunhas e elipses alongadas (poucos halos circulares). */
const ARTIFACTS_V1 = [
  lineBand(8, 4),
  lineBand(56, 3),
  lineBand(104, 5),
  lineBand(176, 3),
  lineBand(18, 3),
  lineBand(96, 4),
  lineBand(142, 3),
  lineBand(72, 4),
  lineBand(28, 4),
  lineBand(112, 3),
  lineBand(64, 3),
  shard(38, 3),
  shard(122, 3),
  shard(74, 2),
  shard(168, 2),
  ellipseGlow(50, 55, "42%", "7%", 3, "82%"),
  ellipseGlow(16, 40, "32%", "11%", 5, "78%"),
  ellipseGlow(84, 88, "26%", "14%", 4, "80%"),
  ellipseGlow(24, 32, "28%", "9%", 5, "76%"),
  ellipseGlow(68, 48, "20%", "28%", 5, "80%"),
  ellipseGlow(88, 78, "30%", "12%", 4, "74%"),
  ellipseGlow(8, 68, "14%", "22%", 4, "78%"),
  ellipseGlow(52, 18, "24%", "9%", 5, "74%"),
  ellipseGlow(22, 48, "22%", "9%", 5, "76%"),
  ellipseGlow(74, 36, "26%", "10%", 5, "72%"),
  ellipseGlow(48, 78, "16%", "24%", 4, "78%"),
  arcWedge(72, 44, 250, 3, 48),
  arcWedge(36, 12, 20, 3, 44),
  arcWedge(40, 28, 135, 3, 44),
  arcWedge(18, 82, 285, 3, 40),
  arcWedge(84, 16, 15, 3, 36),
  arcWedge(44, 22, 120, 3, 42),
  arcWedge(12, 70, 300, 3, 38),
  glow(48, 50, 130, 3),
  glow(50, 42, 100, 4),
  glow(30, 75, 110, 3),
].join(", ");

/** Textura média: traços e faixas; poucos pontos de destaque. */
const ARTIFACTS_V2 = [
  lineBand(12, 4),
  lineBand(88, 3),
  lineBand(134, 4),
  lineBand(44, 3),
  lineBand(162, 4),
  shard(22, 4),
  shard(58, 3),
  shard(96, 3),
  shard(142, 4),
  shard(188, 3),
  shard(6, 3),
  shard(74, 4),
  arcWedge(30, 40, 95, 3, 40),
  arcWedge(70, 62, 200, 3, 36),
  arcWedge(48, 18, 310, 2, 32),
  ellipseGlow(20, 55, "18%", "14%", 4, "72%"),
  ellipseGlow(82, 38, "24%", "10%", 4, "70%"),
  dot(8, 12, 3, 14),
  dot(42, 10, 4, 13),
  dot(65, 18, 6, 12),
  dot(14, 52, 6, 12),
  dot(76, 54, 5, 12),
  dot(34, 68, 4, 11),
  dot(90, 62, 4, 12),
  dot(18, 8, 4, 13),
  dot(54, 22, 5, 12),
  dot(38, 58, 4, 12),
  dot(62, 94, 3, 11),
  dot(44, 96, 4, 12),
  dot(56, 60, 5, 12),
  dot(24, 68, 6, 12),
  dot(56, 44, 3, 12),
  dot(32, 8, 4, 12),
  dot(8, 78, 4, 11),
  dot(36, 38, 5, 12),
].join(", ");

/** Meio-termo: poucos anéis; traços, cunhas e elipses. */
const ARTIFACTS_V3 = [
  ring(50, 8, 4, 6, 11),
  ring(24, 64, 4, 6, 10),
  ring(82, 68, 3.5, 5.5, 10),
  ring(14, 8, 3, 5, 10),
  lineBand(32, 4),
  lineBand(118, 4),
  lineBand(76, 3),
  lineBand(148, 4),
  lineBand(8, 3),
  shard(14, 4),
  shard(46, 4),
  shard(102, 3),
  shard(166, 4),
  shard(52, 3),
  shard(128, 4),
  ellipseGlow(40, 48, "18%", "16%", 5, "70%"),
  ellipseGlow(72, 22, "22%", "9%", 5, "68%"),
  ellipseGlow(18, 78, "14%", "20%", 4, "74%"),
  arcWedge(56, 58, 45, 3, 38),
  arcWedge(50, 50, 60, 3, 42),
  arcWedge(28, 92, 200, 3, 38),
  arcWedge(34, 36, 175, 3, 36),
  sparkle(12, 18, 17),
  sparkle(48, 14, 16),
  sparkle(74, 40, 17),
  sparkle(30, 56, 16),
  sparkle(88, 82, 17),
  sparkle(52, 22, 16),
  sparkle(18, 48, 16),
  sparkle(42, 58, 17),
  sparkle(68, 44, 16),
  sparkle(26, 34, 17),
  sparkle(84, 34, 16),
  shard(26, 3),
  shard(60, 3),
  shard(92, 3),
  shard(8, 3),
].join(", ");

/** Camada rápida intermediária: traços e elipses; poucos pontos grandes. */
const ARTIFACTS_V4 = [
  lineBand(24, 4),
  lineBand(108, 4),
  lineBand(156, 3),
  lineBand(84, 4),
  shard(18, 4),
  shard(54, 4),
  shard(90, 3),
  shard(132, 4),
  shard(174, 3),
  shard(4, 4),
  ellipseGlow(20, 70, "18%", "24%", 5, "76%"),
  ellipseGlow(80, 24, "22%", "11%", 5, "70%"),
  ellipseGlow(48, 44, "24%", "10%", 5, "74%"),
  ellipseGlow(12, 56, "20%", "10%", 4, "72%"),
  arcWedge(60, 72, 175, 3, 36),
  arcWedge(78, 20, 210, 3, 34),
  arcWedge(44, 52, 125, 3, 32),
  glow(52, 78, 62, 6),
  glow(18, 38, 58, 5),
  glow(88, 66, 64, 5),
  dot(58, 32, 9, 10),
  dot(20, 74, 8, 9),
  dot(86, 78, 8, 9),
  dot(24, 8, 6, 9),
  dot(8, 88, 8, 9),
  dot(48, 42, 6, 9),
  dot(16, 36, 6, 9),
  dot(38, 64, 7, 9),
  dot(18, 72, 7, 9),
  dot(46, 18, 6, 9),
  dot(64, 54, 7, 9),
].join(", ");

/** Primeiro plano: traços cruzados + brilhos pontuais (scroll mais rápido). */
const ARTIFACTS_V5 = [
  shard(10, 4),
  shard(34, 4),
  shard(58, 3),
  shard(82, 4),
  shard(6, 3),
  shard(118, 4),
  shard(142, 3),
  shard(168, 4),
  shard(194, 3),
  shard(26, 4),
  shard(50, 3),
  shard(96, 4),
  lineBand(40, 3),
  lineBand(152, 4),
  lineBand(88, 3),
  sparkle(5, 8, 15),
  sparkle(32, 12, 16),
  sparkle(60, 6, 15),
  sparkle(88, 16, 16),
  sparkle(28, 52, 15),
  sparkle(56, 66, 16),
  sparkle(16, 68, 15),
  sparkle(84, 94, 16),
  sparkle(2, 32, 15),
  sparkle(54, 18, 16),
  sparkle(30, 96, 15),
  sparkle(72, 34, 16),
  sparkle(22, 38, 15),
  sparkle(66, 42, 16),
  sparkle(14, 62, 15),
  sparkle(40, 84, 16),
  sparkle(76, 90, 15),
  arcWedge(48, 44, 88, 3, 28),
  arcWedge(22, 78, 220, 3, 26),
].join(", ");

export default function ParallaxArtifacts() {
  return (
    <div
      className="parallax-artifacts pointer-events-none absolute inset-0 -z-1 block overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="parallax-layer parallax-layer--v1 absolute inset-0"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: ARTIFACTS_V1,
          maskImage: MASK_INNER,
        }}
      />
      <div
        className="parallax-layer parallax-layer--v2 absolute inset-0"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: ARTIFACTS_V2,
          maskImage: MASK_DEFAULT,
        }}
      />
      <div
        className="parallax-layer parallax-layer--v3 absolute inset-0"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: ARTIFACTS_V3,
          maskImage: MASK_DEFAULT,
        }}
      />
      <div
        className="parallax-layer parallax-layer--v4 absolute inset-0"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: ARTIFACTS_V4,
          maskImage: MASK_DEFAULT,
        }}
      />
      <div
        className="parallax-layer parallax-layer--v5 absolute inset-0"
        style={{
          transform: "translate3d(0, 0, 0)",
          backgroundImage: ARTIFACTS_V5,
          maskImage: MASK_DEFAULT,
        }}
      />
    </div>
  );
}
