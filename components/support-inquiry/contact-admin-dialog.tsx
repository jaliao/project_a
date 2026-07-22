/*
 * ----------------------------------------------
 * ContactAdminDialog - 聯繫管理者提問 Dialog
 * 2026-07-22
 * components/support-inquiry/contact-admin-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

type Category = 'account' | 'course' | 'material' | 'other'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactAdminDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('supportInquiry')
  const router = useRouter()
  const [category, setCategory] = useState<Category | ''>('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
    { value: 'account', label: t('categoryAccount') },
    { value: 'course', label: t('categoryCourse') },
    { value: 'material', label: t('categoryMaterial') },
    { value: 'other', label: t('categoryOther') },
  ]

  function handleClose() {
    setCategory('')
    setBody('')
    setErrors({})
    onOpenChange(false)
  }

  async function handleSubmit() {
    setLoading(true)
    setErrors({})
    const result = await submitInquiry({ category, body })
    setLoading(false)
    if (result.success) {
      toast.success(t('submitSuccess'))
      handleClose()
      router.refresh()
    } else if (result.errors) {
      setErrors(result.errors)
    } else {
      toast.error(result.message ?? t('submitFail'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('categoryLabel')}</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)} disabled={loading}>
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
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('bodyLabel')}</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('bodyPlaceholder')}
              rows={5}
              disabled={loading}
            />
            <FieldError message={errors.body?.[0]} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !category || !body.trim()}>
            {loading ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
