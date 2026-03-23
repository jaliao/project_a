/*
 * ----------------------------------------------
 * Topbar - 頂部工具列
 * 2026-03-23
 * components/layout/topbar.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconSchool, IconUser, IconBell } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { CourseOrderDialog } from '@/components/course-order/course-order-dialog'

export function Topbar() {
  const router = useRouter()
  const [isOrderOpen, setIsOrderOpen] = useState(false)

  return (
    <header className="flex h-16 items-center border-b px-4 gap-4">
      {/* 系統標題 */}
      <span className="font-semibold text-lg flex-1">啟動靈人系統</span>

      {/* 右側操作按鈕群組 */}
      <div className="flex items-center gap-2">
        {/* 新增課程 */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsOrderOpen(true)}
        >
          <IconSchool className="h-4 w-4 mr-1.5" />
          新增課程
        </Button>

        <CourseOrderDialog open={isOrderOpen} onOpenChange={setIsOrderOpen} />

        {/* 個人資料 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/profile')}
          title="個人資料"
        >
          <IconUser className="h-5 w-5" />
        </Button>

        {/* 訊息（預留，無 Badge） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => console.log('訊息 - 預留')}
          title="訊息"
        >
          <IconBell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
