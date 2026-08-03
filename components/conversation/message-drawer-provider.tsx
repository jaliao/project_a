/*
 * ----------------------------------------------
 * MessageDrawerProvider - 全域訊息 Drawer 觸發機制
 * 2026-08-03 (Updated: 2026-08-03)
 * components/conversation/message-drawer-provider.tsx
 *
 * 任何頁面呼叫 useMessageDrawer().openMessageDrawer(targetUserId?)
 * 即可開啟訊息 Drawer；未帶 targetUserId 時顯示頻道列表；
 * 帶 targetUserId 且該對象已有既有對話時，先進入選擇模式
 * （選既有對話接續 or 開新對話），供使用者決定（cr-spec-260803-006）
 * ----------------------------------------------
 */

'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import {
  fetchMyConversations,
  fetchConversationMessages,
  fetchConversationsWithUser,
  fetchPreviewNewConversation,
  sendConversationMessage,
  startConversation,
  inviteToConversation,
  updateConversationTitle,
  togglePinConversation,
} from '@/app/actions/conversation'
import type { ConversationSummary, ConversationWithMessages } from '@/lib/data/conversation'
import { MessageDrawer } from './message-drawer'

type ActionResult = { success: boolean; message?: string; errors?: Record<string, string[]> }

type MessageDrawerContextValue = {
  openMessageDrawer: (targetUserId?: string) => void
  unreadCount: number
}

const MessageDrawerContext = createContext<MessageDrawerContextValue | null>(null)

export function useMessageDrawer() {
  const ctx = useContext(MessageDrawerContext)
  if (!ctx) throw new Error('useMessageDrawer must be used within MessageDrawerProvider')
  return ctx
}

type MessageDrawerProviderProps = {
  children: React.ReactNode
  initialConversations: ConversationSummary[]
  currentUserId: string
}

export function MessageDrawerProvider({ children, initialConversations, currentUserId }: MessageDrawerProviderProps) {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState(initialConversations)
  const [selected, setSelected] = useState<ConversationWithMessages | null>(null)
  const [loading, setLoading] = useState(false)
  // 選擇模式：對某位對象「傳訊息」時，若已有既有對話，先顯示候選清單讓使用者挑選既有對話或開新對話
  const [pickingTargetUserId, setPickingTargetUserId] = useState<string | null>(null)
  const [pickingCandidates, setPickingCandidates] = useState<ConversationSummary[]>([])

  const unreadCount = conversations.filter((c) => c.isUnread).length
  const selectedSummary = selected?.id ? conversations.find((c) => c.id === selected.id) : undefined

  const refreshConversations = useCallback(async () => {
    const list = await fetchMyConversations()
    setConversations(list)
  }, [])

  const clearPicking = useCallback(() => {
    setPickingTargetUserId(null)
    setPickingCandidates([])
  }, [])

  const selectConversation = useCallback(
    async (conversationId: number) => {
      clearPicking()
      setLoading(true)
      const detail = await fetchConversationMessages(conversationId)
      setSelected(detail)
      setLoading(false)
      refreshConversations()
    },
    [refreshConversations, clearPicking]
  )

  const startNewWithTarget = useCallback(async (targetUserId: string) => {
    setLoading(true)
    const detail = await fetchPreviewNewConversation(targetUserId)
    setSelected(detail)
    setLoading(false)
    clearPicking()
  }, [clearPicking])

  const openMessageDrawer = useCallback(
    (targetUserId?: string) => {
      setOpen(true)
      clearPicking()
      if (!targetUserId) {
        setSelected(null)
        refreshConversations()
        return
      }
      setLoading(true)
      fetchConversationsWithUser(targetUserId).then((candidates) => {
        setLoading(false)
        if (candidates.length === 0) {
          startNewWithTarget(targetUserId)
        } else {
          setPickingTargetUserId(targetUserId)
          setPickingCandidates(candidates)
        }
      })
      refreshConversations()
    },
    [refreshConversations, clearPicking, startNewWithTarget]
  )

  const handleSend = useCallback(
    async (body: string): Promise<ActionResult> => {
      if (!selected) return { success: false, message: '請選擇對話' }
      const targetUserId = selected.participants[0]?.userId
      const result = selected.id
        ? await sendConversationMessage(selected.id, body)
        : targetUserId
          ? await startConversation(targetUserId, body)
          : { success: false, message: '找不到對象' }
      if (result.success && result.conversationId) {
        const detail = await fetchConversationMessages(result.conversationId)
        setSelected(detail)
        refreshConversations()
      }
      return result
    },
    [selected, refreshConversations]
  )

  const handleUpdateTitle = useCallback(
    async (title: string): Promise<ActionResult> => {
      if (!selected?.id) return { success: false, message: '尚未建立對話' }
      const result = await updateConversationTitle(selected.id, title)
      if (result.success) {
        const detail = await fetchConversationMessages(selected.id)
        setSelected(detail)
        refreshConversations()
      }
      return result
    },
    [selected, refreshConversations]
  )

  const handleInvite = useCallback(
    async (targetSpiritId: string): Promise<ActionResult> => {
      if (!selected?.id) return { success: false, message: '尚未建立對話' }
      const result = await inviteToConversation(selected.id, targetSpiritId)
      if (result.success) {
        const detail = await fetchConversationMessages(selected.id)
        setSelected(detail)
        refreshConversations()
      }
      return result
    },
    [selected, refreshConversations]
  )

  const handleTogglePin = useCallback(async () => {
    if (!selected?.id) return
    await togglePinConversation(selected.id)
    refreshConversations()
  }, [selected, refreshConversations])

  return (
    <MessageDrawerContext.Provider value={{ openMessageDrawer, unreadCount }}>
      {children}
      <MessageDrawer
        open={open}
        onOpenChange={setOpen}
        conversations={conversations}
        selected={selected}
        selectedIsPinned={selectedSummary?.isPinned ?? false}
        loading={loading}
        currentUserId={currentUserId}
        pickingCandidates={pickingCandidates}
        isPicking={pickingTargetUserId !== null}
        onSelectConversation={selectConversation}
        onPickExisting={selectConversation}
        onPickNew={() => pickingTargetUserId && startNewWithTarget(pickingTargetUserId)}
        onSend={handleSend}
        onUpdateTitle={handleUpdateTitle}
        onInvite={handleInvite}
        onTogglePin={handleTogglePin}
      />
    </MessageDrawerContext.Provider>
  )
}
