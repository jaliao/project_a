# cr-spec-260714-003 班級管理前台化：課程頁學員增刪＋重新招募＋操作 LOG，退場後台選單

## Why

cr-spec-260714-002 把班級學員管理與操作紀錄放在後台獨立頁，但實際操作動線在**前台課程頁**（`/course/[id]`）——管理者與講師都在課程頁工作，後台選單多一層跳轉且講師無法使用。本次將學員增刪、操作 LOG 移入課程頁並開放講師操作，同時補「進行中退回招生中」的重新招募作業，後台對應功能退場。

## What Changes

- **課程卡片顯示編號**：共用元件 `CourseSessionCard` 於課程標題上方顯示 `#編號`（`CourseInvite.id`），**所有使用處**（開課管理、我的開課、媒合布告欄、學員課程列表等）一律顯示。
- **課程頁「已核准學員」區塊加操作按鈕**（比照「課程基本資訊」的編輯按鈕樣式）：
  - **新增學員**：沿用既有 dialog 流程（email 掛既有帳號／建新帳號＋臨時密碼一次性顯示、可補登結業）。
  - **移除學員**：開啟移除模式／dialog 逐筆移除（教材寄送關聯擋下、已結業醒目警示，行為不變）。
  - 操作權限：**管理者＋該課講師**（原僅管理者；講師現可自行管理名單，含建帳號與補登結業）。
  - 操作 LOG 查詢由同頁「課程操作 LOG」區塊承擔，不另設按鈕。
- **新增「重新招募作業」區塊**（課程頁講師操作區，比照結業作業）：課程**進行中**時可退回**招生中**（清除 `startedAt`），供修正誤按開始上課或重新收學員。
- **講師操作區權限擴充**：**重新招募作業、結業作業、取消作業**一律「管理者＋該課講師」可操作（原結業／取消僅課程建立者）。
- **新增「課程操作 LOG」區塊**（課程頁）：顯示該課程的管理操作紀錄（原 `/admin/operation-logs?inviteId=` 內容），可見性**管理者＋該課講師**（比照結業資訊區塊）。
- **後台退場**（由上述功能取代）：
  - 開課管理列表移除 `#編號` 列與「⋯」操作選單（含變更課程狀態 dialog）。
  - 刪除後台頁 `/admin/course-sessions/[id]/students` 與 `/admin/operation-logs`（含 dashboard「操作紀錄」功能格）。
  - ⚠️ 隨選單移除，後台「已取消→招生中」回退與強制變更狀態不再提供（重新招募僅涵蓋進行中→招生中；如需可日後再加）。
- 操作紀錄**寫入**機制不變（`AdminActionLog`，增刪學員同交易寫入；操作者可為講師）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-session-card`: 卡片於標題上方顯示課程編號（所有使用處）。
- `course-session-detail`: 已核准學員區塊加新增／移除學員按鈕（管理者＋講師）；新增「課程操作 LOG」區塊（管理者＋講師可見）。
- `admin-enrollment-management`: 學員增刪入口由後台獨立頁改為課程頁區塊；操作權限由僅管理者擴為管理者＋該課講師；後台 students 頁移除。
- `admin-operation-log`: 查詢介面由後台獨立頁改為課程頁區塊（依課程過濾）；後台頁與 dashboard 入口移除；寫入需求不變（操作者擴及講師）。
- `admin-course-sessions`: 移除卡片操作選單與後台狀態變更需求；班級編號改由共用卡片顯示。
- `course-graduation`: 結業作業操作權限擴為管理者＋該課講師。
- `cancel-course-session`: 取消作業操作權限擴為管理者＋該課講師；新增「重新招募作業」（進行中→招生中）需求。

## Impact

- **元件**：`course-session-card.tsx`（編號 prop）、課程頁 `/course/[id]`（已核准學員區塊按鈕、重新招募區塊、LOG 區塊）；`invite-student-cells.tsx` 移作課程頁使用；刪除 `course-session-actions-menu.tsx`。
- **頁面刪除**：`admin/course-sessions/[id]/students/page.tsx`、`admin/operation-logs/page.tsx`；`admin/page.tsx` 移除操作紀錄功能格；`admin/course-sessions/page.tsx` 移除編號列與選單。
- **Server Actions**：`addStudentToInvite`／`removeStudentFromInvite`／`lookupMemberByEmail` 守衛改「`canAccessAdmin` 或該課建立者」（lookup 需帶 `inviteId` 供授權）；`graduateCourse`／`cancelCourseSession` 守衛擴及管理者；新增 `reopenRecruitment`（進行中→招生中，管理者＋講師）；`setCourseStatusAdmin` 移除。
- **Data Layer**：`getAdminLogs` 供課程頁區塊使用（依 `inviteId`）；`invite-students.ts` 查詢沿用或併入課程頁資料。
- **無 DB schema 變更**。
- **手冊**：管理者手冊（第七／十七／十八章大改：功能移至課程頁）、老師手冊（新增：講師可自行增刪學員、重新招募、LOG 區塊）；`config/version.json` patch +1。
