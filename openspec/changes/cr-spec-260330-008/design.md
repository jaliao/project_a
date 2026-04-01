## Context

教材申請（`CourseOrder`）目前支援三種取貨方式（`DeliveryMethod`）：7-11、全家、郵寄。選擇 7-11 時，取貨地址儲存在 `deliveryAddress String?` 欄位，為純文字手填（店號或店名），格式不統一，管理者需人工確認，容易出錯。

7-11 提供官方的「門市地圖選擇器」（Map API），以 `window.open` 開啟選擇器頁面，使用者選取門市後，透過 `postMessage` 將結構化資料（店號、店名、地址）回傳至母視窗。這是台灣電商常用的整合方式（如 ECPay、綠界），不需後端代理，純前端即可完成。

**相關現有程式碼：**
- `CourseOrder` model：`prisma/schema/course-order.prisma`
- 教材申請 Server Action：`app/actions/` 中的 `applyMaterialOrder`
- 教材申請表單元件：`components/` 中的 `MaterialOrderDialog`（或類似名稱）
- 後台管理頁：`app/(user)/admin/materials/`

## Goals / Non-Goals

**Goals:**
- 串接 7-11 門市選擇器，取代 7-11 取貨時的純文字輸入
- 將門市資訊結構化存入 DB（`storeId`、`storeName`）
- 後台管理頁顯示結構化門市資訊（店號＋店名）
- `deliveryAddress` 欄位保留給全家、郵寄取貨方式使用

**Non-Goals:**
- 不處理全家取貨的門市選擇器（另一個 CR）
- 不整合物流追蹤（貨態查詢）
- 不建立後端代理 API，選擇器完全在前端完成
- 不影響既有 `shippedAt` / `receivedAt` 確認流程

## Decisions

### D1：使用 `window.open` + `postMessage` 整合門市選擇器

**選擇**：前端直接開啟 7-11 官方門市選擇器 URL，透過 `window.addEventListener('message')` 接收回傳資料。

**理由**：這是 7-11 / ECPay 官方文件的建議整合方式。不需後端介入，實作最簡單，且所有資料驗證由 7-11 官方完成，不會有假店號問題。

**備案**：iframe 內嵌（部分情境可用），但 7-11 部分環境限制跨域 iframe，`window.open` 相容性更佳。

---

### D2：新增 `storeId`、`storeName` 欄位，不移除 `deliveryAddress`

**選擇**：在 `CourseOrder` 新增 `storeId String?` 與 `storeName String?`，保留 `deliveryAddress` 供非 7-11 的取貨方式使用。

**理由**：`deliveryAddress` 目前用於全家（店號）和郵寄（地址），一次性遷移全部取貨方式風險較高。先只處理 7-11，其餘取貨方式維持現狀，降低此次 CR 的影響範圍。

**遷移**：新欄位皆為 `String?`（nullable），現有資料不受影響，無需 data migration。

---

### D3：表單 UI — 選擇 7-11 時顯示「選取門市」按鈕

**選擇**：選擇 7-11 取貨時，`deliveryAddress` 文字欄位改為：
- 一個「選取門市」按鈕（呼叫 `window.open`）
- 選取後顯示已選店名 + 店號（唯讀 badge）
- 提供「重新選取」功能

**理由**：防止使用者繞過選擇器直接輸入錯誤店號，確保資料品質。

---

### D4：`applyMaterialOrder` Server Action 接收 `storeId`、`storeName`

**選擇**：Zod schema 新增選填欄位 `storeId` / `storeName`，並在 `deliveryMethod === sevenEleven` 時設為必填驗證。

**理由**：Server-side validation 確保資料完整性，不依賴前端。

## Risks / Trade-offs

- **7-11 API URL 環境差異**：開發 / 測試環境使用 7-11 測試站，正式環境使用正式站，URL 需透過環境變數區分，避免測試資料混入正式系統。→ 以 `NEXT_PUBLIC_711_MAP_URL` env var 控制。

- **Popup 被瀏覽器封鎖**：部分瀏覽器在非使用者互動（如 auto-trigger）時會封鎖 popup。→ 確保 `window.open` 在 onClick handler 內直接呼叫（同步），不透過 async 延遲。

- **postMessage 安全性**：需驗證 `event.origin` 符合 7-11 官方網域，防止惡意頁面偽造門市資料。→ 在 message listener 中加入 origin 白名單檢查。

- **既有資料相容**：已存在的 7-11 CourseOrder 其 `storeId` / `storeName` 為 null，`deliveryAddress` 可能仍有人工填入的值。→ 後台管理頁優先顯示 `storeId`/`storeName`，若為 null 則 fallback 顯示 `deliveryAddress`（兼容舊資料）。

## Migration Plan

1. 執行 `make schema-update name=add_711_store_fields` 新增 DB 欄位（nullable，無 data migration）
2. 更新 Zod schema、Server Action
3. 更新前端表單元件
4. 更新後台管理頁顯示邏輯
5. 設定 `NEXT_PUBLIC_711_MAP_URL` 環境變數

**Rollback**：欄位為 nullable，若 rollback 只需還原程式碼，DB 欄位不影響現有功能。

## Open Questions

- **7-11 測試站 URL**：需確認測試環境的門市選擇器 URL（可能需向 ECPay/7-11 申請測試帳號）。若無法取得，開發階段可 mock postMessage 事件。
- **全家取貨**：是否要在此 CR 同步處理，或另開 CR？（目前計畫另開）
