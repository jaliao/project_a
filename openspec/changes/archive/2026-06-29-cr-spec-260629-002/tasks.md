## 1. 資料層

- [x] 1.1 `lib/data/account-recovery.ts` `findInactiveByRealName`：以 `realName`（trim）在未啟用帳號（`lastLoginAt: null` 且 `isTempPassword: true`）查詢，回傳符合清單
- [x] 1.2 `buildRecoveryQuestion`：依帳號 `InviteEnrollment` 取得授課老師（`CourseInvite.createdBy`）與同學（同班其他報名者），並取無關會員作誘答；以 `getMemberDisplayName` 顯示
- [x] 1.3 `listInactiveMembers`：未啟用會員清單查詢（`where: { lastLoginAt: null }`，含姓名/email/spiritId/roles/createdAt/isTempPassword）

## 2. 驗證題 Token 與工具

- [x] 2.1 `lib/utils/recovery-token.ts`：HMAC 簽章 token（quiz/email 兩階段，封裝帳號 id、正解、嘗試次數、效期）；`signRecoveryToken`/`verifyRecoveryToken`
- [x] 2.2 出題函式（於 `buildRecoveryQuestion`）：優先老師題、無則同學題、4 選 1（正解 + 誘答洗牌），資料不足回傳 null

## 3. Server Actions

- [x] 3.1 `findRecoverableAccount(realName)`：1 筆→簽發 quiz token + 題目；0／多筆／無法出題→對應導向訊息（不揭露細節）
- [x] 3.2 `answerRecoveryQuestion(token, choiceId)`：驗 token、比對答案；對→二次確認資格後簽發 email token；錯→累加，達上限（3）→中止
- [x] 3.3 `submitRecoveryEmail(token, email)`：驗 token；email 格式 + 唯一性檢查；`$transaction` 更新 `email`、重產臨時密碼、`whitelistedEmail` upsert active；成功後 `sendTempPasswordEmail`（規則 10 `resolveContactEmail`）

## 4. 公開找回帳號頁

- [x] 4.1 `app/(auth)/recover-account/page.tsx` + `recover-account-form.tsx`：四狀態（name→quiz→email→done），沿用 auth 群組版型
- [x] 4.2 各狀態 UI：查無/多筆同名/無法出題→洽管理員提示；答錯與剩餘次數；成功後「臨時密碼已寄至 email」+ 前往 `/login`
- [x] 4.3 入口連結：`app/page.tsx` 首頁 CTA 與 `app/(auth)/login/user-auth-form.tsx` 加「找回帳號」連結至 `/recover-account`；`middleware.ts` `PUBLIC_PATHS` 加入 `/recover-account`（免登入放行，否則被導去 `/login`）

## 5. 後台未啟用會員清單

- [x] 5.1 `app/(user)/admin/members/inactive/page.tsx`：管理者限定（`canAccessAdmin`），列出未啟用會員
- [x] 5.2 表格欄位：啟動編號、姓名、email、身分、建立時間、臨時密碼狀態；空狀態提示
- [x] 5.3 後台首頁（`/admin`）新增「未啟用會員」入口卡片

## 6. 驗證

- [x] 6.1 找回流程（邏輯驗證）：恰 1 筆→出題；答對→email token→改 email→重產臨時密碼+寄信；可用 email + 臨時密碼登入
- [x] 6.2 安全分支（邏輯驗證）：0 筆/多筆同名/無課程資料→洽管理員；答錯達上限→中止；答對與改 email 皆二次確認帳號仍未啟用
- [x] 6.3 email 修改（邏輯驗證）：格式錯誤/已被占用→擋下不送出；確認不改→以原 email 重寄
- [x] 6.4 後台清單（邏輯驗證）：`canAccessAdmin` 守衛；`where lastLoginAt: null` 已登入過會員不列入
- [x] 6.5 `npm run lint`（0 errors）與 `npm run build`（✓ Compiled successfully）通過

## 7. 文件與版本

- [x] 7.1 `doc/學員手冊.md` 新增「找回帳號」章節（姓名→選擇題→確認 email→收臨時密碼登入）
- [x] 7.2 `doc/管理者操作手冊.md` 新增「未啟用會員清單」與「同名/無資料者由後台協助」
- [x] 7.3 學員手冊 v0.1.95、管理者手冊 v0.1.96；`config/version.json` 0.1.98 → 0.1.99
- [x] 7.4 `README-AI.md`：版本、路由（recover-account / members/inactive）、當前任務新增本變更
