import { useMemo } from "react"

import type { ChatMessage, ConversationSummary, DashboardMetrics } from "@/lib/waha-types"

interface UseDashboardMetricsInput {
  conversations: ConversationSummary[]
  currentMessages: ChatMessage[]
}

export function useDashboardMetrics(input: UseDashboardMetricsInput): DashboardMetrics {
  const { conversations, currentMessages } = input

  return useMemo(() => {
    const unreadMessages = conversations.reduce((acc, conversation) => acc + conversation.unreadCount, 0)
    const pendingConversations = conversations.filter((conversation) => conversation.status === "pending").length

    const incoming = currentMessages.filter((message) => message.direction === "incoming")
    const outgoing = currentMessages.filter((message) => message.direction === "outgoing")

    let avgResponseMinutes = 0
    const firstIncomingMsg = incoming[0]
    if (firstIncomingMsg && outgoing.length > 0) {
      const firstIncoming = Date.parse(firstIncomingMsg.timestamp)
      const firstOutgoingAfterIncoming = outgoing.find(
        (message) => Date.parse(message.timestamp) >= firstIncoming
      )
      if (firstOutgoingAfterIncoming) {
        const deltaMs = Date.parse(firstOutgoingAfterIncoming.timestamp) - firstIncoming
        avgResponseMinutes = Math.max(0, Math.round(deltaMs / 1000 / 60))
      }
    }

    return {
      totalConversations: conversations.length,
      pendingConversations,
      unreadMessages,
      avgResponseMinutes,
    }
  }, [conversations, currentMessages])
}
