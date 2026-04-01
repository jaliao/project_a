## Why

教材申請表單選擇「7-11 取貨」時，講師需手動輸入門市店號或名稱，容易打錯或填寫格式不一致，導致管理者寄送時需要額外確認甚至退件。串接 7-11 官方門市選擇器 API，讓講師透過互動式地圖選取門市，系統自動帶回正確的店號與店名，從源頭消除人工輸入錯誤。

## What Changes

- 教材申請表單（`MaterialOrderDialog`）在選擇 `DeliveryMethod.sevenEleven` 時，以 7-11 門市選擇器取代純文字輸入欄位
- 使用 7-11 開放的 Map API（門市地圖選擇器），透過新開視窗讓使用者選取門市，callback 帶回店號（`storeId`）與店名（`storeName`）
- `CourseOrder` model 新增結構化欄位：`storeId`、`storeName`（取代 `deliveryAddress` 在 7-11 情境的模糊用途）
- 管理者後台（`admin-material-management`）寄送頁面顯示結構化的門市資訊，不再需要人工解析 `deliveryAddress` 字串

## Capabilities

### New Capabilities
- `711-store-selector`: 7-11 門市選擇器整合 — 前端互動元件 + callback 處理，在教材申請表單中內嵌門市選取流程

### Modified Capabilities
- `material-order-application`: 教材申請表單新增 7-11 門市選擇器 UI，選擇 7-11 取貨時以選擇器取代文字輸入
- `course-order`: `CourseOrder` model 新增 `storeId String?` 與 `storeName String?` 欄位；`deliveryAddress` 保留給郵寄用途

## Impact

- **Schema**: `prisma/schema/course-order.prisma` 新增 `storeId`、`storeName` 欄位
- **Server Action**: `applyMaterialOrder` 接受並儲存 `storeId`、`storeName`
- **UI**: `MaterialOrderDialog`（或對應元件）在 7-11 模式下顯示門市選擇按鈕，選取後顯示已選門市名稱
- **外部依賴**: 7-11 Map API（門市選擇器），以 `window.open` 開啟官方選擇器頁面，接收 `postMessage` callback
- **管理後台**: `admin-material-management` 相關頁面需顯示 `storeId` / `storeName`
