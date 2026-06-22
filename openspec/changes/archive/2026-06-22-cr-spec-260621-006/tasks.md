## 1. Schema

- [x] 1.1 `prisma/schema/user.prisma`：`UserRole` enum 移除 `teacher_4`，更新相關註解為 teacher_1~teacher_3

## 2. 角色單一來源（auth-roles）

- [x] 2.1 `lib/auth-roles.ts`：移除 `TEACHER_ROLES`、`TEACHER_ROLE_BY_CATALOG`（鍵 `4`）、角色↔catalog 反向對應、課程名稱對應、`ROLE_LABELS`、其餘角色陣列中的 `teacher_4`；檔頭註解改為 teacher_1~teacher_3

## 3. 後台 UI／查詢

- [x] 3.1 `lib/data/dashboard.ts` + `app/(user)/admin/dashboard/page.tsx`：移除「啟動事工 4 講師資格人數」統計與卡片
- [x] 3.2 `components/admin/members-filter.tsx`：身分篩選移除「啟動事工 4 講師」
- [x] 3.3 `app/api/admin/members/export/route.ts`：身分中文化移除「啟動事工 4 講師」
- [x] 3.4 `app/actions/admin.ts`：移除 `teacher_4`（角色驗證／可選身分清單）

## 4. Seed

- [x] 4.1 `prisma/seed.ts`：`courses` 移除「啟動事工 4」（保留 3 本）；先修鏈僅保留 1→2→3
- [x] 4.2 `prisma/seed.ts`：保留／測試帳號 roles 移除 `teacher_4`（含 `teacher@test.com`）

## 5. 重置資料庫

- [x] 5.1 依 CLAUDE.md「重置開發環境資料庫步驟」重置 DB（`make dev-clean` → `make prisma-dev-deploy` → `make prisma-dev-seed`），套用 enum 變更與新 seed
- [x] 5.2 ⚠️ 若重置失敗：停止並回報使用者，請其提供正確重置程序，據以修正 CLAUDE.md 後再重試

## 6. 驗證

- [x] 6.1 `npm run build` 通過（tsc 無錯誤；移除 enum 後型別會抓出殘留 `teacher_4` 引用）
- [x] 6.2 全庫搜尋確認無殘留：`grep -rn "teacher_4\|啟動事工 4" app/ lib/ components/ prisma/schema prisma/seed.ts`（不含 generated／archive）
- [x] 6.3 重置後抽查：DB enum 無 `teacher_4`、courseCatalog 僅 3 筆、後台篩選與儀錶板無啟動事工 4

## 7. 收尾

- [x] 7.1 依 CLAUDE.md 第 9 點更新 `doc/老師手冊.md`、`doc/管理者操作手冊.md`（四書→三書、移除啟動事工 4 講師），更新檔首版本與日期；`README-AI.md` 同步
- [x] 7.2 apply 時將 `config/version.json` patch 版本號 +1
