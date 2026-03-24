## Context

Dashboard 首頁（`app/(user)/dashboard/page.tsx`）目前為 Server Component，已有統計卡片、ProfileBanner、CourseSessionDialog、EnrolledStudentsList、RecentMembers 等區塊。session.user.role 透過 JWT 傳入，Server Component 可直接讀取判斷角色。本次僅調整 UI 結構，不新增 Server Action 或 DB 查詢。

## Goals / Non-Goals

**Goals:**
- 將 Dashboard 重組為「學習」、「授課」、「管理者」三個功能單元區塊
- 管理者區塊依 `session.user.role`（admin / superadmin）條件顯示
- 功能按鈕佔位（disabled），視覺完整但無功能
- 整合現有 CourseSessionDialog 至授課單元

**Non-Goals:**
- 不實作「加入學習」、「開課查詢」的實際功能
- 不建立 `/admin` 後台頁面
- 不新增 DB schema 或 Server Action

## Decisions

### 1. 功能單元直接內嵌於 page.tsx
功能單元 UI 簡單（卡片 + 按鈕），不拆成獨立元件，直接內嵌於 `page.tsx` 減少檔案數量。若日後複雜化再抽離。

### 2. 角色判斷在 Server Component
`session` 已在 page.tsx 取得，直接 `session?.user?.role === 'admin' || === 'superadmin'` 條件渲染管理者區塊，無需 Client Component 或額外 API。

### 3. 佔位按鈕使用 disabled 樣式
「加入學習」、「開課查詢」使用 `<Button disabled>` 加 `coming soon` tooltip 或 badge，視覺上清楚表達功能未開放。

### 4. 保留現有區塊位置
ProfileBanner 與 RecentMembers 維持現有位置（頁首與頁尾），三個功能單元插入統計卡片下方。

## Risks / Trade-offs

- **現有「快速連結」與「開課管理」區塊移除**：功能整合進新單元，現有連結不丟失（學習紀錄移至學習單元，CourseSessionDialog 移至授課單元）
- **未來功能上線需修改此頁**：佔位按鈕需逐步替換為實際功能，耦合在同一檔案較易維護

## Migration Plan

直接修改 `app/(user)/dashboard/page.tsx`，移除舊區塊、加入新三欄結構。不需 migration。
