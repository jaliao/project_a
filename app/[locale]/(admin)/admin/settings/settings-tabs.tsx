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
import { ClassCapacityForm } from '@/components/admin/class-capacity-form'
import { RemittanceAccountForm } from '@/components/admin/remittance-account-form'
import { GraduationEmailForm } from '@/components/admin/graduation-email-form'
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
  isSuperadmin: boolean
  currentDepth: number
  classMaxCapacity: number
  remittanceAccount: string
  graduationSubject: string
  graduationBody: string
  churches: Church[]
  courses: CourseCatalogEntry[]
}

export function SettingsTabs({ activeTab, isSuperadmin, currentDepth, classMaxCapacity, remittanceAccount, graduationSubject, graduationBody, churches, courses }: SettingsTabsProps) {
  const router = useRouter()

  return (
    <Tabs value={activeTab} onValueChange={(v) => router.push(`?tab=${v}`)}>
      <TabsList>
        <TabsTrigger value="basic">基本設定</TabsTrigger>
        <TabsTrigger value="churches">教會代碼維護</TabsTrigger>
        <TabsTrigger value="courses">課程目錄管理</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        {isSuperadmin ? (
          <div className="rounded-lg border p-5 space-y-4 max-w-md">
            <div>
              <h2 className="font-medium">學習階層展開深度</h2>
              <p className="text-sm text-muted-foreground mt-1">
                會員詳情頁「學習階層」分頁向下展開的層數（1–10），預設為 3。
              </p>
            </div>
            <HierarchyDepthForm currentDepth={currentDepth} />

            <div className="border-t pt-4">
              <h2 className="font-medium">班級人數上限</h2>
              <p className="text-sm text-muted-foreground mt-1">
                開課與編輯課程時，老師可設定的每班人數上限（1–99），預設為 7。管理者編輯個別班級時可超過此上限。
              </p>
            </div>
            <ClassCapacityForm current={classMaxCapacity} />

            <div className="border-t pt-4">
              <h2 className="font-medium">教材匯款帳號</h2>
              <p className="text-sm text-muted-foreground mt-1">
                教材繳費批價時提供給老師的匯款帳號，批價表單會預設帶入此值。
              </p>
            </div>
            <RemittanceAccountForm currentAccount={remittanceAccount} />

            <div className="border-t pt-4">
              <h2 className="font-medium">結業信範本</h2>
              <p className="text-sm text-muted-foreground mt-1">
                老師確認結業時，自動寄給結業學員的信件主旨與內文。
              </p>
            </div>
            <GraduationEmailForm currentSubject={graduationSubject} currentBody={graduationBody} />
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
