## Context

現有 `711-store-selector` 元件透過 `window.open` 開啟 7-11 自家地圖 URL，再以 `postMessage` 接收回傳。該 URL 非正式 API，且僅支援 7-11，`familyMart` 取貨選項目前無法選取門市。

ECPay 物流 API 提供 **MapCVS 超商店鋪資訊服務**，統一支援 7-11（UNIMART）、全家（FAMI），流程為：前端開啟視窗 → 伺服器產生並 POST 至 ECPay → 使用者選取門市 → ECPay POST 回 `ServerReplyURL` → callback 頁面以 `postMessage` 通知父視窗。

`CourseOrder.storeId` / `storeName` 欄位已存在，Schema 無需異動。

## Goals / Non-Goals

**Goals:**
- 以 ECPay MapCVS 官方 API 取代非正式 7-11 Map URL
- 統一支援 7-11（UNIMART）與全家（FAMI）門市選取
- HashKey / HashIV 保留在伺服器端，不暴露於前端
- 本機開發可透過 mock 模式繞過 ECPay 外部呼叫

**Non-Goals:**
- 不整合 Hi-Life、OK Mart（ECPay 物流僅支援 7-11 / 全家超商取貨）
- 不處理實際物流寄送（本變更僅為門市資訊蒐集，寄送流程由管理者手動處理）
- 不實作物流訂單建立（`CreateShippingOrder`）

## Decisions

### D1：伺服器端產生 ECPay 表單（不在前端計算 CheckMacValue）

ECPay MapCVS 需傳送含 CheckMacValue 的 POST 請求至 `https://logistics.ecpay.com.tw/Express/map`。CheckMacValue 使用 MD5，計算需要 HashKey / HashIV。

- **選項 A（採用）**：前端開啟 `/api/ecpay/store-map?type=UNIMART`，由 Next.js API Route 計算 CheckMacValue 並回傳自動 submit 的 HTML form。
- **選項 B（棄用）**：前端直接計算並 POST，需將 HashKey 暴露於環境變數（`NEXT_PUBLIC_`），有安全疑慮。

### D2：Callback 透過 postMessage 通知父視窗

ECPay POST 到 `ServerReplyURL`（`/api/ecpay/store-callback`）。此 API Route 回傳一段 HTML，執行：

```html
<script>
  window.opener?.postMessage({ storeId, storeName }, window.location.origin)
  window.close()
</script>
```

前端元件監聽 `message` 事件，**僅接受 `event.origin === window.location.origin`**（比舊版 7-11 外部 origin 白名單更安全）。

### D3：`ServerReplyURL` 必須為公開可達的 HTTPS URL

ECPay 無法 POST 到 `localhost`。透過環境變數 `ECPAY_LOGISTICS_SERVER_URL` 設定 base URL：
- 本機開發：設為 ngrok / cloudflare tunnel URL，或留空啟用 mock 模式
- 正式環境：設為 `https://your-domain.com`

**Mock 模式**：`ECPAY_LOGISTICS_SERVER_URL` 未設定時，`/api/ecpay/store-map` 直接回傳模擬門市資料並觸發 `postMessage`，無需外部依賴，開發時可離線使用。

### D6：ECPay MapCVS 端點透過環境變數控制（實作修正）

原設計以 `NODE_ENV` 自動切換測試 / 正式端點，實際使用上不夠彈性（例如本機開發也可能需要打正式環境驗證憑證）。

**改為**：`ECPAY_LOGISTICS_MAP_URL` 環境變數手動指定，預設值為正式環境 `https://logistics.ecpay.com.tw/Express/map`。

| 情境 | `ECPAY_LOGISTICS_MAP_URL` 設定 |
|------|-------------------------------|
| 正式環境（預設） | 不填，使用預設值 |
| 切換為測試環境 | `https://logistics-stage.ecpay.com.tw/Express/map` |

測試帳號（MerchantID `2000132`）只能搭配測試端點使用；正式帳號搭配正式端點。

### D4：元件 API — 傳入 `logisticsSubType`，父層負責映射

新元件 `EcpayStoreSelector` props：
```typescript
interface Props {
  logisticsSubType: 'UNIMART' | 'FAMI'
  value: { storeId: string; storeName: string } | null
  onChange: (store: { storeId: string; storeName: string } | null) => void
  disabled?: boolean
}
```

`MaterialOrderDialog` 根據 `deliveryMethod` 映射：
- `sevenEleven` → `logisticsSubType="UNIMART"`
- `familyMart` → `logisticsSubType="FAMI"`

### D5：移除舊元件與環境變數

`components/711-store-selector/` 與 `NEXT_PUBLIC_711_MAP_URL` 在本次變更中一併移除。不留向後相容層。

## Risks / Trade-offs

- **本機開發需 tunnel 或 mock 模式**：ECPay callback 無法到達 localhost。Mock 模式可完全在本機運作，但不驗證實際 ECPay 流程。→ 文件說明如何設定 ngrok，並確保 mock 模式完整可用。
- **ECPay 測試帳號共用**：測試環境 MerchantID `2000132` 為公開帳號，其他開發者可見測試紀錄。→ 僅限開發測試，正式環境使用專屬帳號。
- **`window.opener` 為 null**：若父視窗已關閉或被 CSP 阻擋，callback 無法通知。→ callback 頁面顯示「已選取：{storeName}，請關閉此視窗」作為降級提示。
- **物流 CheckMacValue 使用 MD5（非 SHA256）**：與金流 AIO 不同，須另行實作物流版 CheckMacValue 工具函式。

## Migration Plan

1. 新增 `app/api/ecpay/store-map/route.ts`
2. 新增 `app/api/ecpay/store-callback/route.ts`
3. 新增 `components/ecpay-store-selector/store-selector.tsx`
4. 更新 `MaterialOrderDialog`，以 `EcpayStoreSelector` 取代 `StoreSelector711`
5. 刪除 `components/711-store-selector/`
6. 更新 `.env.example`：移除 `NEXT_PUBLIC_711_MAP_URL`，新增 ECPay 物流憑證
7. 無 Schema migration（欄位已存在）

**Rollback**：若 ECPay callback 無法正常運作，可暫時將 `EcpayStoreSelector` 內部改回 mock 模式（清空 `ECPAY_LOGISTICS_SERVER_URL`），不影響已存入的 `storeId` / `storeName` 資料。

## Open Questions

- 正式環境是否需要申請 ECPay 物流正式帳號，或沿用目前管理者手動寄送流程（不走 ECPay 物流）？→ 本次變更僅蒐集門市資訊，不建立物流訂單，測試帳號已足夠。
- `CVSAddress`（門市地址）是否需要儲存？→ 目前 `CourseOrder` 無此欄位，暫不儲存；若後續需要，另提 CR。
