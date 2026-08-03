/*
 * ----------------------------------------------
 * MessageDrawer - 訊息 Drawer（頻道列表＋選中頻道訊息）
 * 2026-08-03 (Updated: 2026-08-03)
 * components/conversation/message-drawer.tsx
 *
 * 滿版顯示，含明確關閉按鈕；「傳訊息」入口若對象已有既有對話
 * 會先進入選擇畫面（既有對話 vs 開新對話）；對話資訊子區塊
 * 提供標題編輯／參與者列表／邀請成員／釘選（cr-spec-260803-006）
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconArrowLeft, IconX, IconUsers, IconPin, IconPinFilled, IconPencil, IconCheck, IconUserPlus } from '@tabler/icons-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ConversationThread } from './conversation-thread'
import type { ConversationSummary, ConversationWithMessages } from '@/lib/data/conversation'

type ActionResult = { success: boolean; message?: string; errors?: Record<string, string[]> }

type MessageDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: ConversationSummary[]
  selected: ConversationWithMessages | null
  selectedIsPinned: boolean
  loading: boolean
  currentUserId: string
  pickingCandidates: ConversationSummary[]
  isPicking: boolean
  onSelectConversation: (conversationId: number) => void
  onPickExisting: (conversationId: number) => void
  onPickNew: () => void
  onSend: (body: string) => Promise<ActionResult>
  onUpdateTitle: (title: string) => Promise<ActionResult>
  onInvite: (targetSpiritId: string) => Promise<ActionResult>
  onTogglePin: () => void
}

function ChannelAvatar({ conversation }: { conversation: ConversationSummary }) {
  if (conversation.isGroup) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <IconUsers className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
  const other = conversation.otherParticipants[0]
  return <UserAvatar avatarUrl={other?.avatarUrl ?? null} displayName={conversation.displayTitle} />
}

export function MessageDrawer({
  open,
  onOpenChange,
  conversations,
  selected,
  selectedIsPinned,
  loading,
  currentUserId,
  pickingCandidates,
  isPicking,
  onSelectConversation,
  onPickExisting,
  onPickNew,
  onSend,
  onUpdateTitle,
  onInvite,
  onTogglePin,
}: MessageDrawerProps) {
  const t = useTranslations('conversation')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  function handleSelect(conversationId: number) {
    onSelectConversation(conversationId)
    setMobileShowThread(true)
  }

  function handlePickExisting(conversationId: number) {
    onPickExisting(conversationId)
    setMobileShowThread(true)
  }

  function handlePickNew() {
    onPickNew()
    setMobileShowThread(true)
  }

  function startEditTitle() {
    setTitleDraft(selected?.title ?? '')
    setEditingTitle(true)
  }

  async function saveTitle() {
    const result = await onUpdateTitle(titleDraft)
    if (!result.success) {
      toast.error(result.message ?? t('sendFail'))
    }
    setEditingTitle(false)
  }

  async function handleInviteSubmit() {
    if (!inviteInput.trim()) return
    setInviteLoading(true)
    const result = await onInvite(inviteInput.trim())
    setInviteLoading(false)
    if (result.success) {
      toast.success(t('inviteSuccess'))
      setInviteInput('')
    } else {
      toast.error(result.message ?? t('inviteFail'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0">
          <DrawerTitle>{t('pageTitle')}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label={t('close')}>
              <IconX className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 左側：頻道列表 */}
          <div
            className={`w-full shrink-0 overflow-y-auto border-r sm:block sm:w-80 ${mobileShowThread ? 'hidden' : 'block'}`}
          >
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t('emptyState')}</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={`flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-muted/60 ${
                    selected?.id === c.id ? 'bg-muted' : ''
                  }`}
                >
                  <ChannelAvatar conversation={c} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {c.isPinned && <IconPinFilled className="h-3 w-3 shrink-0 text-primary" />}
                      <p className={`truncate text-sm ${c.isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {c.displayTitle}
                      </p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
                  </div>
                  {c.isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))
            )}
          </div>

          {/* 右側：選擇畫面 or 選中頻道內容 */}
          <div className={`flex w-full flex-1 min-w-0 flex-col p-4 sm:flex ${mobileShowThread ? 'flex' : 'hidden'}`}>
            <div className="mb-2 flex items-center gap-2 sm:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileShowThread(false)}>
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            {isPicking ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('pickerHint')}</p>
                {pickingCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handlePickExisting(c.id)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/60"
                  >
                    <ChannelAvatar conversation={c} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.displayTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
                    </div>
                  </button>
                ))}
                <Button variant="outline" className="w-full" onClick={handlePickNew}>
                  {t('startNewConversation')}
                </Button>
              </div>
            ) : selected ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {/* 對話資訊子區塊 */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {editingTitle ? (
                      <>
                        <Input
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          placeholder={t('titlePlaceholder')}
                          maxLength={100}
                          className="h-8 flex-1"
                        />
                        <Button size="icon" variant="ghost" className="size-8" onClick={saveTitle}>
                          <IconCheck className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="flex-1 truncate text-sm font-semibold">{selected.displayTitle}</p>
                        {selected.id && (
                          <Button size="icon" variant="ghost" className="size-8" onClick={startEditTitle}>
                            <IconPencil className="h-4 w-4" />
                          </Button>
                        )}
                        {selected.id && (
                          <Button size="icon" variant="ghost" className="size-8" onClick={onTogglePin}>
                            {selectedIsPinned ? (
                              <IconPinFilled className="h-4 w-4 text-primary" />
                            ) : (
                              <IconPin className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selected.participants.map((p) => (
                      <div key={p.userId} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1">
                        <UserAvatar avatarUrl={p.avatarUrl} displayName={p.name} size="sm" />
                        <span className="text-xs">{p.name}</span>
                      </div>
                    ))}
                  </div>

                  {selected.id && (
                    <div className="flex gap-2">
                      <Input
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder={t('invitePlaceholder')}
                        className="h-8 flex-1"
                        disabled={inviteLoading}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8 shrink-0"
                        onClick={handleInviteSubmit}
                        disabled={inviteLoading || !inviteInput.trim()}
                      >
                        <IconUserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <ConversationThread
                  key={selected.id ?? selected.participants[0]?.userId}
                  currentUserId={currentUserId}
                  messages={selected.messages}
                  onSend={onSend}
                  placeholder={t('placeholder')}
                  sendLabel={t('send')}
                  sendingLabel={t('sending')}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{loading ? t('sending') : t('selectChannelHint')}</p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
