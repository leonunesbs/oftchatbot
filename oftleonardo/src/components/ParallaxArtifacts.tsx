const brand = "var(--color-brand)";

function lineBand(angle: number, opacity: number) {
  return `linear-gradient(${angle}deg, transparent 0%, transparent 43%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 50%, transparent 57%, transparent 100%)`;
}

function shard(angle: number, opacity: number) {
  return `linear-gradient(${angle}deg, transparent 0%, transparent 44%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 50%, transparent 56%, transparent 100%)`;
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

function glow(x: number, y: number, spread: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0%, transparent ${spread}px)`;
}

function dot(x: number, y: number, r: number, opacity: number) {
  return `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${brand} ${opacity}%, transparent) 0 ${r}px, transparent ${r}px)`;
}

const MASK_DEFAULT =
  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)";
const MASK_INNER =
  "linear-gradient(to bottom, transparent 2%, black 18%, black 84%, transparent 98%)";

/** Fundo distante: poucas camadas, textura leve (desktop — movimento aplicado em `home-scroll-depth.ts`). */
const ARTIFACTS_V1 = [
  lineBand(8, 4),
  lineBand(56, 3),
  lineBand(104, 5),
  lineBand(176, 3),
  lineBand(18, 3),
  lineBand(96, 4),
  shard(38, 3),
  shard(122, 3),
  ellipseGlow(50, 55, "42%", "7%", 3, "82%"),
  ellipseGlow(16, 40, "32%", "11%", 5, "78%"),
  ellipseGlow(84, 88, "26%", "14%", 4, "80%"),
  arcWedge(72, 44, 250, 3, 48),
  arcWedge(36, 12, 20, 3, 44),
  arcWedge(40, 28, 135, 3, 44),
  glow(48, 50, 130, 3),
  glow(50, 42, 100, 4),
].join(", ");

const ARTIFACTS_V2 = [
  lineBand(12, 4),
  lineBand(88, 3),
  lineBand(134, 4),
  shard(22, 4),
  shard(96, 3),
  arcWedge(30, 40, 95, 3, 40),
  arcWedge(70, 62, 200, 3, 36),
  ellipseGlow(20, 55, "18%", "14%", 4, "72%"),
  ellipseGlow(82, 38, "24%", "10%", 4, "70%"),
  dot(8, 12, 3, 14),
  dot(65, 18, 6, 12),
  dot(76, 54, 5, 12),
  dot(34, 68, 4, 11),
  dot(54, 22, 5, 12),
].join(", ");

/** Duas camadas estáticas; transformações são atualizadas no scroll via JS (um único listener + rAF). */
export default function ParallaxArtifacts() {
  return (
    <div
      className="parallax-artifacts pointer-events-none absolute inset-0 -z-[1] hidden overflow-hidden md:block"
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
    </div>
  );
}
