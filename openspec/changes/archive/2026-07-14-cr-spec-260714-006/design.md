# cr-spec-260714-006 Design

## Context

`User.email` 為登入帳號（unique），現無正式變更管道；「找回帳號」流程已有改 email 先例（`submitRecoveryEmail`：交易內 `user.update({ email })`＋新 email 白名單 upsert），但僅限從未登入者。現況：

- 個人資料頁（`profile/page.tsx`）已有：Spirit ID 唯讀卡、`ProfileForm`（含 `linkedProviders`）、`hasPassword`（`passwordHash !== null`）判定、`ChangePasswordCard`（僅 `hasPassword` 顯示）。
- 後台會員詳情「特殊設定」分頁為多個 `rounded-lg border` 區塊（暫停會員／補發密碼／特殊身分授權）。
- JWT callback：初次登入寫入 token，**後續請求自 DB 同步 roles/spiritId/isTempPassword**，但未同步 email（token.email 停留在登入當下）。
- 授權判定全以 `session.user.id`／`roles`，不依賴 session email；寄信收件人依規則 10 由 DB 查詢解析。

## Goals / Non-Goals

**Goals:**

- 管理者（特殊設定）與會員本人（個人資料頁）可變更登入 email，規則一致（唯一性、白名單汰換）。
- 會員在個人資料頁可看到目前登入帳號與登入方式。
- 變更後現有 session 不中斷，下次登入用新 email。

**Non-Goals:**

- 新 email 驗證信（pendingEmail）流程、變更通知信、變更歷史紀錄。
- Google 綁定關係搬移／解綁（`Account` 不動）；`commEmail` 不動。
- Google-only 使用者前台自改（顯示請洽管理員；後台可代改）。

## Decisions

### D1. 共用核心：`lib/account-email-change.ts`

抽共用函式（可於交易內呼叫）：

1. email 正規化（trim＋toLowerCase）＋格式驗證（Zod）。
2. 唯一性檢查：`User.email === next` 且 `id != 本人` → 欄位錯誤「此 Email 已被使用」；與現值相同 → 欄位錯誤「與目前帳號相同」。
3. 交易內三步：`user.update({ email: next })`、舊 email 白名單 `updateMany({ where: { email: old }, data: { isActive: false } })`（停用不刪除，保留紀錄；查無列即略過）、新 email 白名單 upsert（`isActive: true`）。

**為何停用舊白名單**：避免舊 email 之後被誤用於 Google OAuth 登入產生歧義；找回帳號流程未停用屬歷史行為，本次統一（不回溯修它）。

### D2. 兩個 Server Action、守衛不同

- `changeMyAccountEmail(newEmail, currentPassword)`（`app/actions/profile.ts`）：session 本人；`passwordHash === null`（Google-only）→ 拒絕「請洽管理員協助修改」；`bcrypt.compare` 驗證目前密碼（錯誤回欄位錯誤）；核心邏輯 D1；成功 message 提示「下次登入請使用新帳號」。
- `changeMemberEmailAdmin(userId, newEmail)`（`app/actions/admin.ts`）：`canAccessAdmin`；免密碼；可對 Google-only 會員操作；核心邏輯 D1。不寄信、不發通知。

### D3. 前台 UI：`ChangeAccountCard` 置於變更密碼卡上方

新 client 元件 `profile/change-account-card.tsx`，由 page 傳入 `currentEmail`／`hasPassword`：

- **有密碼**：卡片含新 email 輸入＋目前密碼輸入＋「修改帳號」按鈕 → AlertDialog 確認（列示新舊 email、提醒下次登入用新帳號）→ 呼叫 action → 成功 toast＋`router.refresh()`。
- **Google-only**：同位置改顯示說明卡「Google 登入帳號請洽管理員協助修改」。
- 頁面順序：`ProfileForm` → **帳號修改卡** → `ChangePasswordCard`（維持「變更密碼上方」）。

### D4. 啟動帳號資訊＝擴充 Spirit ID 唯讀卡

於「啟動事工編號」同一張卡下方（分隔線後）顯示「啟動帳號資訊」：登入帳號 email＋登入方式標示（「密碼登入」／「Google 登入」，依 `hasPassword` 與 `linkedProviders`，兩者可並存）。server 端直接渲染，無新查詢（page 已 include accounts）。

### D5. 後台 UI：特殊設定分頁新增「帳號修改」區塊

新 client 元件 `components/admin/member-email-form.tsx`：顯示目前帳號 email、輸入新 email、AlertDialog 確認（新舊 email 並列）後呼叫 `changeMemberEmailAdmin`；區塊置於「補發密碼」之後、「特殊身分授權」之前。成功後 `router.refresh()`。

### D6. Session 與 email 同步

JWT else 分支（每請求同步）select 補 `email` 並寫回 `token.email`，使 session email 隨變更即時更新（select 本就每請求執行，成本為零）。授權不依賴 email，此舉僅為顯示一致性。

## Risks / Trade-offs

- [打錯新 email 且登出 → 鎖外] → 確認視窗強制核對新舊 email；仍可用既有「找回帳號」或管理者後台代改救援。
- [Google 綁定者改 email 後，Google 登入身分比對] → NextAuth 以 `Account`（provider id）對應使用者，不受 email 變更影響；舊 email 白名單停用防止「以舊 Google email 另建帳號」歧義。
- [他人以新 email 曾註冊過白名單但無帳號] → upsert 僅設 `isActive: true`，不影響唯一性檢查（以 `User.email` 為準）。
- [session email 過期] → D6 每請求同步；所有授權以 id/roles，無功能性風險。

## Migration Plan

無 DB schema 變更；純程式部署，回滾＝revert commit。

## Open Questions

- 無。
