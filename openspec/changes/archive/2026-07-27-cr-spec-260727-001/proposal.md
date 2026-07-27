## Why

2026-07-27 再次發生「聯繫管理者提問消失」誤報事故（陳弘敏／KUA），經查 production 資料庫（GCP `35.236.153.251`）與 `postgres_db` 的 DML log 確認：學員本人資料並未遺失（原帳號 `PA261389` 之結業紀錄完整），消失的是一個**重複帳號**，由管理者依既有 `deleteMember()`（`app/actions/admin.ts:287`）hard delete 功能刪除，`support_inquiries` 因 `onDelete: Cascade` 隨之被清空，造成留言看似「憑空消失」。

此事故暴露兩個實質缺口：
1. `deleteMember()` 完全沒有寫入 `admin_action_logs`，與其他既有管理操作（`enrollment_add`／`enrollment_remove`）不一致，導致刪除會員這種高風險操作查無稽核紀錄——這也是 2026-07-24 上一次事故（id 8、11、12 空缺）最終無法查明根因的同一個盲點。
2. `SupportInquiry`（學員提問／管理者回覆）對 `userId` 採 `onDelete: Cascade`，任何帳號被刪除（無論是清理重複帳號或其他原因）都會連帶抹除已回覆的客服留言內容，不利留存客服歷程與未來查證。

## What Changes

- `deleteMember()` 執行 hard delete 前，於同一交易內寫入一筆 `AdminActionLog`（沿用既有稽核紀錄模型），記錄操作者、被刪除帳號之姓名／Email／`spiritId` 文字快照與動作類型，使刪除會員後仍可追溯是誰、刪除了誰。
- `AdminActionLog.inviteTitle` 欄位改為可選（`String?`），使非課程情境的操作（如會員刪除）也能寫入紀錄，不再侷限於班級學員增減。
- `SupportInquiry.userId` 外鍵刪除行為由 `Cascade` 改為 `SetNull`（欄位改為可選），並新增提問人文字快照欄位（姓名／Email／`spiritId`，於提問建立當下寫入），確保提問人帳號日後被刪除時，提問內容與回覆記錄仍完整保留、可讀。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-member-management`：`deleteMember()` 刪除會員時須寫入稽核紀錄（現行「條件式會員刪除」需求擴充）
- `admin-operation-log`：擴大稽核紀錄涵蓋範圍至會員刪除（`member_delete`），修正現行「僅涵蓋班級學員新增／移除」之範圍限制敘述；`AdminActionLog` 資料模型的 `inviteTitle` 由必填改為可選
- `contact-admin`：`SupportInquiry` 資料模型新增提問人快照欄位，`userId` 刪除行為改為 `SetNull`，確保提問人帳號刪除後留言仍保留
- `admin-inquiry-management`：提問卡片顯示提問人背景資訊時改用快照欄位並於帳號已刪除時加註「此帳號已被刪除」；提問人帳號已刪除時不顯示「查看會員」連結（避免連到不存在的 `/admin/members/{userId}`）

## Impact

- **Schema**：`prisma/schema/admin-log.prisma`（`AdminActionLog.inviteTitle` 改可選）、`prisma/schema/support-inquiry.prisma`（`SupportInquiry.userId` 改可選＋新增快照欄位），需 `make schema-update` 產生 migration；正式環境已有資料，須確認新增欄位皆為可選或有預設值，相容既有資料。
- **程式碼**：`app/actions/admin.ts`（`deleteMember`）、`app/actions/support-inquiry.ts` 或對應提問建立的 Server Action（新增快照欄位寫入）、後台提問管理列表／詳情顯示邏輯（`userId` 為 null 時改用快照欄位顯示提問人資訊）。
- **不影響**：學員提問送出流程本身的欄位與驗證邏輯不變；既有已回覆內容不變。
