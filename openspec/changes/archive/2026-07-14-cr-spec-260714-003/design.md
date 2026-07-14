# cr-spec-260714-003 Design

## Context

cr-spec-260714-002 的班級學員管理與操作紀錄落在後台（`/admin/course-sessions/[id]/students`、`/admin/operation-logs`、卡片「⋯」選單），本次全數搬到前台課程頁 `/course/[id]` 並開放該課講師操作。現況：

- `CourseSessionCard` 為共用元件（開課管理、我的開課、媒合布告欄、學員課程列表、儀表板預覽），**未接收課程 id**（僅組 `href`）；標籤列位於標題上方（cr-spec-260708-004 定案版型）。
- 課程頁已核准學員名單為 server 渲染卡片 grid（**刻意不顯示 Email**，cr-spec-260708-002）；`isInstructor`／`isAdmin` 旗標已在 page 計算。
- 講師操作區 `CourseDetailActions`（僅 `isInstructor` 渲染）含教材申請／開始上課／結業作業／取消授課四區塊，字串為**繁體寫死**（未 i18n 化）。
- `graduateCourse`／`cancelCourseSession` 守衛為 `createdById === session.user.id`（不含 admin）；`setCourseStatusAdmin`（後台任意切換）將隨選單刪除。
- `addStudentToInvite`／`removeStudentFromInvite`／`lookupMemberByEmail` 守衛為 `canAccessAdmin`；`lookupMemberByEmail` 無 inviteId 參數（改講師可用時需以課程歸屬授權）。
- `getCourseSessionById` 的 enrollment select 無 `shipmentItems` count（移除防呆需要）。

## Goals / Non-Goals

**Goals:**

- 課程編號於共用卡片一律可見；學員增刪、重新招募、操作 LOG 全數在課程頁完成。
- 重新招募／結業／取消三作業：管理者＋該課講師皆可操作。
- 後台對應功能乾淨退場（選單、兩個頁面、dashboard 功能格、`setCourseStatusAdmin`）。

**Non-Goals:**

- 已取消→招生中回退、後台強制狀態變更（隨選單移除，不再提供）。
- 教材申請／開始上課／公開媒合設定開放給管理者（維持講師專屬）。
- 操作 LOG 記錄範圍擴大（仍僅學員新增/移除）；LOG 寫入機制不變。
- 課程頁管理區塊 i18n 化（比照講師操作區既有繁體寫死慣例）。

## Decisions

### D1. 卡片編號＝`CourseSessionCard` 新增必要 prop `inviteId`

標籤列（標題上方）最前面加 `#255` 樣式（`font-mono text-xs text-muted-foreground`），與既有 Badge 同列。所有使用處本就持有課程 id（組 href 用），一併傳入。**用必要 prop 而非 optional**：使用處僅少數幾個，一次補齊可避免遺漏；學員也看得到編號（回報問題好溝通，決策已確認）。

### D2. 已核准學員區塊＝抽成 client 元件 `ApprovedStudentsSection`

現為 page 內 server 渲染；移除模式需切換狀態，抽成 client 元件接收序列化學員資料與 `canManage`（`isInstructor || isAdmin`）：

- 區塊標題列右側兩顆按鈕（比照課程基本資訊「編輯」樣式：outline sm、icon＋文字）：**新增學員**、**移除學員**。僅 `canManage` 渲染；一般學員視角與現況完全相同。
- **新增學員**：沿用 `AddStudentDialog`（cr-spec-260714-002 元件搬移共用），流程不變（email 確認列／建帳號臨時密碼一次性顯示／補登結業提示）。
- **移除學員**：按鈕切換「移除模式」——各學員卡出現紅色「移除」按鈕（沿用 `RemoveStudentButton` 的警示確認與防呆），再點一次退出模式。移除模式下學員卡加顯**啟動編號**輔助辨識（Email 維持不顯示，沿用資安慣例）。
- 資料：`getCourseSessionById` enrollment select 補 `_count.shipmentItems` 與 `user.spiritId`，供移除防呆與辨識。

### D3. 權限模型＝「管理者或該課建立者」統一 helper

