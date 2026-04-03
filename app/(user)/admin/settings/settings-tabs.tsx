/*
 * ----------------------------------------------
 * 系統設定 Tabs 元件（Client Component）
 * 2026-04-03 (Updated: 2026-04-03)
 * app/(user)/admin/settings/settings-tabs.tsx
 * ----------------------------------------------
 */

'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HierarchyDepthForm } from '@/components/admin/hierarchy-depth-form'
import { ChurchList } from '@/components/admin/church-list'
import { CourseCatalogTable } from '@/components/course-catalog/course-catalog-table'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'

type Church = {
  id: number
  name: string
  isActive: boolean
  sortOrder: number
  memberCount: number
}

interface SettingsTabsProps {
  activeTab: string
  role: string
  currentDepth: number
  churches: Church[]
  courses: CourseCatalogEntry[]
}

export function SettingsTabs({ activeTab, role, currentDepth, churches, courses }: SettingsTabsProps) {
  const router = useRouter()

  return (
    <Tabs value={activeTab} onValueChange={(v) => router.push(`?tab=${v}`)}>
      <TabsList>
        <TabsTrigger value="basic">基本設定</TabsTrigger>
        <TabsTrigger value="churches">教會代碼維護</TabsTrigger>
        <TabsTrigger value="courses">課程目錄管理</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        {role === 'superadmin' ? (
          <div className="rounded-lg border p-5 space-y-4 max-w-md">
            <div>
              <h2 className="font-medium">學習階層展開深度</h2>
              <p className="text-sm text-muted-foreground mt-1">
                會員詳情頁「學習階層」分頁向下展開的層數（1–10），預設為 3。
              </p>
            </div>
            <HierarchyDepthForm currentDepth={currentDepth} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">此設定需 superadmin 權限。</p>
        )}
      </TabsContent>

      <TabsContent value="churches" className="mt-6">
        <ChurchList churches={churches} />
      </TabsContent>

      <TabsContent value="courses" className="mt-6">
        <CourseCatalogTable courses={courses} />
      </TabsContent>
    </Tabs>
  )
}
