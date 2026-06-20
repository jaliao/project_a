## Context

目前授權模型以單一 `teacher` 身分代表「具開課權限」，`canTeach(roles)` 回傳布林（見 `lib/auth-roles.ts`）。實務上講師資格依書籍核發，現行只能靠「`teacher` 身分 + 該書結業證書」隱性拼湊（`lib/data/dashboard.ts`、`create-course-wizard` 以 `graduatedCatalogIds` 判定）。本次將講師資格正式建模為四個書籍講師身分，並讓開課權限依書籍綁定。

系統尚未上線，開發資料庫可直接重建並重新 seed，因此**不需要既有資料的 Prisma 資料遷移**，僅需一次性的 schema 變更與 seed 調整。

四本書與身分對應固定為：`teacher_1`↔啟動靈人(1)、`teacher_2`↔啟動豐盛(2)、`teacher_3`↔啟動得勝(3)、`teacher_4`↔啟動事工 4(4)。

## Goals / Non-Goals

**Goals:**
- 將 `UserRole` 的單一 `teacher` 拆為 `teacher_1`～`teacher_4`，作為唯一身分來源。
- 提供以書籍綁定的集中式授權判定 `canTeachBook(roles, courseCatalogId)` 與 `canTeachAny(roles)`。
- 「身分↔書籍」對應為單一真實來源，授權、標籤、統計、開課過濾皆引用之。
- 後台會員管理可獨立加掛/移除四個書籍講師身分並依其篩選。
- 身分標籤與開課精靈資格改由書籍講師身分推導。
- 書籍改名（啟動靈人 3→啟動得勝、啟動靈人 4→啟動事工 4）。

**Non-Goals:**
- 不處理正式環境的線上資料遷移（系統未上線，採重建+重新 seed）。
- 不改變結業（`graduatedAt`）流程本身；僅解除「結業=授課資格」的耦合。
- 不調整師生關係定義（`lib/data/hierarchy.ts` 仍以啟動靈人 catalogId=1 為準）。
- 不新增書籍；維持四本既有課程目錄。

## Decisions

### 1. Enum 值採 `teacher_1`～`teacher_4`（依使用者指定）
`UserRole` 改為 `user / teacher_1 / teacher_2 / teacher_3 / teacher_4 / admin / superadmin`，移除 `teacher`。
- 替代方案：語意化命名（`teacher_spirit` 等）— 使用者明確選擇數字編號，且與 catalogId 對齊、未來擴充書籍時規則一致。
- 取捨：數字較不自我描述，故以「身分↔書籍對應」集中表（含中文書名）補足可讀性。

### 2. 「身分↔書籍對應」為 config-driven 單一來源
比照專案 config-driven enum 慣例，於 `lib/auth-roles.ts`（或新增 `config/teacher-books.ts`）定義雙向對應：
```
TEACHER_ROLE_BY_CATALOG: { 1: 'teacher_1', 2: 'teacher_2', 3: 'teacher_3', 4: 'teacher_4' }
CATALOG_BY_TEACHER_ROLE: 反向
BOOK_LABEL_BY_TEACHER_ROLE: { teacher_1: '啟動靈人', ... }
```
授權、`identity-tags`、`dashboard` 統計、開課過濾一律引用，禁止各處硬編碼。

### 3. `canTeach` 由布林改為書籍綁定
`lib/auth-roles.ts` 新增：
- `canTeachBook(roles, courseCatalogId)`：`roles` 含對應講師身分，或含 `admin`/`superadmin`。
- `canTeachAny(roles)`：含任一 `teacher_*`，或 `admin`/`superadmin`。用於「是否顯示開課入口/講師視圖」等不指定特定書的情境。
- 同步更新 `ROLE_LABELS`、`ASSIGNABLE_ROLES`、`normalizeRoles` 的有效值清單。
- 替代方案：保留 `canTeach(roles)` 布林 — 無法表達書籍綁定，違反需求。

