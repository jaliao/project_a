## 1. 系統設定頁重構為 Tabs

- [x] 1.1 `app/(user)/admin/settings/page.tsx`：改為 admin/superadmin 皆可進入（移除 superadmin-only redirect），改用 `searchParams.tab` 讀取 active tab
- [x] 1.2 `app/(user)/admin/settings/page.tsx`：引入 shadcn/ui `<Tabs>` 元件，加入「基本設定」與「教會代碼維護」兩個 TabsTrigger（以 `<Link href="?tab=...">` 切換）
- [x] 1.3 「基本設定」TabsContent：superadmin 顯示 `HierarchyDepthForm`，admin 顯示「此設定需 superadmin 權限」提示
- [x] 1.4 「教會代碼維護」TabsContent：fetch 所有教會資料（含 memberCount），渲染 `ChurchList` 元件

## 2. /admin/churches 相容處理

- [x] 2.1 `app/(user)/admin/churches/page.tsx`：改為 server redirect → `/admin/settings?tab=churches`
- [x] 2.2 `app/actions/church.ts`：將所有 `revalidatePath('/admin/churches')` 更新為 `revalidatePath('/admin/settings')`

## 3. 後台首頁入口更新

- [x] 3.1 `app/(user)/admin/page.tsx`：「教會管理」功能卡片 `href` 改為 `/admin/settings?tab=churches`

## 4. 版本與文件

- [x] 4.1 `config/version.json` patch 版本號 +1
- [x] 4.2 依 `.ai-rules.md` 更新 `README-AI.md`
