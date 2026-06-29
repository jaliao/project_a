## Context

灌檔會員由 `createMember` 等批次方式建立：具 `email`、`realName`、`spiritId`、臨時密碼（`isTempPassword=true`）並加入白名單；首次登入前 `lastLoginAt` 為 null（首次登入由 `lib/auth.ts` 的 `signIn` callback 設定）。登入為 Credentials（Email + 密碼）。既有 `/forgot-password` 走 email reset token，但前提是會員能收到該信箱的信，無法解決「email 填錯/不明」情境。`realName` 在 schema 中不唯一。

灌檔（seed）自名冊建立會員時一併建立課程（`CourseInvite`）與報名（`InviteEnrollment`），因此未啟用會員多半已具課程關聯：**授課老師** = 其報名課程的 `CourseInvite.createdBy`；**同學** = 同一 `CourseInvite` 的其他報名者。此關聯可用來出「身分驗證選擇題」。

## Goals / Non-Goals

**Goals:**
- 提供公開「找回帳號」流程，讓**未啟用**（從未登入過且仍為臨時密碼）會員以中文名字查出帳號、**通過課程選擇題驗證身分**、確認/修改 email，並把臨時密碼重寄至該信箱。
- 後台提供「未啟用會員」清單（`lastLoginAt = null`）供追蹤。
- 沿用既有 mailer、白名單、臨時密碼產生機制，不改動登入機制。

**Non-Goals:**
- 不改變登入認證（仍 email + 密碼）；中文名字僅用於找回查詢。
- 不處理「已登入過」會員的帳號找回（其應走 `/forgot-password`）。
- 後台清單本期僅「列出」，不含清單上直接重發密碼/改 email（屬後續）。

## Decisions

- **資格限制：僅 `lastLoginAt == null` 且 `isTempPassword == true` 的帳號可被找回。**
  - 理由：限制在「未啟用」帳號，避免以姓名接管已啟用、已自行設定密碼的帳號（降低 takeover 面）。
- **查詢鍵：`realName` 精確比對（trim 後）。**
  - 0 筆 → 顯示通用「查無符合資料，請洽管理員」（不揭露帳號是否存在）。
  - 多筆同名 → 顯示「查到多筆同名，請洽管理員」並中止（name-only 無法安全消歧）。
  - 恰 1 筆 → 進入**身分驗證選擇題**步驟（非直接到 email）。

- **身分驗證選擇題（恰 1 筆後的關卡）：**
  - 出題來源：以該帳號的 `InviteEnrollment` 推導。
    - 老師題：「下列哪一位是你的授課老師？」正解 = 其報名課程的 `CourseInvite.createdBy`。
    - 同學題：「下列哪一位是你的同學？」正解 = 同班其他報名者。
  - 誘答選項：取自與該帳號課程**無關**的其他會員，避免誤判為正解；全部以 `getMemberDisplayName` 顯示（不直接揭露 realName）。
  - 題型選擇：優先老師題（單一明確正解）；無老師資料時退用同學題。
  - **無足夠資料**（無報名／湊不出選項）→ 不出題、導向「請洽管理員」。
  - **防猜題**：固定 4 選 1，限制嘗試次數（預設 3 次），超過即中止並導向管理員。公開無 session 流程下，以**短效簽章 token**（攜帶帳號 id、題目、嘗試次數、效期）在前後步驟間傳遞並於伺服器驗證，避免前端竄改與跨步驟重放。
  - 答對 → 進入確認/修改 email 步驟；答錯 → 計數 +1、重出題或提示重試。
- **email 確認/修改 + 重寄臨時密碼（單一送出交易）：**
  1. 驗證新 email 格式；若與原值不同，檢查未被其他帳號使用（唯一性）。
  2. `prisma.$transaction`：更新 `User.email`、重產臨時密碼（`bcrypt` hash、`isTempPassword=true`）、`whitelistedEmail` upsert 新 email 為 active（若 email 變更，舊白名單可保留或停用——預設保留，避免誤殺）。
  3. 交易成功後寄送臨時密碼信至確認後的 email（沿用 `sendTempPasswordEmail` + 規則 10 `resolveContactEmail`，未啟用會員通常退回帳號 email）。
  - 替代方案：僅在 email 變更時重寄——但「確認（未改）」也需要拿到密碼，故一律重寄較直覺。
- **入口：** 首頁 header/CTA 與 `/login` 頁皆加「找回帳號」連結，導向 `/recover-account`（置於 `app/(auth)/` 群組，與 login/forgot 一致版型）。
- **後台清單：** 新增頁面（建議 `/admin/members/inactive` 或會員管理頁加篩選），以 `where: { lastLoginAt: null }` 查詢；欄位：姓名、email、spiritId、身分、建立時間、臨時密碼狀態。沿用 `lib/data/members` 查詢樣式。

## Risks / Trade-offs

- [僅憑姓名即可接管未啟用帳號] → 以**課程選擇題**驗證身分大幅降低：須認得自己的老師/同學才能繼續；僅未啟用帳號可用；多筆同名一律拒絕並導向管理員；臨時密碼只寄到「確認後的 email」（留下 email 變更軌跡）；後台未啟用清單供稽核。
- [選擇題可被猜中（4 選 1）] → 限制嘗試次數（預設 3 次）並以短效簽章 token 計數防竄改；超過即中止導向管理員。
- [部分未啟用會員無課程資料可出題] → 無法自助，明確導向管理員由後台協助（清單已提供）。
- [改 email 造成白名單/唯一性衝突] → 送出前檢查 email 未被占用；白名單以新 email upsert active。
- [同名多筆使部分人無法自助] → 明確導向管理員，由後台協助（清單已提供）。

## Migration Plan

- 無資料庫 schema 變更（沿用既有 `User.email/realName/lastLoginAt/isTempPassword/passwordHash` 與 `WhitelistedEmail`）。純新增路由、action 與後台清單頁，部署即生效；回退僅需移除新頁面與入口連結。

## Open Questions

- 選擇題的嘗試次數上限（暫定 3 次）與選項數（暫定 4 選 1）是否合適，可於實作後依體驗微調。
- 後台清單未來是否需「直接重發臨時密碼/改 email」的操作鈕（本期僅列出）。
