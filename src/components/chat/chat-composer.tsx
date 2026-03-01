"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void>;
};

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [text, setText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(value);
      setText("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-border/70 border-t px-2 py-2 md:px-3 md:py-2.5">
      <form onSubmit={handleSubmit} className="bg-background/95 ring-border flex items-center gap-2 rounded-2xl p-2 ring-1 shadow-xs">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={disabled ? "Selecione uma conversa para enviar" : "Digite uma mensagem..."}
          disabled={disabled || isSending}
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button type="submit" className="h-10 px-4" disabled={disabled || isSending || !text.trim()}>
          {isSending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-1.5 px-1 text-[11px]">Enter para enviar mensagem.</p>
    </div>
  );
}
