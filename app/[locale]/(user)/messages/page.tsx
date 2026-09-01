/*
 * ----------------------------------------------
 * 社群頁面（原「訊息」頁；cr-spec-260901-003 更名並加「好友 | 訊息」頁籤）
 * 2026-08-14 (Updated: 2026-09-01)
 * app/(user)/messages/page.tsx
 *
 * 取代原本的訊息 Drawer（cr-spec-260814-001）：以獨立頁面呈現，
 * 避免 vaul Drawer 在桌面滑鼠情境下對內容套用 user-select:none。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMyConversations } from '@/lib/data/conversation'
import { getMyFriends } from '@/lib/data/friendship'
import { MessagesPage as MessagesPageContent } from '@/components/conversation/messages-page'

export const metadata: Metadata = {
  title: '社群 — 啟動事工',
}

interface PageProps {
  searchParams: Promise<{ with?: string; tab?: string }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sp = await searchParams
  const [conversations, friends] = await Promise.all([
    getMyConversations(session.user.id),
    getMyFriends(session.user.id),
  ])

  return (
    <MessagesPageContent
      initialConversations={conversations}
      initialFriends={friends}
      currentUserId={session.user.id}
      mySpiritId={session.user.spiritId ?? null}
      initialTab={sp.tab === 'messages' ? 'messages' : 'friends'}
      initialWithUserId={sp.with}
    />
  )
}
