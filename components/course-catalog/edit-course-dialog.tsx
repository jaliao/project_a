/*
 * ----------------------------------------------
 * EditCourseDialog - 編輯課程設定 Dialog
 * 2026-03-30
 * components/course-catalog/edit-course-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateCourse } from '@/app/actions/course-catalog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'

interface EditCourseDialogProps {
  course: CourseCatalogEntry
  allCourses: CourseCatalogEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCourseDialog({ course, allCourses, open, onOpenChange }: EditCourseDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [label, setLabel] = useState(course.label)
  const [description, setDescription] = useState(course.description ?? '')
  const [isActive, setIsActive] = useState(course.isActive)
  const [prerequisiteIds, setPrerequisiteIds] = useState<number[]>(
    course.prerequisites.map((p) => p.id)
  )

  // 可選先修課程（排除自身）
  const prereqOptions = allCourses.filter((c) => c.id !== course.id)

  const togglePrereq = (id: number, checked: boolean) => {
    setPrerequisiteIds((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id)
    )
  }

  const handleSubmit = () => {
    if (!label.trim()) {
      toast.error('課程名稱不可為空')
      return
    }
    startTransition(async () => {
      const result = await updateCourse(course.id, {
        label: label.trim(),
        description: description.trim() || null,
        isActive,
        prerequisiteIds,
      })
      if (result.success) {
        toast.success(result.message ?? '已更新')
        onOpenChange(false)
      } else {
        toast.error(result.message ?? '更新失敗')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>編輯課程設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* 課程名稱 */}
          <div className="space-y-1.5">
            <Label>課程名稱</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="輸入課程名稱"
              disabled={isPending}
            />
          </div>

          {/* 課程簡介 */}
          <div className="space-y-1.5">
            <Label>課程簡介（選填）</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="輸入課程簡介"
              disabled={isPending}
            />
          </div>

          {/* isActive */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">開放狀態</p>
              <p className="text-xs text-muted-foreground">開放後可被選擇開課與報名</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
          </div>

          {/* 先修課程 */}
          {prereqOptions.length > 0 && (
            <div className="space-y-2">
              <Label>先修課程</Label>
              <p className="text-xs text-muted-foreground">學員與教師須完成以下課程才可報名或開設此課程</p>
              <div className="space-y-2">
                {prereqOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`prereq-${option.id}`}
                      checked={prerequisiteIds.includes(option.id)}
                      onCheckedChange={(checked) => togglePrereq(option.id, !!checked)}
                      disabled={isPending}
                    />
                    <label
                      htmlFor={`prereq-${option.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
              {isPending ? '儲存中…' : '儲存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
