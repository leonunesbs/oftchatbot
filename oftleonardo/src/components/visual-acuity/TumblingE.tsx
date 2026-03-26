import type { Orientation } from "./constants";

interface TumblingEProps {
  size: number;
  orientation: Orientation;
  className?: string;
}

const ROTATION: Record<Orientation, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

/**
 * Renders a Tumbling E optotype as an SVG.
 * The E is a 5×5 grid where each cell = size/5.
 * Base orientation (right): three horizontal prongs pointing right.
 */
export default function TumblingE({ size, orientation, className }: TumblingEProps) {
  const s = size / 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label={`E apontando para ${orientation}`}
    >
      <g
        transform={`rotate(${ROTATION[orientation]} ${size / 2} ${size / 2})`}
      >
        {/* Top bar */}
        <rect x={0} y={0} width={size} height={s} className="fill-foreground" />
        {/* Vertical spine (left side) */}
        <rect x={0} y={0} width={s} height={size} className="fill-foreground" />
        {/* Middle bar */}
        <rect x={0} y={2 * s} width={size} height={s} className="fill-foreground" />
        {/* Bottom bar */}
        <rect x={0} y={4 * s} width={size} height={s} className="fill-foreground" />
      </g>
    </svg>
  );
}
