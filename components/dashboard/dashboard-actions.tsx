/*
 * ----------------------------------------------
 * DashboardActions - 首頁快速操作區（Client）
 * 2026-03-23
 * components/dashboard/dashboard-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { IconSpeakerphone, IconListCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { CreateInviteDialog } from '@/components/course-invite/create-invite-dialog'

interface Order {
  id: number
  buyerNameZh: string
  courseDate: string
}

interface DashboardActionsProps {
  orders: Order[]
}

export function DashboardActions({ orders }: DashboardActionsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // 偵測 ?enrolled=1，顯示 toast 後清除 query param
  useEffect(() => {
    if (searchParams.get('enrolled') === '1') {
      toast.success('已成功加入課程！')
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  return (
    <>
      <div className="flex items-center gap-3">
        <Button onClick={() => setIsInviteOpen(true)}>
          <IconSpeakerphone className="h-4 w-4 mr-1.5" />
          開課邀請
        </Button>
        <Button variant="outline" onClick={() => router.push('/invites')}>
          <IconListCheck className="h-4 w-4 mr-1.5" />
          查看邀請進度
        </Button>
      </div>

      <CreateInviteDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        orders={orders}
      />
    </>
  )
}
