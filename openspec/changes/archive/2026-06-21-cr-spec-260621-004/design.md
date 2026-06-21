## Context

ECPay 超商門市選擇流程（`components/ecpay-store-selector/`）：
1. 前端 `window.open('/api/ecpay/store-map?type=UNIMART|FAMI')`（同源 GET、頂層導覽 → SameSite=Lax cookie 帶入 → 通過 middleware）。
2. `store-map` 回傳自動 submit 的 HTML form，POST 至 ECPay MapCVS，`ServerReplyURL = {serverUrl}/api/ecpay/store-callback`。
3. 使用者於 ECPay 選門市 → **ECPay 自其網域跨站 POST** `{CVSStoreID, CVSStoreName}` 至 `/api/ecpay/store-callback`。
4. callback route 回傳 HTML，內含 `window.opener.postMessage(...)` + `window.close()`。

問題在第 3 步：跨站 POST 不帶 NextAuth session cookie（Lax 僅於頂層 GET 導覽帶入），middleware 視為未登入 → `redirect('/login?callbackUrl=%2Fapi%2Fecpay%2Fstore-callback')`，callback route 從未執行。

`middleware.ts` 的 `PUBLIC_PATHS` 含 `/api/auth` 但無 `/api/ecpay/store-callback`，`isPublic()` 以 `pathname === p || startsWith(p + '/')` 比對。

## Goals / Non-Goals

**Goals:**
- 讓 `/api/ecpay/store-callback` 免登入可達，使 ECPay 跨站 POST 回傳直達 callback，正常 postMessage 並關閉視窗。

**Non-Goals:**
- 不改 callback / store-map 內容與門市選擇器前端。
- 不放行其他 `/api/ecpay/*`（`store-map` 以同源 GET 開啟，cookie 正常，毋需公開）。

## Decisions

### 決策 1：僅將 `/api/ecpay/store-callback` 加入 `PUBLIC_PATHS`
最小、精準：只放行真正接收跨站 POST 的 callback。`isPublic()` 既有比對 `pathname === p` 即可命中此精確路徑。
- 替代方案 A：放行整個 `/api/ecpay`（前綴）→ 連帶公開 `store-map`（產生含 CheckMacValue 的 ECPay form），非必要且擴大暴露面，否決。
- 替代方案 B：改 cookie 為 SameSite=None → 影響全站安全屬性、牽連過大，否決。

### 決策 2：安全性評估
callback route 僅回顯 ECPay POST 的門市代號／名稱（已對 HTML 特殊字元轉義），不讀寫 DB、不涉使用者資料，公開無敏感外洩風險；門市資料最終仍由前端 `postMessage`（限定 `window.location.origin`）回傳父視窗，再由既有表單流程送出與 server 驗證。

## Risks / Trade-offs

- [公開 callback 路徑可被匿名 POST] → 該 route 僅回顯轉義後字串、無副作用，無實質風險；不變更其行為。
- [未來新增其他 ECPay callback] → 比照將該精確路徑加入白名單（不採前綴放行）。

## Migration Plan

單一 middleware 白名單調整，無 DB 變更。部署即生效；回滾＝自 `PUBLIC_PATHS` 移除該路徑。

## Open Questions

無。
