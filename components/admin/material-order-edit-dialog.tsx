/*
 * ----------------------------------------------
 * MaterialOrderEditDialog - 管理者編輯教材申請資料
 * 2026-04-02
 * components/admin/material-order-edit-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  adminMaterialOrderEditSchema,
  type AdminMaterialOrderEditValues,
} from '@/lib/schemas/course-order'
import { updateMaterialOrderAdmin } from '@/app/actions/course-order'

interface MaterialOrderEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  defaultValues: {
    buyerNameZh: string
    buyerNameEn: string
    teacherName: string
    churchOrg: string
    email: string
    phone: string
    courseDate: string
    taxId: string | null
  }
}

export function MaterialOrderEditDialog({
  open,
  onOpenChange,
  orderId,
  defaultValues,
}: MaterialOrderEditDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<AdminMaterialOrderEditValues>({
    resolver: zodResolver(adminMaterialOrderEditSchema),
    defaultValues: {
      buyerNameZh: defaultValues.buyerNameZh,
      buyerNameEn: defaultValues.buyerNameEn,
      teacherName: defaultValues.teacherName,
      churchOrg: defaultValues.churchOrg,
      email: defaultValues.email,
      phone: defaultValues.phone,
      courseDate: defaultValues.courseDate,
      taxId: defaultValues.taxId ?? '',
    },
  })

  const onSubmit = (values: AdminMaterialOrderEditValues) => {
    startTransition(async () => {
      const result = await updateMaterialOrderAdmin(
        orderId,
        values as Record<string, string>
      )
      if (result.success) {
        toast.success(result.message ?? '已更新申請資料')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? '更新失敗，請稍後再試')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>編輯申請資料</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="buyerNameZh" render={({ field }) => (
              <FormItem>
                <FormLabel>購買人中文姓名 *</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="buyerNameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>購買人英文姓名 *</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="teacherName" render={({ field }) => (
              <FormItem>
                <FormLabel>教師姓名 *</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="churchOrg" render={({ field }) => (
              <FormItem>
                <FormLabel>所屬教會/單位 *</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl><Input type="email" {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>聯絡電話 *</FormLabel>
                <FormControl><Input type="tel" {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="courseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>預計開課日期 *</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem>
                <FormLabel>統一編號（選填）</FormLabel>
                <FormControl><Input {...field} disabled={isPending} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '儲存中…' : '儲存'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
