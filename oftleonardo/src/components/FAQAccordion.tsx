import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig, type FaqAnswerSegment } from "@/config/site";
import { useState } from "react";

type FaqEntry = (typeof siteConfig.faq)[number];

function linkProps(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return { target: "_blank" as const, rel: "noopener noreferrer" };
  }
  return {};
}

function renderFaqAnswer(segments: readonly FaqAnswerSegment[]) {
  return segments.map((seg, i) => {
    if (seg.type === "text") {
      return <span key={i}>{seg.text}</span>;
    }
    if (seg.bookingDialog) {
      return (
        <a
          key={i}
          href={seg.href}
          data-booking-trigger
          data-online-booking-link-id={seg.onlineBookingLinkId ?? "gtm-faq-dialog-agendar-online"}
          data-url-sync={seg.urlSync ? "true" : undefined}
          className="font-medium text-brand underline-offset-4 transition-colors hover:text-brand/85 hover:underline"
        >
          {seg.label}
        </a>
      );
    }
    const extra = linkProps(seg.href);
    return (
      <a
        key={i}
        href={seg.href}
        className="font-medium text-brand underline-offset-4 transition-colors hover:text-brand/85 hover:underline"
        {...extra}
      >
        {seg.label}
      </a>
    );
  });
}

export default function FAQAccordion() {
  const INITIAL_VISIBLE_ITEMS = 6;
  const [showAll, setShowAll] = useState(false);
  const visibleFaq: readonly FaqEntry[] = showAll
    ? siteConfig.faq
    : siteConfig.faq.slice(0, INITIAL_VISIBLE_ITEMS);
  const hasHiddenItems = siteConfig.faq.length > INITIAL_VISIBLE_ITEMS;

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        {visibleFaq.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {renderFaqAnswer(item.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {hasHiddenItems && !showAll ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-brand underline-offset-4 transition-colors hover:text-brand/85 hover:underline"
          >
            Ver mais perguntas
          </button>
        </div>
      ) : null}
    </>
  );
}
