export const CREDIT_CARD_WIDTH_MM = 85.6;
export const CREDIT_CARD_HEIGHT_MM = 53.98;
export const CREDIT_CARD_ASPECT_RATIO =
  CREDIT_CARD_WIDTH_MM / CREDIT_CARD_HEIGHT_MM;

export const DEFAULT_DISTANCE_M = 0.5;

export const AVAILABLE_DISTANCES = [
  { meters: 0.3, label: "30 cm" },
  { meters: 0.5, label: "50 cm" },
  { meters: 0.7, label: "70 cm" },
] as const;

export type TestDistance = (typeof AVAILABLE_DISTANCES)[number];

export const DISTANCE_STORAGE_KEY = "va-distance";

export const ACUITY_LEVELS = [
  { snellen: "20/200", denominator: 200 },
  { snellen: "20/100", denominator: 100 },
  { snellen: "20/80", denominator: 80 },
  { snellen: "20/60", denominator: 60 },
  { snellen: "20/40", denominator: 40 },
  { snellen: "20/30", denominator: 30 },
  { snellen: "20/25", denominator: 25 },
  { snellen: "20/20", denominator: 20 },
  { snellen: "20/15", denominator: 15 },
] as const;

export type AcuityLevel = (typeof ACUITY_LEVELS)[number];

const ARC_MINUTE_TO_RAD = Math.PI / (180 * 60);
const STROKES_PER_OPTOTYPE = 5;

/**
 * Optotype total height in mm per Messias et al. (2010):
 *   y = d × tan(5 × MAR)
 * where MAR (minimum angle of resolution) = denominator / 20 arcminutes.
 * The optotype subtends 5 × MAR arcminutes (5-stroke grid).
 */
export function optotypeHeightMm(
  denominator: number,
  distanceM: number = DEFAULT_DISTANCE_M,
): number {
  const mar = denominator / 20;
  return distanceM * 1000 * Math.tan(STROKES_PER_OPTOTYPE * mar * ARC_MINUTE_TO_RAD);
}

export function optotypeHeightPx(
  denominator: number,
  pxPerMm: number,
  distanceM: number = DEFAULT_DISTANCE_M,
): number {
  return optotypeHeightMm(denominator, distanceM) * pxPerMm;
}

export type OptotypeMode = "tumbling-e" | "snellen-letters";

export type Orientation = "right" | "left" | "up" | "down";

const ORIENTATIONS: Orientation[] = ["right", "left", "up", "down"];

export function randomOrientation(): Orientation {
  return ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)];
}

export function generateOrientations(count: number): Orientation[] {
  return Array.from({ length: count }, () => randomOrientation());
}

const SLOAN_LETTERS = ["C", "D", "E", "F", "L", "N", "O", "P", "R", "T", "Z"];

export function generateLetters(count: number): string[] {
  const pool = [...SLOAN_LETTERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeSeededRng(seedKey: string): () => number {
  let state = hashSeed(seedKey) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function generateSeededOrientations(count: number, seedKey: string): Orientation[] {
  const rng = makeSeededRng(seedKey);
  return Array.from({ length: count }, () => ORIENTATIONS[Math.floor(rng() * ORIENTATIONS.length)]);
}

export function generateSeededLetters(count: number, seedKey: string): string[] {
  const rng = makeSeededRng(seedKey);
  const pool = [...SLOAN_LETTERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export const LOCALSTORAGE_KEY = "va-calibration";
export const SLIDER_POSITION_KEY = "va-slider-position";

export interface CalibrationData {
  pxPerMm: number;
  calibratedAt: string;
}
