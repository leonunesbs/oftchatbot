import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { useMemo, useState } from "react";

export default function FAQAccordion() {
  const INITIAL_VISIBLE_ITEMS = 6;
  const [showAll, setShowAll] = useState(false);
  const visibleFaq = useMemo(
    () => (showAll ? siteConfig.faq : siteConfig.faq.slice(0, INITIAL_VISIBLE_ITEMS)),
    [showAll]
  );
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
              {item.answer}
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
