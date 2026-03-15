import { cookies } from "next/headers";

import { cn } from "@/lib/utils";

const THEME_COLOR_COOKIE_NAME = "themecolor";
const DEFAULT_THEME_COLOR = "#7894ff";

const NAMED_THEME_COLORS: Record<string, string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  fuchsia: "#d946ef",
  indigo: "#6366f1",
  lime: "#84cc16",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
  red: "#ef4444",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  yellow: "#eab308",
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function normalizeHexColor(value: string) {
  const normalized = value.trim();
  const hex3Match = /^#([0-9a-fA-F]{3})$/;
  const hex6Match = /^#([0-9a-fA-F]{6})$/;

  const hex3 = normalized.match(hex3Match);
  if (hex3?.[1]) {
    const [r, g, b] = hex3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const hex6 = normalized.match(hex6Match);
  if (hex6?.[1]) {
    return `#${hex6[1].toLowerCase()}`;
  }

  return null;
}

function parseHexToRgb(hexColor: string): RgbColor {
  const value = hexColor.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function resolveThemeColor(rawValue?: string) {
  if (!rawValue) {
    return DEFAULT_THEME_COLOR;
  }

  const decodedValue = decodeURIComponent(rawValue).trim().toLowerCase();
  if (!decodedValue) {
    return DEFAULT_THEME_COLOR;
  }

  const fromPalette = NAMED_THEME_COLORS[decodedValue];
  if (fromPalette) {
    return fromPalette;
  }

  const hexColor = normalizeHexColor(decodedValue);
  return hexColor ?? DEFAULT_THEME_COLOR;
}

type ThemedLoadingShellProps = {
  children: React.ReactNode;
  className?: string;
};

export async function ThemedLoadingShell({
  children,
  className,
}: ThemedLoadingShellProps) {
  const cookieStore = await cookies();
  const themeColorCookie = cookieStore.get(THEME_COLOR_COOKIE_NAME)?.value;
  const resolvedThemeColor = resolveThemeColor(themeColorCookie);
  const { r, g, b } = parseHexToRgb(resolvedThemeColor);

  return (
    <div className={cn("relative isolate", className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 blur-2xl"
        style={{
          background: `radial-gradient(circle at top, rgba(${r}, ${g}, ${b}, 0.18), transparent 58%)`,
        }}
      />
      {children}
    </div>
  );
}
