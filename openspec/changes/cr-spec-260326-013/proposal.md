## Why

首頁授課單元目前只有操作按鈕，學員無法在首頁快速預覽自己最近的授課紀錄；新增授課表單夾帶龐大的教材訂購資料，增加操作負擔且混淆職責（教材訂購為獨立流程）。本次簡化表單並提升首頁資訊密度。

## What Changes

- 首頁授課單元顯示最近 3 筆授課卡片；若超過 3 筆則加一張「更多授課資訊」卡片，連結到 `/user/{spiritId}/courses`
- 新增授課 Dialog 按鈕文字由「新增開課」改為「新增授課」
- 新增授課表單移除所有教材訂購欄位（buyerNameZh、buyerNameEn、teacherName、churchOrg、email、phone、materialVersion、purchaseType、studentNames、quantityOption、quantityNote、taxId、deliveryMethod）
- 新增授課表單新增「課程名稱」欄位（必填），預設值為 `{講師名稱} 的 {課程內容}`（例：系統管理員的啟動靈人 1），可自行修改
- 新增授課表單新增「備註」欄位（非必填）
- `CourseInvite` 資料模型新增 `courseDate String?` 欄位（直接儲存，不再透過 CourseOrder 關聯讀取）與 `notes String?` 欄位
- 新增授課 action 不再建立 CourseOrder，只建立 CourseInvite
- `getMyCourseSessions` 更新以讀取 CourseInvite.courseDate（向後相容：優先取 invite.courseDate，fallback 至 courseOrder.courseDate）

## Capabilities

### New Capabilities
- （無）

### Modified Capabilities
- `create-course-session`：表單大幅簡化（移除教材訂購欄位）、新增 title/notes 欄位、不再建立 CourseOrder；CourseInvite 新增 courseDate 與 notes 欄位（需 DB migration）
- `dashboard-home`：首頁授課單元顯示最近 3 筆授課卡片，超過 3 筆時顯示「更多授課資訊」導覽卡片

## Impact

- `prisma/schema/course-invite.prisma` — 新增 `courseDate`、`notes` 欄位（需 `make schema-update`）
- `lib/schemas/course-session.ts` — 大幅簡化 Zod schema（移除訂購欄位，新增 title、notes）
- `app/actions/course-session.ts` — 移除 CourseOrder 建立邏輯，CourseInvite 補寫 courseDate、notes、title
- `components/course-session/course-session-form.tsx` — 移除訂購區塊，新增 title（含動態預設值）、notes 欄位
- `components/course-session/course-session-dialog.tsx` — 更新按鈕文字；新增 `instructorName` prop 傳入 form
- `lib/data/course-sessions.ts` — `getMyCourseSessions` 新增讀取 `courseDate` 欄位並 fallback
- `app/(user)/user/[spiritId]/page.tsx` — 授課單元改為顯示最近授課預覽 + 「更多」卡片
