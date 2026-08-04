## Why

後台教材申請管理頁（`/admin/materials`）目前列表一次顯示所有狀態的申請，數量一多不易找到需要處理的項目；列表的「講師」欄位直接顯示 Email，不符合機敏欄位最小揭露原則（Email 屬聯繫用途，不應在列表無謂曝光）；展開詳情時雖有各種欄位，但沒有一個統一、可直接檢視/聯繫該講師的入口。

## What Changes

- **進度分頁籤**：`/admin/materials` 新增分頁籤：全部｜待處理｜已完成。「待處理」SHALL 涵蓋除「已完成」外的所有狀態（待批價、待付款、待確認收款、待寄送）；「已完成」SHALL 涵蓋已寄送、已收件。分頁籤為純前端篩選（資料已一次撈取，不重新查詢），預設顯示「全部」。
- **列表講師欄位移除 Email**：列表「講師」欄位 SHALL NOT 顯示 Email，僅顯示姓名（既有行為不變）。
- **新增可重用元件「會員標籤」（`MemberTag`，後台專用）**：顯示會員的啟動編號、身分標籤（沿用 `identity-tags` 既有計算邏輯）、頭像、顯示名稱（暱稱／真實名稱，沿用 `getMemberDisplayName`），並提供「檢視」（開新分頁導向 `/admin/members/{id}`）與「訊息」（開啟既有訊息 Drawer，`openMessageDrawer(userId)`）兩個圖示按鈕。
- **教材申請詳情整合會員標籤**：展開教材申請詳情時，SHALL 新增以「會員標籤」呈現該筆申請關聯的講師（`CourseInvite.createdBy`）；無關聯講師（獨立訂單）時 SHALL NOT 顯示會員標籤區塊。

## Capabilities

### New Capabilities
- `admin-member-tag`：後台專用「會員標籤」顯示元件，涵蓋顯示內容（啟動編號／身分標籤／頭像／顯示名稱）與「檢視」「訊息」兩個操作行為的契約，供任何後台頁面在需要「顯示某會員摘要資訊並提供檢視/聯繫入口」時重用（本次由教材申請詳情觸發建立）

### Modified Capabilities
- `admin-material-management`：新增「教材申請列表分頁籤（全部／待處理／已完成）」「列表講師欄位不顯示 Email」「教材申請詳情整合會員標籤顯示講師」三則需求

## Impact

- **Data Layer**（`lib/data/course-order.ts`）：`getAllCourseOrdersWithInvite` 的 `courseInvite.createdBy` select 擴充為完整會員標籤所需欄位（`id`／`spiritId`／`roles`／`nickname`／`realName`／`englishName`／`displayNameMode`／`avatarKey`／`image`）；`CourseOrderWithInvite` 新增 `instructor: MemberTagInfo | null`（`MemberTagInfo` 由 `admin-member-tag` 定義：`id`／`spiritId`／`roles`／`displayName`／`avatarUrl`）。既有 `instructorName`／`instructorEmail` 欄位不變動、不移除（避免影響其他既有呼叫端），列表沿用 `instructorName` 顯示姓名。
- **共用邏輯抽出**：身分標籤計算邏輯（目前僅內嵌於 `app/[locale]/(user)/user/[spiritId]/page.tsx`）抽出為 `lib/utils/identity-tags.ts` 的 `getIdentityTags(roles)`，該頁面同步改用抽出後的函式（純重構、行為不變）。
- **UI**：新增 `components/admin/member-tag.tsx`；`components/admin/material-order-table.tsx` 新增分頁籤（`Tabs`/`TabsList`/`TabsTrigger`，沿用既有 `components/ui/tabs.tsx`）、移除講師欄位 Email 顯示、展開詳情新增會員標籤區塊。
- **不修改**：`quoteMaterialOrder`／`confirmMaterialPayment`／`confirmShipment` 等既有 Server Actions 邏輯；列印出貨單頁面。

## Non-Goals

- 分頁籤不做伺服器端分頁/篩選查詢，資料量現階段不大，前端篩選已足夠；若未來資料量大幅成長可另開 CR 改為伺服器端。
- 「會員標籤」本次僅實作於教材申請詳情，不主動套用到其他既有頁面（如提問管理、會員審核等），但元件設計為可重用，日後有需要可另開 CR 套用。
- 不變更「講師」欄位以外的其他既有列表欄位與展開詳情內容。
