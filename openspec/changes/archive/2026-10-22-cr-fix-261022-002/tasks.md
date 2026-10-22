## 1. 新增根層全站錯誤邊界頁面

- [x] 1.1 新檔 `app/global-error.tsx`（`'use client'`）：接收 `error`、`reset` props，自帶最小 `<html lang="zh-TW">`/`<body>`（inline style，比照 `app/not-found.tsx` 風格與配色），不 import 任何依賴 `NextIntlClientProvider`／全站 CSS 的元件
- [x] 1.2 頁面內容：顯示固定繁體中文錯誤訊息（例如「發生錯誤」＋簡短說明），提供「重新嘗試」按鈕（`onClick` 呼叫 `reset()`）與「回到首頁」連結（原生 `<a href="/">`，比照 `app/not-found.tsx` 不使用 i18n Link 元件的既有理由）

## 2. 版本

- [x] 2.1 `config/version.json` patch +1，`updatedAt` 更新為當日日期（無使用者可見功能異動，故不更新 `doc/` 操作手冊）

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 成功
- [x] 3.2 `npm run build` 連續執行至少 3 次（含一次清除 `.next` 快取後重跑）皆以 exit code 0 完整結束，不再出現 `/_global-error` 的 `TypeError: Cannot read properties of null (reading 'useContext')` 崩潰
- [x] 3.3 情境：本機以暫時性手法於 root layout 內拋出例外（以 `headers()` 判斷測試專用 request header 觸發，避免影響 build 階段的靜態分析掃描；驗證後已還原、`git diff` 確認 `app/[locale]/layout.tsx` 無殘留變更）。以 `next build && PORT=3002 next start` 驗證：未帶測試 header 的請求正常回應 200；帶測試 header 的請求回應 500，且 Next 回傳的錯誤回應正確改用 `app/global-error.tsx` 的編譯 chunk（`grep` 確認該 chunk 內容含「發生錯誤」文案），而非落回 Next 內部預設 global-error 元件
- [x] 3.4 程式碼審查確認：`app/global-error.tsx` 的「重新嘗試」按鈕 `onClick` 呼叫 `reset()`，「回到首頁」為 `<a href="/">`；因 global-error 屬 Client Component 錯誤邊界回退畫面（`reset` 為函式，無法經 SSR 序列化傳遞），實際畫面render於 client-side hydration 之後，`curl` 等工具無法直接看到渲染後文字，已改用編譯後 chunk 內容比對（見 3.3）佐證渲染邏輯正確；視覺層的最終確認留待下次有瀏覽器可用時人工點擊核實
- [x] 3.5 步驟 3.2 連續 4 次（含 1 次測試用 clean build）皆未重現崩潰，判定本次 CR 完成；若未來實際部署後仍偶發重現，需另開 CR 排查 Turbopack 並行 worker 相關的 race condition
