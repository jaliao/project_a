## Why

目前系統的操作回饋只依賴 toast（Sonner），通知消失後使用者無法回顧重要事件（如開課完成、學員審核結果）。需要將關鍵操作的 toast 同步寫入 Inbox 通知系統，讓使用者能在側邊欄查閱歷史，並提供可重用的標準整合介面。

## What Changes

- 新增 `createNotification` Server Action（或 utility），供各 action 呼叫以寫入 Inbox 通知
- 開課完成（`createCourseSession`）時，同步傳送 Inbox 通知給開課教師
- 識別其他需要同步 Inbox 通知的關鍵 toast 操作，統一套用
- 建立標準的「Toast + Inbox 通知」整合工具函數，讓未來功能可重用
- **不改動** toast 呈現方式，僅在特定操作成功時額外寫入 Inbox

## Capabilities

### New Capabilities

- `notify-on-action`: 標準整合工具 — 在 Server Action 執行成功後同步寫入 Inbox 通知的共用函數（位於 `lib/notification.ts` 或 `app/actions/notification.ts`）

### Modified Capabilities

- `course-session`: 開課 action（`createCourseSession`）成功後，額外呼叫通知工具寫入 Inbox
- `notification`: 新增 `createNotification` 函數，供其他 actions 直接呼叫（非使用者觸發，而是系統內部呼叫）

## Impact

**需整合 Inbox 通知的 toast 操作（優先順序）：**

| 操作 | 檔案 | 通知對象 |
|------|------|---------|
| 開課完成 | `course-session-form.tsx` | 開課教師（自己） |
| 取消課程 | `cancel-course-dialog.tsx` | 開課教師（自己） |
| 學員申請核准/拒絕 | `pending-enrollment-list.tsx` | 申請學員 |
| 課程結業 | （`graduateCourse` action） | 開課教師 |

**不需整合的 toast（短暫操作回饋）：**
- 複製邀請連結（`invite-copy-button.tsx`）
- 登入 / 密碼重設
- 個人資料更新

**受影響的程式碼：**
- `app/actions/course-session.ts` — 新增通知呼叫
- `app/actions/notification.ts` — 新增 `createNotification` 內部函數
- `lib/data/notification.ts` — 可能新增 helper

**無資料庫 schema 變更**（Notification model 現有欄位已足夠）。
