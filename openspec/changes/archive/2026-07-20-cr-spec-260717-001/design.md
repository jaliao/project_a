# Design: cr-spec-260717-001 課程頁新增學員改為僅限既有會員

## Context

`addStudentToInvite`（`app/actions/invite-students.ts`）目前以 email 查既有帳號，查無時呼叫 `createLoginableMember` 建新帳號（`spiritId`＋臨時密碼＋白名單）。此為**任何具課程管理權限者可任意建立帳號**的途徑，未經正規（Google OAuth 白名單／後台新增會員）流程審核，構成安全疑慮。`lib/data/invite-students.ts` 的 `findMemberByEmail` 目前只支援 email 精確比對；`User.spiritId` 為唯一索引可同精確比對。UI（`AddStudentDialog`）目前欄位為「姓名＋Email」，debounce 查詢 email 顯示既有/新建提示。

## Goals / Non-Goals

**Goals:**
- `addStudentToInvite` 移除建新帳號分支；查無對應會員時拒絕並提示。
- 查找輸入改為單一欄位，接受 Email 或啟動編號（spiritId），找到既有會員才可送出。
- UI 移除姓名欄與建帳號完成畫面。

**Non-Goals:**
- 不改後台既有的「新增會員」機制（`/admin/members` 新增功能）——那是正規建帳號管道，不受影響。
- 不改移除學員、補登結業邏輯。
- 不改白名單機制本身。

## Decisions

### D1：查找輸入改為「Email 或啟動編號」單一欄位

- `findMemberByEmail` 擴充為 `findMemberByIdentifier(identifier: string)`：先判斷格式——含 `@` 視為 email（沿用既有 email 正規化：trim+lowercase）；否則視為 spiritId（trim，`User.spiritId` 查詢）。
- `lookupMemberByEmail` action 更名為 `lookupMemberByIdentifier(inviteId, identifier)`，同樣以 `inviteId` 綁定課程歸屬授權（沿用防枚舉設計）。
- 前端輸入框 placeholder 改「Email 或啟動編號」；debounce 查詢的格式驗證放寬為「非空字串」（不再限定 email regex），交由 server 端判斷格式並查詢。

替代方案：保留兩個獨立欄位（Email／啟動編號）——增加表單複雜度，用戶多數只會用其一，故採單一欄位＋自動判斷。

### D2：`addStudentToInvite` 移除建帳號分支

- 輸入改為 `{ inviteId, identifier, graduated, graduatedAt? }`（移除 `realName`、`email` 改 `identifier`）。
- 查無對應會員（`findMemberByIdentifier` 回傳 null）時，回傳 `{ success: false, errors: { identifier: ['查無此會員，請確認 Email 或啟動編號'] } }`，**不建立任何帳號**。
- 找到會員後：沿用既有「建立報名＋補登結業＋AdminActionLog」交易邏輯，`targetSnapshot` 改用查得會員的 `realName`／識別碼（原本用送出的 email，現改用查得帳號的 email 或 spiritId 顯示）。
- `createLoginableMember` 匯入移除（此檔案不再需要）。

### D3：UI 精簡

- `AddStudentDialog`：欄位改「Email 或啟動編號」單一 input；移除「姓名」欄；`LookupState` 的 `'new'` 分支文案改為「查無此會員，請確認 Email 或啟動編號」且**送出按鈕停用**（原本 `'new'` 時仍可送出建帳號，現不可）。
- 移除 `created`（臨時密碼一次性顯示）狀態與其 UI 區塊——不再有建帳號情境。
- Dialog 說明文字改為「以 Email 或啟動編號查找既有會員並加入班級；查無帳號時請先至會員管理新增」。

## Risks / Trade-offs

- [使用者原本仰賴此功能快速建帳號] → 導向後台既有「新增會員」機制（`/admin/members` 頁面既有功能），該處走正規審核／白名單流程；手冊註明操作路徑改變。
- [spiritId 格式使用者不熟悉] → 沿用系統既有顯示格式，不新增格式規則；查詢失敗時提示明確（Email 或啟動編號皆試過查無）。

## Migration Plan

無 migration（純 action／UI 邏輯調整，移除分支不影響既有資料）。

## Open Questions

（無）
