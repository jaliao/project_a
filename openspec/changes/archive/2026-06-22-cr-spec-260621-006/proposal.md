## Why

「啟動事工 4」課程與其對應的「啟動事工 4 講師」身分（`teacher_4`）目前為停用佔位、尚未實際使用。系統尚未上線、無需顧慮舊資料，應將其自程式與 seed 中移除，簡化角色模型為三書（啟動靈人／啟動豐盛／啟動得勝）。

## What Changes

- **BREAKING**：`UserRole` enum 移除 `teacher_4`（移除既有角色值）。
- `lib/auth-roles.ts`：講師角色由四書改為三書 —— 移除 `teacher_4` 於 `TEACHER_ROLES`、`TEACHER_ROLE_BY_CATALOG`（移除 `4`）、反向對應、課程名稱對應、`ROLE_LABELS` 與各角色陣列。
- 後台儀錶板移除「啟動事工 4 講師資格人數」統計卡片與其查詢。
- 會員管理身分篩選、Excel 匯出身分中文化移除「啟動事工 4 講師」。
- `prisma/seed.ts`：課程目錄移除「啟動事工 4」（僅保留 3 本書與其先修鏈）；保留／測試帳號 roles 移除 `teacher_4`。
- 重置開發資料庫（依 CLAUDE.md「重置開發環境資料庫步驟」）使 enum 變更與 seed 生效。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `member-roles`: 書籍講師身分由四個（teacher_1~4）縮減為三個（teacher_1~3），移除 `teacher_4`／啟動事工 4 講師相關需求。
- `identity-tags`: 身分標籤移除「啟動事工 4 講師」。
- `admin-member-management`: 會員身分篩選與儀錶板統計移除「啟動事工 4 講師」項。

## Impact

- `prisma/schema/user.prisma`：`UserRole` enum 移除 `teacher_4` → 需 migration（重置 DB 套用）。
- `lib/auth-roles.ts`：移除 `teacher_4` 全部對應與標籤。
- `lib/data/dashboard.ts`、`app/(user)/admin/dashboard/page.tsx`：移除啟動事工 4 講師統計。
- `components/admin/members-filter.tsx`、`app/api/admin/members/export/route.ts`、`app/actions/admin.ts`：移除 `teacher_4` 選項／中文化／驗證。
- `prisma/seed.ts`：移除「啟動事工 4」課程與保留帳號的 `teacher_4`。
- 主 specs：`member-roles`、`identity-tags`、`admin-member-management` 需 delta。
- 文件：`doc/` 老師手冊、管理者手冊移除四書／啟動事工 4 講師敘述；`README-AI.md` 同步。
- `config/version.json` patch +1。
- **重置 DB**：依 CLAUDE.md 步驟執行；若失敗則回報並請使用者提供正確程序、據以修正 CLAUDE.md。
