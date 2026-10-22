## Context

CR-FEAT-261021-004（Phase 1 LINE OAuth 登入）已讓使用者能以 LINE 登入並在 `Account` 表留下 `provider = 'line'` 記錄，但個人資料頁「帳號連動」卡片的 LINE 區塊當時是先行預留的靜態占位符，從未串接 `linkedProviders`，導致已連結 LINE 的使用者看到錯誤的「未連結」狀態。Google 區塊已有正確的 `isGoogleLinked` 寫法可直接比照。

## Goals / Non-Goals

**Goals:**
- LINE 區塊狀態文字正確反映 `linkedProviders` 是否含 `'line'`。

**Non-Goals:**
- 不開放 LINE 的連結／解除連結互動功能（按鈕維持 disabled／「即將推出」），該互動留待後續「登入方式管理」CR。
- 不新增 i18n 文案 key，沿用既有 `profile.providerLinked` / `profile.providerUnlinked` / `profile.comingSoon`。
- 不調整 `page.tsx` 的 `linkedProviders` 計算邏輯（已正確包含 `'line'`）。

## Decisions

- **新增 `isLineLinked` 常數，寫法比照既有 `isGoogleLinked`（`linkedProviders.includes('line')`）。**
  理由：與 Google 區塊使用同一套 `linkedProviders` prop 與相同判斷模式，維持程式碼風格一致，不引入新的狀態來源。
- **僅修正狀態文字與移除誤導性的 `opacity-60` 占位樣式，互動按鈕本身不變動。**
  理由：本張 CR 範圍明確限定在「顯示狀態正確性」，實際 OAuth 綁定/解綁屬於更大範圍的「登入方式管理」UI，留待後續 CR 統一設計（含解除綁定的唯一登入方式防呆等規則）。

## Risks / Trade-offs

- 使用者看到 LINE 顯示「已連結」後，可能預期能點擊解除連結，但按鈕仍為 disabled／「即將推出」。此為刻意的範圍切分（見 proposal 第 4 點與其他 CR 分工），非遺漏。

## Migration Plan

純前端顯示邏輯調整，無資料庫變更、無需 migration：
1. 新增 `isLineLinked` 常數。
2. LINE 區塊狀態文字改用 `isLineLinked` 判斷，移除 `opacity-60`。
3. 回退：還原 `profile-form.tsx` 單一檔案即可。
