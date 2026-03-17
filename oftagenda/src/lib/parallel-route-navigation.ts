"use client";

type RouterLike = {
  replace: (href: string) => void;
};

export function closeParallelRoute(
  router: RouterLike,
  fallbackHref: string,
) {
  if (typeof window !== "undefined") {
    const fallbackUrl = new URL(fallbackHref, window.location.origin);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const fallbackPath = `${fallbackUrl.pathname}${fallbackUrl.search}${fallbackUrl.hash}`;

    if (currentPath === fallbackPath) {
      return;
    }
  }

  // Parallel/intercepted routes can keep stale history entries.
  // Closing via deterministic replace avoids inconsistent dialog behavior.
  router.replace(fallbackHref);
}
