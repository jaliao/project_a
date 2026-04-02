## 1. 資料庫 Schema 更新

- [x] 1.1 在 `prisma/schema/course-order.prisma` 新增 `storeId String?` 欄位
- [x] 1.2 在 `prisma/schema/course-order.prisma` 新增 `storeName String?` 欄位
- [x] 1.3 執行 `make schema-update name=add_711_store_fields` 建立 migration 並重新產生 Prisma client

## 2. 環境變數設定

- [x] 2.1 在 `.env.example` 新增 `NEXT_PUBLIC_711_MAP_URL` 變數並附上說明
- [x] 2.2 在本機 `.env` 設定 `NEXT_PUBLIC_711_MAP_URL`（開發用測試 URL 或 mock）

## 3. Zod Schema 與 Server Action 更新

- [x] 3.1 在教材申請的 Zod schema（`lib/schemas/`）新增 `storeId String?` 與 `storeName String?` 欄位
- [x] 3.2 在 Zod schema 加入條件驗證：`deliveryMethod === sevenEleven` 時 `storeId`/`storeName` 不可為空
- [x] 3.3 更新 `applyMaterialOrder` Server Action，將 `storeId`/`storeName` 寫入 `CourseOrder`

## 4. 7-11 門市選擇器元件

- [x] 4.1 建立 `components/711-store-selector/` 目錄與元件檔案
- [x] 4.2 實作「選取門市」按鈕，點擊後以 `window.open` 開啟 `NEXT_PUBLIC_711_MAP_URL`
- [x] 4.3 實作 `window.addEventListener('message')` listener，驗證 `event.origin` 符合 7-11 網域白名單
- [x] 4.4 接收 `postMessage` 回傳的 `{ storeId, storeName }` 並更新元件狀態
- [x] 4.5 已選取門市後顯示「已選取：{storeName}（{storeId}）」與「重新選取」按鈕
- [x] 4.6 在元件 unmount 時移除 message listener（防止 memory leak）

## 5. 教材申請表單整合

- [x] 5.1 在教材申請表單（`MaterialOrderDialog` 或同等元件）讀取 `deliveryMethod` 欄位變化
- [x] 5.2 當 `deliveryMethod === sevenEleven` 時，隱藏 `deliveryAddress` 文字輸入，顯示 `711-store-selector` 元件
- [x] 5.3 當 `deliveryMethod` 切換離開 7-11 時，清除 `storeId`/`storeName`，還原顯示 `deliveryAddress` 文字輸入
- [x] 5.4 在表單預填邏輯中加入 `storeId`/`storeName`（修改現有 CourseOrder 時帶入已儲存值）
- [x] 5.5 確認表單提交資料包含 `storeId`/`storeName`，傳送至 `applyMaterialOrder`

## 6. 管理後台顯示更新

- [x] 6.1 在 `/admin/materials` 申請列表與詳情，將 7-11 取貨的 `deliveryAddress` 欄位改為優先顯示 `storeName（storeId）`
- [x] 6.2 若 `storeId`/`storeName` 為 null（舊資料），fallback 顯示 `deliveryAddress`（兼容既有資料）

## 7. 版本與文件

- [x] 7.1 更新 `config/version.json` patch 版本號 +1
- [x] 7.2 更新 `README-AI.md`（依 `.ai-rules.md` 規範）
