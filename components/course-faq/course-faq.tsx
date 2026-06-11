/*
 * ----------------------------------------------
 * CourseFaq - 課程 FAQ 留言問答區塊
 * 2026-06-11
 * components/course-faq/course-faq.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconTrash, IconMessageCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  postCourseQuestion,
  replyCourseMessage,
  deleteCourseMessage,
} from '@/app/actions/course-message'
import type { CourseMessageThread } from '@/lib/data/course-message'

function formatDateTime(date: Date): string {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

interface CourseFaqProps {
  inviteId: number
  currentUserId?: string
  isInstructor: boolean
  messages: CourseMessageThread[]
}

// 刪除按鈕（含確認）
function DeleteMessageButton({ messageId }: { messageId: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await deleteCourseMessage(messageId)
      if (res.success) {
        toast.success(res.message ?? '已刪除')
        router.refresh()
      } else {
        toast.error(res.message ?? '刪除失敗')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label="刪除留言"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除留言</AlertDialogTitle>
          <AlertDialogDescription>
            此操作不可復原。若刪除的是提問，其下所有回覆也會一併刪除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            確認刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// 回覆表單（僅老師）
function ReplyForm({ parentId }: { parentId: number }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!body.trim()) {
      toast.error('請填寫內容')
      return
    }
    startTransition(async () => {
      const res = await replyCourseMessage(parentId, body)
      if (res.success) {
        toast.success(res.message ?? '已回覆')
        setBody('')
        router.refresh()
      } else {
        toast.error(res.message ?? res.errors?.body?.[0] ?? '回覆失敗')
      }
    })
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="回覆學員提問…"
        rows={2}
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? '送出中…' : '送出回覆'}
        </Button>
      </div>
    </div>
  )
}

export function CourseFaq({ inviteId, currentUserId, isInstructor, messages }: CourseFaqProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const canDelete = (authorId: string) => isInstructor || authorId === currentUserId

  const handleAsk = () => {
    if (!body.trim()) {
      toast.error('請填寫內容')
      return
    }
    startTransition(async () => {
      const res = await postCourseQuestion(inviteId, body)
      if (res.success) {
        toast.success(res.message ?? '已送出提問')
        setBody('')
        router.refresh()
      } else {
        toast.error(res.message ?? res.errors?.body?.[0] ?? '送出失敗')
      }
    })
  }

  return (
    <div className="rounded-lg border p-5 space-y-5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <IconMessageCircle className="h-4 w-4" />
        課程 FAQ
      </h2>

      {/* 提問表單（所有登入會員） */}
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="對課程有疑問嗎？在這裡提問…"
          rows={3}
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAsk} disabled={isPending}>
            {isPending ? '送出中…' : '送出提問'}
          </Button>
        </div>
      </div>

      {/* 留言串列 */}
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前還沒有提問，成為第一個提問的人吧！</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((q) => (
            <li key={q.id} className="rounded-md border p-4 space-y-3">
              {/* 提問 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{q.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(q.createdAt)}</span>
                  </div>
                  {canDelete(q.authorId) && <DeleteMessageButton messageId={q.id} />}
                </div>
                <p className="text-sm whitespace-pre-wrap">{q.body}</p>
              </div>

              {/* 回覆串 */}
              {q.replies.length > 0 && (
                <ul className="space-y-2 border-l-2 border-muted pl-3">
                  {q.replies.map((r) => (
                    <li key={r.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-primary">{r.authorName}</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">老師</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                        </div>
                        {canDelete(r.authorId) && <DeleteMessageButton messageId={r.id} />}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* 回覆表單（僅老師） */}
              {isInstructor && <ReplyForm parentId={q.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
