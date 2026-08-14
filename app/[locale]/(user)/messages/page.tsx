/*
 * ----------------------------------------------
 * 訊息頁面
 * 2026-08-14
 * app/(user)/messages/page.tsx
 *
 * 取代原本的訊息 Drawer（cr-spec-260814-001）：改為獨立頁面呈現，
 * 避免 vaul Drawer 在桌面滑鼠情境下對內容套用 user-select:none，
 * 導致訊息文字無法選取複製。
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMyConversations } from '@/lib/data/conversation'
import { MessagesPage as MessagesPageContent } from '@/components/conversation/messages-page'

interface PageProps {
  searchParams: Promise<{ with?: string }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const conversations = await getMyConversations(session.user.id)
  const sp = await searchParams

  return (
    <MessagesPageContent
      initialConversations={conversations}
      currentUserId={session.user.id}
      initialWithUserId={sp.with}
    />
  )
}
