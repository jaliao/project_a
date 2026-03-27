## Why

學員申請加入課程的 Dialog 目前只顯示書籍選項，缺少課程基本資訊（課程名稱、預計開課日期、講師）讓學員確認後再送出。此外，學員送出申請後講師不會收到 Inbox 通知，需手動查看待審核列表才知道有新申請。

## What Changes

- `EnrollmentApplicationDialog` 新增課程資訊展示區塊（課程名稱、預計開課日期、講師姓名），讓學員在選擇書籍前先確認課程資訊
- `applyToCourse` action 成功後，以 `createNotification` 通知講師有新申請（fire-and-forget）
- `StudentApplySection` 傳入必要課程資訊 props，轉傳給 Dialog
- `course/[id]/page.tsx` 調整資料傳遞，確保 Dialog 取得所需欄位

## Capabilities

### New Capabilities

- `enrollment-application`: 學員申請加入課程的完整 UX 流程 — 課程資訊確認 → 書籍選擇 → 送出申請 → 講師收到通知

### Modified Capabilities

- （無）

## Impact

**受影響的元件與 actions：**

| 檔案 | 修改內容 |
|------|---------|
| `components/course-session/enrollment-application-dialog.tsx` | 新增 props（courseTitle, courseDate?, instructorName）；Dialog 頂部加入課程資訊區塊 |
| `app/(user)/course/[id]/student-apply-section.tsx` | 新增 props 並傳入 Dialog |
| `app/(user)/course/[id]/page.tsx` | 傳入課程資訊至 StudentApplySection |
| `app/actions/course-invite.ts` — `applyToCourse` | 成功後取得講師 userId，呼叫 `createNotification` |

**無資料庫 schema 變更**。
