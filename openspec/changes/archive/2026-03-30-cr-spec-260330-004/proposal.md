## Why

課程詳情頁（`/course/[id]`）的「申請參加」按鈕目前未做前置課程資格驗證。學員即使未完成先修課程，仍可看到可點擊的申請按鈕並送出申請，造成邏輯漏洞（Server Action 雖有 `checkPrerequisites` 驗證，但 UI 層無任何提示）。

需要在按鈕層級給予明確的前置課程提醒，讓學員在申請前就知道自己不符合資格，並禁止按鈕點擊。

## What Changes

- `app/(user)/course/[id]/page.tsx`：呼叫 `checkPrerequisites(userId, courseCatalogId)` 取得缺少的先修課程清單，傳入 `StudentApplySection`
- `app/(user)/course/[id]/student-apply-section.tsx`：接收 `missingPrerequisites: { id: number; label: string }[]`；若不為空則顯示提醒文字並 disabled 按鈕

## Capabilities

- student-apply-prerequisite-gate：申請按鈕先修資格前置檢查（UI 層提醒 + disabled）

## Impact

- 只影響 `course/[id]` 頁面的學員申請區塊
- Server Action 層的 `checkPrerequisites` 驗證保持不變（defense-in-depth）
- 無 DB schema 變更
