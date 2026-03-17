"use client";

import { parseAsString, useQueryState } from "nuqs";
import {
  PARALLEL_ROUTE_ORIGIN_QUERY_KEY,
  resolveParallelRouteBackHref,
} from "@/lib/parallel-route-origin";

type RouterLike = {
  replace: (href: string) => void;
};

export function useParallelRouteBackHref(fallbackHref: string) {
  const [originHref] = useQueryState(PARALLEL_ROUTE_ORIGIN_QUERY_KEY, parseAsString);
  return resolveParallelRouteBackHref(originHref, fallbackHref);
}

export function closeParallelRoute(
  router: RouterLike,
  fallbackHref: string,
  originHref?: string | null,
) {
  const targetHref = resolveParallelRouteBackHref(originHref, fallbackHref);

  if (typeof window !== "undefined") {
    const fallbackUrl = new URL(targetHref, window.location.origin);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const fallbackPath = `${fallbackUrl.pathname}${fallbackUrl.search}${fallbackUrl.hash}`;

    if (currentPath === fallbackPath) {
      return;
    }
  }

  // Parallel/intercepted routes can keep stale history entries.
  // Closing via deterministic replace avoids inconsistent dialog behavior.
  router.replace(targetHref);
}
