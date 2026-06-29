## Why

灌檔（批次建立）的會員拿到帳號時，其 email 可能填錯、過時或本人不清楚，導致無法用「email + 臨時密碼」完成首次登入，也不適用既有 `/forgot-password`（需先能收到該信箱的信）。需提供一個公開的「找回帳號」入口，讓**從未登入過**的會員以中文名字查出自己的帳號、確認或修改 email，並把臨時密碼重寄到該信箱以完成首次登入。同時後台需能查詢「尚未登入過（未啟用）」的會員以利追蹤。

## What Changes

- 首頁（與登入頁）新增「找回帳號」入口，導向公開頁 `/recover-account`。
- 新增公開「找回帳號」流程（僅限**從未登入過且仍為臨時密碼**的會員）：
  1. 輸入**中文名字**查詢符合的未啟用帳號。
  2. **身分驗證（選擇題）**：以該帳號的課程資料出題（「下列哪一位是你的授課老師／同學？」），答對才可繼續；限制嘗試次數。
  3. 顯示目前 email，供**確認或修改**。
  4. 送出後系統**重新產生臨時密碼**、更新 email 與白名單，並把臨時密碼**寄到確認後的 email**。
  5. 引導至登入頁，以 email + 臨時密碼登入。
- 中文名字**僅用於找回帳號查詢**，登入機制不變（仍為 email + 密碼）。
- 同名（兩筆以上）／查無資料時不揭露帳號細節，提示洽管理員；無足夠課程資料可出題者亦導向管理員。
- 後台新增「未啟用會員」查詢清單：列出 `lastLoginAt` 為空（從未登入過）的會員。

## Capabilities

### New Capabilities

- `account-recovery`: 公開找回帳號流程——以中文名字查詢未啟用帳號、以課程資料出選擇題驗證身分、確認/修改 email、重寄臨時密碼；含首頁/登入頁入口與資格限制（僅未登入過、臨時密碼）。
- `admin-inactive-members`: 後台「未啟用會員」清單——列出從未登入過（`lastLoginAt` 為 null）的會員供管理者追蹤。

### Modified Capabilities

（無 spec 層需求變更；登入、建立會員流程不變。）

## Impact

- 路由/頁面：新增 `app/(auth)/recover-account/`（頁面 + 表單）；`app/page.tsx` 與 `app/(auth)/login/` 加入口連結。
- Server Action：新增找回帳號查詢與送出 action（查詢未啟用帳號、email 唯一性檢查、更新 email + 白名單、重產臨時密碼、寄信）。
- 寄信：沿用 `lib/mailer.ts` 的 `sendTempPasswordEmail`，依規則 10 以 `resolveContactEmail` 解析收件（未啟用會員通常退回帳號 email）。
- 資格判定：以 `User.lastLoginAt == null` 且 `isTempPassword == true` 為「未啟用」條件；`realName` 比對（不唯一→多筆時拒絕並導向管理員）。
- 身分驗證題：以 `InviteEnrollment` 推導正確答案——授課老師為 `CourseInvite.createdBy`、同學為同班其他報名者；誘答選項取自無關會員；皆以 `getMemberDisplayName` 顯示。
- 後台：新增未啟用會員清單頁（沿用 `lib/data/members` 查詢樣式，新增 `lastLoginAt: null` 條件）。
- 安全：以「課程選擇題」驗證身分強化 name-only；風險與緩解詳見 design.md（僅未啟用帳號可用、多筆同名拒絕、限制猜題次數、無資料導向管理員、臨時密碼僅寄至確認 email、後台清單供稽核）。
- 操作手冊：更新 `doc/學員手冊.md`（找回帳號）與 `doc/管理者操作手冊.md`（未啟用會員清單）。
