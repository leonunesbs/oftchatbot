import { useEffect, useRef } from "react";

interface Artifact {
  shape: "circle" | "ring" | "dot" | "cross";
  size: number;
  x: string;
  y: string;
  speed: number;
  opacity: number;
  rotate?: number;
}

const artifacts: Artifact[] = [
  // Zone 1 (0–8%) — Hero top
  { shape: "cross", size: 9, x: "3%", y: "2%", speed: -0.28, opacity: 0.12, rotate: 20 },
  { shape: "ring", size: 14, x: "12%", y: "5%", speed: -0.2, opacity: 0.09 },
  { shape: "cross", size: 7, x: "22%", y: "1%", speed: -0.24, opacity: 0.11, rotate: -35 },
  { shape: "dot", size: 3, x: "30%", y: "7%", speed: -0.17, opacity: 0.14 },
  { shape: "cross", size: 6, x: "40%", y: "3%", speed: -0.22, opacity: 0.1, rotate: 55 },
  { shape: "ring", size: 10, x: "50%", y: "6%", speed: -0.19, opacity: 0.08 },
  { shape: "cross", size: 8, x: "60%", y: "1%", speed: -0.26, opacity: 0.11, rotate: -15 },
  { shape: "dot", size: 4, x: "68%", y: "5%", speed: -0.18, opacity: 0.13 },
  { shape: "cross", size: 5, x: "76%", y: "8%", speed: -0.21, opacity: 0.1, rotate: 70 },
  { shape: "ring", size: 12, x: "85%", y: "2%", speed: -0.25, opacity: 0.09 },
  { shape: "cross", size: 7, x: "93%", y: "6%", speed: -0.16, opacity: 0.12, rotate: -50 },
  { shape: "circle", size: 4, x: "17%", y: "8%", speed: -0.23, opacity: 0.11 },

  // Zone 2 (8–16%) — Hero mid
  { shape: "cross", size: 8, x: "2%", y: "10%", speed: -0.19, opacity: 0.11, rotate: 30 },
  { shape: "ring", size: 16, x: "10%", y: "14%", speed: -0.23, opacity: 0.09 },
  { shape: "cross", size: 6, x: "20%", y: "9%", speed: -0.21, opacity: 0.1, rotate: -40 },
  { shape: "dot", size: 3, x: "28%", y: "15%", speed: -0.16, opacity: 0.14 },
  { shape: "cross", size: 7, x: "38%", y: "11%", speed: -0.24, opacity: 0.11, rotate: 65 },
  { shape: "circle", size: 4, x: "46%", y: "13%", speed: -0.17, opacity: 0.12 },
  { shape: "cross", size: 5, x: "55%", y: "16%", speed: -0.22, opacity: 0.1, rotate: -20 },
  { shape: "ring", size: 10, x: "64%", y: "10%", speed: -0.25, opacity: 0.08 },
  { shape: "cross", size: 8, x: "73%", y: "14%", speed: -0.18, opacity: 0.12, rotate: 45 },
  { shape: "dot", size: 4, x: "82%", y: "12%", speed: -0.2, opacity: 0.13 },
  { shape: "cross", size: 6, x: "90%", y: "9%", speed: -0.26, opacity: 0.1, rotate: -60 },
  { shape: "ring", size: 12, x: "96%", y: "15%", speed: -0.19, opacity: 0.09 },

  // Zone 3 (16–24%)
  { shape: "ring", size: 20, x: "86%", y: "18%", speed: -0.19, opacity: 0.1 },
  { shape: "circle", size: 5, x: "16%", y: "20%", speed: -0.17, opacity: 0.13 },
  { shape: "cross", size: 8, x: "26%", y: "22%", speed: -0.21, opacity: 0.09, rotate: -35 },
  { shape: "ring", size: 12, x: "36%", y: "19%", speed: -0.23, opacity: 0.08 },
  { shape: "dot", size: 3, x: "46%", y: "23%", speed: -0.16, opacity: 0.15 },
  { shape: "circle", size: 4, x: "56%", y: "17%", speed: -0.2, opacity: 0.11 },
  { shape: "cross", size: 6, x: "66%", y: "21%", speed: -0.25, opacity: 0.1, rotate: 60 },
  { shape: "dot", size: 3, x: "76%", y: "24%", speed: -0.18, opacity: 0.14 },
  { shape: "ring", size: 10, x: "6%", y: "23%", speed: -0.24, opacity: 0.09 },
  { shape: "circle", size: 3, x: "96%", y: "20%", speed: -0.22, opacity: 0.12 },
  { shape: "dot", size: 4, x: "40%", y: "18%", speed: -0.19, opacity: 0.13 },
  { shape: "cross", size: 5, x: "8%", y: "17%", speed: -0.26, opacity: 0.1, rotate: -15 },

  // Zone 4 (24–32%)
  { shape: "ring", size: 16, x: "3%", y: "26%", speed: -0.26, opacity: 0.09 },
  { shape: "circle", size: 5, x: "13%", y: "29%", speed: -0.19, opacity: 0.12 },
  { shape: "dot", size: 3, x: "23%", y: "31%", speed: -0.24, opacity: 0.13 },
  { shape: "ring", size: 14, x: "33%", y: "27%", speed: -0.2, opacity: 0.09 },
  { shape: "cross", size: 7, x: "43%", y: "30%", speed: -0.17, opacity: 0.1, rotate: 20 },
  { shape: "circle", size: 3, x: "53%", y: "25%", speed: -0.22, opacity: 0.12 },
  { shape: "ring", size: 10, x: "63%", y: "28%", speed: -0.21, opacity: 0.08 },
  { shape: "dot", size: 4, x: "73%", y: "32%", speed: -0.16, opacity: 0.15 },
  { shape: "cross", size: 6, x: "83%", y: "26%", speed: -0.25, opacity: 0.1, rotate: -40 },
  { shape: "circle", size: 4, x: "93%", y: "30%", speed: -0.18, opacity: 0.11 },
  { shape: "dot", size: 3, x: "48%", y: "32%", speed: -0.23, opacity: 0.14 },
  { shape: "ring", size: 12, x: "18%", y: "25%", speed: -0.2, opacity: 0.09 },

  // Zone 5 (32–40%)
  { shape: "ring", size: 18, x: "88%", y: "34%", speed: -0.21, opacity: 0.09 },
  { shape: "cross", size: 7, x: "8%", y: "37%", speed: -0.17, opacity: 0.1, rotate: 55 },
  { shape: "dot", size: 4, x: "18%", y: "39%", speed: -0.24, opacity: 0.13 },
  { shape: "circle", size: 5, x: "28%", y: "35%", speed: -0.18, opacity: 0.11 },
  { shape: "ring", size: 12, x: "38%", y: "33%", speed: -0.26, opacity: 0.08 },
  { shape: "cross", size: 6, x: "48%", y: "38%", speed: -0.2, opacity: 0.1, rotate: -15 },
  { shape: "dot", size: 3, x: "58%", y: "36%", speed: -0.19, opacity: 0.14 },
  { shape: "circle", size: 3, x: "68%", y: "40%", speed: -0.23, opacity: 0.12 },
  { shape: "ring", size: 14, x: "78%", y: "34%", speed: -0.16, opacity: 0.09 },
  { shape: "dot", size: 3, x: "98%", y: "37%", speed: -0.22, opacity: 0.15 },
  { shape: "cross", size: 5, x: "55%", y: "33%", speed: -0.25, opacity: 0.1, rotate: 30 },
  { shape: "circle", size: 4, x: "3%", y: "40%", speed: -0.17, opacity: 0.12 },

  // Zone 6 (40–48%)
  { shape: "ring", size: 16, x: "10%", y: "42%", speed: -0.25, opacity: 0.09 },
  { shape: "cross", size: 8, x: "20%", y: "45%", speed: -0.2, opacity: 0.1, rotate: 30 },
  { shape: "circle", size: 5, x: "30%", y: "47%", speed: -0.22, opacity: 0.11 },
  { shape: "dot", size: 3, x: "40%", y: "43%", speed: -0.16, opacity: 0.14 },
  { shape: "ring", size: 10, x: "50%", y: "41%", speed: -0.23, opacity: 0.08 },
  { shape: "cross", size: 6, x: "60%", y: "46%", speed: -0.19, opacity: 0.1, rotate: -40 },
  { shape: "dot", size: 4, x: "70%", y: "44%", speed: -0.21, opacity: 0.15 },
  { shape: "circle", size: 4, x: "80%", y: "48%", speed: -0.17, opacity: 0.12 },
  { shape: "ring", size: 14, x: "90%", y: "42%", speed: -0.24, opacity: 0.09 },
  { shape: "dot", size: 3, x: "5%", y: "46%", speed: -0.18, opacity: 0.13 },
  { shape: "cross", size: 5, x: "35%", y: "41%", speed: -0.26, opacity: 0.1, rotate: 80 },
  { shape: "circle", size: 3, x: "75%", y: "47%", speed: -0.2, opacity: 0.11 },

  // Zone 7 (48–56%)
  { shape: "ring", size: 14, x: "12%", y: "50%", speed: -0.22, opacity: 0.09 },
  { shape: "dot", size: 3, x: "22%", y: "53%", speed: -0.16, opacity: 0.14 },
  { shape: "circle", size: 5, x: "32%", y: "55%", speed: -0.23, opacity: 0.11 },
  { shape: "cross", size: 7, x: "42%", y: "51%", speed: -0.2, opacity: 0.1, rotate: 70 },
  { shape: "ring", size: 18, x: "52%", y: "49%", speed: -0.25, opacity: 0.08 },
  { shape: "dot", size: 4, x: "62%", y: "54%", speed: -0.18, opacity: 0.15 },
  { shape: "cross", size: 6, x: "72%", y: "56%", speed: -0.21, opacity: 0.09, rotate: -60 },
  { shape: "circle", size: 4, x: "82%", y: "52%", speed: -0.17, opacity: 0.13 },
  { shape: "ring", size: 10, x: "92%", y: "50%", speed: -0.24, opacity: 0.09 },
  { shape: "dot", size: 3, x: "2%", y: "55%", speed: -0.19, opacity: 0.12 },
  { shape: "cross", size: 5, x: "47%", y: "56%", speed: -0.26, opacity: 0.1, rotate: 25 },
  { shape: "circle", size: 3, x: "67%", y: "49%", speed: -0.22, opacity: 0.11 },

  // Zone 8 (56–64%)
  { shape: "ring", size: 16, x: "82%", y: "58%", speed: -0.22, opacity: 0.09 },
  { shape: "cross", size: 7, x: "7%", y: "61%", speed: -0.16, opacity: 0.1, rotate: -10 },
  { shape: "circle", size: 5, x: "17%", y: "63%", speed: -0.24, opacity: 0.12 },
  { shape: "dot", size: 3, x: "27%", y: "59%", speed: -0.19, opacity: 0.14 },
  { shape: "ring", size: 10, x: "37%", y: "57%", speed: -0.21, opacity: 0.08 },
  { shape: "cross", size: 6, x: "47%", y: "62%", speed: -0.2, opacity: 0.1, rotate: 35 },
  { shape: "dot", size: 4, x: "57%", y: "64%", speed: -0.17, opacity: 0.15 },
  { shape: "circle", size: 4, x: "67%", y: "60%", speed: -0.23, opacity: 0.11 },
  { shape: "ring", size: 14, x: "77%", y: "58%", speed: -0.25, opacity: 0.09 },
  { shape: "dot", size: 3, x: "87%", y: "63%", speed: -0.18, opacity: 0.13 },
  { shape: "cross", size: 5, x: "97%", y: "59%", speed: -0.26, opacity: 0.1, rotate: -55 },
  { shape: "circle", size: 3, x: "42%", y: "64%", speed: -0.2, opacity: 0.12 },
  { shape: "dot", size: 3, x: "13%", y: "58%", speed: -0.21, opacity: 0.13 },
  { shape: "cross", size: 5, x: "71%", y: "63%", speed: -0.19, opacity: 0.1, rotate: 18 },
  { shape: "ring", size: 9, x: "33%", y: "61%", speed: -0.23, opacity: 0.08 },
  { shape: "dot", size: 3, x: "52%", y: "59%", speed: -0.2, opacity: 0.14 },
  { shape: "circle", size: 3, x: "91%", y: "60%", speed: -0.18, opacity: 0.12 },
  { shape: "cross", size: 4, x: "24%", y: "62%", speed: -0.22, opacity: 0.1, rotate: -32 },

  // Zone 9 (64–72%)
  { shape: "ring", size: 14, x: "5%", y: "66%", speed: -0.25, opacity: 0.09 },
  { shape: "circle", size: 5, x: "15%", y: "69%", speed: -0.19, opacity: 0.12 },
  { shape: "dot", size: 3, x: "25%", y: "71%", speed: -0.17, opacity: 0.13 },
  { shape: "cross", size: 7, x: "35%", y: "67%", speed: -0.22, opacity: 0.1, rotate: 50 },
  { shape: "ring", size: 12, x: "45%", y: "65%", speed: -0.2, opacity: 0.08 },
  { shape: "dot", size: 4, x: "55%", y: "70%", speed: -0.16, opacity: 0.15 },
  { shape: "cross", size: 6, x: "65%", y: "72%", speed: -0.21, opacity: 0.1, rotate: -30 },
  { shape: "circle", size: 4, x: "75%", y: "68%", speed: -0.24, opacity: 0.11 },
  { shape: "ring", size: 18, x: "85%", y: "66%", speed: -0.18, opacity: 0.09 },
  { shape: "dot", size: 3, x: "95%", y: "71%", speed: -0.23, opacity: 0.14 },
  { shape: "cross", size: 5, x: "10%", y: "72%", speed: -0.26, opacity: 0.1, rotate: 15 },
  { shape: "circle", size: 3, x: "50%", y: "65%", speed: -0.19, opacity: 0.12 },
  { shape: "ring", size: 11, x: "60%", y: "67%", speed: -0.22, opacity: 0.08 },
  { shape: "dot", size: 4, x: "70%", y: "69%", speed: -0.18, opacity: 0.14 },
  { shape: "cross", size: 5, x: "30%", y: "70%", speed: -0.24, opacity: 0.1, rotate: -12 },
  { shape: "dot", size: 3, x: "40%", y: "68%", speed: -0.2, opacity: 0.14 },
  { shape: "ring", size: 9, x: "90%", y: "70%", speed: -0.17, opacity: 0.08 },
  { shape: "circle", size: 3, x: "80%", y: "72%", speed: -0.21, opacity: 0.12 },

  // Zone 10 (72–80%)
  { shape: "ring", size: 16, x: "8%", y: "74%", speed: -0.22, opacity: 0.09 },
  { shape: "dot", size: 3, x: "18%", y: "77%", speed: -0.16, opacity: 0.14 },
  { shape: "circle", size: 5, x: "28%", y: "79%", speed: -0.23, opacity: 0.11 },
  { shape: "cross", size: 7, x: "38%", y: "75%", speed: -0.2, opacity: 0.1, rotate: -20 },
  { shape: "ring", size: 10, x: "48%", y: "73%", speed: -0.25, opacity: 0.08 },
  { shape: "dot", size: 4, x: "58%", y: "78%", speed: -0.18, opacity: 0.15 },
  { shape: "cross", size: 6, x: "68%", y: "80%", speed: -0.21, opacity: 0.1, rotate: 65 },
  { shape: "circle", size: 4, x: "78%", y: "76%", speed: -0.17, opacity: 0.13 },
  { shape: "ring", size: 14, x: "88%", y: "74%", speed: -0.24, opacity: 0.09 },
  { shape: "dot", size: 3, x: "98%", y: "79%", speed: -0.19, opacity: 0.12 },
  { shape: "cross", size: 5, x: "43%", y: "80%", speed: -0.26, opacity: 0.1, rotate: -45 },
  { shape: "circle", size: 3, x: "3%", y: "78%", speed: -0.22, opacity: 0.11 },
  { shape: "cross", size: 6, x: "22%", y: "73%", speed: -0.2, opacity: 0.1, rotate: 28 },
  { shape: "dot", size: 3, x: "63%", y: "75%", speed: -0.24, opacity: 0.13 },
  { shape: "ring", size: 11, x: "33%", y: "77%", speed: -0.18, opacity: 0.08 },
  { shape: "dot", size: 3, x: "73%", y: "73%", speed: -0.22, opacity: 0.14 },
  { shape: "cross", size: 5, x: "92%", y: "76%", speed: -0.19, opacity: 0.1, rotate: 42 },
  { shape: "dot", size: 3, x: "53%", y: "76%", speed: -0.2, opacity: 0.13 },

  // Zone 11 (80–88%)
  { shape: "ring", size: 18, x: "6%", y: "82%", speed: -0.21, opacity: 0.09 },
  { shape: "circle", size: 5, x: "16%", y: "85%", speed: -0.19, opacity: 0.12 },
  { shape: "dot", size: 3, x: "26%", y: "87%", speed: -0.24, opacity: 0.13 },
  { shape: "cross", size: 7, x: "36%", y: "83%", speed: -0.17, opacity: 0.1, rotate: 40 },
  { shape: "ring", size: 12, x: "46%", y: "81%", speed: -0.22, opacity: 0.08 },
  { shape: "dot", size: 4, x: "56%", y: "86%", speed: -0.16, opacity: 0.15 },
  { shape: "cross", size: 6, x: "66%", y: "88%", speed: -0.2, opacity: 0.1, rotate: -70 },
  { shape: "circle", size: 4, x: "76%", y: "84%", speed: -0.25, opacity: 0.11 },
  { shape: "ring", size: 10, x: "86%", y: "82%", speed: -0.18, opacity: 0.09 },
  { shape: "dot", size: 3, x: "96%", y: "87%", speed: -0.23, opacity: 0.14 },
  { shape: "cross", size: 5, x: "41%", y: "88%", speed: -0.26, opacity: 0.1, rotate: 10 },
  { shape: "circle", size: 3, x: "71%", y: "81%", speed: -0.19, opacity: 0.12 },
  { shape: "ring", size: 10, x: "58%", y: "83%", speed: -0.2, opacity: 0.08 },
  { shape: "dot", size: 4, x: "88%", y: "84%", speed: -0.17, opacity: 0.14 },
  { shape: "dot", size: 3, x: "21%", y: "82%", speed: -0.23, opacity: 0.14 },
  { shape: "cross", size: 5, x: "51%", y: "86%", speed: -0.18, opacity: 0.1, rotate: -24 },
  { shape: "circle", size: 3, x: "81%", y: "88%", speed: -0.21, opacity: 0.12 },
  { shape: "ring", size: 9, x: "31%", y: "84%", speed: -0.2, opacity: 0.08 },

  // Zone 12 (88–100%)
  { shape: "ring", size: 14, x: "4%", y: "90%", speed: -0.21, opacity: 0.09 },
  { shape: "cross", size: 7, x: "14%", y: "93%", speed: -0.2, opacity: 0.1, rotate: 40 },
  { shape: "dot", size: 3, x: "24%", y: "95%", speed: -0.18, opacity: 0.14 },
  { shape: "circle", size: 5, x: "34%", y: "91%", speed: -0.23, opacity: 0.12 },
  { shape: "ring", size: 10, x: "44%", y: "89%", speed: -0.25, opacity: 0.08 },
  { shape: "dot", size: 4, x: "54%", y: "94%", speed: -0.16, opacity: 0.15 },
  { shape: "cross", size: 6, x: "64%", y: "96%", speed: -0.22, opacity: 0.1, rotate: -45 },
  { shape: "circle", size: 4, x: "74%", y: "92%", speed: -0.19, opacity: 0.11 },
  { shape: "ring", size: 16, x: "84%", y: "90%", speed: -0.24, opacity: 0.09 },
  { shape: "dot", size: 3, x: "94%", y: "95%", speed: -0.17, opacity: 0.13 },
  { shape: "cross", size: 5, x: "39%", y: "98%", speed: -0.26, opacity: 0.1, rotate: 55 },
  { shape: "circle", size: 3, x: "9%", y: "97%", speed: -0.2, opacity: 0.12 },
];

