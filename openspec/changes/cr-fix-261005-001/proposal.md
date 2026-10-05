## Why

2026-10-05 客服嘗試在後台刪除會員 PA260267（盧蔡美玲，啟動靈人講師身分）失敗，前端沒有顯示任何有意義的錯誤提示。查證後確認根因：`deleteMember`（`app/actions/admin.ts:288-326`）在 `prisma.$transaction` 內依序刪除 `InviteEnrollment`、`CourseInvite`，再刪除 `User`。本次案例中，該會員身為講師建立的班級（`CourseInvite`）底下還有其他學員的報名記錄（`InviteEnrollment.inviteId` 外鍵為 `ON DELETE RESTRICT`）尚未清除，`tx.courseInvite.deleteMany(...)` 因而被資料庫以外鍵約束拒絕，Prisma 擲出 `PrismaClientKnownRequestError`（code `P2003`）。

但 `deleteMember` 整段函式沒有任何 `try/catch`，這個例外直接以 rejected promise 形式往上拋。前端 `MemberDeleteButton`（`components/admin/member-delete-button.tsx:37-47`）雖然已經正確處理 `result.success === false` 的情況（`toast.error(result.message ?? '刪除失敗，請稍後再試')`），但因為後端從未回傳這個失敗的 `ActionResponse`，使用者看到的是 Next.js Server Action 未捕捉例外的錯誤畫面，而不是任何中文訊息，也完全不知道卡住刪除的真正原因。

## What Changes

- `deleteMember` 的 `prisma.$transaction(...)` 呼叫包上 `try/catch`，攔截 Prisma 外鍵約束錯誤（`code === 'P2003'`），依錯誤回傳的約束名稱對應到具體的繁體中文訊息，以 `{ success: false, message: '...' }` 回傳，不再讓例外往上拋出中斷 Server Action。約束名稱的實際取得路徑已於 task 1.3 在本機 dev 容器實測確認：本專案用 `@prisma/adapter-pg`，`error.meta.driverAdapterError.cause.constraint.index` 才是約束名稱，而非官方文件舊版描述的 `error.meta.field_name`（詳見 design.md）。
- 已知可能出現的 RESTRICT 外鍵逐一對應明確訊息，涵蓋：`InviteEnrollment.inviteId`（班級下仍有其他學員報名——**實測確認這才是本次事件實際觸發的約束**，而非原先以為的 `CourseInvite.createdById`，詳見 design.md）、`Conversation.createdById`、`ConversationMessage.authorId`、`CourseMessage.authorId`；`CourseInvite.createdById`、`InviteEnrollment.userId` 理論上不會在此流程觸發（`deleteMember` 已先清空相關資料），但仍保留對照表項目作防呆。未列在對照表中的其他 `P2003`（未來新增的關聯表若忘記處理）與其他未預期例外，一律回傳一則通用但誠實的 fallback 訊息，不假裝成功也不吞掉例外細節（記錄到 server log 供後續排查）。
- 前端 `member-delete-button.tsx` 不需修改：既有的 `result.success` 分支與 `toast.error(result.message ...)` 已經是正確的呈現邏輯，本次只是讓後端終於會把失敗結果傳到這裡。驗收時仍會實際操作一次確認顯示正常。

### 排除範圍

- 不在本次自動清除擋住刪除的關聯資料（例如自動轉移班級、自動清空對話記錄）——這屬於另一張 CR「支援將老師名下的班級轉移給另一位老師」（`cr-feat-261005-001`）的範圍，本次僅止於讓失敗原因可見。
- 不改變刪除的業務邏輯或清理順序，僅新增錯誤攔截與訊息轉譯。

## Capabilities

### Modified Capabilities
- `admin-member-management`：既有「條件式會員刪除」需求補上「刪除失敗時的錯誤訊息」規格

## Impact

- **程式碼**：`app/actions/admin.ts`（`deleteMember`）
- 無 Prisma schema／migration 變更
- 無新增 i18n key（錯誤訊息直接寫繁體中文字串，與既有 `ActionResponse.message` 慣例一致，非 i18n key 化範圍）
