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
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('course.faq')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await deleteCourseMessage(messageId)
      if (res.success) {
        toast.success(res.message ?? t('deleted'))
        router.refresh()
      } else {
        toast.error(res.message ?? t('deleteFail'))
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
          aria-label={t('deleteTitle')}
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteWarning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('confirmDelete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// 回覆表單（僅老師）
function ReplyForm({ parentId }: { parentId: number }) {
  const t = useTranslations('course.faq')
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!body.trim()) {
      toast.error(t('validateContent'))
      return
    }
    startTransition(async () => {
      const res = await replyCourseMessage(parentId, body)
      if (res.success) {
        toast.success(res.message ?? t('replied'))
        setBody('')
        router.refresh()
      } else {
        toast.error(res.message ?? res.errors?.body?.[0] ?? t('replyFail'))
      }
    })
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('replyPlaceholder')}
        rows={2}
        disabled={isPending}
        className="text-sm"
      />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? t('submitting') : t('submitReply')}
        </Button>
      </div>
    </div>
  )
}

export function CourseFaq({ inviteId, currentUserId, isInstructor, messages }: CourseFaqProps) {
  const t = useTranslations('course.faq')
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const canDelete = (authorId: string) => isInstructor || authorId === currentUserId

  const handleAsk = () => {
    if (!body.trim()) {
      toast.error(t('validateContent'))
      return
    }
    startTransition(async () => {
      const res = await postCourseQuestion(inviteId, body)
      if (res.success) {
        toast.success(res.message ?? t('asked'))
        setBody('')
        router.refresh()
      } else {
        toast.error(res.message ?? res.errors?.body?.[0] ?? t('askFail'))
      }
    })
  }

  return (
    <div className="rounded-lg border p-5 space-y-5">
      <div className="flex items-center gap-2">
        <IconMessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">{t('title')}</h2>
      </div>

      {/* 提問表單（所有登入會員） */}
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('askPlaceholder')}
          rows={3}
          disabled={isPending}
          className="text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={handleAsk} disabled={isPending}>
            {isPending ? t('submitting') : t('submitAsk')}
          </Button>
        </div>
      </div>

      {/* 留言串列 */}
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isInstructor ? t('emptyTeacher') : t('emptyStudent')}
        </p>
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
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{t('teacherTag')}</span>
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
