/*
 * ----------------------------------------------
 * 結業信範本設定表單（主旨＋內文）
 * 2026-06-21
 * components/admin/graduation-email-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateGraduationEmailTemplate } from '@/app/actions/admin-settings'

export function GraduationEmailForm({
  currentSubject,
  currentBody,
}: {
  currentSubject: string
  currentBody: string
}) {
  const [subject, setSubject] = useState(currentSubject)
  const [body, setBody] = useState(currentBody)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await updateGraduationEmailTemplate(subject, body)
      if (result.success) {
        setMessage(result.message ?? '結業信範本已儲存')
      } else {
        setError(result.errors?.subject?.[0] ?? result.errors?.body?.[0] ?? result.message ?? '儲存失敗')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
      <div className="space-y-1">
        <label className="text-sm font-medium">主旨</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">內文</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
      </div>
      <p className="text-xs text-muted-foreground">
        可用變數：<code>{'{{studentName}}'}</code>（學員姓名）、<code>{'{{courseName}}'}</code>（課程名稱）、
        <code>{'{{graduationDate}}'}</code>（結業日期）、<code>{'{{spiritId}}'}</code>（靈人編號）
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {message && <p className="text-xs text-green-600">{message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '儲存中…' : '儲存'}
      </Button>
    </form>
  )
}
