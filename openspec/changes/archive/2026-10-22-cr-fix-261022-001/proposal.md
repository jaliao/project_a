## Why

CR-FEAT-261021-004（Phase 1 LINE OAuth 登入）實測時發現，個人資料頁「帳號連動」卡片（`app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx` 第 412–420 行）的 LINE 區塊是先前預留的靜態占位符：寫死顯示「未連結」＋「即將推出」，完全沒讀取 `linkedProviders`（該 prop 已含 `'line'`，由 `page.tsx` 的 `user.accounts.map(a => a.provider)` 算出，見 `page.tsx` 第 49、112 行）。導致已用 LINE 登入成功、`Account` 表確實有 `provider = 'line'` 記錄的使用者，在此卡片看到錯誤的「未連結」狀態，容易誤導。

Google 區塊（同檔第 387–411 行）已正確用 `isGoogleLinked = linkedProviders.includes('google')`（第 171 行）判斷顯示狀態，LINE 區塊僅需比照同樣邏輯即可修正。

## What Changes

- LINE 區塊改用 `linkedProviders.includes('line')` 判斷顯示「已連結」／「未連結」，比照 Google 區塊既有的 `isGoogleLinked` 寫法（新增對應的 `isLineLinked` 常數），文案沿用既有 `t('profile.providerLinked')` / `t('profile.providerUnlinked')` i18n key，不新增文案。
- 「連結／解除連結」互動按鈕本次**不開放**：LINE 按鈕維持 `disabled` 與「即將推出」（`t('profile.comingSoon')`），僅移除整個區塊的 `opacity-60` 占位樣式改為與狀態文字一致的呈現（按鈕仍保留 disabled 外觀）。實際 OAuth 綁定／解綁互動留待後續「登入方式管理」CR。
- 同步在 `account-linking` capability 補一條 LINE 顯示狀態的 Requirement，明確記錄「顯示用 `linkedProviders` 判斷、互動本階段仍停用」的範圍界線，避免後續 CR 誤判此次已完成互動功能。

## Capabilities

### Modified Capabilities

- `account-linking`：新增一條「LINE 帳號連動狀態顯示」Requirement，定義 Profile 頁 LINE 區塊須依 `linkedProviders` 顯示正確的已連結／未連結狀態，但連結／解除連結互動本階段仍停用。

## Impact

- **修改** `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：新增 `isLineLinked` 常數，LINE 區塊狀態文字改依其顯示；互動按鈕維持 disabled／「即將推出」不變。
- **不修改** `app/[locale]/(user)/user/[spiritId]/profile/page.tsx`（`linkedProviders` 已包含 `'line'`，無需調整）。
- **不需要**資料庫 schema 變更、不需要新增 i18n key（沿用既有 `profile.providerLinked` / `profile.providerUnlinked` / `profile.comingSoon`）。
- **操作手冊**：已檢查 `doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md`，三份手冊目前皆未提及「帳號連動」卡片的 LINE 顯示狀態，無需修改；僅於 apply 階段依慣例將 `config/version.json` patch +1。
