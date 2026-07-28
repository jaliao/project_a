/*
 * ----------------------------------------------
 * SupportInquiryForm - 聯絡管理者提問表單（核心邏輯）
 * 2026-07-22
 * components/support-inquiry/support-inquiry-form.tsx
 *
 * 可供 Dialog 外殼（課程頁，固定分類）或頁面內嵌（個人專區，四選一）共用。
 * ----------------------------------------------
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { submitInquiry } from '@/app/actions/support-inquiry'
import { isDeploymentMismatchError } from '@/lib/utils/server-action-error'

type Category = 'account' | 'course' | 'material' | 'other'

type Props = {
  // 提供時隱藏分類 Select，改顯示固定分類文字（供課程頁使用）
  fixedCategory?: Category
  // 隨表單一併送出，記錄此提問來自哪個課程
  courseInviteId?: number
  onSuccess?: () => void
  // 提供時於送出按鈕左側顯示「取消」按鈕（供 Dialog 外殼使用）
  onCancel?: () => void
}

// 課程頁 Dialog 依課程區分草稿；個人頁卡片與我的提問頁為同一類一般提問，共用草稿
function getDraftStorageKey(courseInviteId?: number) {
  return courseInviteId ? `supportInquiryDraft:course:${courseInviteId}` : 'supportInquiryDraft:general'
}

export function SupportInquiryForm({ fixedCategory, courseInviteId, onSuccess, onCancel }: Props) {
  const t = useTranslations('supportInquiry')
  const router = useRouter()
  const [category, setCategory] = useState<Category | ''>(fixedCategory ?? '')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const draftKey = getDraftStorageKey(courseInviteId)

  // 掛載時還原草稿（例如因部署版本不符提示而重新整理頁面後）
  useEffect(() => {
    const raw = sessionStorage.getItem(draftKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as { category?: Category | ''; body?: string }
      if (draft.body) setBody(draft.body)
      if (!fixedCategory && draft.category) setCategory(draft.category)
    } catch {
      sessionStorage.removeItem(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  function saveDraft(nextCategory: Category | '', nextBody: string) {
    if (!nextBody && !nextCategory) {
      sessionStorage.removeItem(draftKey)
      return
    }
    sessionStorage.setItem(draftKey, JSON.stringify({ category: nextCategory, body: nextBody }))
  }

  function clearDraft() {
    sessionStorage.removeItem(draftKey)
  }

  const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
    { value: 'account', label: t('categoryAccount') },
    { value: 'course', label: t('categoryCourse') },
    { value: 'material', label: t('categoryMaterial') },
    { value: 'other', label: t('categoryOther') },
  ]

  const fixedCategoryLabel =
    fixedCategory === 'account'
      ? t('categoryAccount')
      : fixedCategory === 'course'
        ? t('categoryCourse')
        : fixedCategory === 'material'
          ? t('categoryMaterial')
          : fixedCategory === 'other'
            ? t('categoryOther')
            : ''

  async function handleSubmit() {
    setLoading(true)
    setErrors({})
    try {
      const result = await submitInquiry({ category, body, courseInviteId })
      if (result.success) {
        toast.success(t('submitSuccess'))
        clearDraft()
        setBody('')
        if (!fixedCategory) setCategory('')
        router.refresh()
        onSuccess?.()
      } else if (result.errors) {
        setErrors(result.errors)
      } else {
        toast.error(result.message ?? t('submitFail'))
      }
    } catch (error) {
      if (isDeploymentMismatchError(error)) {
        toast.error(t('deploymentMismatch'), {
          duration: Infinity,
          action: { label: t('refreshPage'), onClick: () => window.location.reload() },
        })
      } else {
        toast.error(t('submitFail'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('categoryLabel')}</label>
        {fixedCategory ? (
          <p className="text-sm text-muted-foreground">
            {fixedCategoryLabel}
            <span className="ml-1.5 text-xs">（{t('courseCategoryFixedNote')}）</span>
          </p>
        ) : (
          <>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as Category)
                saveDraft(v as Category, body)
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.category?.[0]} />
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('bodyLabel')}</label>
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            saveDraft(category, e.target.value)
          }}
          placeholder={t('bodyPlaceholder')}
          rows={5}
          disabled={loading}
        />
        <FieldError message={errors.body?.[0]} />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={loading || !category || !body.trim()}>
          {loading ? t('submitting') : t('submit')}
        </Button>
      </div>
    </div>
  )
}
