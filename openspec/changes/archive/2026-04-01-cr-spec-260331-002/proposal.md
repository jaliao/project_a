## Why

現有的門市選擇器（`cr-spec-260330-008`）採用 7-11 自家 Map URL + `postMessage` 方式實作，但該 URL 並非正式公開 API，穩定性與長期維護存在風險，且僅支援 7-11 單一通路。`CourseOrder.deliveryMethod` 已有 `familyMart` 選項但目前缺乏對應的門市選擇器。

綠界物流 API 提供**超商店鋪資訊服務（MapCVS）**，以官方管道統一支援 7-11（UNIMART）與全家（FAMI），透過 Server Callback 回傳正式的門市店號與店名，可同時解決穩定性與多通路問題。

## What Changes

- 以 ECPay MapCVS 整合取代既有的 7-11 Map URL + postMessage 方案
- 新增通用「超商門市選擇器」元件，依 `deliveryMethod`（`sevenEleven` / `familyMart`）自動帶入對應的 `LogisticsSubType`
- 新增 API Route `/api/ecpay/store-callback`：接收 ECPay POST 回傳的門市資料，渲染回傳頁面並以 `postMessage` 通知開啟視窗
- 新增 API Route `/api/ecpay/store-map`：接收 `logisticsSubType` 參數，產生並自動 POST 至 ECPay `/Express/map`（避免在 client 端暴露 HashKey）
- 移除 `NEXT_PUBLIC_711_MAP_URL` 環境變數，改用 ECPay 物流憑證（`ECPAY_LOGISTICS_MERCHANT_ID`、`ECPAY_LOGISTICS_HASH_KEY`、`ECPAY_LOGISTICS_HASH_IV`）
- `MaterialOrderDialog` 的門市選擇器改用新元件，`deliveryMethod === familyMart` 時亦可正常選取門市

## Capabilities

### New Capabilities
- `ecpay-store-selector`: ECPay MapCVS 超商門市選擇器整合 — 包含前端元件、`/api/ecpay/store-map` 導轉路由、`/api/ecpay/store-callback` 接收路由，統一支援 7-11 / 全家

### Modified Capabilities
- `material-order-application`: 門市選擇器改用 ECPay MapCVS 版本；全家取貨選項現可正常選取門市（先前無對應選擇器）
- `711-store-selector`: 既有元件由 `ecpay-store-selector` 取代並廢除；`NEXT_PUBLIC_711_MAP_URL` 環境變數移除

## Impact

- **環境變數**：移除 `NEXT_PUBLIC_711_MAP_URL`，新增 `ECPAY_LOGISTICS_MERCHANT_ID`、`ECPAY_LOGISTICS_HASH_KEY`、`ECPAY_LOGISTICS_HASH_IV`、`ECPAY_LOGISTICS_SERVER_URL`（測試/正式環境切換）
- **API Routes**：新增 `app/api/ecpay/store-map/route.ts`、`app/api/ecpay/store-callback/route.ts`
- **元件**：新增 `components/ecpay-store-selector/`，取代 `components/711-store-selector/`
- **加密**：需實作 CheckMacValue（SHA256）用於 ECPay 物流 API 請求驗證
- **外部依賴**：ECPay 物流測試環境（`logistics-stage.ecpay.com.tw`），MerchantID `2000132`（公開測試帳號）
- **Schema**：無需異動（`storeId`、`storeName` 欄位已存在）
