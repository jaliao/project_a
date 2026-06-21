## MODIFIED Requirements

### Requirement: 接收 ECPay Callback 並通知父視窗
系統 SHALL 提供 API Route `/api/ecpay/store-callback`，接收 ECPay POST 回傳的門市資料，並以 `postMessage` 通知開啟此視窗的父視窗。

此路徑 SHALL 為免登入公開路徑（列入認證 middleware 白名單）：ECPay 自其網域以**跨站 POST** 回傳，請求不帶 NextAuth session cookie（SameSite=Lax），因此 middleware SHALL NOT 將 `/api/ecpay/store-callback` 轉導 `/login`，以確保 callback route 能執行並回傳門市資料。

#### Scenario: ECPay 成功回傳門市資料
- **WHEN** 使用者在 ECPay MapCVS 選取門市，ECPay POST `{ CVSStoreID, CVSStoreName }` 至 `/api/ecpay/store-callback`
- **THEN** callback 頁面渲染含 `window.opener?.postMessage({ storeId: CVSStoreID, storeName: CVSStoreName }, window.location.origin)` 的 script，並自動關閉視窗

#### Scenario: 未登入 session 的跨站 POST 不被轉導
- **WHEN** ECPay 跨站 POST 至 `/api/ecpay/store-callback` 且請求未帶 session cookie
- **THEN** middleware 放行該請求至 callback route（不轉導 `/login`），callback 正常回傳門市資料並關閉視窗

#### Scenario: 父視窗已關閉時降級處理
- **WHEN** `window.opener` 為 null（父視窗已關閉）
- **THEN** callback 頁面顯示「已選取：{storeName}，請關閉此視窗並重新操作」，不拋出例外
