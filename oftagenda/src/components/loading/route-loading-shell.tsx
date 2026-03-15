import { ThemedLoadingShell } from "@/components/themed-loading-shell";
import { cn } from "@/lib/utils";

type LoadingContainerSize = "md" | "lg" | "xl" | "full";

const containerClassBySize: Record<LoadingContainerSize, string> = {
  md: "mx-auto w-full max-w-3xl",
  lg: "mx-auto w-full max-w-5xl",
  xl: "mx-auto w-full max-w-6xl",
  full: "w-full",
};

type RouteLoadingShellProps = {
  children: React.ReactNode;
  size?: LoadingContainerSize;
  className?: string;
};

export function RouteLoadingShell({
  children,
  size = "lg",
  className,
}: RouteLoadingShellProps) {
  return (
    <ThemedLoadingShell>
      <section className={cn(containerClassBySize[size], className)}>{children}</section>
    </ThemedLoadingShell>
  );
}