const PARALLAX_STRENGTH = 1.15;
const DEPTH_SPEED_MULTIPLIER = {
  far: 0.48,
  mid: 1,
  near: 1.65,
} as const;
const CYCLE_SPEED_MULTIPLIER = [0.8, 0.9, 0.98, 0.86, 1.02, 0.76] as const;

function getDepthBySize(size: number): keyof typeof DEPTH_SPEED_MULTIPLIER {
  if (size <= 4) return "far";
  if (size >= 12) return "near";
  return "mid";
}

function Shape({ shape, size, opacity, rotate }: Artifact) {
  const color = "var(--color-brand)";

  if (shape === "dot") {
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={color}
        opacity={opacity}
      />
    );
  }

  if (shape === "circle") {
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={color}
        opacity={opacity}
      />
    );
  }

  if (shape === "ring") {
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 1.5}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={opacity}
      />
    );
  }

  // cross
  const mid = size / 2;
  const arm = size * 0.38;
  return (
    <g
      opacity={opacity}
      transform={rotate ? `rotate(${rotate} ${mid} ${mid})` : undefined}
    >
      <line
        x1={mid - arm}
        y1={mid}
        x2={mid + arm}
        y2={mid}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line
        x1={mid}
        y1={mid - arm}
        x2={mid}
        y2={mid + arm}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </g>
  );
}

function ParallaxItem({
  artifact,
  index,
}: {
  artifact: Artifact;
  index: number;
}) {
  const depth = getDepthBySize(artifact.size);
  const cycle = CYCLE_SPEED_MULTIPLIER[index % CYCLE_SPEED_MULTIPLIER.length];
  const speedMultiplier = DEPTH_SPEED_MULTIPLIER[depth] * cycle;
  const parallaxSpeed = artifact.speed * PARALLAX_STRENGTH * speedMultiplier;

  return (
    <div
      className="absolute"
      style={{
        left: artifact.x,
        top: artifact.y,
        transform: `translate3d(0, calc(var(--parallax-y, 0px) * ${parallaxSpeed}), 0)`,
        willChange: "transform",
      }}
    >
      <svg
        width={artifact.size}
        height={artifact.size}
        viewBox={`0 0 ${artifact.size} ${artifact.size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Shape {...artifact} />
      </svg>
    </div>
  );
}

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
      className="pointer-events-none absolute inset-0 -z-1 hidden overflow-hidden motion-safe:block"
      aria-hidden="true"
    >
      {artifacts.map((a, i) => (
        <ParallaxItem key={i} artifact={a} index={i} />
      ))}
    </div>
  );
}
