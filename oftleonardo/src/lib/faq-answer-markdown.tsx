import { createElement, Fragment, type ReactNode } from "react";

/**
 * Renders FAQ answers from content collections: **bold** and [label](href).
 * Kept intentionally small to avoid pulling in a full markdown parser.
 */
export function renderFaqAnswerMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remainder = text;
  let key = 0;

  while (remainder.length > 0) {
    const linkMatch = remainder.match(/^\[([^\]]*)\]\(([^)]*)\)/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      parts.push(
        createElement(
          "a",
          {
            key: key++,
            href,
            className:
              "text-brand font-medium underline underline-offset-2 hover:text-brand/80",
          },
          label,
        ),
      );
      remainder = remainder.slice(linkMatch[0].length);
      continue;
    }

    const boldMatch = remainder.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        createElement(
          "strong",
          { key: key++, className: "font-semibold text-foreground" },
          boldMatch[1],
        ),
      );
      remainder = remainder.slice(boldMatch[0].length);
      continue;
    }

    const nextLink = remainder.indexOf("[");
    const nextBold = remainder.indexOf("**");
    let cut = remainder.length;
    if (nextLink !== -1) cut = Math.min(cut, nextLink);
    if (nextBold !== -1) cut = Math.min(cut, nextBold);
    parts.push(remainder.slice(0, cut));
    remainder = remainder.slice(cut);
  }

  return createElement(Fragment, null, parts);
}

/** Plain text for JSON-LD / schema (no markdown markers). */
export function stripFaqAnswerMarkdownForPlainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
