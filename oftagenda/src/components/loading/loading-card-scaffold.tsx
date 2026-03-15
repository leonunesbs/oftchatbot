import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingCardScaffoldProps = {
  children: React.ReactNode;
  headerLines?: string[];
  className?: string;
  contentClassName?: string;
  variant?: React.ComponentProps<typeof Card>["variant"];
};

export function LoadingCardScaffold({
  children,
  headerLines = ["h-7 w-56", "h-4 w-full max-w-2xl"],
  className,
  contentClassName,
  variant,
}: LoadingCardScaffoldProps) {
  return (
    <Card variant={variant} className={cn("border-border/70", className)}>
      <CardHeader className="space-y-3">
        {headerLines.map((lineClassName, index) => (
          <Skeleton key={`loading-card-header-${index}`} className={lineClassName} />
        ))}
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
