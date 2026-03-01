"use client";

import { cn } from "@/lib/utils";
import type { WahaMessage } from "@/lib/waha/types";

type MessageBubbleProps = {
  message: WahaMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const messageTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex w-full", message.fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(82%,42rem)] rounded-2xl border px-3 py-2.5 text-sm shadow-xs",
          message.fromMe
            ? "bg-primary/95 text-primary-foreground border-primary/70 rounded-br-md"
            : "bg-background text-foreground border-border rounded-bl-md"
        )}
      >
        <p className="wrap-break-word whitespace-pre-wrap leading-relaxed">{message.text}</p>
        <p
          className={cn(
            "mt-1.5 text-right text-[11px]",
            message.fromMe ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          {messageTime}
        </p>
      </div>
    </div>
  );
}
