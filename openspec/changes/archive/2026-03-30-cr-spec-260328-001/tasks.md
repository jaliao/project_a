## 1. 資料查詢更新

- [x] 1.1 在 `app/(user)/user/[spiritId]/page.tsx` 的 `prisma.user.findUnique` select 補充 `role: true`

## 2. 標籤計算邏輯

- [x] 2.1 移除 `LEARNING_LEVEL_LABEL` 對應表與 `levelLabel` 變數
- [x] 2.2 新增 `identityTags: string[]` 計算邏輯：
  - `role` 為 `admin` 或 `superadmin` → 加入「系統管理員」
  - 依 `certificates` 的 `courseLevel` 推導講師標籤（level1→「啟動靈人 1 講師」，依此類推）

## 3. 身分標籤 UI 更新

- [x] 3.1 將身分標籤區塊改為 `identityTags` 陣列渲染（多 Badge 並排）
- [x] 3.2 `identityTags` 為空時顯示「—」佔位符
