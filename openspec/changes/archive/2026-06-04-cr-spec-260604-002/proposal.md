## Why

在開發／測試環境中，要重現「一位講師帶 5 位學員、啟動靈人課程、教材尚未送出」的情境，目前必須手動新增授課、逐一建立並報名 5 個帳號，耗時且容易出錯。提供「新增測試授課」一鍵建資料按鈕，可大幅加速講師端／學員端與後續結業、教材寄送等流程的手動測試。

## What Changes

- 在使用者個人頁（`app/(user)/user/[spiritId]/page.tsx`）既有「新增授課」按鈕旁，新增一個「新增測試授課」按鈕。
- 此按鈕**僅在測試環境顯示**（`process.env.NODE_ENV === 'development'`），production 不渲染。
- 點擊後一鍵建立一筆測試授課資料：
  - 1 筆 `CourseInvite`，`courseCatalogId = 1`（啟動靈人），`maxCount = 5`，建立者為當前使用者，**未設 `startedAt`（待開課）**。
  - 動態建立 5 個臨時測試 `User`（含自動核發的 `spiritId`），並各建立 1 筆 `InviteEnrollment`，`status = approved`、`materialChoice = none`。
  - **不建立 `CourseOrder`**（代表教材訂購步驟尚未進行，即「教材還沒送出」）。
- 新增對應的 Server Action，內含環境守衛：在 production 被呼叫時直接拒絕（深度防禦，不只靠 UI 隱藏）。

## Capabilities

### New Capabilities
- `test-course-session`: 測試環境專用的一鍵建立測試授課功能——產生啟動靈人課程、5 位臨時測試學員（approved 報名、待開課、無教材訂購），以及對應的 UI 按鈕與受環境守衛的 Server Action。

### Modified Capabilities
<!-- 既有 create-course-session / course-invite 的需求行為不變，本變更僅新增測試專用入口，不修改既有授課建立規格，故此處留空。 -->

## Impact

- **UI**：`app/(user)/user/[spiritId]/page.tsx`（按鈕區）、新增測試授課按鈕元件（client）。
- **Server Action**：新增 `app/actions/` 內的測試授課 action（建立 invite + 5 臨時 user + 5 enrollment），含 `NODE_ENV` production 守衛與登入驗證。
- **資料模型**：沿用既有 `CourseInvite`、`InviteEnrollment`、`User`，無 schema 變更。
- **環境**：行為依 `NODE_ENV` 分歧；production 完全不提供此功能。
- **測試資料**：會在 DB 產生臨時測試 User 與 enrollment（僅限開發環境，不影響 production）。
</content>
