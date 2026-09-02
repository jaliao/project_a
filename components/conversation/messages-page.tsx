/*
 * ----------------------------------------------
 * MessagesPage - 社群頁面內容（頁首＋「好友 | 訊息」頁籤；訊息＝頻道列表＋選中頻道）
 * 2026-08-14 (Updated: 2026-09-01)
 * components/conversation/messages-page.tsx
 *
 * 2026-09-01（cr-spec-260901-004）：訊息頁籤行動裝置版面優化——面板改 100dvh
 * 彈性高（min-h-0 鏈，輸入框不被 Footer 遮蔽）、手機移除巢狀外框、
 * 返回頻道列表鍵移入對話標題列右上角（移除獨立返回列）。
 * 2026-09-01（cr-spec-260901-006）：成員清單與邀請加入改由標題列「成員」按鈕
 * 開啟的 ConversationMembersDialog（桌機/手機一致）；標題區不再行內顯示
 * 成員 chips 與邀請輸入框。
 * 2026-09-01（cr-spec-260901-007）：openWithUser 改為「與對象已有一筆以上
 * 既有對話 → 直接開啟其中『最後訊息時間最新』的一筆」，移除既有對話選擇
 * 畫面（picker）與「開新對話」入口；尚無對話仍直接進新對話畫面。
 * 2026-09-02（cr-spec-260902-001）：加好友介面改置中彈窗（AddFriendDialog）；
 * 「傳訊息」入口只開一對一對話（由 lib/data/conversation.ts findConversationsWithUser
 * 收斂實現，本檔 openWithUser 不改）。
 *
 * 取代原本的 MessageDrawerProvider + MessageDrawer（cr-spec-260814-001）：
 * 狀態邏輯與 UI 合併為單一頁面內容元件，不再包 Drawer wrapper，
 * 讓訊息文字在桌面瀏覽器可正常選取複製。透過 initialWithUserId
 * （對應網址 ?with=）指定初次要對話的對象。
 * ----------------------------------------------
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconArrowLeft, IconUsers, IconPin, IconPinFilled, IconPencil, IconCheck, IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ConversationThread } from './conversation-thread'
import { ConversationMembersDialog } from './conversation-members-dialog'
import { AddFriendDialog } from '@/components/community/add-friend-dialog'
import { FriendsList } from '@/components/community/friends-list'
import {
  fetchMyConversations,
  fetchConversationMessages,
  fetchConversationsWithUser,
  fetchPreviewNewConversation,
  sendConversationMessage,
  startConversation,
  updateConversationTitle,
  togglePinConversation,
} from '@/app/actions/conversation'
import { fetchMyFriends } from '@/app/actions/friendship'
import type { ConversationSummary, ConversationWithMessages } from '@/lib/data/conversation'
import type { FriendListItem } from '@/lib/data/friendship'

type ActionResult = { success: boolean; message?: string; errors?: Record<string, string[]> }

type MessagesPageProps = {
  initialConversations: ConversationSummary[]
  initialFriends: FriendListItem[]
  currentUserId: string
  mySpiritId: string | null
  initialTab?: 'friends' | 'messages'
  initialWithUserId?: string
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

export function MessagesPage({
  initialConversations,
  initialFriends,
  currentUserId,
  mySpiritId,
  initialTab,
  initialWithUserId,
}: MessagesPageProps) {
  const t = useTranslations('conversation')
  const tCommunity = useTranslations('community')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [friends, setFriends] = useState(initialFriends)
  const [addOpen, setAddOpen] = useState(false)
  // 頁籤：帶 ?with= 時強制「訊息」，否則依 ?tab=（預設「好友」）
  const [tab, setTab] = useState<'friends' | 'messages'>(
    initialWithUserId ? 'messages' : initialTab ?? 'friends'
  )
  const [selected, setSelected] = useState<ConversationWithMessages | null>(null)
  const [loading, setLoading] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [membersOpen, setMembersOpen] = useState(false)

  const selectedSummary = selected?.id ? conversations.find((c) => c.id === selected.id) : undefined
  const selectedIsPinned = selectedSummary?.isPinned ?? false

  const refreshConversations = useCallback(async () => {
    const list = await fetchMyConversations()
    setConversations(list)
  }, [])

  const startNewWithTarget = useCallback(async (targetUserId: string) => {
    setLoading(true)
    const detail = await fetchPreviewNewConversation(targetUserId)
    setSelected(detail)
    setLoading(false)
    setMobileShowThread(true)
  }, [])

  const selectConversation = useCallback(
    async (conversationId: number) => {
      setLoading(true)
      const detail = await fetchConversationMessages(conversationId)
      setSelected(detail)
      setLoading(false)
      setMobileShowThread(true)
      refreshConversations()
    },
    [refreshConversations]
  )

  // 以某對象起對話：無既有對話 → 直接開新對話畫面；
  // 有一筆以上 → 直接開啟「最後訊息時間最新」的一筆（不再顯示選擇畫面）。
  // （供 ?with= 深連結與「好友」頁籤卡片「傳訊息」共用）
  const openWithUser = useCallback(
    async (targetUserId: string) => {
      setLoading(true)
      const candidates = await fetchConversationsWithUser(targetUserId)
      setLoading(false)
      if (candidates.length === 0) {
        startNewWithTarget(targetUserId)
        return
      }
      const latest = [...candidates].sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
      )[0]
      selectConversation(latest.id)
    },
    [startNewWithTarget, selectConversation]
  )

  const reloadFriends = useCallback(async () => {
    setFriends(await fetchMyFriends())
  }, [])

  // 切換頁籤並同步 ?tab=（淺導航，不重載）
  const changeTab = useCallback(
    (next: string) => {
      const value = next === 'messages' ? 'messages' : 'friends'
      setTab(value)
      router.replace(`/messages?tab=${value}`, { scroll: false })
    },
    [router]
  )

  // 掛載時若帶入指定對象（?with=），比照原本 openMessageDrawer(targetUserId) 的邏輯
  useEffect(() => {
    if (!initialWithUserId) return
    openWithUser(initialWithUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWithUserId])

  function startEditTitle() {
    setTitleDraft(selected?.title ?? '')
    setEditingTitle(true)
  }

  async function saveTitle() {
    if (!selected?.id) {
      setEditingTitle(false)
      return
    }
    const result = await updateConversationTitle(selected.id, titleDraft)
    if (result.success) {
      setSelected(await fetchConversationMessages(selected.id))
      refreshConversations()
    } else {
      toast.error(result.message ?? t('sendFail'))
    }
    setEditingTitle(false)
  }

  const handleMembersInvited = useCallback(async () => {
    if (!selected?.id) return
    setSelected(await fetchConversationMessages(selected.id))
    refreshConversations()
  }, [selected?.id, refreshConversations])

  async function handleTogglePin() {
    if (!selected?.id) return
    await togglePinConversation(selected.id)
    refreshConversations()
  }

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
        setSelected(await fetchConversationMessages(result.conversationId))
        refreshConversations()
      }
      return result
    },
    [selected, refreshConversations]
  )

  function handleSelect(conversationId: number) {
    selectConversation(conversationId)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tCommunity('title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <IconUserPlus className="mr-1 h-4 w-4" />
          {tCommunity('addFriend')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="friends">{tCommunity('tabFriends')}</TabsTrigger>
          <TabsTrigger value="messages">{tCommunity('tabMessages')}</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendsList
            friends={friends}
            onOpenConversation={(uid) => {
              changeTab('messages')
              openWithUser(uid)
            }}
            onRemoved={reloadFriends}
          />
        </TabsContent>

        <TabsContent value="messages">
      {/* 手機面板高度＝100dvh 扣掉實際外框（Topbar 4rem＋main py-6 3rem＋頁首 ~2.75rem
          ＋TabsList ~3.25rem＋Footer ~3rem ≒ 16rem）；扣太少會讓外層 document 可捲，
          送出訊息後畫面被帶離輸入框（cr-spec-260901-007 修正，原為 13rem）。 */}
      <div className="flex h-[calc(100dvh-16rem)] min-h-[24rem] overflow-hidden sm:h-[calc(100vh-16rem)] sm:min-h-[28rem] sm:rounded-lg sm:border">
        {/* 左側：頻道列表 */}
        <div
          className={`w-full shrink-0 overflow-y-auto sm:block sm:w-80 sm:border-r ${mobileShowThread ? 'hidden' : 'block'}`}
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
        <div className={`flex w-full flex-1 min-w-0 min-h-0 flex-col p-4 sm:flex ${mobileShowThread ? 'flex' : 'hidden'}`}>
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {/* 對話資訊子區塊 */}
              <div className="space-y-2 border-b pb-3 sm:rounded-lg sm:border sm:p-3">
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
                        <Button size="icon" variant="ghost" className="size-8" onClick={handleTogglePin}>
                          {selectedIsPinned ? (
                            <IconPinFilled className="h-4 w-4 text-primary" />
                          ) : (
                            <IconPin className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {selected.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label={t('membersTitle')}
                          title={t('membersTitle')}
                          onClick={() => setMembersOpen(true)}
                        >
                          <IconUsers className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {/* 手機：返回頻道列表（與標題同一列、置右上角） */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0 sm:hidden"
                    aria-label={tCommon('back')}
                    title={tCommon('back')}
                    onClick={() => setMobileShowThread(false)}
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ConversationMembersDialog
                open={membersOpen}
                onOpenChange={setMembersOpen}
                conversationId={selected.id ?? undefined}
                participants={selected.participants}
                friends={friends}
                onInvited={handleMembersInvited}
              />

              <ConversationThread
                key={selected.id ?? selected.participants[0]?.userId}
                currentUserId={currentUserId}
                messages={selected.messages}
                onSend={handleSend}
                placeholder={t('placeholder')}
                sendLabel={t('send')}
                sendingLabel={t('sending')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-1 flex items-center justify-between gap-2 sm:hidden">
                <span className="text-sm text-muted-foreground">
                  {loading ? t('sending') : t('selectChannelHint')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={tCommon('back')}
                  title={tCommon('back')}
                  onClick={() => setMobileShowThread(false)}
                >
                  <IconArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {loading ? t('sending') : t('selectChannelHint')}
              </p>
            </div>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>

      <AddFriendDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mySpiritId={mySpiritId}
        onFriendAdded={reloadFriends}
      />
    </div>
  )
}
