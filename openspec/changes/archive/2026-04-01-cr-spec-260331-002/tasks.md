## 1. 環境變數設定

- [x] 1.1 在 `.env.example` 移除 `NEXT_PUBLIC_711_MAP_URL`，新增 `ECPAY_LOGISTICS_MERCHANT_ID`、`ECPAY_LOGISTICS_HASH_KEY`、`ECPAY_LOGISTICS_HASH_IV`、`ECPAY_LOGISTICS_SERVER_URL` 並附上說明（測試帳號：MerchantID=2000132, HashKey=5294y06JbISpM5x9, HashIV=v77hoKGq4kWxNNIS）
- [x] 1.2 在本機 `.env` 設定 ECPay 物流測試憑證，`ECPAY_LOGISTICS_SERVER_URL` 留空（啟用 mock 模式）

## 2. 工具函式：ECPay 物流 CheckMacValue（MD5）

- [x] 2.1 建立 `lib/ecpay/logistics.ts`，實作 `calcLogisticsCheckMacValue(params: Record<string, string>): string`（字母序排序 → URL encode → 加 HashKey/HashIV → MD5 → 大寫）
- [x] 2.2 以 ECPay 官方測試向量驗證 CheckMacValue 計算結果正確

## 3. API Route：/api/ecpay/store-map

- [x] 3.1 建立 `app/api/ecpay/store-map/route.ts`，讀取 `?type=UNIMART|FAMI` query 參數，無效值回傳 400
- [x] 3.2 Mock 模式（`ECPAY_LOGISTICS_SERVER_URL` 未設定）：回傳含模擬門市資料（storeId=`MOCK001`、storeName=`（開發測試門市）`）的 HTML，直接觸發 `postMessage` 後關閉視窗
- [x] 3.3 正式模式：計算 CheckMacValue 並回傳自動 submit 的 HTML form，POST 至 ECPay `https://logistics-stage.ecpay.com.tw/Express/map`（`ECPAY_LOGISTICS_SERVER_URL` 設定時），`ServerReplyURL` 指向 `${ECPAY_LOGISTICS_SERVER_URL}/api/ecpay/store-callback`

## 4. API Route：/api/ecpay/store-callback

- [x] 4.1 建立 `app/api/ecpay/store-callback/route.ts`，以 POST handler 接收 ECPay form POST（`CVSStoreID`、`CVSStoreName`）
- [x] 4.2 回傳 HTML 頁面，執行 `window.opener?.postMessage({ storeId, storeName }, window.location.origin)` 後自動關閉視窗
- [x] 4.3 `window.opener` 為 null 時顯示降級訊息：「已選取：{storeName}，請關閉此視窗並重新操作」

## 5. 前端元件：EcpayStoreSelector

- [x] 5.1 建立 `components/ecpay-store-selector/store-selector.tsx`，props：`logisticsSubType: 'UNIMART' | 'FAMI'`、`value: { storeId, storeName } | null`、`onChange`、`disabled`
- [x] 5.2 點擊按鈕時以 `window.open('/api/ecpay/store-map?type={logisticsSubType}', '_ecpaymap', 'width=1000,height=680,scrollbars=yes')` 開啟選擇器
- [x] 5.3 以 `useEffect` 監聽 `window.addEventListener('message', handler)`，僅接受 `event.origin === window.location.origin` 的訊息
- [x] 5.4 收到 `{ storeId, storeName }` 後呼叫 `onChange` 更新表單狀態
- [x] 5.5 未選取狀態：顯示「選取門市」按鈕（含 IconMapPin）
- [x] 5.6 已選取狀態：顯示「已選取：{storeName}（{storeId}）」及「重新選取」按鈕（含 IconRefresh）
- [x] 5.7 元件 unmount 時移除 message listener（`return () => window.removeEventListener(...)` 防止 memory leak）

## 6. 整合教材申請表單

- [x] 6.1 在 `lib/schemas/course-order.ts`（Zod schema）確認條件驗證：`deliveryMethod === sevenEleven || familyMart` 時 `storeId`/`storeName` 不可為空
- [x] 6.2 更新 `components/course-session/material-order-dialog.tsx`（或對應元件），在 `deliveryMethod === 'sevenEleven'` 時渲染 `<EcpayStoreSelector logisticsSubType="UNIMART" />`
- [x] 6.3 在 `deliveryMethod === 'familyMart'` 時渲染 `<EcpayStoreSelector logisticsSubType="FAMI" />`（原本為純文字輸入，現改為選擇器）
- [x] 6.4 切換 `deliveryMethod` 時清除 `storeId`/`storeName`（在 `watch('deliveryMethod')` 的 `useEffect` 中 `setValue`）

## 7. 移除舊元件

- [x] 7.1 刪除 `components/711-store-selector/` 整個目錄
- [x] 7.2 確認 `NEXT_PUBLIC_711_MAP_URL` 已無任何程式碼引用（全域搜尋確認）

## 8. 驗證與測試

- [x] 8.1 本機 mock 模式：點擊「選取門市」→ 新視窗立即回傳模擬資料 → 表單顯示「已選取：（開發測試門市）」
- [x] 8.2 表單切換取貨方式：7-11 ↔ 全家 → storeId/storeName 清除；切至郵寄 → 顯示 deliveryAddress 欄位
- [x] 8.3 未選取門市直接送出 → 表單阻擋並顯示「請選取取貨門市」
- [x] 8.4 選取門市後送出 → CourseOrder 的 storeId/storeName 正確寫入資料庫
- [x] 8.5 重新開啟已有超商門市的教材申請 → EcpayStoreSelector 顯示已選取狀態
- [x] 8.6 執行 `npm run build` 確認無 TypeScript 錯誤

## 9. 版本與文件更新

- [x] 9.1 將 `config/version.json` patch 版本號 +1
- [x] 9.2 依 `.ai-rules.md` 更新 `README-AI.md`，反映 ECPay 物流整合與環境變數變更
