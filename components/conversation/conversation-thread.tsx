/*
 * ----------------------------------------------
 * ConversationThread - 訊息對話串（共用元件）
 * 2026-08-03 (Updated: 2026-09-01)
 * components/conversation/conversation-thread.tsx
 *
 * 不含固定文案字串，寄件者名稱／訊息內容皆由 props 傳入，
 * placeholder／送出按鈕文字由呼叫端決定語言；
 * 不假設固定 conversationId，由呼叫端（MessageDrawer）決定
 * onSend 要建立新對話還是在既有對話中回覆（cr-spec-260803-004）。
 * 2026-09-01（cr-spec-260901-004）：最外層改彈性高（flex-1 min-h-0），
 * 高度由父容器決定；MessageScroller 外框改 sm: 斷點——手機不套外框。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/shared/user-avatar'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller'

export type ConversationThreadMessage = {
  id: number
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: Date
}

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

type ConversationThreadProps = {
  currentUserId: string
  messages: ConversationThreadMessage[]
  onSend: (body: string) => Promise<ActionResponse>
  placeholder?: string
  sendLabel?: string
  sendingLabel?: string
}

export function ConversationThread({
  currentUserId,
  messages,
  onSend,
  placeholder = '輸入訊息內容…',
  sendLabel = '送出',
  sendingLabel = '送出中…',
}: ConversationThreadProps) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!body.trim()) return
    setLoading(true)
    const result = await onSend(body)
    setLoading(false)
    if (result.success) {
      setBody('')
    } else {
      toast.error(result.errors?.body?.[0] ?? result.message ?? '送出失敗，請稍後再試')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <MessageScrollerProvider>
        <MessageScroller className="flex-1 min-h-0 sm:rounded-lg sm:border">
          <MessageScrollerViewport className="p-4">
            <MessageScrollerContent>
              {messages.map((m) => {
                const align = m.authorId === currentUserId ? 'end' : 'start'
                return (
                  <MessageScrollerItem key={m.id} scrollAnchor={m.id === messages[messages.length - 1]?.id}>
                    <Message align={align}>
                      <MessageAvatar>
                        <UserAvatar avatarUrl={m.authorAvatarUrl} displayName={m.authorName} size="sm" />
                      </MessageAvatar>
                      <MessageContent>
                        <MessageHeader>{m.authorName}</MessageHeader>
                        <div className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap break-words">
                          {m.body}
                        </div>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button onClick={handleSend} disabled={loading || !body.trim()}>
          {loading ? sendingLabel : sendLabel}
        </Button>
      </div>
    </div>
  )
}
