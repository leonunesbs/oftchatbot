import { useCallback, useEffect, useMemo, useState } from "react"

import { getConversations, WahaApiError } from "@/lib/waha-client"
import type { ConversationStatus, ConversationSummary } from "@/lib/waha-types"

export type ConversationFilter = "all" | ConversationStatus

interface UseConversationsOptions {
  session?: string
  liveIntervalMs?: number
  enabled?: boolean
}

export function useConversations(options?: UseConversationsOptions) {
  const session = options?.session ?? "default"
  const liveIntervalMs = options?.liveIntervalMs ?? 5000
  const enabled = options?.enabled ?? true
  const [items, setItems] = useState<ConversationSummary[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ConversationFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (isBackground = false) => {
    if (!enabled) {
      if (!isBackground) {
        setIsLoading(false)
      }
      return
    }

    try {
      if (!isBackground) {
        setIsLoading(true)
        setError(null)
      }
      const conversations = await getConversations(session)
      setItems(conversations)

      if (!selectedChatId && conversations.length > 0) {
        setSelectedChatId(conversations[0].id)
      }
    } catch (rawError) {
      const message =
        rawError instanceof WahaApiError ? rawError.message : "Erro ao carregar conversas da WAHA."
      setError(message)
    } finally {
      if (!isBackground) {
        setIsLoading(false)
      }
    }
  }, [enabled, selectedChatId, session])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [enabled, reload])

  useEffect(() => {
    if (!enabled || liveIntervalMs <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      void reload(true)
    }, liveIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, liveIntervalMs, reload])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesFilter = filter === "all" ? true : item.status === filter
      if (!matchesFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return (
        item.contactName.toLowerCase().includes(normalizedQuery) ||
        item.contactPhone.toLowerCase().includes(normalizedQuery) ||
        item.lastMessage.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [filter, items, query])

  const selectedConversation = useMemo(
    () => items.find((item) => item.id === selectedChatId) ?? null,
    [items, selectedChatId]
  )

  return {
    items,
    filteredItems,
    selectedChatId,
    selectedConversation,
    query,
    filter,
    isLoading,
    error,
    setSelectedChatId,
    setQuery,
    setFilter,
    reload,
    setItems,
  }
}