新增共用判定（action 層）：載入 invite 後 `canManageInvite = canAccessAdmin(roles) || invite.createdById === userId`。

- `addStudentToInvite`／`removeStudentFromInvite`：守衛由 `canAccessAdmin` 改 `canManageInvite`。
- `lookupMemberByEmail`：**新增 `inviteId` 參數**，以 `canManageInvite` 授權（避免任意講師掃 email 探測會員）。
- `graduateCourse`／`cancelCourseSession`：`createdById !== uid` 的拒絕改為 `!canManageInvite` 拒絕（管理者可代操作；結業頁 `/course/[id]/graduate` 的頁面守衛同步放行 admin）。
- 新增 `reopenRecruitment(inviteId)`：`canManageInvite`；前置 `startedAt != null && !completedAt && !cancelledAt`；執行 `startedAt = null`（回招生中）。不寫操作 LOG（LOG 範圍維持學員增刪）、不發通知。
- 刪除 `setCourseStatusAdmin`。

### D4. 講師操作區改「分區塊權限」渲染

`CourseDetailActions` 渲染條件由 `isInstructor` 改 `isInstructor || isAdmin`，內部以 props 區分：

- **教材申請、開始上課**：僅 `isInstructor` 顯示（維持現狀，教材寄件人等資料屬講師）。
- **重新招募作業**（新區塊，比照結業作業樣式）：課程**進行中**顯示；說明文字＋「退回招生中」按鈕＋確認 dialog（提示：退回後可再邀請/核准學員，既有學員與教材紀錄不受影響）。
- **結業作業、取消授課**：`isInstructor || isAdmin` 顯示。

### D5. 課程操作 LOG 區塊＝server 渲染、最近 30 筆

課程頁新增區塊（`isInstructor || isAdmin` 才渲染，位置在講師操作區之後）：以 `getAdminLogs({ inviteId, page: 1 })` 取最新 30 筆，卡片列樣式沿用原後台頁（時間、操作者、動作 Badge、對象、摘要），區塊註記「顯示最近 30 筆」。不做分頁（單一課程增刪量小）。

### D6. 後台退場清單

- `admin/course-sessions/page.tsx`：移除 `#編號`＋「⋯」列（恢復純卡片 grid；編號改由卡片本身顯示）。
- 刪除 `components/course-session/course-session-actions-menu.tsx`、`app/[locale]/(admin)/admin/course-sessions/[id]/students/page.tsx`、`app/[locale]/(admin)/admin/operation-logs/page.tsx`。
- `admin/page.tsx` 移除「操作紀錄」功能格。
- `lib/data/invite-students.ts` 的 `getInviteStudentsAdmin` 隨 students 頁刪除（`findMemberByEmail` 保留供 lookup）；`lib/data/admin-logs.ts` 保留（LOG 區塊使用）。
- `components/ui/dropdown-menu.tsx` 保留（primitive 供未來使用）。

## Risks / Trade-offs

- [講師可建帳號／補登結業（權限擴大）] → 操作皆寫入 `AdminActionLog`（操作者含講師）＋LOG 區塊對管理者透明；講師本就能走結業流程，補登為同質操作。
- [`lookupMemberByEmail` 開放講師] → 以 `inviteId` 綁定課程歸屬授權，非該課講師/管理者一律拒絕，避免 email 枚舉。
- [失去後台「已取消→招生中」回退] → proposal 已載明的取捨；需要時日後於課程頁加「重新開課」區塊即可。
- [重新招募退回後開始上課門檻重算] → 退回僅清 `startedAt`，教材訂單／收件紀錄保留，開課門檻（gate）邏輯不受影響、重新開始上課時照常檢核。
- [管理者操作結業] → 結業頁守衛同步放行 admin，逐學員勾選流程不變；管理者誤操作風險由既有確認流程承擔。

## Migration Plan

無 DB schema 變更。純程式部署；後台頁刪除屬破壞性 URL 變更但系統未上線、無書籤相容需求（`prelaunch`）。回滾＝revert commit。

## Open Questions

- 無。