呼叫點調整：
- `app/actions/course-invite.ts`、`app/actions/course-session.ts` 的守衛改為 `canTeachBook(roles, courseCatalogId)`，`courseCatalogId` 取自輸入/選定課程。
- `app/(user)/user/[spiritId]/page.tsx` 等「是否顯示開課入口」改用 `canTeachAny`。

### 4. 開課精靈資格改由書籍講師身分判定
`create-course-wizard` Step 1 卡片可選性由 `graduatedCatalogIds.includes(course.id)` 改為 `canTeachBook(roles, course.id)`；提示文字改「須具備{書名}講師身分才能授課」。`admin`/`superadmin` 不受限。

### 5. 身分標籤改由 roles 推導
`identity-tags` 的講師標籤改自 `roles` 中的 `teacher_*` 映射為「{書名}講師」，移除結業證書推導路徑。系統管理員標籤與空狀態「—」不變。

### 6. Seed 與書籍改名（取代資料遷移）
- `prisma/seed.ts`：courseCatalogId=3 label 改「啟動得勝」、=4 改「啟動事工 4」。
- roster 匯入的講師（皆啟動靈人班別）指派 `teacher_1`；既有 `gordon@test.com` 的 `teacher` 改為 `teacher_1`。
- 新增一個專用測試教師帳號（如 `teacher@test.com`），身分為 `{user, teacher_1, teacher_2, teacher_3, teacher_4}`，用於四本書開課與篩選的 QA。
- 既有 `teacher` 指派處全部改為對應 `teacher_*`。

### 7. 統計與資料層
`lib/data/dashboard.ts` 的講師資格人數改以 `roles has 'teacher_N'` 計數（不再 join 結業證書），並引用對應表。後台儀錶板 SHALL 同時呈現四本書的講師資格人數：啟動靈人、啟動豐盛、啟動得勝、啟動事工 4。

## Risks / Trade-offs

- [所有 `canTeach()` 呼叫點都需帶入 courseCatalogId] → 全域搜尋 `canTeach(` 列舉呼叫點；無書籍語境者改用 `canTeachAny`，避免漏改造成越權或誤擋。
- [移除 enum 值 `teacher` 屬破壞性 schema 變更] → 因 DB 重建，採 `make schema-update` 產生全新 migration + 重新 seed；不嘗試線上 `ALTER TYPE`。
- [解除「結業=授課資格」耦合可能改變既有人員的可開課集合] → 由 seed 明確指派書籍講師身分；正式啟用前由管理者於後台校正。
- [硬編碼書籍對應散落各處的風險] → 強制統一引用對應表（Decision 2），PR review 檢查。
- [identity-tags 既有依結業證書的測試/快照失效] → 一併更新對應顯示邏輯與手冊範例。

## Migration Plan

1. 修改 `prisma/schema/user.prisma` 的 `UserRole` enum。
2. `make schema-update name=split_teacher_roles_by_book` 產生 migration 並重生 client。
3. 更新 `lib/auth-roles.ts`（對應表、`canTeachBook`/`canTeachAny`、labels/assignable/normalize）。
4. 更新呼叫點（actions、profile、wizard、identity-tags、dashboard）。
5. 更新後台會員管理 UI（身分編輯複選、清單身分篩選）。
6. 更新 `prisma/seed.ts`（書籍改名 + 講師身分指派），`make clean && make dev && make schema-update && make prisma-seed` 重建驗證。
7. 同步 `config/version.json` patch +1、重生 `README-AI.md`、更新 `doc/管理者操作手冊.md`、`doc/老師手冊.md`。

回滾：開發階段以 `make clean` 重建即可；無正式資料風險。

## Open Questions

（已解決）
- 測試教師帳號：新增一個專用帳號（`teacher@test.com`），一次持有全部四個書籍講師身分，供 QA 覆蓋四書開課與篩選。
- 儀錶板：同時呈現四本書（啟動靈人、啟動豐盛、啟動得勝、啟動事工 4）的講師資格人數。
