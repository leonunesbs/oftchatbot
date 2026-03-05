import { useCallback, useEffect, useMemo, useState } from "react"

import { getConversationMessages, sendTextMessage, WahaApiError } from "@/lib/waha-client"
import type { ChatMessage } from "@/lib/waha-types"

interface UseChatThreadOptions {
  session?: string
  chatId: string | null
  onLoaded?: (chatId: string) => void | Promise<void>
  liveIntervalMs?: number
  enabled?: boolean
}

export function useChatThread(options: UseChatThreadOptions) {
  const session = options.session ?? "default"
  const chatId = options.chatId
  const onLoaded = options.onLoaded
  const liveIntervalMs = options.liveIntervalMs ?? 2500
  const enabled = options.enabled ?? true
  const [items, setItems] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async (isBackground = false) => {
    if (!enabled) {
      if (!isBackground) {
        setIsLoading(false)
      }
      return
    }

    if (!chatId) {
      setItems([])
      return
    }

    try {
      if (!isBackground) {
        setIsLoading(true)
        setError(null)
      }
      const messages = await getConversationMessages(chatId, session)
      setItems(messages)
      if (!isBackground) {
        await onLoaded?.(chatId)
      }
    } catch (rawError) {
      const message =
        rawError instanceof WahaApiError ? rawError.message : "Erro ao carregar mensagens da conversa."
      setError(message)
    } finally {
      if (!isBackground) {
        setIsLoading(false)
      }
    }
  }, [chatId, enabled, onLoaded, session])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setIsLoading(false)
      return
    }
    void loadMessages()
  }, [enabled, loadMessages])

  useEffect(() => {
    if (!enabled || !chatId || liveIntervalMs <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (isSending) {
        return
      }
      void loadMessages(true)
    }, liveIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [chatId, enabled, isSending, liveIntervalMs, loadMessages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!enabled || !chatId) {
        return
      }

      const trimmed = text.trim()
      if (!trimmed) {
        return
      }

      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        chatId,
        body: trimmed,
        timestamp: new Date().toISOString(),
        direction: "outgoing",
        status: "pending",
      }

      setItems((current) => [...current, optimistic])
      setIsSending(true)
      setError(null)

      try {
        const sent = await sendTextMessage({
          chatId,
          session,
          text: trimmed,
        })

        setItems((current) => current.map((item) => (item.id === optimistic.id ? sent : item)))
      } catch (rawError) {
        const message = rawError instanceof WahaApiError ? rawError.message : "Erro ao enviar mensagem."
        setItems((current) =>
          current.map((item) => (item.id === optimistic.id ? { ...item, status: "failed" } : item))
        )
        setError(message)
      } finally {
        setIsSending(false)
      }
    },
    [chatId, enabled, session]
  )

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
    [items]
  )

  return {
    items: orderedItems,
    isLoading,
    isSending,
    error,
    loadMessages,
    sendMessage,
  }
}
