## Why

目前系統只有單一「講師（`teacher`）」身分，無法區分一位會員實際具備哪一本書的授課資格。但實務上講師資格是「依書籍」核發的（啟動靈人、啟動豐盛、啟動靈人 3、啟動靈人 4），需要分別判定開課權限與顯示資格標籤。現行只能靠「`teacher` 身分 + 該書結業證書」隱性推導（見 `lib/data/dashboard.ts`），授權與顯示邏輯不一致且難以維護。

## What Changes

- **BREAKING** 將 `UserRole` 的單一 `teacher` 身分，拆分為四個書籍講師身分：
  - `teacher_1` — 啟動靈人講師（courseCatalogId=1）
  - `teacher_2` — 啟動豐盛講師（courseCatalogId=2）
  - `teacher_3` — 啟動得勝講師（courseCatalogId=3）
  - `teacher_4` — 啟動事工 4 講師（courseCatalogId=4）
- 同步調整書籍名稱：courseCatalogId=3 由「啟動靈人 3」改為「啟動得勝」、courseCatalogId=4 由「啟動靈人 4」改為「啟動事工 4」。
- 建立「講師身分 ↔ 書籍（CourseCatalog）」的對應關係，作為授權與顯示的單一真實來源。
- 開課權限改為**依書籍綁定**：`canTeach` 由布林改為 `canTeach(roles, courseCatalogId)`，需持有該書對應的講師身分（`admin`／`superadmin` 仍可教所有書）。
- 後台會員管理的身分指派，由單一「講師」開關改為四個書籍講師身分的個別指派。
- 開課精靈（建立 CourseInvite）的可選書籍，依使用者持有的書籍講師身分過濾。
- 身分標籤（identity tags）的「講師」標籤改由四個書籍講師身分推導，與授權判定一致。
- **無需資料遷移**：系統尚未上線，開發資料庫可直接重建並重新 seed，既有 `teacher` 身分改由 seed 直接指派對應書籍講師身分（不需 migration 轉換既有資料）。

## Capabilities

### New Capabilities
<!-- 不新增獨立 capability；書籍↔身分對應與書籍綁定授權併入既有 member-roles。 -->

### Modified Capabilities
- `member-roles`: 將單一 `teacher` 身分拆為四個書籍講師身分；新增「身分↔書籍」對應；`canTeach` 改為依書籍綁定；補既有 `teacher` 資料遷移規則。
- `identity-tags`: 「講師」標籤改由四個書籍講師身分推導（取代/對齊既有依結業證書推導）。
- `admin-member-management`: 身分指派由單一講師開關改為四個書籍講師身分的個別加掛／移除。
- `create-course-wizard`: 開課可選書籍依使用者持有之書籍講師身分過濾；無對應身分者不可開該書的課。

## Impact

- **資料模型**：`prisma/schema/user.prisma` 的 `UserRole` enum（重建資料庫；無需既有資料遷移）。
- **授權核心**：`lib/auth-roles.ts`（`canTeach`、`ASSIGNABLE_ROLES`、`ROLE_LABELS`、`normalizeRoles`）。
- **Server Actions 守衛**：`app/actions/course-invite.ts`、`app/actions/course-session.ts`（`canTeach` 呼叫點改為帶 courseCatalogId）。
- **後台**：`app/(user)/admin/members/`（身分指派 UI）、`app/(user)/admin/dashboard/`。
- **統計／資料層**：`lib/data/dashboard.ts`（講師資格人數計算）、`lib/data/hierarchy.ts`。
- **顯示**：個人資料頁身分標籤、`types/next-auth.d.ts` session roles 型別。
- **Seed**：`prisma/seed.ts`（書籍 label 改名為「啟動得勝」「啟動事工 4」、教師帳號改指派四個書籍講師身分）、`prisma/seed-data/`。
- **操作手冊**：`doc/管理者操作手冊.md`、`doc/老師手冊.md`（依 CLAUDE.md 第 9 點同步）。
