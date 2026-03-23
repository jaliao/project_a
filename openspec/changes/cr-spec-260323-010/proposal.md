## Why

目前「新增課程（訂購教材）」與「開課邀請（產生邀請連結）」是兩個獨立入口，教師需分別操作，流程割裂。本次將兩者合併為單一「新增開課」單元，從首頁一鍵完成：填寫訂購資料 → 指定課程 → 設定邀請期限 → 取得邀請連結，並可即時查看接受邀請的學員名單。

## What Changes

- 首頁（Dashboard）出現「新增開課」單元，取代舊有的獨立「新增課程」與「開課邀請」兩個入口按鈕
- 合併表單：CourseOrder 訂購資料 + CourseInvite 邀請設定整合為單一 Dialog
- 課程選擇限定「啟動靈人 1」或「啟動靈人 2」（使用現有 `config/course-catalog.ts` isActive 課程）
- 預計開課日期改用 Calendar 日期元件（DatePicker）
- 新增「邀請截止日期」欄位，使用 DatePicker 元件
- 開發環境（`NODE_ENV === 'development'`）表單自動填入測試資料
- 合併表單提交後：建立 CourseOrder + CourseInvite 兩筆記錄，並顯示邀請連結
- 「新增開課」卡片下方可查看已接受邀請的學員清單：暱稱（姓名 ｜ 性別）、接受邀請時間

## Capabilities

### New Capabilities
- `create-course-session`: 合併「課程訂購」與「開課邀請」的單一表單 Dialog，含開發環境測試資料自動填入、DatePicker 元件、邀請截止日期欄位
- `enrolled-students-list`: 首頁「新增開課」單元下方顯示已接受邀請學員清單（暱稱、性別、接受時間）

### Modified Capabilities
- `dashboard-home`: 首頁新增「新增開課」區塊（取代舊有個別入口），整合 create-course-session Dialog 與 enrolled-students-list

## Impact

- `app/(user)/dashboard/page.tsx` — 新增「新增開課」區塊，整合 CourseSessionDialog 與 EnrolledStudentsList
- `components/course-session/course-session-dialog.tsx` — 合併表單 Dialog（CourseOrder + CourseInvite）
- `components/course-session/course-session-form.tsx` — 表單主體（含 DatePicker、課程 Select、開發環境預填）
- `components/course-session/enrolled-students-list.tsx` — 學員清單元件（Server Component）
- `app/actions/course-session.ts` — Server Action：`createCourseSession`（atomic 建立 CourseOrder + CourseInvite）
- `lib/schemas/course-session.ts` — Zod schema（合併 CourseOrder + CourseInvite 欄位）
- `config/course-catalog.ts` — 確認 isActive 課程資料（讀取現有，不修改）
- UI 依賴：shadcn/ui Calendar + Popover（DatePicker 元件）
- 不需新增 DB schema（複用 CourseOrder、CourseInvite、InviteEnrollment 現有模型）
