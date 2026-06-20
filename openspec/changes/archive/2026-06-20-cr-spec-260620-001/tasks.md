## 1. 資料模型

- [x] 1.1 修改 `prisma/schema/user.prisma` 的 `UserRole` enum：移除 `teacher`，新增 `teacher_1`、`teacher_2`、`teacher_3`、`teacher_4`
- [x] 1.2 執行 `make schema-update name=split_teacher_roles_by_book` 產生 migration 並重生 Prisma client
- [x] 1.3 確認 `types/next-auth.d.ts` 的 session `roles` 型別沿用 `UserRole`，無殘留 `teacher` 字面值

## 2. 授權核心與書籍對應（單一真實來源）

- [x] 2.1 在 `lib/auth-roles.ts` 定義書籍對應：`TEACHER_ROLE_BY_CATALOG`、`CATALOG_BY_TEACHER_ROLE`、`BOOK_LABEL_BY_TEACHER_ROLE`（teacher_1↔1 啟動靈人、teacher_2↔2 啟動豐盛、teacher_3↔3 啟動得勝、teacher_4↔4 啟動事工 4）
- [x] 2.2 新增 `canTeachBook(roles, courseCatalogId)`：含對應講師身分或 `admin`/`superadmin` 為真
- [x] 2.3 新增 `canTeachAny(roles)`：含任一 `teacher_*` 或 `admin`/`superadmin` 為真
- [x] 2.4 更新 `ROLE_LABELS`（四個書籍講師中文名）、`ASSIGNABLE_ROLES`（含四個講師身分）、`normalizeRoles` 有效值清單
- [x] 2.5 移除/取代舊布林 `canTeach(roles)`，確認無遺留引用

## 3. 呼叫點守衛改為書籍綁定

- [x] 3.1 `app/actions/course-invite.ts`：開課守衛改為 `canTeachBook(roles, courseCatalogId)`（catalogId 取自輸入）
- [x] 3.2 `app/actions/course-session.ts`：`createCourseSession` 守衛改為 `canTeachBook(roles, 選定課程 id)`
- [x] 3.3 `app/(user)/user/[spiritId]/page.tsx` 等「是否顯示開課入口/講師視圖」改用 `canTeachAny(roles)`
- [x] 3.4 全域搜尋 `canTeach(` 列舉所有呼叫點，逐一改為 `canTeachBook` 或 `canTeachAny`，確認無漏改

## 4. 開課精靈資格判定

- [x] 4.1 `create-course-wizard` Step 1：卡片可選性由 `graduatedCatalogIds.includes(course.id)` 改為 `canTeachBook(roles, course.id)`
- [x] 4.2 無資格卡片提示文字改為「須具備{書名}講師身分才能授課」；`admin`/`superadmin` 不受限

## 5. 身分標籤與儀錶板

- [x] 5.1 `identity-tags` 講師標籤改由 `roles` 的 `teacher_*` 映射「{書名}講師」，移除結業證書推導路徑
- [x] 5.2 `lib/data/dashboard.ts`：講師資格人數改以 `roles has 'teacher_N'` 計數，引用對應表
- [x] 5.3 後台儀錶板呈現四本書講師資格人數（啟動靈人、啟動豐盛、啟動得勝、啟動事工 4）

## 6. 後台會員管理

- [x] 6.1 會員詳情頁身分編輯：四個書籍講師身分各自獨立加掛/移除（複選），保留 `user` 基線與「禁止移除自身管理身分」防呆
- [x] 6.2 會員清單身分篩選下拉：選項改為一般會員／啟動靈人講師／啟動豐盛講師／啟動得勝講師／啟動事工 4 講師／管理者／超級管理者，`?role=` 對應 `teacher_1`～`teacher_4`（包含語意）
- [x] 6.3 會員清單/詳情「身分」欄 badge 顯示四個書籍講師中文名

## 7. Seed 與書籍改名

- [x] 7.1 `prisma/seed.ts`：courseCatalogId=3 label 改「啟動得勝」、=4 改「啟動事工 4」
- [x] 7.2 roster 講師與 `gordon@test.com` 的 `teacher` 改為 `teacher_1`；移除所有 `teacher` 字面值
- [x] 7.3 新增專用測試教師帳號（如 `teacher@test.com`），身分 `{user, teacher_1, teacher_2, teacher_3, teacher_4}`
- [ ] 7.4 `make clean && make dev && make schema-update && make prisma-seed` 重建並驗證 seed 正常

## 8. 收尾與同步

- [x] 8.1 `config/version.json` patch 版本號 +1
- [x] 8.2 依 `.ai-rules.md` 重新產生 `README-AI.md`（反映新身分模型與書籍名稱）
- [x] 8.3 更新 `doc/管理者操作手冊.md`、`doc/老師手冊.md`（身分指派、開課資格、儀錶板講師人數、書籍改名），更新檔首版本與日期
- [x] 8.4 `npm run lint` 與 `npm run build` 通過

## 9. 驗證

- [x] 9.1 以 `teacher@test.com` 驗證四本書皆可開課，且卡片資格與提示正確
- [x] 9.2 以僅持 `teacher_1` 的帳號驗證僅能開啟動靈人、其餘書籍卡片灰暗
- [x] 9.3 後台依各書籍講師身分篩選會員，結果正確；個人頁身分標籤顯示對應「{書名}講師」
- [x] 9.4 儀錶板四本書講師資格人數計數正確
