import { Button } from "@/components/ui/button";
import { trackArticleShare } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Copy, Facebook, Linkedin, Mail, Send, Share2 } from "lucide-react";
import * as React from "react";

export type ArticleShareButtonsProps = {
  /** URL canônica do artigo (https…). */
  url: string;
  title: string;
  /** Slug do artigo (item_id no dataLayer). */
  articleId: string;
};

/**
 * URLs de compartilhamento por rede (boas práticas):
 * - WhatsApp: `wa.me/?text=` com título + URL (único parâmetro recomendado).
 * - Facebook: apenas `u` (a rede obtém título/descrição dos metadados da URL).
 * - X: `twitter.com/intent/tweet` com `text` + `url` (endpoint oficial ainda em twitter.com).
 * - LinkedIn: apenas `url` em share-offsite (pré-visualização via OG da página).
 * - Telegram: `t.me/share/url` com `url` e `text`.
 */
function buildShareTargets(url: string, title: string) {
  const u = encodeURIComponent(url);
  const textLine = `${title}\n${url}`;
  const textEncoded = encodeURIComponent(textLine);
  const titleEncoded = encodeURIComponent(title);

  return {
    whatsapp: `https://wa.me/?text=${textEncoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?text=${titleEncoded}&url=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${titleEncoded}`,
    email: `mailto:?subject=${titleEncoded}&body=${encodeURIComponent(textLine)}`,
  };
}

function iconButtonClass(network: string) {
  return cn(
    "text-muted-foreground hover:text-foreground",
    network === "whatsapp" && "hover:text-[#25D366]",
    network === "facebook" && "hover:text-[#1877F2]",
    network === "linkedin" && "hover:text-[#0A66C2]",
    network === "x" && "hover:text-foreground",
    network === "telegram" && "hover:text-[#26A5E4]",
  );
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Logotipo do WhatsApp (marca reconhecível; cor via `currentColor`). */
function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function ArticleShareButtons({ url, title, articleId }: ArticleShareButtonsProps) {
  const targets = React.useMemo(() => buildShareTargets(url, title), [url, title]);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const baseId = `gtm-artigo-${articleId}-share`;

  const fireShare = React.useCallback(
    (method: string, triggerId: string) => {
      trackArticleShare({ method, item_id: articleId, trigger_id: triggerId });
    },
    [articleId],
  );

  const handleCopy = React.useCallback(async () => {
    const tid = `${baseId}-copy`;
    try {
      await navigator.clipboard.writeText(url);
      fireShare("copy_link", tid);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      /* silencioso: sem tracking de falha para não poluir o dataLayer */
    }
  }, [url, baseId, fireShare]);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleNativeShare = React.useCallback(async () => {
    const tid = `${baseId}-native`;
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: title, url });
      fireShare("native", tid);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }, [title, url, baseId, fireShare]);

  const showNative = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <section
      className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3.5 sm:px-5 sm:py-4"
      aria-labelledby="article-share-heading"
    >
      <h2 id="article-share-heading" className="mb-3 text-sm font-semibold text-foreground">
        Compartilhar este conteúdo
      </h2>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button asChild variant="outline" size="icon-sm" className={iconButtonClass("whatsapp")}>
          <a
            id={`${baseId}-whatsapp`}
            href={targets.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no WhatsApp"
            title="WhatsApp"
            onClick={() => fireShare("whatsapp", `${baseId}-whatsapp`)}
          >
            <WhatsAppLogo />
          </a>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className={iconButtonClass("facebook")}>
          <a
            id={`${baseId}-facebook`}
            href={targets.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no Facebook"
            title="Facebook"
            onClick={() => fireShare("facebook", `${baseId}-facebook`)}
          >
            <Facebook className="size-4" aria-hidden />
          </a>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className={iconButtonClass("x")}>
          <a
            id={`${baseId}-x`}
            href={targets.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no X"
            title="X (Twitter)"
            onClick={() => fireShare("twitter", `${baseId}-x`)}
          >
            <XLogo />
          </a>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className={iconButtonClass("linkedin")}>
          <a
            id={`${baseId}-linkedin`}
            href={targets.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no LinkedIn"
            title="LinkedIn"
            onClick={() => fireShare("linkedin", `${baseId}-linkedin`)}
          >
            <Linkedin className="size-4" aria-hidden />
          </a>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className={iconButtonClass("telegram")}>
          <a
            id={`${baseId}-telegram`}
            href={targets.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no Telegram"
            title="Telegram"
            onClick={() => fireShare("telegram", `${baseId}-telegram`)}
          >
            <Send className="size-4" aria-hidden />
          </a>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className="text-muted-foreground hover:text-foreground">
          <a
            id={`${baseId}-email`}
            href={targets.email}
            aria-label="Compartilhar por e-mail"
            title="E-mail"
            onClick={() => fireShare("email", `${baseId}-email`)}
          >
            <Mail className="size-4" aria-hidden />
          </a>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          id={`${baseId}-copy`}
          aria-label={copied ? "Link copiado" : "Copiar link do artigo"}
          title={copied ? "Copiado!" : "Copiar link"}
          onClick={handleCopy}
        >
          <Copy className="size-4" aria-hidden />
        </Button>

        {showNative ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            id={`${baseId}-native`}
            aria-label="Compartilhar pelo sistema"
            title="Compartilhar…"
            onClick={handleNativeShare}
          >
            <Share2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
