## Context

目前系統已有兩個獨立功能：
- `components/course-order/` — 課程教材訂購表單（CourseOrder，13 欄位）
- `components/course-invite/` — 開課邀請表單（CourseInvite，含課程選擇、預計人數）

兩者在 Dashboard 為分開的入口，教師需操作兩次。課程選擇已受 `config/course-catalog.ts` 約束（isActive：level1、level2）。CourseInvite 已有 `courseOrderId` 外鍵可選關聯 CourseOrder，但目前未強制連結。

DB 模型無需變更，僅需整合 UI 與 Server Action，並補充邀請截止日期欄位（CourseInvite 需新增 `expiredAt`）。

## Goals / Non-Goals

**Goals:**
- 首頁出現單一「新增開課」區塊，整合訂購與邀請為一個 Dialog
- 表單含完整欄位（CourseOrder 欄位 + 課程選擇 + 邀請截止日期 + 預計人數）
- 課程選擇使用 Select（限 isActive 課程：啟動靈人 1 / 2）
- 預計開課日期與邀請截止日期均使用 DatePicker（shadcn Calendar + Popover）
- 開發環境自動填入測試資料（`NODE_ENV === 'development'`）
- 提交後 atomic 建立 CourseOrder + CourseInvite（prisma.$transaction）
- 首頁區塊下方顯示最新邀請的已報名學員（暱稱 | 性別、接受時間）

**Non-Goals:**
- 不修改學員加入邀請的流程（invite-join）
- 不修改先修驗證邏輯（course-prerequisite）
- 不重構現有 CourseOrder / CourseInvite 的獨立入口（保留，暫不移除）
- 不新增通知或 Email 功能

## Decisions

### 1. 合併為新 `course-session` 元件目錄
建立 `components/course-session/` 而非修改既有 course-order / course-invite，避免破壞現有獨立入口。新表單共用同一 Zod schema（`lib/schemas/course-session.ts`），合併兩者欄位。

### 2. CourseInvite 新增 `expiredAt` 欄位
邀請截止日期目前不存在於 DB。需在 `prisma/schema/course-invite.prisma` 的 CourseInvite 模型新增 `expiredAt DateTime?`，並執行一次 migration。這是本次唯一的 DB schema 變更。

### 3. Server Action：atomic transaction
`createCourseSession` 使用 `prisma.$transaction()`：
1. 建立 CourseOrder → 取得 `courseOrderId`
2. 建立 CourseInvite（帶 courseOrderId、courseLevel、expiredAt）

任一失敗均全部 rollback，確保資料一致性。

### 4. 開發環境預填（DEV_DEFAULTS）
在 `course-session-form.tsx` 頂層宣告 `DEV_DEFAULTS` 常數物件，`useForm` 的 `defaultValues` 根據 `process.env.NODE_ENV === 'development'` 選擇填入或空值。不影響正式環境。

### 5. 學員清單：Server Component + 即時查詢
`EnrolledStudentsList` 為 Server Component，直接查詢最近一筆 CourseInvite 的 InviteEnrollment（status: 'accepted'），顯示 user.displayName（`${name} | ${gender}`）與 acceptedAt 時間。頁面設定 `export const dynamic = 'force-dynamic'` 確保即時資料。

### 6. DatePicker 元件
使用 shadcn/ui 標準 DatePicker 模式（Calendar + Popover + Button trigger）。若專案尚未安裝 Calendar 元件，需執行 `npx shadcn@latest add calendar`。

## Risks / Trade-offs

- **expiredAt migration**：需執行 `make schema-update name=add_expired_at_to_invite`，開發與 VPS3 均需套用 → 部署時務必先 migrate 再啟動
- **最新邀請定義模糊**：學員清單顯示「最近一筆 CourseInvite」，若教師有多個進行中邀請，僅顯示最新一筆 → 後續可考慮加入邀請選擇器，本次不做
- **表單欄位數量多**：合併後約 15+ 欄位，需用 ScrollArea 包裹確保小螢幕可捲動

## Migration Plan

1. 新增 `expiredAt DateTime?` 至 `prisma/schema/course-invite.prisma`
2. 執行 `make schema-update name=add_expired_at_to_invite`
3. 確認 shadcn Calendar 元件已安裝（`npx shadcn@latest add calendar --legacy-peer-deps`）
4. 建立 `lib/schemas/course-session.ts`、`app/actions/course-session.ts`
5. 建立 `components/course-session/` 元件
6. 修改 `app/(user)/dashboard/page.tsx` 加入新區塊

Rollback：migration 可還原（`expiredAt` 為 nullable，不影響現有資料）；元件新增不影響現有功能。

## Open Questions

- 學員清單是否需要分頁？（目前假設顯示全部接受者，數量有限）
- 「新增開課」區塊在 Dashboard 的確切位置？（建議放在統計卡片下方，DashboardActions 上方）
