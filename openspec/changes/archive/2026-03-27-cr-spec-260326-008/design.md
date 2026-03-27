## Context

現有申請流程：學員點擊「申請參加」→ `EnrollmentApplicationDialog` 開啟 → 選擇書籍 → 呼叫 `applyToCourse`。

缺少兩件事：
1. Dialog 沒有顯示課程資訊（學員看不到自己在申請哪門課、什麼日期、誰開課）
2. `applyToCourse` 成功後不會通知講師（講師只能主動查看 `pending-enrollment-list`）

資料流目前是 `page.tsx` → `StudentApplySection` → `EnrollmentApplicationDialog`，只傳了 `inviteId`。講師的 `userId` 可從 `invite.createdById` 取得，`applyToCourse` action 已查詢 invite，加通知只需在現有查詢基礎上呼叫 `createNotification`。

## Goals / Non-Goals

**Goals:**
- `EnrollmentApplicationDialog` 新增課程資訊展示（課程名稱、預計開課日期、講師姓名）
- `applyToCourse` 成功後通知講師（Inbox）
- props 從 `page.tsx` 往下傳遞

**Non-Goals:**
- 重新設計申請流程或 UI 架構
- 在 Dialog 中做先修驗證（`applyToCourse` action 已處理）
- 即時推播（僅 Inbox）

## Decisions

### D1：課程資訊由父層傳入，不在 Dialog 內 re-fetch

`page.tsx` 已有所有課程資料（`courseSession`），直接往下傳 props 比在 Dialog 內發 request 更簡單，無多餘 DB 查詢。

傳遞路徑：`page.tsx` → `StudentApplySection` → `EnrollmentApplicationDialog`

新增 props：
```typescript
// StudentApplySection
courseTitle: string
courseDate?: string | null
instructorName: string

// EnrollmentApplicationDialog（同樣 3 個 props）
courseTitle: string
courseDate?: string | null
instructorName: string
```

### D2：講師通知複用 createNotification（cr-spec-260326-007 已建立）

`applyToCourse` 已查詢 `invite`，`invite.createdById` 即講師 userId。在 create enrollment 後加 try/catch 呼叫 `createNotification`，fire-and-forget 模式一致。

通知內容：title `新申請通知`，body 包含課程名稱與申請者名稱。

申請者名稱：需從 `session.user.name` 取得（JWT 已存 name）。

## Risks / Trade-offs

- **`session.user.name` 可能為 null**（未設定姓名的使用者）→ Mitigation: fallback 顯示 email 或「某位學員」
- **講師通知無申請連結**（點通知後需自行導到課程頁）→ Mitigation: body 提示前往課程詳情查看，未來可加深連結

## Migration Plan

1. 修改 `EnrollmentApplicationDialog` — 新增 3 個 props，Dialog 頂部加課程資訊
2. 修改 `StudentApplySection` — 新增 3 個 props 並傳入 Dialog
3. 修改 `app/(user)/course/[id]/page.tsx` — 傳入課程資訊至 StudentApplySection
4. 修改 `app/actions/course-invite.ts` — `applyToCourse` 成功後通知講師

## Open Questions

- 無
