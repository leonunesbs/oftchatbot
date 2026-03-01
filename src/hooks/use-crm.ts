import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  addCrmTag,
  getCrmChatMeta,
  getCrmChatStages,
  getCrmMetrics,
  removeCrmTag,
  syncChatEvents,
  syncCrmChats,
  updateCrmChatMeta,
} from "@/lib/crm-client"
import type { ChatMessage, ConversationSummary, CrmChatMeta, DashboardMetrics, PipelineStage } from "@/lib/waha-types"

const EMPTY_METRICS: DashboardMetrics = {
  totalConversations: 0,
  pendingConversations: 0,
  unreadMessages: 0,
  avgResponseMinutes: 0,
}

const FULL_SYNC_MIN_INTERVAL_MS = 30_000
const MAX_TRACKED_MESSAGE_IDS_PER_CHAT = 5_000

function buildConversationsSignature(
  conversations: ConversationSummary[]
): string {
  return conversations
    .map((conversation) => {
      const avatar = conversation.avatarUrl ?? ""
      return `${conversation.id}|${conversation.contactName}|${conversation.contactPhone}|${avatar}`
    })
    .sort()
    .join("||")
}

export function useCrmData(input: {
  selectedChatId: string | null
  conversations: ConversationSummary[]
  currentMessages: ChatMessage[]
}) {
  const { selectedChatId, conversations, currentMessages } = input
  const [metaByChatId, setMetaByChatId] = useState<Record<string, CrmChatMeta>>({})
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS)
  const [stageByChatId, setStageByChatId] = useState<Record<string, PipelineStage>>({})
  const lastConversationSignatureRef = useRef<string>("")
  const lastFullSyncAtRef = useRef<number>(0)
  const syncedMessageIdsByChatRef = useRef<Map<string, Set<string>>>(new Map())

  const reloadMetrics = useCallback(async () => {
    const data = await getCrmMetrics()
    setMetrics(data)
  }, [])

  const reloadStages = useCallback(async () => {
    const data = await getCrmChatStages()
    setStageByChatId(
      data.stages.reduce(
        (acc, item) => ({ ...acc, [item.chatId]: item.stage }),
        {} as Record<string, PipelineStage>
      )
    )
  }, [])

  const syncConversations = useCallback(async () => {
    const normalizedChats = conversations.map((conversation) => ({
      chatId: conversation.id,
      contactName: conversation.contactName,
      contactPhone: conversation.contactPhone,
      avatarUrl: conversation.avatarUrl,
    }))
    const signature = buildConversationsSignature(conversations)
    const now = Date.now()
    const hasChanges = signature !== lastConversationSignatureRef.current
    const reachedMinInterval = now - lastFullSyncAtRef.current >= FULL_SYNC_MIN_INTERVAL_MS
    if (!hasChanges && !reachedMinInterval) {
      return false
    }

    await syncCrmChats(normalizedChats)
    lastConversationSignatureRef.current = signature
    lastFullSyncAtRef.current = now
    return true
  }, [conversations])

  const refreshMeta = useCallback(async (chatId: string) => {
    const data = await getCrmChatMeta(chatId)
    setMetaByChatId((current) => ({ ...current, [chatId]: data }))
    setStageByChatId((current) => ({ ...current, [chatId]: data.stage }))
    return data
  }, [])

  useEffect(() => {
    void syncConversations()
      .then((didSync) => {
        if (!didSync) {
          return
        }
        return Promise.all([reloadMetrics(), reloadStages()])
      })
      .then(() => undefined)
      .catch(() => undefined)
  }, [reloadMetrics, reloadStages, syncConversations])

  useEffect(() => {
    if (!selectedChatId) {
      return
    }
    let isMounted = true
    void getCrmChatMeta(selectedChatId).then((data) => {
      if (!isMounted) {
        return
      }
      setMetaByChatId((current) => ({ ...current, [selectedChatId]: data }))
      setStageByChatId((current) => ({ ...current, [selectedChatId]: data.stage }))
    })
    return () => {
      isMounted = false
    }
  }, [selectedChatId])

  useEffect(() => {
    if (!selectedChatId || currentMessages.length === 0) {
      return
    }

    const chatId = selectedChatId
    const knownIds = syncedMessageIdsByChatRef.current.get(chatId) ?? new Set<string>()
    const pendingMessages = currentMessages.filter((message) => !knownIds.has(message.id))

    if (pendingMessages.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void syncChatEvents(chatId, pendingMessages)
        .then(() => {
          const mergedIds = syncedMessageIdsByChatRef.current.get(chatId) ?? new Set<string>()
          for (const message of pendingMessages) {
            mergedIds.add(message.id)
          }
          if (mergedIds.size > MAX_TRACKED_MESSAGE_IDS_PER_CHAT) {
            const ordered = Array.from(mergedIds).slice(-MAX_TRACKED_MESSAGE_IDS_PER_CHAT)
            syncedMessageIdsByChatRef.current.set(chatId, new Set(ordered))
          } else {
            syncedMessageIdsByChatRef.current.set(chatId, mergedIds)
          }
          void reloadMetrics()
        })
        .catch(() => undefined)
    }, 800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentMessages, reloadMetrics, selectedChatId])

  const selectedMeta = useMemo(
    () => (selectedChatId ? metaByChatId[selectedChatId] ?? null : null),
    [metaByChatId, selectedChatId]
  )

  const updateNotes = useCallback(
    async (chatId: string, notes: string) => {
      const current = metaByChatId[chatId]
      if (!current) {
        return
      }
      await updateCrmChatMeta({
        chatId,
        stage: current.stage,
        notes,
        name: current.name,
        phone: current.phone,
        avatarUrl: current.avatarUrl,
        about: current.about,
        email: current.email,
        preferredLocation: current.preferredLocation,
      })
      setMetaByChatId((previous) => ({
        ...previous,
        [chatId]: {
          ...previous[chatId],
          notes,
        },
      }))
    },
    [metaByChatId]
  )

  const updateStage = useCallback(
    async (chatId: string, stage: PipelineStage) => {
      const current = metaByChatId[chatId]
      if (!current) {
        return
      }
      await updateCrmChatMeta({
        chatId,
        stage,
        notes: current.notes,
        name: current.name,
        phone: current.phone,
        avatarUrl: current.avatarUrl,
        about: current.about,
        email: current.email,
        preferredLocation: current.preferredLocation,
      })
      setMetaByChatId((previous) => ({
        ...previous,
        [chatId]: {
          ...previous[chatId],
          stage,
        },
      }))
      setStageByChatId((previous) => ({ ...previous, [chatId]: stage }))
      void reloadMetrics()
    },
    [metaByChatId, reloadMetrics]
  )

  const updateName = useCallback(
    async (chatId: string, name: string) => {
      const current = metaByChatId[chatId]
      const normalizedName = name.trim()
      if (!normalizedName) {
        return
      }

      const conversation = conversations.find((item) => item.id === chatId)
      const stage = current?.stage ?? "descoberta"
      const notes = current?.notes ?? ""
      const phone = current?.phone ?? conversation?.contactPhone ?? ""
      const avatarUrl = current?.avatarUrl ?? conversation?.avatarUrl
      const about = current?.about

      await updateCrmChatMeta({
        chatId,
        stage,
        notes,
        name: normalizedName,
        phone,
        avatarUrl,
        about,
        email: current?.email,
        preferredLocation: current?.preferredLocation,
      })
      setMetaByChatId((previous) => ({
        ...previous,
        [chatId]: {
          chatId,
          stage,
          notes,
          name: normalizedName,
          phone,
          avatarUrl,
          about,
          tags: previous[chatId]?.tags ?? [],
          email: previous[chatId]?.email,
          preferredLocation: previous[chatId]?.preferredLocation,
          appointment: previous[chatId]?.appointment ?? null,
        },
      }))
    },
    [conversations, metaByChatId]
  )

  const addTag = useCallback(
    async (chatId: string, tag: string) => {
      await addCrmTag(chatId, tag)
      await refreshMeta(chatId)
    },
    [refreshMeta]
  )

  const removeTag = useCallback(
    async (chatId: string, tag: string) => {
      await removeCrmTag(chatId, tag)
      await refreshMeta(chatId)
    },
    [refreshMeta]
  )

  return {
    metrics,
    stageByChatId,
    selectedMeta,
    refreshMeta,
    updateNotes,
    updateStage,
    updateName,
    addTag,
    removeTag,
    reloadMetrics,
    reloadStages,
  }
}
