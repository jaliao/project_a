## 1. 資料庫 Schema

- [x] 1.1 在 `prisma/schema/` 新增 `admin-setting.prisma`，定義 `AdminSetting` model（`key String @unique`, `value String`）
- [x] 1.2 執行 `make schema-update name=add_admin_setting` 建立遷移並重新生成 client

## 2. Data Layer

- [x] 2.1 新增 `lib/data/admin-settings.ts`，實作 `getAdminSetting(key, defaultValue)` 與 `upsertAdminSetting(key, value)`
- [x] 2.2 新增 `lib/data/hierarchy.ts`，實作 `getMemberHierarchy(userId, depth)` — BFS 迭代查詢「啟動靈人」師生關係（老師向上 1 層、學生向下 depth 層，僅含 `graduatedAt IS NOT NULL`）

## 3. Server Actions

- [x] 3.1 新增 `app/actions/admin-settings.ts`，實作 `updateHierarchyDepth(depth: number)` Server Action（驗證 1–10 整數，呼叫 `upsertAdminSetting`，`revalidatePath('/admin/settings')`）

## 4. 元件

- [x] 4.1 新增 `components/admin/member-hierarchy-tree.tsx`（Server Component），接收 `userId: string` 與 `depth: number`，呼叫 `getMemberHierarchy`，以縮排方式渲染老師節點、中心節點（高亮）、學生樹；每個節點為連至 `/admin/members/[id]` 的連結

## 5. 頁面更新

- [x] 5.1 更新 `app/(user)/admin/members/[id]/page.tsx`：改用 shadcn `Tabs` 包裝，「基本資料」分頁保留現有內容，新增「學習階層」分頁嵌入 `MemberHierarchyTree`；在 Server Component 中讀取 `hierarchy_depth` 設定並傳入
- [x] 5.2 新增 `app/(user)/admin/settings/page.tsx`：顯示 `hierarchy_depth` 設定表單（數字 input 1–10），送出呼叫 `updateHierarchyDepth`，僅 superadmin 可訪問

## 6. 導覽

- [x] 6.1 在側邊欄（`components/layout/sidebar.tsx` 或對應檔案）管理員區塊加入「系統設定」連結（`/admin/settings`），僅 superadmin 可見

## 7. 版本與文件

- [x] 7.1 `config/version.json` patch 版本號 +1
- [x] 7.2 依 `.ai-rules.md` 更新 `README-AI.md`
